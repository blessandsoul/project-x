import { useCallback, useEffect, useState } from 'react'
import { calculateVehicleQuotes, fetchVehicleFull } from '@/api/vehicles'
import type { VehicleFullResponse, VehicleQuote } from '@/types/vehicles'

interface UseVehicleDetailsOptions {
  initialLimit?: number
  initialMinRating?: number | null
}

interface UseVehicleDetailsResult {
  vehicle: VehicleFullResponse['vehicle'] | null
  photos: VehicleFullResponse['photos']
  quotes: VehicleQuote[]
  distanceMiles: number | null
  isLoading: boolean
  isLoadingMore: boolean
  isRefreshingQuotes: boolean
  error: string | null
  /** Whether price calculation is available for this vehicle's location */
  priceAvailable: boolean
  /** Message when price is not available */
  priceUnavailableMessage: string | null
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

/**
 * Map vehicle_type field to calculator vehiclecategory.
 * @param vehicleType - 'c' for motorcycles, 'v' for vehicles, or other
 * @returns 'Bike' for motorcycles, 'Sedan' for everything else
 */
function mapVehicleTypeToCategory(vehicleType: string | null | undefined): 'Sedan' | 'Bike' {
  return vehicleType === 'c' ? 'Bike' : 'Sedan'
}

export function useVehicleDetails(
  vehicleId: number | null,
  options?: UseVehicleDetailsOptions
): UseVehicleDetailsResult {
  const [vehicle, setVehicle] = useState<VehicleFullResponse['vehicle'] | null>(null)
  const [photos, setPhotos] = useState<VehicleFullResponse['photos']>([])
  const [quotes, setQuotes] = useState<VehicleQuote[]>([])
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Price availability state (from server response)
  const [priceAvailable, setPriceAvailable] = useState(true)
  const [priceUnavailableMessage, setPriceUnavailableMessage] = useState<string | null>(null)

  // Pagination state - use initial values from options
  const [quotesTotal, setQuotesTotal] = useState(0)
  const [quotesLimit, setQuotesLimit] = useState(options?.initialLimit ?? 5)
  const [currentOffset, setCurrentOffset] = useState(0)

  // Rating filter - use initial value from options
  const [minRating, setMinRating] = useState<number | null>(options?.initialMinRating ?? null)

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
  // Requires vehicle data to be loaded first (for auction source and yard_name)
  useEffect(() => {
    if (!vehicleId || !vehicle) {
      return
    }

    // Get auction and usacity from vehicle data
    const auction = vehicle.source || ''
    const usacity = vehicle.yard_name || ''

    // If we don't have the required data, skip the API call
    if (!auction || !usacity) {
      // eslint-disable-next-line no-console
      console.log('[useVehicleDetails] Missing auction or usacity, skipping quote calculation')
      setPriceAvailable(false)
      setPriceUnavailableMessage('Vehicle location data is incomplete. Cannot calculate shipping quotes.')
      setQuotes([])
      return
    }

    let isMounted = true

    const run = async () => {
      // Don't clear quotes - just show loading state while keeping current content visible
      setIsRefreshingQuotes(true)

      try {
        // Call API with auction and usacity from vehicle data
        // Map vehicle_type to vehiclecategory: 'c' = Bike, anything else = Sedan
        const vehiclecategory = mapVehicleTypeToCategory(vehicle.vehicle_type)
        const quotesResponse = await calculateVehicleQuotes(
          vehicleId,
          auction,
          usacity,
          'usd',
          {
            limit: quotesLimit,
            offset: 0,
            ...(minRating !== null && { minRating }),
            vehiclecategory,
          }
        )
        if (!isMounted) return

        // Handle price availability from server response
        const isPriceAvailable = quotesResponse.price_available !== false
        setPriceAvailable(isPriceAvailable)
        setPriceUnavailableMessage(isPriceAvailable ? null : (quotesResponse.message || 'Price calculation not available'))

        setDistanceMiles(quotesResponse.distance_miles ?? null)

        const itemsQuotes = Array.isArray(quotesResponse.quotes) ? quotesResponse.quotes : []

        // Update quotes only after we have new data
        setQuotes(itemsQuotes)
        setCurrentOffset(itemsQuotes.length)

        if (typeof quotesResponse.total === 'number') {
          setQuotesTotal(quotesResponse.total)
        } else {
          setQuotesTotal(itemsQuotes.length)
        }
      } catch (err) {
        if (!isMounted) return
        // eslint-disable-next-line no-console
        console.error('[useVehicleDetails] calculateVehicleQuotes error:', err)
        setDistanceMiles(null)
        setQuotes([])
        setQuotesTotal(0)
        setPriceAvailable(false)
        setPriceUnavailableMessage('Failed to load shipping quotes. Please try again.')
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
  }, [vehicleId, vehicle, reloadKey, quotesLimit, minRating])

  // Load more quotes
  const loadMoreQuotes = useCallback(async () => {
    if (!vehicleId || !vehicle || isLoadingMore || currentOffset >= quotesTotal) return

    const auction = vehicle.source || ''
    const usacity = vehicle.yard_name || ''
    if (!auction || !usacity) return

    setIsLoadingMore(true)

    try {
      const vehiclecategory = mapVehicleTypeToCategory(vehicle.vehicle_type)
      const quotesResponse = await calculateVehicleQuotes(
        vehicleId,
        auction,
        usacity,
        'usd',
        {
          limit: quotesLimit,
          offset: currentOffset,
          ...(minRating !== null && { minRating }),
          vehiclecategory,
        }
      )

      const newQuotes = Array.isArray(quotesResponse.quotes) ? quotesResponse.quotes : []

      setQuotes(prev => [...prev, ...newQuotes])
      setCurrentOffset(prev => prev + newQuotes.length)

      if (typeof quotesResponse.total === 'number') {
        setQuotesTotal(quotesResponse.total)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[useVehicleDetails] loadMoreQuotes error:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [vehicleId, vehicle, isLoadingMore, currentOffset, quotesTotal, quotesLimit, minRating])

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
    priceAvailable,
    priceUnavailableMessage,
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
