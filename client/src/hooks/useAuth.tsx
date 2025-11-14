import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@/mocks/_mockData'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const API_BASE_URL = 'http://localhost:3000'
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

  const login = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: email,
          password,
        }),
      })

      let payload: unknown = null

      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
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
          status: response.status,
          statusText: response.statusText,
          payload,
          code,
          message,
          friendlyMessage,
        })

        throw new Error(friendlyMessage)
      }

      const authPayload = extractAuthPayload(payload)

      if (!authPayload) {
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
    } catch (error) {
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
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username: name,
          password,
        }),
      })

      let payload: unknown = null

      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
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
          status: response.status,
          statusText: response.statusText,
          payload,
          code,
          message,
          friendlyMessage,
        })

        throw new Error(friendlyMessage)
      }

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
    } catch (error) {
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
