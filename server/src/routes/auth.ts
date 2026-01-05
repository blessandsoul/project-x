/**
 * Secure Auth Routes (HttpOnly Cookie-based Authentication)
 *
 * Implements secure authentication with:
 * - HttpOnly cookies for access and refresh tokens
 * - Refresh token rotation to prevent replay attacks
 * - CSRF protection for all unsafe methods
 * - Rate limiting on sensitive endpoints
 *
 * Endpoints:
 * - POST /auth/register - Register new user and set cookies
 * - POST /auth/login - Authenticate and set cookies
 * - POST /auth/refresh - Rotate refresh token
 * - POST /auth/logout - Revoke session and clear cookies
 * - GET /auth/me - Get current user from access cookie
 * - GET /auth/csrf - Get CSRF token
 * - GET /auth/sessions - List active sessions (authenticated)
 * - DELETE /auth/sessions - Revoke all sessions (authenticated)
 */

import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModel.js';
import { SessionService } from '../services/SessionService.js';
import { AuthenticationError, ValidationError, ConflictError } from '../types/errors.js';
import {
  setAuthCookies,
  clearAuthCookies,
  setCsrfTokenCookie,
  clearLegacyTokenCookie,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
} from '../utils/cookies.js';
import { generateSecureToken } from '../utils/crypto.js';
import { AUTH_RATE_LIMIT } from '../config/auth.js';
import { getUserAvatarUrls, getCompanyLogoUrls } from '../services/ImageUploadService.js';
import { CompanyModel } from '../models/CompanyModel.js';
import { incrementCacheVersion, invalidateUserCache } from '../utils/cache.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const userModel = new UserModel(fastify);
  const companyModel = new CompanyModel(fastify);
  const sessionService = new SessionService(fastify);

  /**
   * Helper to get user avatar/logo URLs
   */
  async function getUserImageUrls(user: { username: string; role: string; company_id: number | null }) {
    const avatarUrls = await getUserAvatarUrls(user.username);

    let logoUrls = { url: null as string | null, originalUrl: null as string | null };
    if (user.role === 'company' && user.company_id) {
      const company = await companyModel.findById(user.company_id);
      if (company) {
        logoUrls = await getCompanyLogoUrls(company.slug || company.name);
      }
    }

    return {
      avatar_url: avatarUrls.url,
      original_avatar_url: avatarUrls.originalUrl,
      company_logo_url: logoUrls.url,
      original_company_logo_url: logoUrls.originalUrl,
    };
  }

  const BCRYPT_SALT_ROUNDS = 12;

  /**
   * POST /auth/register
   *
   * Register a new user account and set HttpOnly cookies.
   * 
   * Option B (2-step onboarding):
   * - Creates user with role='user' only
   * - Company creation happens later via POST /companies/onboard
   * - Strict schema: only email, username, password accepted
   */
  fastify.post('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 255 },
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6, maxLength: 255 },
        },
        additionalProperties: false,
      },
    },
    config: {
      rateLimit: {
        max: AUTH_RATE_LIMIT.register.max,
        timeWindow: AUTH_RATE_LIMIT.register.timeWindow,
      },
    },
  }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;

    // Explicit rejection of company fields with clear error message
    const companyFields = ['role', 'name', 'companyPhone', 'basePrice', 'pricePerMile', 'customsFee', 'serviceFee', 'brokerFee'];
    const foundCompanyFields = companyFields.filter(field => field in body);
    if (foundCompanyFields.length > 0) {
      throw new ValidationError(
        `Company fields are not allowed in /auth/register. Use /companies/onboard. Found: ${foundCompanyFields.join(', ')}`
      );
    }

    const { email, username, password } = body as {
      email: string;
      username: string;
      password: string;
    };

    // Check if user already exists
    const emailExists = await userModel.emailExists(email);
    if (emailExists) {
      throw new ConflictError('User with this email already exists');
    }

    const usernameExists = await userModel.usernameExists(username);
    if (usernameExists) {
      throw new ConflictError('User with this username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user with role='user' (company creation via /companies/onboard)
    const user = await userModel.create({
      email,
      username,
      password: passwordHash,
      role: 'user',
      company_id: null,
    });

    // Create session
    const userAgent = request.headers['user-agent'] || null;
    const ip = request.ip || null;

    const tokenPair = await sessionService.createSession({
      userId: user.id,
      userAgent,
      ip,
    });

    // Set cookies
    setAuthCookies(reply, tokenPair.accessToken, tokenPair.refreshToken);

    // Generate and set CSRF token
    const csrfToken = generateSecureToken(32);
    setCsrfTokenCookie(reply, csrfToken);

    // Get image URLs
    const imageUrls = await getUserImageUrls({
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    });

    // Log successful registration
    fastify.log.info({
      userId: user.id,
      sessionId: tokenPair.sessionId,
      ip,
    }, 'User registered');

    return reply.code(201).send({
      registered: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        company_id: user.company_id,
        ...imageUrls,
      },
    });
  });

  /**
   * POST /auth/login
   *
   * Authenticate user and set HttpOnly cookies.
   */
  fastify.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: { type: 'string', minLength: 1, maxLength: 255 },
          password: { type: 'string', minLength: 1, maxLength: 255 },
        },
        additionalProperties: false,
      },
    },
    config: {
      rateLimit: {
        max: AUTH_RATE_LIMIT.login.max,
        timeWindow: AUTH_RATE_LIMIT.login.timeWindow,
      },
    },
  }, async (request, reply) => {
    const { identifier, password } = request.body as { identifier: string; password: string };

    // Find user by email or username
    const user = await userModel.findByIdentifier(identifier);

    // Use constant-time comparison to prevent timing attacks
    // Always hash even if user not found to prevent user enumeration
    if (!user) {
      // Dummy hash to prevent timing attacks
      await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');
      throw new AuthenticationError('Invalid credentials');
    }

    if (user.is_blocked) {
      throw new AuthenticationError('Account is blocked');
    }

    // Check if account is deactivated
    if (user.deactivated_at) {
      const now = new Date();

      // Check if still within grace period (deletion_scheduled_at > now)
      if (user.deletion_scheduled_at && user.deletion_scheduled_at > now) {
        // Account is deactivated but within grace period - offer reactivation
        const daysRemaining = Math.ceil(
          (user.deletion_scheduled_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Verify password first
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          throw new AuthenticationError('Invalid credentials');
        }

        // Return special response for reactivation
        return reply.send({
          needsReactivation: true,
          daysRemaining,
          userId: user.id,
          message: 'Your account is scheduled for deletion. Would you like to reactivate it?',
        });
      }

      // Past grace period or deletion_scheduled_at is null (legacy deactivated account)
      throw new AuthenticationError('Account has been permanently deleted');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Create session
    const userAgent = request.headers['user-agent'] || null;
    const ip = request.ip || null;

    const tokenPair = await sessionService.createSession({
      userId: user.id,
      userAgent,
      ip,
    });

    // Set cookies
    setAuthCookies(reply, tokenPair.accessToken, tokenPair.refreshToken);

    // Clear legacy 'token' cookie from old auth system
    clearLegacyTokenCookie(reply);

    // Generate and set CSRF token
    const csrfToken = generateSecureToken(32);
    setCsrfTokenCookie(reply, csrfToken);

    // Get image URLs
    const imageUrls = await getUserImageUrls({
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    });

    // Log successful login
    fastify.log.info({
      userId: user.id,
      sessionId: tokenPair.sessionId,
      ip,
    }, 'User logged in');

    return reply.send({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        company_id: user.company_id,
        ...imageUrls,
      },
    });
  });

  /**
   * POST /auth/reactivate
   *
   * Reactivate a deactivated account during the 30-day grace period.
   * Clears deactivated_at and deletion_scheduled_at, restores companies.
   */
  fastify.post('/auth/reactivate', {
    schema: {
      body: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: { type: 'string', minLength: 1, maxLength: 255 },
          password: { type: 'string', minLength: 1, maxLength: 255 },
        },
        additionalProperties: false,
      },
    },
    config: {
      rateLimit: {
        max: AUTH_RATE_LIMIT.login.max,
        timeWindow: AUTH_RATE_LIMIT.login.timeWindow,
      },
    },
  }, async (request, reply) => {
    const { identifier, password } = request.body as { identifier: string; password: string };

    // Find user by email or username
    const user = await userModel.findByIdentifier(identifier);

    if (!user) {
      await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is deactivated
    if (!user.deactivated_at) {
      throw new ValidationError('Account is not deactivated');
    }

    // Check if still within grace period
    const now = new Date();
    if (user.deletion_scheduled_at && user.deletion_scheduled_at <= now) {
      throw new AuthenticationError('Reactivation period has expired. Account has been permanently deleted.');
    }

    // Reactivate user account
    await userModel.reactivate(user.id);

    // Update deactivation log with reactivation timestamp and clear scheduled deletion
    // This prevents old deactivation records from triggering deletion
    // First, get the most recent deactivation log ID
    const [logs] = await fastify.mysql.query(
      `SELECT id FROM user_deactivation_logs 
       WHERE user_id = ? 
       AND reactivated_at IS NULL 
       ORDER BY deactivated_at DESC 
       LIMIT 1`,
      [user.id]
    ) as any;

    if (logs && logs.length > 0) {
      await fastify.mysql.query(
        `UPDATE user_deactivation_logs 
         SET reactivated_at = ?, 
             scheduled_deletion_at = NULL 
         WHERE id = ?`,
        [now, logs[0].id]
      );
    }

    // Reactivate companies if company user
    if (user.role === 'company') {
      const reactivatedCount = await companyModel.reactivateByOwnerId(user.id);
      if (reactivatedCount > 0) {
        fastify.log.info({ userId: user.id, reactivatedCount }, 'Companies reactivated');
        await incrementCacheVersion(fastify, 'companies');
      }
    }

    // Invalidate cache
    await invalidateUserCache(fastify, user.id);

    // Create session
    const userAgent = request.headers['user-agent'] || null;
    const ip = request.ip || null;

    const tokenPair = await sessionService.createSession({
      userId: user.id,
      userAgent,
      ip,
    });

    // Set cookies
    setAuthCookies(reply, tokenPair.accessToken, tokenPair.refreshToken);

    // Generate and set CSRF token
    const csrfToken = generateSecureToken(32);
    setCsrfTokenCookie(reply, csrfToken);

    // Get image URLs
    const imageUrls = await getUserImageUrls({
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    });

    // Log reactivation
    fastify.log.info({
      userId: user.id,
      sessionId: tokenPair.sessionId,
      ip,
    }, 'Account reactivated');

    return reply.send({
      reactivated: true,
      authenticated: true,
      message: 'Account reactivated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        company_id: user.company_id,
        ...imageUrls,
      },
    });
  });

  /**
   * POST /auth/refresh
   *
   * Rotate refresh token and issue new access token.
   * This endpoint is the core of replay attack prevention.
   */
  fastify.post('/auth/refresh', {
    config: {
      rateLimit: {
        max: AUTH_RATE_LIMIT.refresh.max,
        timeWindow: AUTH_RATE_LIMIT.refresh.timeWindow,
      },
    },
  }, async (request, reply) => {
    const refreshToken = getRefreshTokenFromCookies(request.cookies);

    if (!refreshToken) {
      clearAuthCookies(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING',
      });
    }

    const userAgent = request.headers['user-agent'] || undefined;
    const ip = request.ip || undefined;

    // Validate refresh token first to get userId
    const validation = await sessionService.validateRefreshToken(refreshToken);
    if (!validation.valid || !validation.userId) {
      clearAuthCookies(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: validation.error || 'Invalid or expired refresh token',
        code: 'REFRESH_TOKEN_INVALID',
      });
    }

    // Check if user is blocked or deactivated
    const user = await userModel.findById(validation.userId);
    if (!user) {
      clearAuthCookies(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.is_blocked) {
      clearAuthCookies(reply);
      await sessionService.revokeAllUserSessions(user.id);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Account is blocked',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    if (user.deactivated_at) {
      clearAuthCookies(reply);
      await sessionService.revokeAllUserSessions(user.id);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    const newTokenPair = await sessionService.rotateRefreshToken(refreshToken, userAgent, ip);

    if (!newTokenPair) {
      clearAuthCookies(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
        code: 'REFRESH_TOKEN_INVALID',
      });
    }

    // Set new cookies
    setAuthCookies(reply, newTokenPair.accessToken, newTokenPair.refreshToken);

    // Generate new CSRF token
    const csrfToken = generateSecureToken(32);
    setCsrfTokenCookie(reply, csrfToken);

    fastify.log.info({
      sessionId: newTokenPair.sessionId,
    }, 'Token refreshed');

    return reply.send({
      refreshed: true,
    });
  });

  /**
   * POST /auth/logout
   *
   * Revoke current session and clear all auth cookies.
   * Supports revocation via refresh token OR access token (sessionId).
   */
  fastify.post('/auth/logout', async (request, reply) => {
    let revoked = false;

    // Try to revoke by refresh token first (if available)
    const refreshToken = getRefreshTokenFromCookies(request.cookies);
    if (refreshToken) {
      revoked = await sessionService.revokeSessionByRefreshToken(refreshToken);
    }

    // If refresh token not available or revocation failed, try access token
    if (!revoked) {
      const accessToken = getAccessTokenFromCookies(request.cookies);
      if (accessToken) {
        const payload = sessionService.verifyAccessToken(accessToken);
        if (payload?.sessionId) {
          await sessionService.revokeSession(payload.sessionId);
          revoked = true;
        }
      }
    }

    clearAuthCookies(reply);

    if (revoked) {
      fastify.log.info('User logged out, session revoked');
    } else {
      fastify.log.info('User logged out (no active session to revoke)');
    }

    return reply.send({
      loggedOut: true,
    });
  });

  /**
   * GET /auth/me
   *
   * Get current user from access token cookie.
   */
  fastify.get('/auth/me', async (request, reply) => {
    const accessToken = getAccessTokenFromCookies(request.cookies);

    if (!accessToken) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Access token required',
        code: 'ACCESS_TOKEN_MISSING',
      });
    }

    const payload = sessionService.verifyAccessToken(accessToken);

    if (!payload) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired access token',
        code: 'ACCESS_TOKEN_INVALID',
      });
    }

    // Get full user data
    const user = await userModel.findById(payload.sub);

    if (!user) {
      clearAuthCookies(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.is_blocked) {
      clearAuthCookies(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Account is blocked',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    if (user.deactivated_at) {
      clearAuthCookies(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Get image URLs
    const imageUrls = await getUserImageUrls({
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        company_id: user.company_id,
        ...imageUrls,
      },
    });
  });

  /**
   * GET /auth/csrf
   *
   * Get a CSRF token for use in subsequent requests.
   * Sets the token in a readable cookie and returns it in the response.
   */
  fastify.get('/auth/csrf', {
    config: {
      rateLimit: {
        max: AUTH_RATE_LIMIT.csrf.max,
        timeWindow: AUTH_RATE_LIMIT.csrf.timeWindow,
      },
    },
  }, async (request, reply) => {
    const csrfToken = generateSecureToken(32);
    setCsrfTokenCookie(reply, csrfToken);

    return reply.send({
      csrfToken,
    });
  });

  /**
   * GET /auth/sessions
   *
   * List all active sessions for the current user.
   * Requires authentication via access token cookie.
   */
  fastify.get('/auth/sessions', async (request, reply) => {
    const accessToken = getAccessTokenFromCookies(request.cookies);

    if (!accessToken) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Access token required',
      });
    }

    const payload = sessionService.verifyAccessToken(accessToken);

    if (!payload) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired access token',
      });
    }

    const sessions = await sessionService.getUserSessions(payload.sub);

    // Return sessions without sensitive data
    const safeSessions = sessions.map((session) => ({
      id: session.id,
      user_agent: session.user_agent,
      ip: session.ip,
      created_at: session.created_at,
      expires_at: session.expires_at,
      is_current: session.id === payload.sessionId,
    }));

    return reply.send({
      sessions: safeSessions,
    });
  });

  /**
   * DELETE /auth/sessions
   *
   * Revoke all sessions for the current user (logout everywhere).
   * Requires CSRF protection.
   */
  fastify.delete('/auth/sessions', {
    preHandler: fastify.csrfProtection,
  }, async (request, reply) => {
    const accessToken = getAccessTokenFromCookies(request.cookies);

    if (!accessToken) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Access token required',
      });
    }

    const payload = sessionService.verifyAccessToken(accessToken);

    if (!payload) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired access token',
      });
    }

    await sessionService.revokeAllUserSessions(payload.sub);
    clearAuthCookies(reply);

    fastify.log.info({
      userId: payload.sub,
    }, 'All user sessions revoked');

    return reply.send({
      revokedAll: true,
    });
  });

  /**
   * DELETE /auth/sessions/:sessionId
   *
   * Revoke a specific session.
   * Requires CSRF protection.
   */
  fastify.delete('/auth/sessions/:sessionId', {
    preHandler: fastify.csrfProtection,
    schema: {
      params: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string', minLength: 36, maxLength: 36 },
        },
      },
    },
  }, async (request, reply) => {
    const accessToken = getAccessTokenFromCookies(request.cookies);

    if (!accessToken) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Access token required',
      });
    }

    const payload = sessionService.verifyAccessToken(accessToken);

    if (!payload) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired access token',
      });
    }

    const { sessionId } = request.params as { sessionId: string };

    // Verify the session belongs to this user (security check)
    const sessions = await sessionService.getUserSessions(payload.sub);
    const targetSession = sessions.find((s) => s.id === sessionId);

    if (!targetSession) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Session not found',
      });
    }

    await sessionService.revokeSession(sessionId);

    // If revoking current session, clear cookies
    if (sessionId === payload.sessionId) {
      clearAuthCookies(reply);
    }

    fastify.log.info({
      userId: payload.sub,
      sessionId,
    }, 'Session revoked');

    return reply.send({
      revoked: true,
    });
  });
};

export { authRoutes };
