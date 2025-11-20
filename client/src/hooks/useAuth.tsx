import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import axios from 'axios'
import { apiAuthorizedGet, apiAuthorizedMutation, apiPost } from '@/lib/apiClient'
import type { User } from '@/mocks/_mockData'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  refreshProfile: () => Promise<void>
  updateProfile: (data: { email?: string; username?: string; password?: string }) => Promise<void>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY_USER = 'projectx_auth_user'
const STORAGE_KEY_TOKEN = 'projectx_auth_token'

const AVATAR_IMAGES = [
  '/avatars/user.jpg',
  '/avatars/dealer.jpg',
  '/avatars/0450249b131eec36dc8333b7cf847bc4.webp',
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash
}

function pickAvatar(seed: string): string {
  if (!seed) return AVATAR_IMAGES[0]
  const index = Math.abs(hashString(seed)) % AVATAR_IMAGES.length
  return AVATAR_IMAGES[index]
}

type BackendUser = {
  id: number
  email: string
  username: string
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
  created_at?: string
  updated_at?: string
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

  return {
    id: maybeProfile.id,
    email: maybeProfile.email,
    username,
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

  const backendUser = user as {
    id?: unknown
    email?: unknown
    username?: unknown
  }

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
    },
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem(STORAGE_KEY_USER)
      const storedToken = window.localStorage.getItem(STORAGE_KEY_TOKEN)
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      if (storedToken) {
        setToken(storedToken)
      }
    } catch {
      setUser(null)
      setToken(null)
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

    return {
      id: String(profile.id),
      name: username,
      email: profile.email,
      avatar: pickAvatar(username),
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
        throw new Error('არასწორი სერვერის პასუხი პროფილზე')
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

        throw new Error(message || 'პროფილის ჩატვირთვის დროს მოხდა შეცდომა')
      }

      console.error('[Auth][Profile][GET] Unexpected error', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error('პროფილის ჩატვირთვის დროს მოხდა შეცდომა')
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
      throw new Error('მომხმარებელი არ არის ავტორიზებული')
    }

    setIsLoading(true)

    try {
      const payload = await apiAuthorizedMutation<unknown>('PUT', '/profile', data)

      const profile = extractProfilePayload(payload)

      if (!profile) {
        throw new Error('არასწორი სერვერის პასუხი პროფილის განახლებაზე')
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
            friendlyMessage = 'პროფილის მონაცემები არასწორია'
          } else {
            friendlyMessage = 'პროფილის განახლების დროს მოხდა შეცდომა'
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

      throw new Error('პროფილის განახლების დროს მოხდა შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (!token) {
      throw new Error('მომხმარებელი არ არის ავტორიზებული')
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
            friendlyMessage = 'პროფილის წაშლის მოთხოვნა არასწორია'
          } else {
            friendlyMessage = 'ანგარიშის წაშლის დროს მოხდა შეცდომა'
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

      throw new Error('ანგარიშის წაშლის დროს მოხდა შეცდომა')
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
              friendlyMessage = 'ავტორიზაციის მონაცემები არასწორია'
            } else if (code === 'AUTHENTICATION_ERROR') {
              friendlyMessage = 'ელ-ფოსტა ან პაროლი არასწორია'
            } else {
              friendlyMessage = 'ავტორიზაციის დროს მოხდა შეცდომა'
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

        throw new Error('ავტორიზაციის დროს მოხდა შეცდომა')
      }

      const authPayload = extractAuthPayload(payload)

      if (!authPayload) {
        if (allowRetry) {
          console.warn('[Auth][Login] Invalid payload, retrying once...')
          await performLoginRequest(false)
          return
        }

        throw new Error('არასწორი სერვერის პასუხი ავტორიზაციაზე')
      }

      const backendUser = authPayload.user

      const username =
        backendUser.username || backendUser.email.split('@')[0] || 'User'

      const nextUser: User = {
        id: String(backendUser.id),
        name: username,
        email: backendUser.email,
        avatar: pickAvatar(username),
      }

      persistSession(nextUser, authPayload.token)
    }

    try {
      await performLoginRequest(true)
    } catch (error: unknown) {
      console.error('[Auth][Login] Unexpected error', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error('ავტორიზაციის დროს მოხდა შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)

    try {
      const payload = await apiPost<unknown>('/register', {
        email,
        username: name,
        password,
      })

      const authPayload = extractAuthPayload(payload)

      if (!authPayload) {
        throw new Error('არასწორი სერვერის პასუხი რეგისტრაციაზე')
      }

      const backendUser = authPayload.user

      const username = backendUser.username || name || backendUser.email.split('@')[0] || 'User'

      const nextUser: User = {
        id: String(backendUser.id),
        name: username,
        email: backendUser.email,
        avatar: pickAvatar(username),
      }

      persistSession(nextUser, authPayload.token)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as unknown
        const { code, message } = extractErrorInfo(payload)

        let friendlyMessage = message

        if (!friendlyMessage) {
          if (code === 'VALIDATION_ERROR') {
            friendlyMessage = 'რეგისტრაციის მონაცემები არასწორია'
          } else if (code === 'CONFLICT_ERROR') {
            friendlyMessage = 'ეს ელ-ფოსტა ან მომხმარებლის სახელი უკვე გამოყენებულია'
          } else {
            friendlyMessage = 'რეგისტრაციის დროს მოხდა შეცდომა'
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

      throw new Error('რეგისტრაციის დროს მოხდა შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    persistSession(null, null)
  }

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
    updateProfile,
    deleteAccount,
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
