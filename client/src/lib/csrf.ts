/**
 * CSRF Token Management
 *
 * Handles CSRF token for secure cookie-based authentication.
 *
 * SOURCE OF TRUTH: The csrf_token cookie (set by server, readable by JS).
 * In-memory caching is used only as an optimization to avoid repeated cookie parsing.
 *
 * The server sets csrf_token as a non-HttpOnly cookie so JavaScript can read it
 * and send it as the X-CSRF-Token header (double-submit cookie pattern).
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://api.trendingnow.ge'

// In-memory cache (optimization only, NOT source of truth)
let csrfTokenCache: string | null = null

// Single-flight lock to prevent concurrent /auth/csrf fetches
let csrfFetchPromise: Promise<string> | null = null

/**
 * Read CSRF token directly from document.cookie
 * This is the SOURCE OF TRUTH - cookies persist across page refreshes and tabs
 */
function readCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf_token' && value) {
      return decodeURIComponent(value)
    }
  }
  return null
}

/**
 * Fetch a fresh CSRF token from the server
 * This calls GET /auth/csrf which sets the csrf_token cookie
 */
async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await axios.get<{ csrfToken: string }>(`${API_BASE_URL}/auth/csrf`, {
      withCredentials: true,
    })
    // Update cache from response (server also sets cookie)
    csrfTokenCache = response.data.csrfToken
    return csrfTokenCache
  } catch (error) {
    console.error('[CSRF] Failed to fetch CSRF token', error)
    throw error
  }
}

/**
 * Get the current CSRF token
 *
 * Priority:
 * 1. Read from cookie (source of truth) - handles page refresh, new tabs
 * 2. Use in-memory cache if cookie not yet available
 * 3. Fetch from /auth/csrf if neither exists
 *
 * Uses single-flight pattern to prevent multiple concurrent fetches
 */
export async function getCsrfToken(): Promise<string> {
  // 1. Always check cookie first (source of truth)
  const cookieToken = readCsrfTokenFromCookie()
  if (cookieToken) {
    csrfTokenCache = cookieToken // Update cache
    return cookieToken
  }

  // 2. Fall back to cache (may exist from recent fetch before cookie is readable)
  if (csrfTokenCache) {
    return csrfTokenCache
  }

  // 3. Fetch from server (single-flight to prevent concurrent requests)
  if (csrfFetchPromise) {
    return csrfFetchPromise
  }

  csrfFetchPromise = fetchCsrfToken().finally(() => {
    csrfFetchPromise = null
  })

  return csrfFetchPromise
}

/**
 * Get CSRF token synchronously (for request interceptor optimization)
 *
 * Returns token from cookie (source of truth) or cache.
 * Returns null if token not available - caller should use async getCsrfToken()
 */
export function getCsrfTokenSync(): string | null {
  // Always prefer cookie (source of truth)
  const cookieToken = readCsrfTokenFromCookie()
  if (cookieToken) {
    csrfTokenCache = cookieToken
    return cookieToken
  }
  return csrfTokenCache
}

/**
 * Force refresh the CSRF token from server
 * Call this after login/register to ensure fresh token
 */
export async function refreshCsrfToken(): Promise<string> {
  csrfTokenCache = null
  csrfFetchPromise = null
  return fetchCsrfToken()
}

/**
 * Clear the CSRF token cache
 * Call this on logout (server clears the cookie)
 */
export function clearCsrfToken(): void {
  csrfTokenCache = null
  csrfFetchPromise = null
}
