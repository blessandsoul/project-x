import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types/user.js';
import { AuthenticationError } from '../types/errors.js';
import { UserModel } from '../models/UserModel.js';
import { getFromCache, setInCache } from '../utils/cache.js';
import { getAccessTokenFromCookies } from '../utils/cookies.js';
import { SessionService } from '../services/SessionService.js';

// Cache user data for 5 minutes to reduce DB load on auth
const USER_CACHE_TTL = 300;

/**
 * Authentication Plugin (Cookie-Only)
 *
 * Provides HttpOnly cookie-based authentication for the Fastify application.
 * Header-based authentication (Authorization: Bearer) is NO LONGER SUPPORTED.
 *
 * Features:
 * - HttpOnly cookie token verification via SessionService
 * - Authentication middleware for protected routes
 * - User caching to reduce DB load
 */

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Authentication middleware - requires HttpOnly cookie access_token.
     * Header-based auth (Authorization: Bearer) is NOT supported.
     */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /**
     * Optional authentication - same as authenticate but doesn't fail if no token present.
     * Useful for routes that work for both authenticated and anonymous users.
     */
    authenticateOptional: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin = fp(async (fastify) => {
  const userModel = new UserModel(fastify);
  const sessionService = new SessionService(fastify);

  /**
   * Authentication middleware for protected routes (Cookie-Only)
   *
   * Extracts and validates access_token from HttpOnly cookie.
   * Header-based auth (Authorization: Bearer) is NOT supported.
   *
   * @param request - Fastify request object
   * @param reply - Fastify reply object
   * @throws Sends 401 response if authentication fails
   */
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Only accept HttpOnly cookie authentication
      const cookieToken = getAccessTokenFromCookies(request.cookies);

      if (!cookieToken) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Access token required',
          code: 'ACCESS_TOKEN_MISSING',
        });
      }

      const cookiePayload = sessionService.verifyAccessToken(cookieToken);
      if (!cookiePayload) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or expired access token',
          code: 'ACCESS_TOKEN_INVALID',
        });
      }

      // Get user from cache/DB
      const cacheKey = `user:auth:${cookiePayload.sub}`;
      let dbUser = await getFromCache<{
        id: number;
        email: string;
        username: string;
        role: UserRole;
        company_id: number | null;
        is_blocked: boolean;
      }>(fastify, cacheKey);

      if (!dbUser) {
        const freshUser = await userModel.findById(cookiePayload.sub);
        if (!freshUser) {
          throw new AuthenticationError('User not found');
        }
        dbUser = {
          id: freshUser.id,
          email: freshUser.email,
          username: freshUser.username,
          role: freshUser.role,
          company_id: freshUser.company_id,
          is_blocked: freshUser.is_blocked,
        };
        await setInCache(fastify, cacheKey, dbUser, USER_CACHE_TTL);
      }

      if (dbUser.is_blocked) {
        throw new AuthenticationError('Account is blocked');
      }

      request.user = {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        company_id: dbUser.company_id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message,
        code: 'AUTHENTICATION_FAILED',
      });
    }
  });

  /**
   * Optional authentication middleware (Cookie-Only)
   *
   * Same as authenticate but doesn't fail if no token present.
   * Useful for routes that work for both authenticated and anonymous users.
   * Header-based auth (Authorization: Bearer) is NOT supported.
   */
  fastify.decorate('authenticateOptional', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      // Only accept HttpOnly cookie authentication
      const cookieToken = getAccessTokenFromCookies(request.cookies);

      if (!cookieToken) {
        // No token -> anonymous (this is OK for optional auth)
        (request as any).user = undefined;
        return;
      }

      const cookiePayload = sessionService.verifyAccessToken(cookieToken);
      if (!cookiePayload) {
        // Invalid token -> anonymous
        (request as any).user = undefined;
        return;
      }

      // Get user from cache/DB
      const cacheKey = `user:auth:${cookiePayload.sub}`;
      let dbUser = await getFromCache<{
        id: number;
        email: string;
        username: string;
        role: UserRole;
        company_id: number | null;
        is_blocked: boolean;
      }>(fastify, cacheKey);

      if (!dbUser) {
        const freshUser = await userModel.findById(cookiePayload.sub);
        if (!freshUser) {
          (request as any).user = undefined;
          return;
        }
        dbUser = {
          id: freshUser.id,
          email: freshUser.email,
          username: freshUser.username,
          role: freshUser.role,
          company_id: freshUser.company_id,
          is_blocked: freshUser.is_blocked,
        };
        await setInCache(fastify, cacheKey, dbUser, USER_CACHE_TTL);
      }

      if (dbUser.is_blocked) {
        (request as any).user = undefined;
        return;
      }

      request.user = {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        company_id: dbUser.company_id,
      };
    } catch (_error) {
      // Optional auth: never send a response; just continue as anonymous
      (request as any).user = undefined;
    }
  });
});

export { authPlugin };
