const API_BASE_URL = 'http://localhost:3000'

export type VinDecodeRequest = {
  vin: string
}

export type VinDecodeSuccess = {
  success: true
  vin: string
  data: Record<string, unknown>
}

export type VinDecodeErrorPayload = {
  error?: string
  details?: string
  statusCode?: number
}

export type VinHealthStatus = {
  service: string
  healthy: boolean
  responseTime: number | null
  timestamp: string
  error: string | null
}

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const errorObject = payload as VinDecodeErrorPayload

  if (!errorObject.error && !errorObject.details) {
    return fallback
  }

  if (errorObject.error && errorObject.details) {
    return `${errorObject.error}: ${errorObject.details}`
  }

  return errorObject.error ?? errorObject.details ?? fallback
}

export async function decodeVin(
  vin: string,
  signal?: AbortSignal,
): Promise<VinDecodeSuccess> {
  const body: VinDecodeRequest = { vin }

  const response = await fetch(`${API_BASE_URL}/api/vin/decode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = extractErrorMessage(payload, 'VIN decode failed')

    console.error('[VIN][decodeVin] Request failed', {
      status: response.status,
      statusText: response.statusText,
      payload,
      message,
    })

    throw new Error(message)
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid VIN decode response')
  }

  const dataObject = payload as {
    success?: unknown
    vin?: unknown
    data?: unknown
  }

  if (dataObject.success !== true) {
    throw new Error('VIN decode failed')
  }

  const decodedVin = typeof dataObject.vin === 'string' ? dataObject.vin : vin
  const decodedData =
    dataObject.data && typeof dataObject.data === 'object'
      ? (dataObject.data as Record<string, unknown>)
      : {}

  return {
    success: true,
    vin: decodedVin,
    data: decodedData,
  }
}

export async function getVinHealth(signal?: AbortSignal): Promise<VinHealthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/vin/health`, {
    method: 'GET',
    signal,
  })

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    console.error('[VIN][getVinHealth] Request failed', {
      status: response.status,
      statusText: response.statusText,
      payload,
    })

    throw new Error('VIN health check failed')
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid VIN health response')
  }

  const data = payload as Partial<VinHealthStatus>

  return {
    service: data.service ?? 'VIN Decoder',
    healthy: Boolean(data.healthy),
    responseTime:
      typeof data.responseTime === 'number' || data.responseTime === null
        ? data.responseTime
        : null,
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
    error: typeof data.error === 'string' || data.error === null ? data.error : null,
  }
}
