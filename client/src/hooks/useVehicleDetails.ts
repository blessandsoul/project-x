import { useEffect, useState } from 'react'
import { calculateVehicleQuotes, fetchVehicleFull } from '@/api/vehicles'
import type { VehicleFullResponse, VehicleQuote } from '@/types/vehicles'

interface UseVehicleDetailsResult {
  vehicle: VehicleFullResponse['vehicle'] | null
  photos: VehicleFullResponse['photos']
  quotes: VehicleQuote[]
  distanceMiles: number | null
  isLoading: boolean
  error: string | null
  recalculate: () => void
}

export function useVehicleDetails(vehicleId: number | null): UseVehicleDetailsResult {
  const [vehicle, setVehicle] = useState<VehicleFullResponse['vehicle'] | null>(null)
  const [photos, setPhotos] = useState<VehicleFullResponse['photos']>([])
  const [quotes, setQuotes] = useState<VehicleQuote[]>([])
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

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

        // eslint-disable-next-line no-console
        console.log('[api] fetchVehicleFull:vehicle', full.vehicle)

        setVehicle(full.vehicle)
        setPhotos(full.photos)
      } catch (err) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : 'Failed to load vehicle details'
        setError(message)
        setIsLoading(false)
        return
      }

      try {
        const quotesResponse = await calculateVehicleQuotes(vehicleId, 'usd')
        if (!isMounted) return

        setDistanceMiles(quotesResponse.distance_miles)

        const itemsQuotes = quotesResponse.quotes
        if (Array.isArray(itemsQuotes) && itemsQuotes.length > 0) {
          setQuotes(itemsQuotes)
        }
      } catch (error) {
        if (!isMounted) return

        // логируем, почему упал calculateVehicleQuotes
        // eslint-disable-next-line no-console
        console.log('[api] calculateVehicleQuotes:error', error)

        setDistanceMiles(null)
        setQuotes([])
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

  const recalculate = () => {
    setReloadKey((prev) => prev + 1)
  }

  return {
    vehicle,
    photos,
    quotes,
    distanceMiles,
    isLoading,
    error,
    recalculate,
  }
}
