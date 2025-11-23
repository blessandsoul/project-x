import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { API_BASE_URL, apiAuthorizedGet, apiAuthorizedMutation, apiPost } from '@/lib/apiClient'
import type { User, UserRole } from '@/types/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  userRole: UserRole | null
  companyId: number | null
  login: (identifier: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role?: string,
    companyName?: string,
    companyPhone?: string,
  ) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  refreshProfile: () => Promise<void>
  updateProfile: (data: { email?: string; username?: string; password?: string }) => Promise<void>
  deleteAccount: () => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY_USER = 'projectx_auth_user'
const STORAGE_KEY_TOKEN = 'projectx_auth_token'
const STORAGE_KEY_ROLE = 'projectx_auth_role'
const STORAGE_KEY_COMPANY_ID = 'projectx_auth_company_id'

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

type AuthSuccessPayload = {
  token: string
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

  const errorContainer = (payload as { error?: unknown }).error

  if (!errorContainer || typeof errorContainer !== 'object') {
    return {}
  }

  const errorObject = errorContainer as { code?: unknown; message?: unknown }

  return {
    code: typeof errorObject.code === 'string' ? errorObject.code : undefined,
    message:
      typeof errorObject.message === 'string' ? errorObject.message : undefined,
  }
}

type ProfilePayload = {
  id: number
  email: string
  username: string
  role?: UserRole
  company_logo_url?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
  original_company_logo_url?: string | null
  original_avatar_url?: string | null
}

const extractProfilePayload = (payload: unknown): ProfilePayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const data = 'data' in payload ? (payload as { data?: unknown }).data : payload

  if (!data || typeof data !== 'object') {
    return null
  }

  const maybeProfile = data as {
    id?: unknown
    email?: unknown
    username?: unknown
    role?: unknown
    company_logo_url?: unknown
    original_company_logo_url?: unknown
    avatar_url?: unknown
    original_avatar_url?: unknown
    created_at?: unknown
    updated_at?: unknown
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
    return raw === 'user' || raw === 'dealer' || raw === 'company'
      ? raw
      : undefined
  })()

  const companyLogoUrl =
    typeof maybeProfile.company_logo_url === 'string' && maybeProfile.company_logo_url.trim().length > 0
      ? maybeProfile.company_logo_url
      : undefined

  const originalCompanyLogoUrl =
    typeof maybeProfile.original_company_logo_url === 'string' &&
    maybeProfile.original_company_logo_url.trim().length > 0
      ? maybeProfile.original_company_logo_url
      : undefined

  const avatarUrl =
    typeof maybeProfile.avatar_url === 'string' && maybeProfile.avatar_url.trim().length > 0
      ? maybeProfile.avatar_url
      : undefined

  return {
    id: maybeProfile.id,
    email: maybeProfile.email,
    username,
    role,
    company_logo_url: companyLogoUrl ?? null,
    avatar_url: avatarUrl ?? null,
    original_company_logo_url: originalCompanyLogoUrl ?? null,
    created_at:
      typeof maybeProfile.created_at === 'string' ? maybeProfile.created_at : undefined,
    updated_at:
      typeof maybeProfile.updated_at === 'string' ? maybeProfile.updated_at : undefined,
  }
}

const extractAuthPayload = (payload: unknown): AuthSuccessPayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const maybeData = 'data' in payload ? (payload as { data?: unknown }).data : payload

  if (!maybeData || typeof maybeData !== 'object') {
    return null
  }

  const token = (maybeData as { token?: unknown }).token
  const user = (maybeData as { user?: unknown }).user

  if (typeof token !== 'string' || !user || typeof user !== 'object') {
    return null
  }

  const backendUser = user as BackendUser

  if (typeof backendUser.id !== 'number' || typeof backendUser.email !== 'string') {
    return null
  }

  const username =
    typeof backendUser.username === 'string'
      ? backendUser.username
      : backendUser.email.split('@')[0] || 'User'

  return {
    token,
    user: {
      id: backendUser.id,
      email: backendUser.email,
      username,
      role: backendUser.role,
      company_id: backendUser.company_id ?? null,
      company_logo_url: backendUser.company_logo_url ?? null,
      original_company_logo_url: backendUser.original_company_logo_url ?? null,
      avatar_url: backendUser.avatar_url ?? null,
      original_avatar_url: backendUser.original_avatar_url ?? null,
    },
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [companyId, setCompanyId] = useState<number | null>(null)

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem(STORAGE_KEY_USER)
      const storedToken = window.localStorage.getItem(STORAGE_KEY_TOKEN)
      const storedRole = window.localStorage.getItem(STORAGE_KEY_ROLE) as UserRole | null
      const storedCompanyId = window.localStorage.getItem(STORAGE_KEY_COMPANY_ID)
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      if (storedToken) {
        setToken(storedToken)
      }
      if (storedRole) {
        setUserRole(storedRole)
      }
      if (storedCompanyId) {
        const parsed = Number.parseInt(storedCompanyId, 10)
        if (!Number.isNaN(parsed)) {
          setCompanyId(parsed)
        }
      }
    } catch {
      setUser(null)
      setToken(null)
      setUserRole(null)
      setCompanyId(null)
    }
  }, [])

  const persistSession = (nextUser: User | null, nextToken: string | null) => {
    setUser(nextUser)
    setToken(nextToken)

    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(nextUser))
    } else {
      window.localStorage.removeItem(STORAGE_KEY_USER)
    }

    if (nextToken) {
      window.localStorage.setItem(STORAGE_KEY_TOKEN, nextToken)
    } else {
      window.localStorage.removeItem(STORAGE_KEY_TOKEN)
    }
  }

  const persistAuthMetadata = (role: UserRole | null, companyIdValue: number | null) => {
    setUserRole(role)
    setCompanyId(companyIdValue)

    if (role) {
      window.localStorage.setItem(STORAGE_KEY_ROLE, role)
    } else {
      window.localStorage.removeItem(STORAGE_KEY_ROLE)
    }

    if (typeof companyIdValue === 'number') {
      window.localStorage.setItem(STORAGE_KEY_COMPANY_ID, String(companyIdValue))
    } else {
      window.localStorage.removeItem(STORAGE_KEY_COMPANY_ID)
    }
  }

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) {
        return prev
      }

      const nextUser: User = {
        ...prev,
        ...updates,
      }

      persistSession(nextUser, token)

      return nextUser
    })
  }

  const mapProfileToUser = (profile: ProfilePayload): User => {
    const username = profile.username || profile.email.split('@')[0] || 'User'

    const shouldUseCompanyLogo = profile.role === 'company'
    let avatar: string | undefined

    if (shouldUseCompanyLogo && profile.company_logo_url) {
      avatar = profile.company_logo_url
    } else if (!shouldUseCompanyLogo && profile.avatar_url) {
      // user/dealer: prefer uploaded avatar when available
      avatar = profile.avatar_url
    }

    return {
      id: profile.id,
      username,
      name: username,
      email: profile.email,
      avatar,
    }
  }

  const refreshProfile = async () => {
    if (!token) {
      return
    }

    try {
      const payload = await apiAuthorizedGet<unknown>('/profile')

      const profile = extractProfilePayload(payload)

      if (!profile) {
        throw new Error(t('auth.error.profile_response'))
      }

      const nextUser = mapProfileToUser(profile)

      persistSession(nextUser, token)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as unknown
        const { code, message } = extractErrorInfo(payload)

        console.error('[Auth][Profile][GET] Request failed', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          payload,
          code,
          message,
        })

        const status = error.response?.status

        if (status === 401 || status === 404) {
          persistSession(null, null)
        }

        throw new Error(message || t('auth.error.profile_load'))
      }

      console.error('[Auth][Profile][GET] Unexpected error', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error(t('auth.error.profile_load'))
    }
  }

  useEffect(() => {
    if (!token) {
      return
    }

    refreshProfile().catch((error) => {
      console.error('[Auth][Profile][Init] Failed to refresh profile', error)
    })
    // we intentionally only react to token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const updateProfile = async (data: {
    email?: string
    username?: string
    password?: string
  }) => {
    if (!token) {
      throw new Error(t('auth.error.not_authorized'))
    }

    setIsLoading(true)

    try {
      const payload = await apiAuthorizedMutation<unknown>('PUT', '/profile', data)

      const profile = extractProfilePayload(payload)

      if (!profile) {
        throw new Error(t('auth.error.profile_update_response'))
      }

      const nextUser = mapProfileToUser(profile)

      persistSession(nextUser, token)
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
          statusText: error.response?.statusText,
          payload,
          code,
          message,
          friendlyMessage,
        })

        const status = error.response?.status

        if (status === 401 || status === 404) {
          persistSession(null, null)
        }

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
  }

  const uploadAvatar = async (file: File) => {
    if (!token) {
      throw new Error(t('auth.error.not_authorized'))
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await axios.post<{
        avatarUrl?: string | null
        originalAvatarUrl?: string | null
      }>(`${API_BASE_URL}/user/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      })

      const avatarUrl =
        typeof response.data.avatarUrl === 'string' &&
        response.data.avatarUrl.trim().length > 0
          ? response.data.avatarUrl
          : null

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
          statusText: error.response?.statusText,
          payload,
          code,
          message,
          friendlyMessage,
        })

        const status = error.response?.status

        if (status === 401 || status === 404) {
          persistSession(null, null)
        }

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
  }

  const deleteAccount = async () => {
    if (!token) {
      throw new Error(t('auth.error.not_authorized'))
    }

    setIsLoading(true)

    try {
      await apiAuthorizedMutation<unknown>('DELETE', '/profile')

      persistSession(null, null)
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
          statusText: error.response?.statusText,
          payload,
          code,
          message,
          friendlyMessage,
        })

        const status = error.response?.status

        if (status === 401 || status === 404) {
          persistSession(null, null)
        }

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
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)

    const performLoginRequest = async (allowRetry: boolean): Promise<void> => {
      let payload: unknown = null

      try {
        payload = await apiPost<unknown>('/login', {
          identifier: email,
          password,
        })
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          payload = error.response?.data as unknown

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
            statusText: error.response?.statusText,
            payload,
            code,
            message,
            friendlyMessage,
          })

          throw new Error(friendlyMessage)
        }

        console.error('[Auth][Login] Unexpected error during request', error)

        if (error instanceof Error) {
          throw error
        }

        throw new Error(t('auth.error.login_generic'))
      }

      const authPayload = extractAuthPayload(payload)

      if (!authPayload) {
        if (allowRetry) {
          console.warn('[Auth][Login] Invalid payload, retrying once...')
          await performLoginRequest(false)
          return
        }

        throw new Error(t('auth.error.login_response'))
      }

      const backendUser = authPayload.user

      const username =
        backendUser.username || backendUser.email.split('@')[0] || 'User'

      const shouldUseCompanyLogo = backendUser.role === 'company'
      let avatar: string | undefined

      if (shouldUseCompanyLogo && backendUser.company_logo_url) {
        avatar = backendUser.company_logo_url
      } else if (!shouldUseCompanyLogo && backendUser.avatar_url) {
        avatar = backendUser.avatar_url
      }

      const nextUser: User = {
        id: backendUser.id,
        username,
        name: username,
        email: backendUser.email,
        avatar,
      }

      persistSession(nextUser, authPayload.token)

      const role = backendUser.role ?? 'user'
      const companyIdValue = typeof backendUser.company_id === 'number' ? backendUser.company_id : null
      persistAuthMetadata(role, companyIdValue)
    }

    try {
      await performLoginRequest(true)
    } catch (error: unknown) {
      console.error('[Auth][Login] Unexpected error', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error(t('auth.error.login_generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    role?: string,
    companyName?: string,
    companyPhone?: string,
  ) => {
    setIsLoading(true)

    try {
      const payload = await apiPost<unknown>('/register', {
        email,
        username: name,
        password,
        role,
        companyName,
        companyPhone,
      })

      const authPayload = extractAuthPayload(payload)

      if (!authPayload) {
        throw new Error(t('auth.error.register_response'))
      }

      const backendUser = authPayload.user

      const username = backendUser.username || name || backendUser.email.split('@')[0] || 'User'

      const nextUser: User = {
        id: backendUser.id,
        username,
        name: username,
        email: backendUser.email,
      }

      persistSession(nextUser, authPayload.token)

      const effectiveRole: UserRole =
        backendUser.role === 'dealer' || backendUser.role === 'company' || backendUser.role === 'user'
          ? backendUser.role
          : role === 'dealer' || role === 'company'
            ? role
            : 'user'

      const companyIdValue = typeof backendUser.company_id === 'number' ? backendUser.company_id : null
      persistAuthMetadata(effectiveRole, companyIdValue)
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
          statusText: error.response?.statusText,
          payload,
          code,
          message,
          friendlyMessage,
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
  }

  const logout = () => {
    persistSession(null, null)
    persistAuthMetadata(null, null)
  }

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
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
