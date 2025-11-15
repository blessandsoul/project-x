import { useEffect, useState } from 'react'
import { searchVehicleQuotes } from '@/api/vehicles'
import type { SearchQuotesResponse, VehiclesSearchFilters } from '@/types/vehicles'

interface UseVehicleSearchQuotesOptions {
  filters: VehiclesSearchFilters
}

interface UseVehicleSearchQuotesResult {
  data: SearchQuotesResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useVehicleSearchQuotes(options: UseVehicleSearchQuotesOptions): UseVehicleSearchQuotesResult {
  const { filters } = options
  const [data, setData] = useState<SearchQuotesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const run = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await searchVehicleQuotes(filters)
        if (!isMounted) return
        setData(result)
      } catch (err) {
        if (!isMounted) return
        if ((err as any).name === 'AbortError') {
          return
        }
        const message = err instanceof Error ? err.message : 'Failed to load vehicle quotes'
        setError(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    run()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [filters, reloadKey])

  const refetch = () => {
    setReloadKey((prev) => prev + 1)
  }

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
