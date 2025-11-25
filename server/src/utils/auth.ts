import { AuthorizationError } from '../types/errors.js';

/**
 * Authorization Utilities
 *
 * Common authorization check patterns used across routes.
 */

interface AuthUser {
  id: number;
  role: string;
  company_id?: number | null;
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: AuthUser | undefined | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user owns a specific company
 */
export function isCompanyOwner(user: AuthUser | undefined | null, companyId: number): boolean {
  return (
    user?.role === 'company' &&
    typeof user.company_id === 'number' &&
    user.company_id === companyId
  );
}

/**
 * Check if user can manage a company (admin or owner)
 */
export function canManageCompany(user: AuthUser | undefined | null, companyId: number): boolean {
  return isAdmin(user) || isCompanyOwner(user, companyId);
}

/**
 * Require user to be able to manage a company, throw if not
 */
export function requireCompanyAccess(
  user: AuthUser | undefined | null,
  companyId: number,
  action: string = 'perform this action',
): void {
  if (!user) {
    throw new AuthorizationError(`Authentication required to ${action}`);
  }

  if (!canManageCompany(user, companyId)) {
    throw new AuthorizationError(`Not authorized to ${action}`);
  }
}

/**
 * Require user to be an admin, throw if not
 */
export function requireAdmin(
  user: AuthUser | undefined | null,
  action: string = 'perform this action',
): void {
  if (!user) {
    throw new AuthorizationError(`Authentication required to ${action}`);
  }

  if (!isAdmin(user)) {
    throw new AuthorizationError(`Admin role required to ${action}`);
  }
}

/**
 * Parse and validate an integer ID from request params
 */
export function parseId(value: string | undefined, name: string = 'id'): number {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  const id = parseInt(value, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`Invalid ${name}`);
  }

  return id;
}
