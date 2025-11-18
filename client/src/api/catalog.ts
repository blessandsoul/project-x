import { apiGet } from '@/lib/apiClient'

export type VehicleCatalogType = 'car' | 'motorcycle'

export interface CatalogMake {
  makeId: number
  name: string
}

export interface CatalogMakesResponse {
  items: CatalogMake[]
}

export interface CatalogModel {
  makeId: number
  makeName: string
  modelId: number
  name: string
}

export interface CatalogModelsResponse {
  make: {
    makeId: number
    name: string
    type: VehicleCatalogType
  }
  items: CatalogModel[]
}

export async function fetchCatalogMakes(
  type: VehicleCatalogType = 'car',
  q?: string,
): Promise<CatalogMake[]> {
  const params = new URLSearchParams()

  if (type) {
    params.set('type', type)
  }

  if (q && q.trim().length > 0) {
    params.set('q', q.trim())
  }

  const query = params.toString()
  const path = query.length ? `/catalog/makes?${query}` : '/catalog/makes'

  const response = await apiGet<CatalogMakesResponse>(path)
  return response.items
}

export async function fetchCatalogModels(
  makeId: number,
  type: VehicleCatalogType = 'car',
): Promise<CatalogModel[]> {
  const params = new URLSearchParams()

  if (type) {
    params.set('type', type)
  }

  const query = params.toString()
  const path = query.length
    ? `/catalog/makes/${makeId}/models?${query}`
    : `/catalog/makes/${makeId}/models`

  const response = await apiGet<CatalogModelsResponse>(path)
  return response.items
}
