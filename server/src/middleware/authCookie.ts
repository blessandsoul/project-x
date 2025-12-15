/**
 * Cookie-based Authentication Middleware
 *
 * Provides authentication guards that read access tokens from HttpOnly cookies
 * instead of Authorization headers. This is the secure replacement for
 * header-based JWT authentication.
 *
 * Features:
 * - Reads access token from HttpOnly cookie
 * - Verifies JWT signature and expiration
 * - Attaches user info to request object
 * - Supports both required and optional authentication
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SessionService } from '../services/SessionService.js';
import { UserModel } from '../models/UserModel.js';
import { getAccessTokenFromCookies } from '../utils/cookies.js';
import { getFromCache, setInCache } from '../utils/cache.js';
import type { UserRole } from '../types/user.js';

// Cache user data for 5 minutes to reduce DB load
const USER_CACHE_TTL = 300;

declare module 'fastify' {
  interface FastifyInstance {
    authenticateCookie: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateCookieOptional: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authCookiePlugin = fp(async (fastify: FastifyInstance) => {
  const sessionService = new SessionService(fastify);
  const userModel = new UserModel(fastify);

  /**
   * Required authentication via cookie
   * Returns 401 if not authenticated
   */
  fastify.decorate('authenticateCookie', async (request: FastifyRequest, reply: FastifyReply) => {
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

    // Try to get user from cache first
    const cacheKey = `user:auth:${payload.sub}`;
    let dbUser = await getFromCache<{
      id: number;
      email: string;
      username: string;
      role: UserRole;
      company_id: number | null;
      is_blocked: boolean;
    }>(fastify, cacheKey);

    if (!dbUser) {
      // Cache miss - load from DB
      const freshUser = await userModel.findById(payload.sub);
      if (!freshUser) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
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
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Account is blocked',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    // Attach user to request
    request.user = {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role,
      company_id: dbUser.company_id,
    };
  });

  /**
   * Optional authentication via cookie
   * Sets request.user if authenticated, undefined otherwise
   * Never returns an error
   */
  fastify.decorate('authenticateCookieOptional', async (request: FastifyRequest, reply: FastifyReply) => {
    const accessToken = getAccessTokenFromCookies(request.cookies);

    if (!accessToken) {
      (request as any).user = undefined;
      return;
    }

    const payload = sessionService.verifyAccessToken(accessToken);

    if (!payload) {
      (request as any).user = undefined;
      return;
    }

    // Try to get user from cache first
    const cacheKey = `user:auth:${payload.sub}`;
    let dbUser = await getFromCache<{
      id: number;
      email: string;
      username: string;
      role: UserRole;
      company_id: number | null;
      is_blocked: boolean;
    }>(fastify, cacheKey);

    if (!dbUser) {
      const freshUser = await userModel.findById(payload.sub);
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
  });
});

export { authCookiePlugin };
