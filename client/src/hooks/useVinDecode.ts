import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      setError(t('carfax.error_vin_required'))
      setResult(null)
      return
    }

    if (trimmed.length !== 17) {
      setError(t('carfax.error_vin_length'))
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
        setError(submissionError.message || t('carfax.error_decode_failed'))
      } else {
        setError(t('carfax.error_decode_failed'))
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
