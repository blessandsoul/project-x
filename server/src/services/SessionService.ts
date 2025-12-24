/**
 * Session Service for Secure HttpOnly Cookie-based Authentication
 *
 * Manages user sessions with:
 * - MySQL for persistent storage and audit trail
 * - Redis for fast session lookups
 * - Refresh token rotation for replay attack prevention
 * - Session revocation support
 */

import type { FastifyInstance } from 'fastify';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type {
  UserSession,
  RedisSessionData,
  CreateSessionInput,
  SessionValidationResult,
  TokenPair,
  AccessTokenPayload,
} from '../types/session.js';
import { generateSecureToken, sha256, generateUuid } from '../utils/crypto.js';
import { SESSION_CONFIG, JWT_ACCESS_SECRET, JWT_ISSUER, JWT_AUDIENCE, ACCESS_TTL_MINUTES } from '../config/auth.js';
import jwt from 'jsonwebtoken';

const REDIS_SESSION_PREFIX = 'sess:';

export class SessionService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Create a new session with refresh token
   */
  async createSession(input: CreateSessionInput): Promise<TokenPair> {
    const { userId, userAgent, ip, refreshTtlDays = SESSION_CONFIG.refreshTtlDays } = input;

    const sessionId = generateUuid();
    const refreshToken = generateSecureToken(48); // 48 bytes = 64 base64url chars
    const refreshHash = sha256(refreshToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + refreshTtlDays * 24 * 60 * 60 * 1000);

    // Get user role for access token
    const userRole = await this.getUserRole(userId);

    // Store in MySQL
    await this.storeSessionInMysql({
      id: sessionId,
      user_id: userId,
      refresh_hash: refreshHash,
      user_agent: userAgent || null,
      ip: ip || null,
      created_at: now,
      expires_at: expiresAt,
      revoked_at: null,
      replaced_by: null,
    });

    // Store in Redis for fast lookups
    await this.storeSessionInRedis(sessionId, {
      userId,
      refreshHash,
      expiresAt: expiresAt.getTime(),
      userAgent: userAgent || null,
      ip: ip || null,
      revoked: false,
    }, refreshTtlDays);

    // Generate access token
    const accessToken = this.generateAccessToken(userId, userRole, sessionId);

    // Enforce max sessions per user
    await this.enforceMaxSessions(userId);

    return {
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  /**
   * Validate a refresh token and return session info
   */
  async validateRefreshToken(refreshToken: string): Promise<SessionValidationResult> {
    if (!refreshToken) {
      return { valid: false, error: 'Refresh token required' };
    }

    const refreshHash = sha256(refreshToken);

    // Try Redis first for speed
    const redisSession = await this.findSessionInRedisByHash(refreshHash);
    if (redisSession) {
      if (redisSession.revoked) {
        return { valid: false, error: 'Session revoked' };
      }
      if (redisSession.expiresAt < Date.now()) {
        return { valid: false, error: 'Session expired' };
      }
      return {
        valid: true,
        userId: redisSession.userId,
      };
    }

    // Fallback to MySQL
    const mysqlSession = await this.findSessionInMysqlByHash(refreshHash);
    if (!mysqlSession) {
      return { valid: false, error: 'Session not found' };
    }

    if (mysqlSession.revoked_at) {
      return { valid: false, error: 'Session revoked' };
    }

    if (mysqlSession.expires_at < new Date()) {
      return { valid: false, error: 'Session expired' };
    }

    return {
      valid: true,
      session: mysqlSession,
      userId: mysqlSession.user_id,
    };
  }

  /**
   * Rotate refresh token (revoke old, create new)
   * This is the core of replay attack prevention
   */
  async rotateRefreshToken(oldRefreshToken: string, userAgent?: string, ip?: string): Promise<TokenPair | null> {
    const refreshHash = sha256(oldRefreshToken);

    // Find the old session
    const oldSession = await this.findSessionInMysqlByHash(refreshHash);
    if (!oldSession) {
      return null;
    }

    if (oldSession.revoked_at) {
      // Token reuse detected! This could be a replay attack.
      // Revoke all sessions for this user as a security measure.
      this.fastify.log.warn({
        userId: oldSession.user_id,
        sessionId: oldSession.id,
      }, 'Refresh token reuse detected - revoking all user sessions');
      await this.revokeAllUserSessions(oldSession.user_id);
      return null;
    }

    if (oldSession.expires_at < new Date()) {
      return null;
    }

    // Create new session
    const newTokenPair = await this.createSession({
      userId: oldSession.user_id,
      userAgent: userAgent || oldSession.user_agent,
      ip: ip || oldSession.ip,
    });

    // Revoke old session and link to new one
    await this.revokeSession(oldSession.id, newTokenPair.sessionId);

    return newTokenPair;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, replacedBy?: string): Promise<void> {
    const now = new Date();

    // Update MySQL
    const pool = this.fastify.mysql;
    await pool.execute(
      `UPDATE user_sessions 
       SET revoked_at = ?, replaced_by = ? 
       WHERE id = ?`,
      [now, replacedBy || null, sessionId],
    );

    // Update Redis
    await this.revokeSessionInRedis(sessionId);
  }

  /**
   * Revoke session by refresh token
   */
  async revokeSessionByRefreshToken(refreshToken: string): Promise<boolean> {
    const refreshHash = sha256(refreshToken);
    const session = await this.findSessionInMysqlByHash(refreshHash);

    if (!session) {
      return false;
    }

    await this.revokeSession(session.id);
    return true;
  }

  /**
   * Revoke all sessions for a user (logout everywhere)
   */
  async revokeAllUserSessions(userId: number): Promise<void> {
    const now = new Date();

    // Get all session IDs for Redis cleanup
    const pool = this.fastify.mysql;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM user_sessions WHERE user_id = ? AND revoked_at IS NULL`,
      [userId],
    );

    // Update MySQL
    await pool.execute(
      `UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`,
      [now, userId],
    );

    // Update Redis
    for (const row of rows) {
      await this.revokeSessionInRedis(row.id);
    }
  }

  /**
   * Verify access token from cookie
   */
  verifyAccessToken(accessToken: string): AccessTokenPayload | null {
    try {
      const payload = jwt.verify(accessToken, JWT_ACCESS_SECRET, {
        issuer: JWT_ISSUER || undefined,
        audience: JWT_AUDIENCE || undefined,
      }) as unknown as AccessTokenPayload;

      if (!payload || typeof payload.sub !== 'number') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: number): Promise<UserSession[]> {
    const pool = this.fastify.mysql;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM user_sessions 
       WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId],
    );

    return rows as UserSession[];
  }

  /**
   * Clean up expired sessions (for cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const pool = this.fastify.mysql;
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM user_sessions WHERE expires_at < NOW()`,
    );

    return result.affectedRows;
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private async getUserRole(userId: number): Promise<string> {
    const pool = this.fastify.mysql;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT role FROM users WHERE id = ?`,
      [userId],
    );

    const firstRow = rows[0];
    if (!firstRow) {
      return 'user';
    }

    return (firstRow as { role?: string }).role || 'user';
  }

  private generateAccessToken(userId: number, role: string, sessionId: string): string {
    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: userId,
      role,
      sessionId,
    };

    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: `${ACCESS_TTL_MINUTES}m`,
      issuer: JWT_ISSUER || undefined,
      audience: JWT_AUDIENCE || undefined,
    });
  }

  private async storeSessionInMysql(session: UserSession): Promise<void> {
    const pool = this.fastify.mysql;
    await pool.execute(
      `INSERT INTO user_sessions 
       (id, user_id, refresh_hash, user_agent, ip, created_at, expires_at, revoked_at, replaced_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.user_id,
        session.refresh_hash,
        session.user_agent,
        session.ip,
        session.created_at,
        session.expires_at,
        session.revoked_at,
        session.replaced_by,
      ],
    );
  }

  private async storeSessionInRedis(
    sessionId: string,
    data: RedisSessionData,
    ttlDays: number,
  ): Promise<void> {
    const redis = this.fastify.redis;
    if (!redis) return;

    const key = `${REDIS_SESSION_PREFIX}${sessionId}`;
    const ttlSeconds = ttlDays * 24 * 60 * 60;

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (err) {
      this.fastify.log.warn({ err }, 'Failed to store session in Redis');
    }
  }

  private async findSessionInRedisByHash(refreshHash: string): Promise<RedisSessionData | null> {
    const redis = this.fastify.redis;
    if (!redis) return null;

    // We need to find by hash, which requires scanning or a secondary index
    // For simplicity, we'll use MySQL as the source of truth for hash lookups
    // Redis is used for sessionId-based lookups after we know the sessionId
    return null;
  }

  private async findSessionInMysqlByHash(refreshHash: string): Promise<UserSession | null> {
    const pool = this.fastify.mysql;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM user_sessions WHERE refresh_hash = ? LIMIT 1`,
      [refreshHash],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as UserSession;
  }

  private async revokeSessionInRedis(sessionId: string): Promise<void> {
    const redis = this.fastify.redis;
    if (!redis) return;

    const key = `${REDIS_SESSION_PREFIX}${sessionId}`;

    try {
      // Get existing data, mark as revoked, update with short TTL
      const existing = await redis.get(key);
      if (existing) {
        const data = JSON.parse(existing) as RedisSessionData;
        data.revoked = true;
        // Keep for 1 hour for audit purposes
        await redis.setex(key, 3600, JSON.stringify(data));
      }
    } catch (err) {
      this.fastify.log.warn({ err }, 'Failed to revoke session in Redis');
    }
  }

  private async enforceMaxSessions(userId: number): Promise<void> {
    const maxSessions = SESSION_CONFIG.maxSessionsPerUser;
    if (maxSessions <= 0) return;

    const pool = this.fastify.mysql;

    // Get count of active sessions
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM user_sessions 
       WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()`,
      [userId],
    );

    const count = (countRows[0] as { count: number } | undefined)?.count || 0;

    if (count > maxSessions) {
      // Revoke oldest sessions to stay within limit
      const toRevoke = count - maxSessions;
      // Note: MySQL 8.0 doesn't support placeholders in LIMIT, so we use direct interpolation
      // This is safe because toRevoke is guaranteed to be a number
      const [oldestRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM user_sessions 
         WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
         ORDER BY created_at ASC
         LIMIT ${Math.max(0, Math.floor(toRevoke))}`,
        [userId],
      );

      for (const row of oldestRows) {
        await this.revokeSession(row.id);
      }
    }
  }
}
