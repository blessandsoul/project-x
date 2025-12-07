import { apiGet, apiPost } from '@/lib/apiClient'
import type {
  SearchQuotesResponse,
  SearchVehiclesResponse,
  VehicleDetails,
  VehicleFullResponse,
  VehiclesSearchFilters,
  VehicleQuote,
  VehiclePhoto,
  VehicleSearchItem,
} from '@/types/vehicles'

export async function fetchVehicleFull(id: number): Promise<VehicleFullResponse> {
  const [vehicle, photos] = await Promise.all([
    apiGet<VehicleDetails>(`/vehicles/${id}`),
    apiGet<VehiclePhoto[]>(`/vehicles/${id}/photos`),
  ])

  return {
    vehicle,
    photos,
  }
}

export async function fetchVehiclePhotos(id: number): Promise<VehiclePhoto[]> {
  return apiGet<VehiclePhoto[]>(`/vehicles/${id}/photos`)
}

export interface VehicleQuotesResponse {
  vehicle_id: number
  make: string
  model: string
  year: number
  mileage: number | null
  yard_name: string | null
  source: string | null
  distance_miles: number
  quotes: VehicleQuote[]
  /** Whether price calculation was successful (false if city couldn't be matched) */
  price_available: boolean
  /** Error message when price_available is false */
  message?: string
  /** City that couldn't be matched (when price_available is false) */
  unmatched_city?: string
  total?: number
  limit?: number
  offset?: number
  page?: number
  totalPages?: number
}

export interface VehiclesCompareRequest {
  vehicle_ids: number[]
  quotes_per_vehicle?: number
  currency?: 'usd' | 'gel'
}

export interface VehiclesCompareResponse {
  currency: 'USD' | 'GEL'
  vehicles: VehicleQuotesResponse[]
}

export interface VehicleSimilarResponse {
  vehicleId: number
  items: VehicleSearchItem[]
  limit: number
  yearRange: number
  priceRadius: number
}

/**
 * Calculate shipping quotes for a vehicle using the server-side calculator API.
 * 
 * The server normalizes auction and usacity values before calling the external
 * calculator API. All pricing logic is handled server-side.
 * 
 * @param vehicleId - Vehicle ID
 * @param auction - Auction source (e.g., "copart", "iaai") - will be normalized server-side
 * @param usacity - US city/yard name (e.g., "Permian Basin (TX)") - will be smart-matched server-side
 * @param currency - Currency for prices (default: 'usd')
 * @param options - Pagination and filter options
 */
export async function calculateVehicleQuotes(
  vehicleId: number,
  auction: string,
  usacity: string,
  currency: 'usd' | 'gel' = 'usd',
  options?: { limit?: number; offset?: number; minRating?: number },
): Promise<VehicleQuotesResponse> {
  const params = new URLSearchParams()

  if (currency) {
    params.set('currency', currency)
  }
  if (typeof options?.limit === 'number') {
    params.set('limit', String(options.limit))
  }
  if (typeof options?.offset === 'number') {
    params.set('offset', String(options.offset))
  }
  if (typeof options?.minRating === 'number') {
    params.set('minRating', String(options.minRating))
  }

  const query = params.toString()
  const path = query.length
    ? `/vehicles/${vehicleId}/calculate-quotes?${query}`
    : `/vehicles/${vehicleId}/calculate-quotes`

  // POST with required body: { auction, usacity }
  // Server normalizes these values and calls the external calculator API
  const response = await apiPost<VehicleQuotesResponse>(path, {
    auction,
    usacity,
  })

  // eslint-disable-next-line no-console
  console.log('[api] calculateVehicleQuotes:response', response)

  return response
}

export async function compareVehicles(payload: VehiclesCompareRequest): Promise<VehiclesCompareResponse> {
  return apiPost<VehiclesCompareResponse>('/vehicles/compare', {
    vehicle_ids: payload.vehicle_ids,
    quotes_per_vehicle: payload.quotes_per_vehicle,
    currency: payload.currency,
  })
}

export async function searchVehicleQuotes(filters: VehiclesSearchFilters): Promise<SearchQuotesResponse> {
  // Backend implements this as POST /vehicles/search-quotes with JSON body
  // matching docs/vehicles-and-quotes-api.md and server/src/routes/company.ts
  return apiPost<SearchQuotesResponse>('/vehicles/search-quotes', filters)
}

export async function searchVehicles(filters: VehiclesSearchFilters & { page?: number }): Promise<SearchVehiclesResponse> {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    params.append(key, String(value))
  })

  const query = params.toString()
  const path = query.length ? `/vehicles/search?${query}` : '/vehicles/search'

  return apiGet<SearchVehiclesResponse>(path)
}

export async function fetchSimilarVehicles(
  id: number,
  options?: { limit?: number; yearRange?: number; priceRadius?: number },
): Promise<VehicleSimilarResponse> {
  const params = new URLSearchParams()

  if (typeof options?.limit === 'number') {
    params.set('limit', String(options.limit))
  }
  if (typeof options?.yearRange === 'number') {
    params.set('year_range', String(options.yearRange))
  }
  if (typeof options?.priceRadius === 'number') {
    params.set('price_radius', String(options.priceRadius))
  }

  const query = params.toString()
  const path = query.length
    ? `/vehicles/${id}/similar?${query}`
    : `/vehicles/${id}/similar`

  return apiGet<VehicleSimilarResponse>(path)
}
