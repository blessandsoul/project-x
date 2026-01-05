/**
 * Authentication Configuration
 *
 * Centralized configuration for secure HttpOnly cookie-based authentication.
 * All security-sensitive values are loaded from environment variables.
 */

// =============================================================================
// JWT Configuration
// =============================================================================

const ENV_JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

if (!ENV_JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET (or JWT_SECRET) environment variable is required');
}

if (process.env.NODE_ENV === 'production' && ENV_JWT_ACCESS_SECRET.length < 32) {
  throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production');
}

export const JWT_ACCESS_SECRET: string = ENV_JWT_ACCESS_SECRET;

export const ACCESS_TTL_MINUTES = process.env.ACCESS_TTL_MINUTES
  ? parseInt(process.env.ACCESS_TTL_MINUTES, 10)
  : 15;

export const REFRESH_TTL_DAYS = process.env.REFRESH_TTL_DAYS
  ? parseInt(process.env.REFRESH_TTL_DAYS, 10)
  : 14;

export const JWT_ISSUER = process.env.JWT_ISSUER || undefined;
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || undefined;

// =============================================================================
// Cookie Configuration
// =============================================================================

const isProd = process.env.NODE_ENV === 'production';

export const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || isProd;

export const COOKIE_SAMESITE: 'strict' | 'lax' | 'none' = (() => {
  const value = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  if (value === 'strict') return 'strict';
  if (value === 'none') return 'none';
  return 'lax';
})();

export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

// Cookie names
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_TOKEN_COOKIE = 'csrf_token';

// Cookie paths
export const ACCESS_TOKEN_PATH = '/';
export const REFRESH_TOKEN_PATH = '/auth/refresh';

// =============================================================================
// CSRF Configuration
// =============================================================================

export const CSRF_SECRET = process.env.CSRF_SECRET || ENV_JWT_ACCESS_SECRET;
export const CSRF_HEADER_NAME = 'x-csrf-token';

// =============================================================================
// CORS Configuration
// =============================================================================

export const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const CORS_CREDENTIALS = process.env.CORS_ALLOW_CREDENTIALS !== 'false';

// =============================================================================
// Rate Limiting Configuration
// =============================================================================

export const AUTH_RATE_LIMIT = {
  login: {
    max: process.env.RATE_LIMIT_AUTH_LOGIN_MAX
      ? parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_MAX, 10)
      : 5,
    timeWindow: process.env.RATE_LIMIT_AUTH_LOGIN_WINDOW || '1 minute',
  },
  register: {
    max: process.env.RATE_LIMIT_AUTH_REGISTER_MAX
      ? parseInt(process.env.RATE_LIMIT_AUTH_REGISTER_MAX, 10)
      : 3,
    timeWindow: process.env.RATE_LIMIT_AUTH_REGISTER_WINDOW || '1 hour',
  },
  refresh: {
    max: process.env.RATE_LIMIT_AUTH_REFRESH_MAX
      ? parseInt(process.env.RATE_LIMIT_AUTH_REFRESH_MAX, 10)
      : 30,
    timeWindow: process.env.RATE_LIMIT_AUTH_REFRESH_WINDOW || '1 minute',
  },
  csrf: {
    max: process.env.RATE_LIMIT_AUTH_CSRF_MAX
      ? parseInt(process.env.RATE_LIMIT_AUTH_CSRF_MAX, 10)
      : 60,
    timeWindow: process.env.RATE_LIMIT_AUTH_CSRF_WINDOW || '1 minute',
  },
};

// =============================================================================
// Session Configuration
// =============================================================================

export const SESSION_CONFIG = {
  refreshTtlDays: REFRESH_TTL_DAYS,
  accessTtlMinutes: ACCESS_TTL_MINUTES,
  // Maximum active sessions per user (0 = unlimited)
  maxSessionsPerUser: process.env.MAX_SESSIONS_PER_USER
    ? parseInt(process.env.MAX_SESSIONS_PER_USER, 10)
    : 10,
};

// =============================================================================
// Trust Proxy (for Nginx/Cloudflare/PM2)
// =============================================================================

export const TRUST_PROXY = process.env.TRUST_PROXY === 'true' || isProd;
