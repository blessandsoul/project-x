const API_BASE_URL = 'http://localhost:3000'

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    ...init,
  })

  const payload = await parseJsonSafe(response)

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as any).message === 'string'
        ? (payload as any).message
        : null) || 'Request failed'

    throw new Error(message)
  }

  return payload as T
}

export async function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init && init.headers ? init.headers : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
    ...init,
  })

  const payload = await parseJsonSafe(response)

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as any).message === 'string'
        ? (payload as any).message
        : null) || 'Request failed'

    throw new Error(message)
  }

  return payload as T
}
