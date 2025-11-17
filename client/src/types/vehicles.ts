export interface VehicleSummary {
  id: number
  brand_name: string
  model_name: string
  make: string
  model: string
  year: number
  yard_name: string | null
  source: string | null
  retail_value: number | string | null
}

export interface VehicleDetails extends VehicleSummary {
  calc_price: number | string | null
  mileage?: number | null
}

export interface VehiclePhoto {
  id: number
  vehicle_id: number
  url: string
  thumb_url: string | null
  thumb_url_min: string | null
  thumb_url_middle: string | null
}

export interface VehicleFullResponse {
  vehicle: VehicleDetails
  photos: VehiclePhoto[]
}

export interface QuoteBreakdown {
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

export interface VehicleQuote {
  company_name: string
  total_price: number
  delivery_time_days?: number | null
  breakdown: QuoteBreakdown
}

export interface VehicleWithQuotes {
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

export interface SearchQuotesResponse {
  items: VehicleWithQuotes[]
  total: number
  limit: number
  offset: number
  page: number
  totalPages: number
}

export interface VehiclesSearchFilters {
  make?: string
  model?: string
  year?: number
  year_from?: number
  year_to?: number
  mileage_from?: number
  mileage_to?: number
  fuel_type?: string
  category?: string
  drive?: string
  price_from?: number
  price_to?: number
  limit?: number
  offset?: number
}

export interface VehicleSearchItem extends VehicleDetails {
  mileage: number | null
  fuel_type?: string | null
  category?: string | null
  drive?: string | null
  distance_miles?: number | null
  primary_photo_url: string | null
  primary_thumb_url: string | null
  vehicle_id?: number
  quotes?: VehicleQuote[]
}

export interface SearchVehiclesResponse {
  items: VehicleSearchItem[]
  total: number
  limit: number
  page: number
  totalPages: number
}
