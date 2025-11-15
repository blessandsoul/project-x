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
  // Backend implements this as POST /vehicles/search-quotes with JSON body
  // matching docs/vehicles-and-quotes-api.md and server/src/routes/company.ts
  return apiPost<SearchQuotesResponse>('/vehicles/search-quotes', filters)
}
