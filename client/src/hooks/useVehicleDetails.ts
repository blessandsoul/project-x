import { useCallback, useEffect, useState } from 'react'
import { calculateVehicleQuotes, fetchVehicleFull } from '@/api/vehicles'
import type { VehicleFullResponse, VehicleQuote } from '@/types/vehicles'

interface UseVehicleDetailsResult {
  vehicle: VehicleFullResponse['vehicle'] | null
  photos: VehicleFullResponse['photos']
  quotes: VehicleQuote[]
  distanceMiles: number | null
  isLoading: boolean
  isLoadingMore: boolean
  isRefreshingQuotes: boolean
  error: string | null
  recalculate: () => void
  // Pagination
  quotesTotal: number
  quotesLimit: number
  hasMoreQuotes: boolean
  loadMoreQuotes: () => void
  // Page size control
  setQuotesLimit: (limit: number) => void
  // Rating filter
  minRating: number | null
  setMinRating: (rating: number | null) => void
}

export function useVehicleDetails(vehicleId: number | null): UseVehicleDetailsResult {
  const [vehicle, setVehicle] = useState<VehicleFullResponse['vehicle'] | null>(null)
  const [photos, setPhotos] = useState<VehicleFullResponse['photos']>([])
  const [quotes, setQuotes] = useState<VehicleQuote[]>([])
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  
  // Pagination state
  const [quotesTotal, setQuotesTotal] = useState(0)
  const [quotesLimit, setQuotesLimit] = useState(5)
  const [currentOffset, setCurrentOffset] = useState(0)
  
  // Rating filter
  const [minRating, setMinRating] = useState<number | null>(null)

  // Load vehicle details (only when vehicleId or reloadKey changes)
  useEffect(() => {
    if (!vehicleId) {
      return
    }

    let isMounted = true

    const run = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const full = await fetchVehicleFull(vehicleId)
        if (!isMounted) return

        setVehicle(full.vehicle)
        setPhotos(full.photos)
      } catch (err) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : 'Failed to load vehicle details'
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
    }
  }, [vehicleId, reloadKey])

  // Track if quotes are being refreshed (for subtle loading indicator, not clearing content)
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false)

  // Load quotes (separate effect for quotes - triggers on filter/limit changes without reloading vehicle)
  useEffect(() => {
    if (!vehicleId) {
      return
    }

    let isMounted = true

    const run = async () => {
      // Don't clear quotes - just show loading state while keeping current content visible
      setIsRefreshingQuotes(true)

      try {
        const quotesResponse = await calculateVehicleQuotes(vehicleId, 'usd', {
          limit: quotesLimit,
          offset: 0,
          ...(minRating !== null && { minRating }),
        })
        if (!isMounted) return

        setDistanceMiles(quotesResponse.distance_miles)

        const itemsQuotes = Array.isArray(quotesResponse.quotes) ? quotesResponse.quotes : []
        // Update quotes only after we have new data
        setQuotes(itemsQuotes)
        setCurrentOffset(itemsQuotes.length)

        if (typeof quotesResponse.total === 'number') {
          setQuotesTotal(quotesResponse.total)
        } else {
          setQuotesTotal(itemsQuotes.length)
        }
      } catch (error) {
        if (!isMounted) return
        // eslint-disable-next-line no-console
        console.log('[api] calculateVehicleQuotes:error', error)
        setDistanceMiles(null)
        setQuotes([])
        setQuotesTotal(0)
      } finally {
        if (isMounted) {
          setIsRefreshingQuotes(false)
        }
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [vehicleId, reloadKey, quotesLimit, minRating])

  // Load more quotes
  const loadMoreQuotes = useCallback(async () => {
    if (!vehicleId || isLoadingMore || currentOffset >= quotesTotal) return

    setIsLoadingMore(true)

    try {
      const quotesResponse = await calculateVehicleQuotes(vehicleId, 'usd', {
        limit: quotesLimit,
        offset: currentOffset,
        ...(minRating !== null && { minRating }),
      })

      const newQuotes = Array.isArray(quotesResponse.quotes) ? quotesResponse.quotes : []
      
      setQuotes(prev => [...prev, ...newQuotes])
      setCurrentOffset(prev => prev + newQuotes.length)

      if (typeof quotesResponse.total === 'number') {
        setQuotesTotal(quotesResponse.total)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('[api] loadMoreQuotes:error', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [vehicleId, isLoadingMore, currentOffset, quotesTotal, quotesLimit, minRating])

  const recalculate = () => {
    setCurrentOffset(0)
    setReloadKey((prev) => prev + 1)
  }

  const handleSetQuotesLimit = useCallback((limit: number) => {
    // Just update limit - effect will handle fetching new quotes
    setQuotesLimit(limit)
  }, [])

  const handleSetMinRating = useCallback((rating: number | null) => {
    // Just update filter - effect will handle fetching new quotes
    setMinRating(rating)
  }, [])

  const hasMoreQuotes = currentOffset < quotesTotal

  return {
    vehicle,
    photos,
    quotes,
    distanceMiles,
    isLoading,
    isLoadingMore,
    isRefreshingQuotes,
    error,
    recalculate,
    quotesTotal,
    quotesLimit,
    hasMoreQuotes,
    loadMoreQuotes,
    setQuotesLimit: handleSetQuotesLimit,
    minRating,
    setMinRating: handleSetMinRating,
  }
}
