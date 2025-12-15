/**
 * Admin Authorization Middleware
 *
 * Centralized guard for admin-only endpoints. Must be used AFTER
 * authentication middleware (authenticateCookie) has run and set request.user.
 *
 * Features:
 * - Blocks non-admin users with 403
 * - Audit logs admin write actions (POST/PUT/PATCH/DELETE)
 *
 * Usage:
 *   preHandler: [fastify.authenticateCookie, fastify.requireAdmin]
 *   // For write operations, add CSRF:
 *   preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection]
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthorizationError } from '../types/errors.js';

// Methods that should be audit logged
const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

declare module 'fastify' {
  interface FastifyInstance {
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const requireAdminPlugin = fp(async (fastify: FastifyInstance) => {
  /**
   * Admin authorization guard
   *
   * Assumes authenticateCookie already ran and set request.user.
   * - If request.user missing → 401 (should not happen if auth middleware ran)
   * - If request.user.role !== 'admin' → 403
   * - Otherwise allows request to proceed
   * - Audit logs write operations
   */
  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    // This should not happen if authenticateCookie ran first, but handle defensively
    if (!request.user) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Check admin role
    if (request.user.role !== 'admin') {
      // Log failed admin access attempt (security monitoring)
      fastify.log.warn({
        event: 'admin_access_denied',
        userId: request.user.id,
        userRole: request.user.role,
        method: request.method,
        route: request.routeOptions?.url || request.url,
        ip: request.ip,
      }, 'Non-admin user attempted to access admin endpoint');

      throw new AuthorizationError('Admin role required to access this resource');
    }

    // Audit log admin write actions (do NOT log request body to avoid sensitive data leaks)
    if (AUDIT_METHODS.has(request.method)) {
      const params = request.params as Record<string, unknown> | undefined;
      fastify.log.info({
        event: 'admin_action',
        adminId: request.user.id,
        adminUsername: request.user.username,
        method: request.method,
        route: request.routeOptions?.url || request.url,
        targetId: params?.id || params?.companyId || params?.reviewId || null,
        ip: request.ip,
        timestamp: new Date().toISOString(),
      }, `Admin action: ${request.method} ${request.routeOptions?.url || request.url}`);
    }

    // Admin authorized - continue to handler
  });
});

export default requireAdminPlugin;
export { requireAdminPlugin };
