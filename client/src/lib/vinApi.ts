import axios, { type AxiosError } from 'axios'
import { API_BASE_URL } from '@/lib/apiClient'

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

  try {
    const response = await axios.post(`${API_BASE_URL}/vin/decode`, body, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    })

    const payload = response.data as unknown

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

    // POST success log
    // eslint-disable-next-line no-console
    console.log('[VIN][decodeVin] Request succeeded', {
      status: response.status,
    })

    return {
      success: true,
      vin: decodedVin,
      data: decodedData,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      const payload = axiosError.response?.data as unknown
      const message = extractErrorMessage(payload, 'VIN decode failed')

      console.error('[VIN][decodeVin] Request failed', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        payload,
        message,
      })

      throw new Error(message)
    }

    console.error('[VIN][decodeVin] Unexpected error', {
      error,
    })

    if (error instanceof Error) {
      throw error
    }

    throw new Error('VIN decode failed')
  }
}

export async function getVinHealth(signal?: AbortSignal): Promise<VinHealthStatus> {
  try {
    const response = await axios.get(`${API_BASE_URL}/vin/health`, {
      signal,
    })

    const payload = response.data as unknown

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
      timestamp:
        typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
      error: typeof data.error === 'string' || data.error === null ? data.error : null,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      const payload = axiosError.response?.data

      console.error('[VIN][getVinHealth] Request failed', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        payload,
      })

      throw new Error('VIN health check failed')
    }

    console.error('[VIN][getVinHealth] Unexpected error', {
      error,
    })

    if (error instanceof Error) {
      throw error
    }

    throw new Error('VIN health check failed')
  }
}
