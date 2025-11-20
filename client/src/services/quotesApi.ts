import { apiPost } from '@/lib/apiClient'

export type QuoteBreakdown = {
  base_price: number
  distance_miles: number
  price_per_mile: number
  mileage_cost: number
  customs_fee: number
  service_fee: number
  broker_fee: number
  retail_value: number
  insurance_rate: number
  insurance_fee: number
  shipping_total: number
  calc_price: number
  total_price: number
  formula_source: string
}

export type VehicleQuote = {
  company_name: string
  total_price: number
  delivery_time_days: number | null
  breakdown: QuoteBreakdown
}

export type CalculateQuotesResponse = {
  vehicle_id: number
  make: string
  model: string
  year: number
  mileage: number | null
  yard_name: string
  source: string
  distance_miles: number
  quotes: VehicleQuote[]
}

export async function calculateVehicleQuotes(
  vehicleId: number,
  currency: 'usd' | 'gel' = 'usd'
): Promise<CalculateQuotesResponse> {
  const path = `/vehicles/${vehicleId}/calculate-quotes`

  // Backend implements this as POST /vehicles/:vehicleId/calculate-quotes with no body
  // We send an empty object as the body and pass currency as a query param.
  return apiPost<CalculateQuotesResponse>(path, {}, {
    params: {
      currency,
    },
  })
}

export type VehicleQuotesRequest = {
  vehicle: {
    vin?: string | null
    price: number
    distance_miles: number
  }
  filters?: {
    min_company_rating?: number
    max_total_price?: number | null
  }
}

export type VehicleQuoteItem = {
  company: {
    id: number
    name: string
  }
  shipping_total: number
  insurance_fee: number
  vehicle_price: number
  total_price: number
}

export type VehicleQuotesResponse = {
  results: VehicleQuoteItem[]
}

export async function searchVehicleQuotes(
  payload: VehicleQuotesRequest,
): Promise<VehicleQuoteItem[]> {
  const raw = await apiPost<VehicleQuotesResponse | VehicleQuoteItem[]>(
    '/vehicles/search-quotes',
    payload,
  )

  if (Array.isArray(raw)) {
    return raw
  }

  if (!raw || !Array.isArray(raw.results)) {
    throw new Error('Invalid search-quotes payload')
  }

  return raw.results
}
