/**
 * Security Configuration
 *
 * This module contains all security-related configuration derived from
 * environment variables. Centralizes CORS, rate limiting, and production
 * environment detection.
 *
 * @module config/security
 */

/** Whether the application is running in production mode */
export const isProd = process.env.NODE_ENV === 'production';

/** Log level based on environment */
export const logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

/** Whether to trust proxy headers (required behind Nginx/Cloudflare) */
export const trustProxy = process.env.TRUST_PROXY === 'true' || isProd;

/**
 * Parse CORS allowed origins from environment variable
 * Supports comma-separated list of origins
 */
const rawCorsOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
export const allowedOrigins = rawCorsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

/** Whether to allow credentials in CORS requests */
export const allowCorsCredentials = process.env.CORS_ALLOW_CREDENTIALS === 'true';

/** Global rate limit - maximum requests per time window */
export const globalRateLimitMax = process.env.RATE_LIMIT_MAX
    ? parseInt(process.env.RATE_LIMIT_MAX, 10)
    : 100;

/** Global rate limit - time window duration */
export const globalRateLimitWindow = process.env.RATE_LIMIT_TIME_WINDOW || '1 minute';

/**
 * Warn if production is running without explicit CORS origins
 * This prevents accidental exposure if deployed without proper config
 */
export function warnIfInsecureCorsConfig(): void {
    if (isProd && allowedOrigins.length === 0) {
        console.warn(
            '\n⚠️  SECURITY WARNING: CORS_ALLOWED_ORIGINS is not configured in production!\n' +
            '   Browser requests with Origin headers will be DENIED.\n' +
            '   Set CORS_ALLOWED_ORIGINS=https://yourdomain.com to allow your frontend.\n'
        );
    }
}

/**
 * Export all security config as a single object for convenience
 */
export const securityConfig = {
    isProd,
    logLevel,
    trustProxy,
    allowedOrigins,
    allowCorsCredentials,
    globalRateLimitMax,
    globalRateLimitWindow,
} as const;
