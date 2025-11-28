import { apiGet, apiPost } from '@/lib/apiClient'

export interface AuctionLocation {
  name: string
  address: string
}

export interface ShippingQuote {
  companyId: number
  companyName: string
  shippingPrice: number
}

export interface CalculateShippingResponse {
  distanceMiles: number
  quotes: ShippingQuote[]
}

export async function fetchCopartLocations(): Promise<AuctionLocation[]> {
  return apiGet<AuctionLocation[]>('/auction/locations/copart')
}

export async function fetchIaaiLocations(): Promise<AuctionLocation[]> {
  return apiGet<AuctionLocation[]>('/auction/locations/iaai')
}

export async function calculateShipping(
  address: string,
  source: 'copart' | 'iaai',
  port?: string,
): Promise<CalculateShippingResponse> {
  return apiPost<CalculateShippingResponse>('/auction/calculate-shipping', {
    address,
    source,
    port: port || 'poti_georgia',
  })
}
