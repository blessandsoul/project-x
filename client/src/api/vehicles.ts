import { apiGet, apiPost } from '@/lib/apiClient'
import type {
  SearchQuotesResponse,
  VehicleFullResponse,
  VehiclesSearchFilters,
  VehicleQuote,
  VehiclePhoto,
} from '@/types/vehicles'

export async function fetchVehicleFull(id: number): Promise<VehicleFullResponse> {
  return apiGet<VehicleFullResponse>(`/vehicles/${id}/full`)
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

export async function calculateVehicleQuotes(vehicleId: number): Promise<VehicleQuotesResponse> {
  return apiPost<VehicleQuotesResponse>(`/vehicles/${vehicleId}/calculate-quotes`)
}

export async function searchVehicleQuotes(filters: VehiclesSearchFilters): Promise<SearchQuotesResponse> {
  const params = new URLSearchParams()

  (Object.entries(filters) as [keyof VehiclesSearchFilters, VehiclesSearchFilters[keyof VehiclesSearchFilters]][])
    .forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }

      params.append(key, String(value))
    })

  const query = params.toString()
  const path = query ? `/vehicles/search-quotes?${query}` : '/vehicles/search-quotes'

  return apiGet<SearchQuotesResponse>(path)
}
