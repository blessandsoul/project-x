import { useState } from 'react'
import type { VehicleQuoteItem, VehicleQuotesRequest } from '@/services/quotesApi'
import { searchVehicleQuotes } from '@/services/quotesApi'

interface UseQuotesSearchState {
  quotes: VehicleQuoteItem[]
  isLoading: boolean
  error: string | null
  searchQuotes: (payload: VehicleQuotesRequest) => Promise<void>
}

export function useQuotesSearch(): UseQuotesSearchState {
  const [quotes, setQuotes] = useState<VehicleQuoteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchQuotes = async (payload: VehicleQuotesRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await searchVehicleQuotes(payload)
      setQuotes(results)
    } catch (err) {
      console.error('[useQuotesSearch] Failed to search quotes', err)
      setError('Failed to calculate quotes')
      setQuotes([])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    quotes,
    isLoading,
    error,
    searchQuotes,
  }
}
