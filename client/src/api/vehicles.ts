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

export async function calculateVehicleQuotes(
  vehicleId: number,
  currency: 'usd' | 'gel' = 'usd',
  options?: { limit?: number; offset?: number },
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

  const query = params.toString()
  const path = query.length
    ? `/vehicles/${vehicleId}/calculate-quotes?${query}`
    : `/vehicles/${vehicleId}/calculate-quotes`

  // Backend implements this as POST /vehicles/:vehicleId/calculate-quotes with no body
  // Fastify требует непустой body при content-type application/json,
  // поэтому отправляем пустой объект как тело запроса.
  const response = await apiPost<VehicleQuotesResponse>(path, {})

  // single log showing the full response shape
  // eslint-disable-next-line no-console
  console.log('[api] calculateVehicleQuotes:full-response', response)

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
