import { useState } from 'react'
import type { CalculateQuotesResponse } from '@/services/quotesApi'
import { calculateVehicleQuotes } from '@/services/quotesApi'

interface UseCalculateVehicleQuotesState {
  data: CalculateQuotesResponse | null
  isLoading: boolean
  error: string | null
  calculateQuotes: (vehicleId: number, currency?: 'usd' | 'gel') => Promise<void>
}

export function useCalculateVehicleQuotes(): UseCalculateVehicleQuotesState {
  const [data, setData] = useState<CalculateQuotesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateQuotes = async (vehicleId: number, currency: 'usd' | 'gel' = 'usd') => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await calculateVehicleQuotes(vehicleId, currency)
      setData(result)
    } catch (err) {
      console.error('[useCalculateVehicleQuotes] Failed to calculate quotes', err)
      setError('Failed to calculate quotes')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    data,
    isLoading,
    error,
    calculateQuotes,
  }
}
