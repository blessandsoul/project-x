/**
 * Authentication Hook with HttpOnly Cookie Support
 *
 * This hook manages authentication state using server-truth from /auth/me.
 * NO tokens are stored in localStorage - authentication is handled via HttpOnly cookies.
 *
 * Flow:
 * 1. On mount, call /auth/me to check if user is authenticated
 * 2. Login calls /auth/login which sets HttpOnly cookies
 * 3. Logout calls /auth/logout which clears cookies
 * 4. 401 responses trigger automatic refresh via apiClient interceptor
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { apiClient, apiAuthorizedMutation } from '@/lib/apiClient'
import { refreshCsrfToken, clearCsrfToken } from '@/lib/csrf'
import type { User, UserRole } from '@/types/api'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  userRole: UserRole | null
  companyId: number | null
  login: (identifier: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  refreshProfile: () => Promise<void>
  updateProfile: (data: { email?: string; username?: string; password?: string }) => Promise<void>
  deleteAccount: () => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type BackendUser = {
  id: number
  email: string
  username: string
  role?: UserRole
  company_id?: number | null
  company_logo_url?: string | null
  original_company_logo_url?: string | null
  avatar_url?: string | null
  original_avatar_url?: string | null
}

type AuthMeResponse = {
  user: BackendUser
}

type AuthLoginResponse = {
  authenticated: boolean
  user: BackendUser
}

type ErrorInfo = {
  code?: string
  message?: string
}

const extractErrorInfo = (payload: unknown): ErrorInfo => {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  // Try direct properties first
  const direct = payload as { code?: unknown; message?: unknown }
  if (typeof direct.code === 'string' || typeof direct.message === 'string') {
    return {
      code: typeof direct.code === 'string' ? direct.code : undefined,
      message: typeof direct.message === 'string' ? direct.message : undefined,
    }
  }

  // Try nested error object
  const errorContainer = (payload as { error?: unknown }).error
  if (!errorContainer || typeof errorContainer !== 'object') {
    return {}
  }

  const errorObject = errorContainer as { code?: unknown; message?: unknown }
  return {
    code: typeof errorObject.code === 'string' ? errorObject.code : undefined,
    message: typeof errorObject.message === 'string' ? errorObject.message : undefined,
  }
}

type ProfilePayload = {
  id: number
  email: string
  username: string
  role?: UserRole
  company_id?: number | null
  company_logo_url?: string | null
  avatar_url?: string | null
  original_company_logo_url?: string | null
  original_avatar_url?: string | null
}

const extractProfilePayload = (payload: unknown): ProfilePayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  // Handle both { user: {...} } and direct user object
  const data = 'user' in payload ? (payload as { user?: unknown }).user : payload

  if (!data || typeof data !== 'object') {
    return null
  }

  const maybeProfile = data as {
    id?: unknown
    email?: unknown
    username?: unknown
    role?: unknown
    company_id?: unknown
    company_logo_url?: unknown
    original_company_logo_url?: unknown
    avatar_url?: unknown
    original_avatar_url?: unknown
  }

  if (typeof maybeProfile.id !== 'number' || typeof maybeProfile.email !== 'string') {
    return null
  }

  const username =
    typeof maybeProfile.username === 'string'
      ? maybeProfile.username
      : maybeProfile.email.split('@')[0] || 'User'

  const role = ((): UserRole | undefined => {
    const raw = maybeProfile.role
    if (raw === 'user' || raw === 'dealer' || raw === 'company') {
      return raw
    }
    return undefined
  })()

  return {
    id: maybeProfile.id,
    email: maybeProfile.email,
    username,
    role,
    company_id: typeof maybeProfile.company_id === 'number' ? maybeProfile.company_id : null,
    company_logo_url:
      typeof maybeProfile.company_logo_url === 'string' ? maybeProfile.company_logo_url : null,
    avatar_url: typeof maybeProfile.avatar_url === 'string' ? maybeProfile.avatar_url : null,
    original_company_logo_url:
      typeof maybeProfile.original_company_logo_url === 'string'
        ? maybeProfile.original_company_logo_url
        : null,
    original_avatar_url:
      typeof maybeProfile.original_avatar_url === 'string' ? maybeProfile.original_avatar_url : null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [companyId, setCompanyId] = useState<number | null>(null)

  /**
   * Map backend user to frontend User type
   */
  const mapBackendUserToUser = useCallback((backendUser: BackendUser): User => {
    const username = backendUser.username || backendUser.email.split('@')[0] || 'User'

    const shouldUseCompanyLogo = backendUser.role === 'company'
    let avatar: string | undefined

    if (shouldUseCompanyLogo && backendUser.company_logo_url) {
      avatar = backendUser.company_logo_url
    } else if (backendUser.avatar_url) {
      avatar = backendUser.avatar_url
    }

    return {
      id: backendUser.id,
      username,
      name: username,
      email: backendUser.email,
      avatar,
    }
  }, [])

  /**
   * Set user state from backend user data
   */
  const setUserFromBackend = useCallback(
    (backendUser: BackendUser | null) => {
      if (!backendUser) {
        setUser(null)
        setUserRole(null)
        setCompanyId(null)
        return
      }

      const mappedUser = mapBackendUserToUser(backendUser)
      setUser(mappedUser)
      setUserRole(backendUser.role ?? 'user')
      setCompanyId(backendUser.company_id ?? null)
    },
    [mapBackendUserToUser],
  )

  /**
   * Clear all auth state (on logout or session expiry)
   */
  const clearAuthState = useCallback(() => {
    setUser(null)
    setUserRole(null)
    setCompanyId(null)
    clearCsrfToken()
  }, [])

  /**
   * Fetch current user from /auth/me
   * This is the source of truth for authentication state
   */
  const fetchCurrentUser = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.get<AuthMeResponse>('/auth/me')
      const backendUser = response.data.user

      if (backendUser) {
        setUserFromBackend(backendUser)
        return true
      }

      clearAuthState()
      return false
    } catch (error) {
      // 401 means not authenticated - this is expected
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearAuthState()
        return false
      }

      console.error('[Auth] Failed to fetch current user', error)
      clearAuthState()
      return false
    }
  }, [setUserFromBackend, clearAuthState])

  /**
   * Initialize auth state on mount
   *
   * Bootstrap flow:
   * 1. Call /auth/me to check if user is authenticated
   * 2. If 401, attempt /auth/refresh once (access token may be expired but refresh token valid)
   * 3. If refresh succeeds, retry /auth/me
   * 4. If refresh fails or second /auth/me fails, user is not authenticated
   *
   * This handles the case where user refreshes the page after access token expired
   * but refresh token is still valid.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First attempt: try /auth/me directly
        const response = await apiClient.get<AuthMeResponse>('/auth/me')
        const backendUser = response.data.user
        if (backendUser) {
          setUserFromBackend(backendUser)
        } else {
          clearAuthState()
        }
      } catch (error) {
        // If 401, attempt refresh once then retry /auth/me
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          try {
            // Attempt to refresh access token
            await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
            
            // Refresh succeeded - retry /auth/me
            const retryResponse = await apiClient.get<AuthMeResponse>('/auth/me')
            const backendUser = retryResponse.data.user
            if (backendUser) {
              setUserFromBackend(backendUser)
            } else {
              clearAuthState()
            }
          } catch {
            // Refresh failed or second /auth/me failed - user is not authenticated
            clearAuthState()
          }
        } else {
          // Non-401 error
          console.error('[Auth] Failed to fetch current user', error)
          clearAuthState()
        }
      }
      setIsInitialized(true)
    }

    initAuth()
  }, [setUserFromBackend, clearAuthState])

  /**
   * Listen for session expiry events from apiClient
   */
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('[Auth] Session expired, clearing state')
      clearAuthState()
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired)
    }
  }, [clearAuthState])

  /**
   * CROSS-TAB LOGOUT SYNC
   *
   * Uses BroadcastChannel to notify other tabs when user logs out.
   * When Tab A logs out, Tab B receives the message and clears its auth state.
   *
   * Security: No sensitive data is shared - only 'logout' event type.
   * Fallback: If BroadcastChannel is not supported, tabs will detect logout on next API call.
   */
  useEffect(() => {
    // BroadcastChannel may not be available in all browsers (e.g., older Safari)
    if (typeof BroadcastChannel === 'undefined') {
      return
    }

    const channel = new BroadcastChannel('auth')

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'logout') {
        console.log('[Auth] Received cross-tab logout signal')
        clearAuthState()
      }
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [clearAuthState])

  /**
   * Update user state locally
   */
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      return { ...prev, ...updates }
    })
  }, [])

  /**
   * Refresh profile from server
   */
  const refreshProfile = useCallback(async () => {
    await fetchCurrentUser()
  }, [fetchCurrentUser])

  /**
   * Login with email/username and password
   */
  const login = useCallback(
    async (identifier: string, password: string) => {
      setIsLoading(true)

      try {
        const response = await apiClient.post<AuthLoginResponse>('/auth/login', {
          identifier,
          password,
        })

        const backendUser = response.data.user

        if (!backendUser) {
          throw new Error(t('auth.error.login_response'))
        }

        setUserFromBackend(backendUser)

        // Refresh CSRF token after login
        await refreshCsrfToken()
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const payload = error.response?.data as unknown
          const { code, message } = extractErrorInfo(payload)

          let friendlyMessage = message

          if (!friendlyMessage) {
            if (code === 'VALIDATION_ERROR') {
              friendlyMessage = t('auth.error.login_invalid')
            } else if (code === 'AUTHENTICATION_ERROR') {
              friendlyMessage = t('auth.error.email_password_incorrect')
            } else {
              friendlyMessage = t('auth.error.login_generic')
            }
          }

          console.error('[Auth][Login] Request failed', {
            status: error.response?.status,
            code,
            message,
          })

          throw new Error(friendlyMessage)
        }

        console.error('[Auth][Login] Unexpected error', error)

        if (error instanceof Error) {
          throw error
        }

        throw new Error(t('auth.error.login_generic'))
      } finally {
        setIsLoading(false)
      }
    },
    [t, setUserFromBackend],
  )

  /**
   * Register new user
   * Uses /auth/register endpoint which sets HttpOnly cookies directly
   */
  const register = useCallback(
    async (email: string, username: string, password: string) => {
      setIsLoading(true)

      try {
        const response = await apiClient.post<{ registered: boolean; user: BackendUser }>(
          '/auth/register',
          { email, username, password },
        )

        const backendUser = response.data.user

        if (!backendUser) {
          throw new Error(t('auth.error.register_response'))
        }

        setUserFromBackend(backendUser)

        // Refresh CSRF token after registration
        await refreshCsrfToken()
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const payload = error.response?.data as unknown
          const { code, message } = extractErrorInfo(payload)

          let friendlyMessage = message

          if (!friendlyMessage) {
            if (code === 'VALIDATION_ERROR') {
              friendlyMessage = t('auth.error.register_invalid')
            } else if (code === 'CONFLICT_ERROR') {
              friendlyMessage = t('auth.error.conflict')
            } else {
              friendlyMessage = t('auth.error.register_generic')
            }
          }

          console.error('[Auth][Register] Request failed', {
            status: error.response?.status,
            code,
            message,
          })

          throw new Error(friendlyMessage)
        }

        console.error('[Auth][Register] Unexpected error', error)

        if (error instanceof Error) {
          throw error
        }

        throw new Error(t('auth.error.register_generic'))
      } finally {
        setIsLoading(false)
      }
    },
    [t, setUserFromBackend],
  )

  /**
   * Logout - call server to clear cookies and notify other tabs
   */
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('[Auth][Logout] Request failed', error)
      // Continue with local logout even if server call fails
    }

    clearAuthState()

    // Notify other tabs about logout (cross-tab sync)
    // No sensitive data shared - only event type
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('auth')
        channel.postMessage({ type: 'logout' })
        channel.close()
      }
    } catch {
      // BroadcastChannel may fail in some contexts, ignore
    }
  }, [clearAuthState])

  /**
   * Update profile
   */
  const updateProfile = useCallback(
    async (data: { email?: string; username?: string; password?: string }) => {
      setIsLoading(true)

      try {
        const payload = await apiAuthorizedMutation<unknown>('PUT', '/profile', data)
        const profile = extractProfilePayload(payload)

        if (!profile) {
          throw new Error(t('auth.error.profile_update_response'))
        }

        setUserFromBackend(profile as BackendUser)
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const payload = error.response?.data as unknown
          const { code, message } = extractErrorInfo(payload)

          let friendlyMessage = message

          if (!friendlyMessage) {
            if (code === 'VALIDATION_ERROR') {
              friendlyMessage = t('auth.error.profile_invalid')
            } else {
              friendlyMessage = t('auth.error.profile_update')
            }
          }

          console.error('[Auth][Profile][PUT] Request failed', {
            status: error.response?.status,
            code,
            message,
          })

          throw new Error(friendlyMessage)
        }

        console.error('[Auth][Profile][PUT] Unexpected error', error)

        if (error instanceof Error) {
          throw error
        }

        throw new Error(t('auth.error.profile_update'))
      } finally {
        setIsLoading(false)
      }
    },
    [t, setUserFromBackend],
  )

  /**
   * Upload avatar
   */
  const uploadAvatar = useCallback(
    async (file: File) => {
      setIsLoading(true)

      try {
        const formData = new FormData()
        formData.append('avatar', file)

        const response = await apiClient.post<{
          avatarUrl?: string | null
          originalAvatarUrl?: string | null
        }>('/user/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        const avatarUrl = response.data.avatarUrl

        if (avatarUrl) {
          updateUser({ avatar: avatarUrl })
        } else {
          await refreshProfile()
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const payload = error.response?.data as unknown
          const { code, message } = extractErrorInfo(payload)

          let friendlyMessage = message

          if (!friendlyMessage) {
            if (code === 'VALIDATION_ERROR') {
              friendlyMessage = t('auth.error.profile_invalid')
            } else if (code === 'AUTHORIZATION_ERROR') {
              friendlyMessage = t('auth.error.not_authorized')
            } else {
              friendlyMessage = t('auth.error.profile_update')
            }
          }

          console.error('[Auth][Avatar][UPLOAD] Request failed', {
            status: error.response?.status,
            code,
            message,
          })

          throw new Error(friendlyMessage)
        }

        console.error('[Auth][Avatar][UPLOAD] Unexpected error', error)

        if (error instanceof Error) {
          throw error
        }

        throw new Error(t('auth.error.profile_update'))
      } finally {
        setIsLoading(false)
      }
    },
    [t, updateUser, refreshProfile],
  )

  /**
   * Delete account
   */
  const deleteAccount = useCallback(async () => {
    setIsLoading(true)

    try {
      await apiAuthorizedMutation<unknown>('DELETE', '/profile')
      clearAuthState()
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as unknown
        const { code, message } = extractErrorInfo(payload)

        let friendlyMessage = message

        if (!friendlyMessage) {
          if (code === 'VALIDATION_ERROR') {
            friendlyMessage = t('auth.error.delete_request_invalid')
          } else {
            friendlyMessage = t('auth.error.delete_account')
          }
        }

        console.error('[Auth][Profile][DELETE] Request failed', {
          status: error.response?.status,
          code,
          message,
        })

        throw new Error(friendlyMessage)
      }

      console.error('[Auth][Profile][DELETE] Unexpected error', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error(t('auth.error.delete_account'))
    } finally {
      setIsLoading(false)
    }
  }, [t, clearAuthState])

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    userRole,
    companyId,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
    updateProfile,
    deleteAccount,
    uploadAvatar,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
