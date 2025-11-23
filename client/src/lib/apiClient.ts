import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
} from 'axios'

export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://api.trendingnow.ge'
const AUTH_TOKEN_STORAGE_KEY = 'projectx_auth_token'

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export const authorizedAxios = axios.create({
  baseURL: API_BASE_URL,
})

authorizedAxios.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers = config.headers ?? {}

    const headers = config.headers as Record<string, string>
    if (!headers.Authorization) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

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
  options?: { authorized?: boolean },
): Promise<T> {
  const isAuthorized = options?.authorized ?? false
  const method = (config.method || 'GET') as HttpMethod
  const url = (config.url || '') as string

  try {
    const client = isAuthorized ? authorizedAxios : axios
    const response = await client.request<T>({
      baseURL: API_BASE_URL,
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
