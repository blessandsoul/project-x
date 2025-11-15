import { useCallback, useState } from 'react'
import { decodeVin, type VinDecodeSuccess } from '@/lib/vinApi'

export interface UseVinDecodeState {
  isLoading: boolean
  error: string | null
  result: VinDecodeSuccess | null
}

export interface UseVinDecodeResult extends UseVinDecodeState {
  submit: (vin: string) => Promise<void>
  reset: () => void
}

export function useVinDecode(): UseVinDecodeResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VinDecodeSuccess | null>(null)

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])

  const submit = useCallback(async (rawVin: string) => {
    const trimmed = rawVin.trim().toUpperCase()

    if (!trimmed) {
      setError('გთხოვთ, შეიყვანოთ VIN კოდი')
      setResult(null)
      return
    }

    if (trimmed.length !== 17) {
      setError('VIN უნდა იყოს 17 სიმბოლო')
      setResult(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const decoded = await decodeVin(trimmed)
      setResult(decoded)
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message || 'VIN decode failed')
      } else {
        setError('VIN decode failed')
      }
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    result,
    submit,
    reset,
  }
}
