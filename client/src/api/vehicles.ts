import { apiGet, apiPost } from '@/lib/apiClient'
import type {
  SearchQuotesResponse,
  SearchVehiclesResponse,
  VehicleDetails,
  VehicleFullResponse,
  VehiclesSearchFilters,
  VehicleQuote,
  VehiclePhoto,
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
}

export async function calculateVehicleQuotes(
  vehicleId: number,
  currency: 'usd' | 'gel' = 'usd',
): Promise<VehicleQuotesResponse> {
  const params = new URLSearchParams()

  if (currency) {
    params.set('currency', currency)
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
