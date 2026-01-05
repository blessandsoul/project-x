/**
 * Cookie Helpers for Secure HttpOnly Authentication
 *
 * Provides utilities for setting and clearing authentication cookies
 * with proper security attributes (HttpOnly, Secure, SameSite).
 */

import type { FastifyReply } from 'fastify';
import {
  COOKIE_SECURE,
  COOKIE_SAMESITE,
  COOKIE_DOMAIN,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  ACCESS_TOKEN_PATH,
  REFRESH_TOKEN_PATH,
  ACCESS_TTL_MINUTES,
  REFRESH_TTL_DAYS,
} from '../config/auth.js';

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number; // in seconds
  domain?: string;
}

/**
 * Build base cookie options with security defaults
 */
function buildCookieOptions(overrides: Partial<CookieOptions> = {}): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: '/',
    maxAge: 0,
    ...overrides,
  };

  // SameSite=None requires Secure=true
  if (options.sameSite === 'none' && !options.secure) {
    options.secure = true;
  }

  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }

  return options;
}

/**
 * Set the access token cookie (HttpOnly, short-lived)
 */
export function setAccessTokenCookie(reply: FastifyReply, accessToken: string): void {
  const maxAge = ACCESS_TTL_MINUTES * 60; // Convert minutes to seconds

  reply.setCookie(ACCESS_TOKEN_COOKIE, accessToken, buildCookieOptions({
    httpOnly: true,
    path: ACCESS_TOKEN_PATH,
    maxAge,
  }));
}

/**
 * Set the refresh token cookie (HttpOnly, long-lived, restricted path)
 */
export function setRefreshTokenCookie(reply: FastifyReply, refreshToken: string): void {
  const maxAge = REFRESH_TTL_DAYS * 24 * 60 * 60; // Convert days to seconds

  reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, buildCookieOptions({
    httpOnly: true,
    path: REFRESH_TOKEN_PATH,
    maxAge,
  }));
}

/**
 * Set the CSRF token cookie (NOT HttpOnly - must be readable by JS)
 */
export function setCsrfTokenCookie(reply: FastifyReply, csrfToken: string): void {
  const maxAge = REFRESH_TTL_DAYS * 24 * 60 * 60; // Same as refresh token

  reply.setCookie(CSRF_TOKEN_COOKIE, csrfToken, buildCookieOptions({
    httpOnly: false, // Must be readable by JavaScript
    path: '/',
    maxAge,
  }));
}

/**
 * Set both access and refresh token cookies
 */
export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void {
  setAccessTokenCookie(reply, accessToken);
  setRefreshTokenCookie(reply, refreshToken);
}

/**
 * Clear legacy 'token' cookie that may exist from old auth system
 * This ensures users with old cookies get them removed
 */
export function clearLegacyTokenCookie(reply: FastifyReply): void {
  reply.clearCookie('token', {
    path: '/',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });
}

/**
 * Clear all authentication cookies (for logout)
 * Also clears legacy 'token' cookie for cleanup
 */
export function clearAuthCookies(reply: FastifyReply): void {
  // Clear access token
  reply.clearCookie(ACCESS_TOKEN_COOKIE, {
    path: ACCESS_TOKEN_PATH,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });

  // Clear refresh token
  reply.clearCookie(REFRESH_TOKEN_COOKIE, {
    path: REFRESH_TOKEN_PATH,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });

  // Clear CSRF token
  reply.clearCookie(CSRF_TOKEN_COOKIE, {
    path: '/',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });

  // Clear legacy 'token' cookie from old auth system
  clearLegacyTokenCookie(reply);
}

/**
 * Extract access token from cookies
 */
export function getAccessTokenFromCookies(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[ACCESS_TOKEN_COOKIE];
}

/**
 * Extract refresh token from cookies
 */
export function getRefreshTokenFromCookies(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[REFRESH_TOKEN_COOKIE];
}

/**
 * Extract CSRF token from cookies
 */
export function getCsrfTokenFromCookies(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[CSRF_TOKEN_COOKIE];
}
