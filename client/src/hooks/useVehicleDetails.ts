import { useEffect, useState } from 'react'
import { calculateVehicleQuotes, fetchVehicleFull } from '@/api/vehicles'
import type { VehicleFullResponse, VehicleQuote } from '@/types/vehicles'
import { mockCompanies } from '@/mocks/_mockData'

interface UseVehicleDetailsResult {
  vehicle: VehicleFullResponse['vehicle'] | null
  photos: VehicleFullResponse['photos']
  quotes: VehicleQuote[]
  distanceMiles: number | null
  isLoading: boolean
  error: string | null
  recalculate: () => void
  isQuotesMock: boolean
}

export function useVehicleDetails(vehicleId: number | null): UseVehicleDetailsResult {
  const [vehicle, setVehicle] = useState<VehicleFullResponse['vehicle'] | null>(null)
  const [photos, setPhotos] = useState<VehicleFullResponse['photos']>([])
  const [quotes, setQuotes] = useState<VehicleQuote[]>([])
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [isQuotesMock, setIsQuotesMock] = useState(false)

  useEffect(() => {
    if (!vehicleId) {
      return
    }

    let isMounted = true

    const createMockQuotes = (
      vehicleData: VehicleFullResponse['vehicle'],
    ): VehicleQuote[] => {
      const basePriceRaw = vehicleData.calc_price ?? vehicleData.retail_value ?? 10000
      const basePrice = typeof basePriceRaw === 'number' ? basePriceRaw : Number(basePriceRaw) || 10000

      const companies = mockCompanies.slice(0, 4)

      return companies.map((company, index) => {
        const priceDeltaPercent = index * 4
        const totalPrice = Math.round(basePrice * (1 + priceDeltaPercent / 100))

        const deliveryBase = 25
        const deliverySpread = index * 3
        const delivery_time_days = deliveryBase + deliverySpread

        const distance_miles = 5200
        const price_per_mile = 0.45
        const mileage_cost = Math.round(distance_miles * price_per_mile)
        const customs_fee = Math.round(basePrice * 0.12)
        const service_fee = 450
        const broker_fee = 250
        const insurance_rate = 0.015
        const insurance_fee = Math.round(basePrice * insurance_rate)
        const shipping_total = mileage_cost + service_fee

        return {
          company_name: company.name,
          total_price: totalPrice,
          delivery_time_days,
          breakdown: {
            base_price: basePrice,
            distance_miles,
            price_per_mile,
            mileage_cost,
            customs_fee,
            service_fee,
            broker_fee,
            retail_value: typeof vehicleData.retail_value === 'number'
              ? vehicleData.retail_value
              : Number(vehicleData.retail_value) || basePrice,
            insurance_rate,
            insurance_fee,
            shipping_total,
            calc_price: typeof vehicleData.calc_price === 'number'
              ? vehicleData.calc_price
              : Number(vehicleData.calc_price) || basePrice,
            total_price: totalPrice,
            formula_source: 'mock_frontend',
          },
        }
      })
    }

    const run = async () => {
      setIsLoading(true)
      setError(null)

      let currentVehicle: VehicleFullResponse['vehicle'] | null = null

      try {
        const full = await fetchVehicleFull(vehicleId)
        if (!isMounted) return
        currentVehicle = full.vehicle
        setVehicle(full.vehicle)
        setPhotos(full.photos)
      } catch (err) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : 'Failed to load vehicle details'
        setError(message)
        setIsLoading(false)
        return
      }

      const fallbackQuotes = currentVehicle ? createMockQuotes(currentVehicle) : []

      try {
        const quotesResponse = await calculateVehicleQuotes(vehicleId)
        if (!isMounted) return

        if (quotesResponse && typeof quotesResponse === 'object') {
          const distance = (quotesResponse as any).distance_miles
          if (typeof distance === 'number') {
            setDistanceMiles(distance)
          } else {
            setDistanceMiles(null)
          }

          const itemsQuotes = (quotesResponse as any).quotes
          if (Array.isArray(itemsQuotes) && itemsQuotes.length > 0) {
            setQuotes(itemsQuotes as VehicleQuote[])
            setIsQuotesMock(false)
          } else {
            setQuotes(fallbackQuotes)
            setIsQuotesMock(true)
          }
        }
      } catch {
        if (!isMounted) return
        setDistanceMiles(null)
        setQuotes(fallbackQuotes)
        setIsQuotesMock(true)
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
    isQuotesMock,
    recalculate,
  }
}
