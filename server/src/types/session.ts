/**
 * Session Types for HttpOnly Cookie-based Authentication
 *
 * Defines types for secure session management including:
 * - Database session records
 * - Redis session cache
 * - Session creation/validation
 */

export interface UserSession {
  id: string; // UUID
  user_id: number;
  refresh_hash: string; // SHA-256 hash of refresh token
  user_agent: string | null;
  ip: string | null;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by: string | null;
}

export interface RedisSessionData {
  userId: number;
  refreshHash: string;
  expiresAt: number; // Unix timestamp
  userAgent: string | null;
  ip: string | null;
  revoked: boolean;
}

export interface CreateSessionInput {
  userId: number;
  userAgent?: string | null;
  ip?: string | null;
  refreshTtlDays?: number;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: UserSession;
  userId?: number;
  error?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface AccessTokenPayload {
  sub: number; // userId
  role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}
