/**
 * API Client with HttpOnly Cookie Authentication
 *
 * Features:
 * - Uses withCredentials for automatic cookie handling
 * - Attaches CSRF token header for unsafe methods (POST/PUT/PATCH/DELETE)
 * - Automatic 401 refresh + retry logic with single-flight lock
 * - No localStorage/sessionStorage token storage
 *
 * Security:
 * - Tokens are in HttpOnly cookies (not accessible to JS)
 * - CSRF token is read from cookie and sent as X-CSRF-Token header
 * - Refresh requests do NOT require CSRF (exempt on server)
 */

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getCsrfToken, getCsrfTokenSync } from './csrf'

export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000/api/v1'
  : '/api/v1' // Relative URL for same-domain deployment

/**
 * Endpoints that should NOT trigger refresh on 401
 * - /auth/refresh: Would cause infinite loop
 * - /auth/me: Used for auth check, 401 is expected when not logged in
 * - /auth/login, /auth/logout, /auth/csrf: Auth endpoints, no retry needed
 */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/logout', '/auth/refresh', '/auth/me', '/auth/csrf']

/**
 * REFRESH LOCK (Single-flight pattern)
 * Prevents multiple concurrent refresh requests when several 401s arrive simultaneously.
 * Only one refresh request is sent; others wait and retry after it completes.
 */
let isRefreshing = false

/**
 * REFRESH QUEUE
 * Holds pending requests that received 401 while a refresh is in progress.
 * After refresh completes, all queued requests are retried or rejected.
 */
type QueueItem = {
  resolve: (value: boolean) => void
  reject: (error: unknown) => void
}
let refreshQueue: QueueItem[] = []

/**
 * Process the refresh queue after refresh completes
 * Called with success=true to retry all queued requests, or success=false to reject them
 */
function processRefreshQueue(success: boolean, error?: unknown): void {
  refreshQueue.forEach((item) => {
    if (success) {
      item.resolve(true)
    } else {
      item.reject(error)
    }
  })
  refreshQueue = []
}

/**
 * Refresh result type
 * - 'success': Token refreshed, retry original request
 * - 'auth_failure': 401/403 from server, session is invalid, logout required
 * - 'network_error': Network issue, do NOT logout, preserve auth state
 */
type RefreshResult = 'success' | 'auth_failure' | 'network_error'

/**
 * Attempt to refresh the access token
 * Uses raw axios (not apiClient) to avoid interceptor recursion
 * Does NOT send CSRF header - refresh is exempt on server
 *
 * CRITICAL: Distinguishes between auth failures (logout) and network errors (preserve state)
 */
export async function refreshAccessToken(): Promise<RefreshResult> {
  try {
    // Use raw axios to avoid triggering our own interceptors
    // Response body is not parsed - we only care if request succeeded
    await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
    return 'success'
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      // 401/403 = auth failure, session is invalid
      if (status === 401 || status === 403) {
        console.error('[API] Token refresh failed: auth error', status)
        return 'auth_failure'
      }
      // Other HTTP errors (5xx, etc) - treat as network error, don't logout
      console.warn('[API] Token refresh failed: server error', status)
      return 'network_error'
    }
    // Network error (no response) - do NOT logout
    console.warn('[API] Token refresh failed: network error', error)
    return 'network_error'
  }
}

/**
 * Main axios instance with cookie credentials
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies with every request
})

/**
 * REQUEST INTERCEPTOR: Attach CSRF token for unsafe methods
 *
 * CSRF SOURCE OF TRUTH: The csrf_token cookie (readable by JS)
 * - getCsrfTokenSync() reads from cookie first, then falls back to cache
 * - getCsrfToken() fetches from /auth/csrf if cookie is missing
 *
 * Only unsafe methods (POST/PUT/PATCH/DELETE) need CSRF protection.
 * GET requests are safe and don't modify state.
 */
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'GET').toUpperCase()
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

  if (unsafeMethods.includes(method)) {
    // Try sync first (reads from cookie), then async fetch if needed
    let token = getCsrfTokenSync()
    if (!token) {
      try {
        token = await getCsrfToken()
      } catch {
        // Continue without CSRF token - server will reject if required
        console.warn('[API] Could not fetch CSRF token')
      }
    }

    if (token) {
      config.headers = config.headers ?? {}
      config.headers['X-CSRF-Token'] = token
    }
  }

  return config
})

/**
 * RESPONSE INTERCEPTOR: Handle 401 with refresh + retry
 *
 * Flow:
 * 1. On 401 (except auth endpoints), attempt to refresh access token
 * 2. If refresh succeeds, retry the original request once
 * 3. If refresh fails, dispatch 'auth:session-expired' event and reject
 *
 * RETRY GUARD: __isRetry flag prevents infinite retry loops
 * SINGLE-FLIGHT: isRefreshing lock ensures only one refresh at a time
 * QUEUE: Concurrent 401s wait for refresh, then all retry together
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { __isRetry?: boolean }

    // Only handle 401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // Don't retry auth endpoints (prevents infinite loops and unnecessary retries)
    const url = originalRequest?.url || ''
    if (AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
      return Promise.reject(error)
    }

    // RETRY GUARD: Don't retry if already retried (prevents infinite loops)
    if (originalRequest?.__isRetry) {
      return Promise.reject(error)
    }

    // SINGLE-FLIGHT: If already refreshing, queue this request to wait
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: () => {
            originalRequest.__isRetry = true
            resolve(apiClient.request(originalRequest))
          },
          reject,
        })
      })
    }

    // Acquire refresh lock
    isRefreshing = true

    try {
      const result = await refreshAccessToken()

      if (result === 'success') {
        // Refresh succeeded - retry all queued requests
        processRefreshQueue(true)
        originalRequest.__isRetry = true
        return apiClient.request(originalRequest)
      } else if (result === 'auth_failure') {
        // Auth failure (401/403) - session is invalid, logout required
        processRefreshQueue(false, new Error('Session expired'))
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        return Promise.reject(error)
      } else {
        // Network error - do NOT logout, just reject this request
        // User remains authenticated, can retry on next request
        processRefreshQueue(false, new Error('Network error during refresh'))
        return Promise.reject(error)
      }
    } catch (refreshError) {
      // Unexpected error - treat as network error, do NOT logout
      processRefreshQueue(false, refreshError)
      return Promise.reject(refreshError)
    } finally {
      // Always release refresh lock
      isRefreshing = false
    }
  },
)

// Legacy export for backward compatibility (same as apiClient now)
export const authorizedAxios = apiClient

type HttpMethod = Method

const shouldLogSuccess = (method?: string): boolean => {
  if (!method) return false
  const upper = method.toUpperCase()
  return upper === 'POST' || upper === 'PUT' || upper === 'PATCH' || upper === 'DELETE'
}

const logSuccess = (method: string | undefined, url: string, response: AxiosResponse) => {
  if (!shouldLogSuccess(method)) return

  // eslint-disable-next-line no-console
  console.log('[api] Request succeeded', {
    method: method?.toUpperCase(),
    url,
    status: response.status,
  })
}

const logError = (method: string | undefined, url: string, error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError

    // eslint-disable-next-line no-console
    console.error('[api] Request failed', {
      method: method?.toUpperCase(),
      url,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      message: axiosError.message,
      data: axiosError.response?.data,
    })
  } else {
    // eslint-disable-next-line no-console
    console.error('[api] Request failed (non-axios error)', {
      method: method?.toUpperCase(),
      url,
      error,
    })
  }
}

async function request<T>(
  config: AxiosRequestConfig,
  _options?: { authorized?: boolean },
): Promise<T> {
  // Note: authorized flag is now ignored - all requests use apiClient with cookies
  const method = (config.method || 'GET') as HttpMethod
  const url = (config.url || '') as string

  try {
    const response = await apiClient.request<T>({
      ...config,
      method,
      url,
    })

    logSuccess(method, url, response)

    return response.data
  } catch (error) {
    logError(method, url, error)
    throw error
  }
}

export function apiGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>(
    {
      ...(config || {}),
      method: 'GET',
      url: path,
    },
    { authorized: false },
  )
}

export function apiPost<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(config && config.headers ? config.headers : {}),
  }

  return request<T>(
    {
      ...(config || {}),
      method: 'POST',
      url: path,
      headers,
      data: body,
    },
    { authorized: false },
  )
}

export function apiAuthorizedGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>(
    {
      ...(config || {}),
      method: 'GET',
      url: path,
    },
    { authorized: true },
  )
}

export function apiAuthorizedMutation<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(config && config.headers ? config.headers : {}),
  }

  return request<T>(
    {
      ...(config || {}),
      method,
      url: path,
      headers,
      data: body,
    },
    { authorized: true },
  )
}
