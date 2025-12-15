/**
 * Cryptographic Utilities for Secure Authentication
 *
 * Provides secure token generation and hashing using Node.js crypto module.
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 * @param bytes - Number of random bytes (default: 32)
 * @returns Base64url-encoded random token
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Compute SHA-256 hash of a string
 * @param input - String to hash
 * @returns Hex-encoded SHA-256 hash (64 characters)
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Generate a CSRF token using HMAC
 * @param secret - HMAC secret key
 * @param sessionId - Session identifier to bind the token to
 * @returns HMAC-based CSRF token
 */
export function generateCsrfToken(secret: string, sessionId: string): string {
  const timestamp = Date.now().toString(36);
  const data = `${sessionId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${timestamp}.${hmac}`;
}

/**
 * Verify a CSRF token
 * @param token - CSRF token to verify
 * @param secret - HMAC secret key
 * @param sessionId - Session identifier the token should be bound to
 * @param maxAgeMs - Maximum age of the token in milliseconds (default: 24 hours)
 * @returns True if token is valid
 */
export function verifyCsrfToken(
  token: string,
  secret: string,
  sessionId: string,
  maxAgeMs: number = 24 * 60 * 60 * 1000,
): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const timestamp = parts[0];
  const providedHmac = parts[1];

  if (!timestamp || !providedHmac) {
    return false;
  }

  // Check timestamp age
  const tokenTime = parseInt(timestamp, 36);
  if (isNaN(tokenTime)) {
    return false;
  }

  const now = Date.now();
  if (now - tokenTime > maxAgeMs) {
    return false;
  }

  // Verify HMAC
  const data = `${sessionId}:${timestamp}`;
  const expectedHmac = crypto.createHmac('sha256', secret).update(data).digest('base64url');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedHmac, 'utf8'),
    Buffer.from(expectedHmac, 'utf8'),
  );
}

/**
 * Generate a UUID v4
 * @returns UUID string
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}
