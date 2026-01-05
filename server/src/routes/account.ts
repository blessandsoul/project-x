/**
 * Account Management Routes (Cookie-based Authentication)
 *
 * Secure self-service account management endpoints using HttpOnly cookie auth.
 * All unsafe methods require CSRF protection.
 *
 * Endpoints:
 * - PATCH /account - Update account details (email, username)
 * - POST /account/change-password - Change password (revokes other sessions)
 * - POST /account/deactivate - Soft-delete account (revokes all sessions)
 */

import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModel.js';
import { SessionService } from '../services/SessionService.js';
import { AuthenticationError, ValidationError, ConflictError } from '../types/errors.js';
import {
  clearAuthCookies,
  getAccessTokenFromCookies,
} from '../utils/cookies.js';
import { AUTH_RATE_LIMIT } from '../config/auth.js';
import { getUserAvatarUrls, getCompanyLogoUrls } from '../services/ImageUploadService.js';
import { CompanyModel } from '../models/CompanyModel.js';
import { invalidateUserCache } from '../utils/cache.js';

const BCRYPT_SALT_ROUNDS = 12;

// Username validation: alphanumeric, underscores, hyphens, 3-50 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,50}$/;

// Rate limit for sensitive account operations
const ACCOUNT_RATE_LIMIT = {
  changePassword: {
    max: 5,
    timeWindow: '15 minutes',
  },
  deactivate: {
    max: 3,
    timeWindow: '1 hour',
  },
};

const accountRoutes: FastifyPluginAsync = async (fastify) => {
  const userModel = new UserModel(fastify);
  const companyModel = new CompanyModel(fastify);
  const sessionService = new SessionService(fastify);

  /**
   * Helper to get user from access token cookie
   */
  async function getUserFromCookie(request: any): Promise<{ userId: number; sessionId: string }> {
    const accessToken = getAccessTokenFromCookies(request.cookies);

    if (!accessToken) {
      throw new AuthenticationError('Access token required');
    }

    const payload = sessionService.verifyAccessToken(accessToken);

    if (!payload) {
      throw new AuthenticationError('Invalid or expired access token');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
    };
  }

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

  /**
   * Build safe user response (no sensitive fields)
   */
  async function buildSafeUserResponse(user: any) {
    const imageUrls = await getUserImageUrls({
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
      deactivated_at: user.deactivated_at,
      ...imageUrls,
    };
  }

  /**
   * PATCH /account
   *
   * Update authenticated user's account details.
   * Requires CSRF protection.
   */
  fastify.patch('/account', {
    preHandler: fastify.csrfProtection,
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', maxLength: 255 },
          username: { type: 'string', minLength: 3, maxLength: 50 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const { userId } = await getUserFromCookie(request);

    const user = await userModel.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.deactivated_at) {
      throw new AuthenticationError('Account is deactivated');
    }

    if (user.is_blocked) {
      throw new AuthenticationError('Account is blocked');
    }

    const body = request.body as {
      email?: string;
      username?: string;
    };

    // Validate and sanitize inputs
    const updates: { email?: string; username?: string } = {};

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      if (!email || email.length === 0) {
        throw new ValidationError('Email cannot be empty');
      }

      // Check uniqueness
      const emailExists = await userModel.emailExists(email, userId);
      if (emailExists) {
        throw new ConflictError('Email already taken');
      }

      updates.email = email;
    }

    if (body.username !== undefined) {
      const username = body.username.trim();
      if (!username || username.length < 3 || username.length > 50) {
        throw new ValidationError('Username must be 3-50 characters');
      }

      if (!USERNAME_REGEX.test(username)) {
        throw new ValidationError('Username can only contain letters, numbers, underscores, and hyphens');
      }

      // Check uniqueness
      const usernameExists = await userModel.usernameExists(username, userId);
      if (usernameExists) {
        throw new ConflictError('Username already taken');
      }

      updates.username = username;
    }

    if (Object.keys(updates).length === 0) {
      // No updates provided, just return current user
      const safeUser = await buildSafeUserResponse(user);
      return reply.send({ user: safeUser });
    }

    // Perform update
    const updatedUser = await userModel.update(userId, updates);

    // Invalidate auth cache
    await invalidateUserCache(fastify, userId);

    fastify.log.info({
      userId,
      updatedFields: Object.keys(updates),
    }, 'Account updated');

    const safeUser = await buildSafeUserResponse(updatedUser);
    return reply.send({ user: safeUser });
  });

  /**
   * POST /account/change-password
   *
   * Change user's password. Revokes all other sessions.
   * Requires CSRF protection.
   */
  fastify.post('/account/change-password', {
    preHandler: fastify.csrfProtection,
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1, maxLength: 255 },
          newPassword: { type: 'string', minLength: 10, maxLength: 255 },
        },
        additionalProperties: false,
      },
    },
    config: {
      rateLimit: {
        max: ACCOUNT_RATE_LIMIT.changePassword.max,
        timeWindow: ACCOUNT_RATE_LIMIT.changePassword.timeWindow,
      },
    },
  }, async (request, reply) => {
    const { userId, sessionId } = await getUserFromCookie(request);

    const user = await userModel.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.deactivated_at) {
      throw new AuthenticationError('Account is deactivated');
    }

    if (user.is_blocked) {
      throw new AuthenticationError('Account is blocked');
    }

    const { currentPassword, newPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
    };

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password strength
    if (newPassword.length < 10) {
      throw new ValidationError('New password must be at least 10 characters');
    }

    // Check password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update password
    await userModel.update(userId, { password: newPasswordHash });

    // Revoke all other sessions (keep current session)
    const sessions = await sessionService.getUserSessions(userId);
    for (const session of sessions) {
      if (session.id !== sessionId) {
        await sessionService.revokeSession(session.id);
      }
    }

    // Invalidate auth cache
    await invalidateUserCache(fastify, userId);

    fastify.log.info({
      userId,
      revokedSessionCount: sessions.length - 1,
    }, 'Password changed, other sessions revoked');

    return reply.send({ success: true });
  });

  /**
   * POST /account/deactivate
   *
   * Soft-delete user account. Revokes all sessions and clears cookies.
   * Requires CSRF protection.
   */
  fastify.post('/account/deactivate', {
    preHandler: fastify.csrfProtection,
    schema: {
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', minLength: 1, maxLength: 255 },
          reason: { type: 'string', maxLength: 500 },
        },
        additionalProperties: false,
      },
    },
    config: {
      rateLimit: {
        max: ACCOUNT_RATE_LIMIT.deactivate.max,
        timeWindow: ACCOUNT_RATE_LIMIT.deactivate.timeWindow,
      },
    },
  }, async (request, reply) => {
    const { userId } = await getUserFromCookie(request);

    const user = await userModel.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.deactivated_at) {
      throw new AuthenticationError('Account is already deactivated');
    }

    const { password, reason } = request.body as {
      password: string;
      reason?: string;
    };

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Password is incorrect');
    }

    const now = new Date();
    // Schedule permanent deletion for 30 days from now
    const deletionScheduledAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // If user is a company owner, deactivate their companies first
    if (user.role === 'company') {
      const deactivatedCount = await companyModel.deactivateByOwnerId(userId);
      if (deactivatedCount > 0) {
        fastify.log.info({ userId, deactivatedCount }, 'Companies deactivated due to account deactivation');
        // Invalidate company cache so public listings update
        const { incrementCacheVersion } = await import('../utils/cache.js');
        await incrementCacheVersion(fastify, 'companies');
      }
    }

    // Mark user as deactivated with scheduled deletion date
    await userModel.update(userId, {
      deactivated_at: now,
      deletion_scheduled_at: deletionScheduledAt,
    });

    // Log the deactivation with reason
    const clientIp = request.ip || request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || null;
    await fastify.mysql.query(
      `INSERT INTO user_deactivation_logs 
       (user_id, reason, deactivated_at, deactivated_by_ip, scheduled_deletion_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        reason?.trim() || null,
        now,
        typeof clientIp === 'string' ? clientIp : null,
        deletionScheduledAt,
      ]
    );

    // Revoke all sessions
    await sessionService.revokeAllUserSessions(userId);

    // Clear auth cookies
    clearAuthCookies(reply);

    // Invalidate auth cache
    await invalidateUserCache(fastify, userId);

    fastify.log.info({
      userId,
      deletionScheduledAt: deletionScheduledAt.toISOString(),
      reason: reason?.slice(0, 100) || null,
      ip: typeof clientIp === 'string' ? clientIp : null,
    }, 'Account deactivated');

    return reply.send({
      success: true,
      deletionScheduledAt: deletionScheduledAt.toISOString(),
    });
  });
};

export { accountRoutes };
