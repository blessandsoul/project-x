import { apiAuthorizedGet, apiAuthorizedMutation } from '@/lib/apiClient'
import type { VehicleSearchItem } from '@/types/vehicles'

export interface WatchlistItem extends VehicleSearchItem {
  // Additional fields from the watchlist response if needed
}

export interface WatchlistResponse {
  items: WatchlistItem[]
  total: number
  limit: number
  page: number
  totalPages: number
}

export interface AddToWatchlistResponse {
  success: boolean
  status: 'created' | 'already_exists'
}

/**
 * Fetch user's vehicle watchlist
 */
export async function fetchWatchlist(
  page: number = 1,
  limit: number = 20,
): Promise<WatchlistResponse> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))

  return apiAuthorizedGet<WatchlistResponse>(`/favorites/vehicles?${params.toString()}`)
}

/**
 * Add a vehicle to the user's watchlist
 */
export async function addToWatchlist(vehicleId: number): Promise<AddToWatchlistResponse> {
  return apiAuthorizedMutation<AddToWatchlistResponse>(
    'POST',
    `/favorites/vehicles/${vehicleId}`,
  )
}

/**
 * Remove a vehicle from the user's watchlist
 */
export async function removeFromWatchlist(vehicleId: number): Promise<void> {
  return apiAuthorizedMutation<void>(
    'DELETE',
    `/favorites/vehicles/${vehicleId}`,
  )
}
