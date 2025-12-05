import { apiGet } from '@/lib/apiClient';
import type { CategoryFilter } from '@/components/auction/AuctionSidebarFilters';

// Types matching the API response from VEHICLE_MAKES_MODELS_API.md
export interface VehicleMake {
  id: number;
  makeId: number;
  name: string;
}

export interface VehicleModel {
  id: number;
  modelName: string;
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

type VehicleType = 'car' | 'motorcycle';

/**
 * Fetch vehicle makes based on transport type filter.
 * 
 * Logic:
 * - categoryFilter = 'v' (cars only) → fetch type=car
 * - categoryFilter = 'c' (motorcycles only) → fetch type=motorcycle
 * - categoryFilter = 'v,c' or undefined (both/all) → fetch both and merge
 * 
 * @param categoryFilter - Current transport type filter
 * @returns Array of makes, deduplicated and sorted alphabetically
 */
export async function fetchMakesByTransportType(
  categoryFilter: CategoryFilter
): Promise<VehicleMake[]> {
  // Determine which types to fetch based on category filter
  if (categoryFilter === 'v') {
    // Cars only
    return fetchMakesByType('car');
  }
  
  if (categoryFilter === 'c') {
    // Motorcycles only
    return fetchMakesByType('motorcycle');
  }
  
  // Both or all transport (undefined or 'v,c')
  // Fetch both and merge
  const [carMakes, motoMakes] = await Promise.all([
    fetchMakesByType('car'),
    fetchMakesByType('motorcycle'),
  ]);
  
  // Merge and deduplicate by makeId
  const makeMap = new Map<number, VehicleMake>();
  
  for (const make of carMakes) {
    makeMap.set(make.makeId, make);
  }
  
  for (const make of motoMakes) {
    if (!makeMap.has(make.makeId)) {
      makeMap.set(make.makeId, make);
    }
  }
  
  // Convert to array and sort alphabetically by name
  return Array.from(makeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * Fetch makes for a specific vehicle type.
 * Uses /api/vehicle-makes?type=car|motorcycle
 */
async function fetchMakesByType(type: VehicleType): Promise<VehicleMake[]> {
  try {
    const response = await apiGet<VehicleMakesResponse>(
      `/api/vehicle-makes?type=${type}`
    );
    
    if (response.success) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error(`[vehicleMakesModels] Failed to fetch ${type} makes:`, error);
    return [];
  }
}

/**
 * Fetch vehicle models for a make based on transport type filter.
 * 
 * Logic:
 * - categoryFilter = 'v' (cars only) → fetch type=car models
 * - categoryFilter = 'c' (motorcycles only) → fetch type=motorcycle models
 * - categoryFilter = 'v,c' or undefined (both/all) → fetch both and merge
 * 
 * @param makeId - The make ID to fetch models for
 * @param categoryFilter - Current transport type filter
 * @returns Array of models, deduplicated and sorted alphabetically
 */
export async function fetchModelsByMake(
  makeId: number,
  categoryFilter: CategoryFilter
): Promise<VehicleModel[]> {
  // Determine which types to fetch based on category filter
  if (categoryFilter === 'v') {
    // Cars only
    return fetchModelsByTypeAndMake('car', makeId);
  }
  
  if (categoryFilter === 'c') {
    // Motorcycles only
    return fetchModelsByTypeAndMake('motorcycle', makeId);
  }
  
  // Both or all transport (undefined or 'v,c')
  // Fetch both and merge
  const [carModels, motoModels] = await Promise.all([
    fetchModelsByTypeAndMake('car', makeId),
    fetchModelsByTypeAndMake('motorcycle', makeId),
  ]);
  
  // Merge and deduplicate by id
  const modelMap = new Map<number, VehicleModel>();
  
  for (const model of carModels) {
    modelMap.set(model.id, model);
  }
  
  for (const model of motoModels) {
    if (!modelMap.has(model.id)) {
      modelMap.set(model.id, model);
    }
  }
  
  // Convert to array and sort alphabetically by modelName
  return Array.from(modelMap.values()).sort((a, b) =>
    a.modelName.localeCompare(b.modelName)
  );
}

/**
 * Fetch models for a specific vehicle type and make.
 * Uses /api/vehicle-models?type=car|motorcycle&makeId=<id>
 */
async function fetchModelsByTypeAndMake(
  type: VehicleType,
  makeId: number
): Promise<VehicleModel[]> {
  try {
    const response = await apiGet<VehicleModelsResponse>(
      `/api/vehicle-models?type=${type}&makeId=${makeId}`
    );
    
    if (response.success) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error(
      `[vehicleMakesModels] Failed to fetch ${type} models for make ${makeId}:`,
      error
    );
    return [];
  }
}
