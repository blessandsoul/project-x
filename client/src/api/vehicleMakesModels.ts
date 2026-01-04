import { apiGet } from '@/lib/apiClient';
import type { CategoryFilter } from '@/components/auction/AuctionSidebarFilters';

// Types matching the new API response
export interface VehicleMake {
  id: number;
  name: string;
}

export interface VehicleModel {
  id: number;
  name: string;
  vehicleType: string | null;
}

interface VehicleMakesResponse {
  success: boolean;
  count: number;
  data: VehicleMake[];
}

interface VehicleModelsResponse {
  success: boolean;
  count: number;
  data: VehicleModel[];
}

/**
 * Fetch all vehicle makes.
 * The new API returns all makes without type filtering.
 * 
 * @returns Array of makes sorted alphabetically
 */
export async function fetchMakesByTransportType(
  _categoryFilter: CategoryFilter
): Promise<VehicleMake[]> {
  // The new API doesn't support type filtering at the make level
  // All makes are returned regardless of category filter
  try {
    const response = await apiGet<VehicleMakesResponse>(
      '/vehicle-makes'
    );

    if (response.success) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error('[vehicleMakesModels] Failed to fetch makes:', error);
    return [];
  }
}

/**
 * Fetch vehicle models for a make.
 * 
 * Logic:
 * - categoryFilter = 'v' (cars only) → fetch vehicleType=Automobile
 * - categoryFilter = 'c' (motorcycles only) → fetch vehicleType=Motorcycle
 * - categoryFilter = 'v,c' or undefined (both/all) → fetch all models for that make
 * 
 * @param makeId - The make ID to fetch models for
 * @param categoryFilter - Current transport type filter
 * @returns Array of models sorted alphabetically
 */
export async function fetchModelsByMake(
  makeId: number,
  categoryFilter: CategoryFilter
): Promise<VehicleModel[]> {
  try {
    let url = `/vehicle-models?makeId=${makeId}`;

    // Add vehicleType filter based on category
    if (categoryFilter === 'v') {
      url += '&vehicleType=Automobile';
    } else if (categoryFilter === 'c') {
      url += '&vehicleType=Motorcycle';
    }
    // For 'v,c' or undefined, don't add vehicleType filter - get all models

    const response = await apiGet<VehicleModelsResponse>(url);

    if (response.success) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error(
      `[vehicleMakesModels] Failed to fetch models for make ${makeId}:`,
      error
    );
    return [];
  }
}
