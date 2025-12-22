import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthorizationError } from '../types/errors.js';
import type { UserRole } from '../types/user.js';

/**
 * RBAC Middleware: Require specific user role(s)
 *
 * Usage:
 *   fastify.get('/admin', {
 *     preHandler: [fastify.authenticateCookie, requireRole('admin')],
 *     ...
 *   })
 *
 * @param allowedRoles - One or more roles that are allowed to access the route
 * @returns Fastify preHandler function
 */
export function requireRole(...allowedRoles: UserRole[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            throw new AuthorizationError('Authentication required');
        }

        if (!request.user.role || !allowedRoles.includes(request.user.role)) {
            throw new AuthorizationError(
                `Access denied. Requires role: ${allowedRoles.join(' or ')}`
            );
        }
    };
}

/**
 * RBAC Middleware: Require company membership
 *
 * Ensures:
 * - User is authenticated
 * - User has role='company'
 * - User has an active company_id
 *
 * Usage:
 *   fastify.get('/company/settings', {
 *     preHandler: [fastify.authenticateCookie, requireCompanyMembership()],
 *     ...
 *   })
 *
 * @returns Fastify preHandler function
 */
export function requireCompanyMembership() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            throw new AuthorizationError('Authentication required');
        }

        if (request.user.role !== 'company') {
            throw new AuthorizationError('Access denied. Requires company role');
        }

        if (!request.user.company_id) {
            throw new AuthorizationError('No active company associated with this account');
        }
    };
}

/**
 * RBAC Middleware: Require user to NOT have a company
 *
 * Ensures:
 * - User is authenticated
 * - User does NOT have a company_id (for onboarding)
 *
 * Usage:
 *   fastify.post('/companies/onboard', {
 *     preHandler: [fastify.authenticateCookie, requireNoCompany()],
 *     ...
 *   })
 *
 * @returns Fastify preHandler function
 */
export function requireNoCompany() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            throw new AuthorizationError('Authentication required');
        }

        if (request.user.company_id) {
            throw new AuthorizationError('User already has an active company');
        }
    };
}
