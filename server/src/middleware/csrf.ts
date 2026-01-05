/**
 * CSRF Protection Middleware
 *
 * Implements double-submit cookie pattern for CSRF protection.
 * Required because we use HttpOnly cookies for authentication.
 *
 * How it works:
 * 1. GET /auth/csrf generates a CSRF token and sets it in a readable cookie
 * 2. Client reads the cookie and sends the token in X-CSRF-Token header
 * 3. This middleware validates that header matches cookie for unsafe methods
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CSRF_SECRET, CSRF_HEADER_NAME, CSRF_TOKEN_COOKIE } from '../config/auth.js';
import { generateCsrfToken, verifyCsrfToken } from '../utils/crypto.js';
import { getCsrfTokenFromCookies } from '../utils/cookies.js';

declare module 'fastify' {
  interface FastifyInstance {
    csrfProtection: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    generateCsrfToken: (sessionId: string) => string;
  }
}

// Methods that require CSRF protection
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Routes that are exempt from CSRF (login/register before session exists)
// Note: We still protect these with rate limiting
// Reason: These endpoints are called BEFORE a CSRF cookie exists, so they cannot
// provide a valid CSRF token. Security is maintained via rate limiting.
const CSRF_EXEMPT_ROUTES = new Set([
  '/auth/login',    // Login before session/CSRF cookie exists
  '/auth/register', // Registration before session/CSRF cookie exists
]);

const csrfPlugin = fp(async (fastify: FastifyInstance) => {
  /**
   * Generate a CSRF token for a session
   */
  fastify.decorate('generateCsrfToken', (sessionId: string): string => {
    return generateCsrfToken(CSRF_SECRET, sessionId);
  });

  /**
   * CSRF protection hook
   * Use as preHandler on routes that need protection
   */
  fastify.decorate('csrfProtection', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only check unsafe methods
    if (!UNSAFE_METHODS.has(request.method)) {
      return;
    }

    // Check if route is exempt
    const routePath = request.routeOptions?.url || request.url.split('?')[0] || '';
    if (CSRF_EXEMPT_ROUTES.has(routePath)) {
      return;
    }

    // Get CSRF token from header
    const headerToken = request.headers[CSRF_HEADER_NAME] as string | undefined;
    if (!headerToken) {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'CSRF token required',
        code: 'CSRF_TOKEN_MISSING',
      });
    }

    // Get CSRF token from cookie
    const cookieToken = getCsrfTokenFromCookies(request.cookies);
    if (!cookieToken) {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'CSRF cookie missing',
        code: 'CSRF_COOKIE_MISSING',
      });
    }

    // Verify tokens match (double-submit pattern)
    if (headerToken !== cookieToken) {
      fastify.log.warn({
        method: request.method,
        url: request.url,
      }, 'CSRF token mismatch');

      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'CSRF token invalid',
        code: 'CSRF_TOKEN_INVALID',
      });
    }

    // For extra security, we could also verify the token signature
    // but double-submit is sufficient for most cases
  });
});

export { csrfPlugin };
