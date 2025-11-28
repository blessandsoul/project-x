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
  vin?: string | null
  engine_volume?: number | string | null
  engine_fuel?: string | null
  transmission?: string | null
  drive?: string | null
  color?: string | null
  status?: string | null
  damage_main_damages?: string | null
  damage_secondary_damages?: string | null
  has_keys_readable?: string | null
  has_keys?: boolean | null
  run_and_drive?: string | null
  airbags?: string | null
  odometer_brand?: string | null
  cylinders?: string | null
  equipment?: string | null
  city?: string | null
  sale_title_state?: string | null
  source_lot_id?: string | null
  salvage_id?: string | null
  repair_cost?: number | string | null
  final_bid?: number | string | null
  buy_it_now_price?: number | string | null
  buy_it_now?: number | string | null
  seller?: string | null
  seller_type?: string | null
  sale_title_type?: string | null
  title?: string | null
  document?: string | null
  sold_at_date?: string | null
  sold_at?: string | null
  sold_at_time?: string | null
  created_at?: string | null
  updated_at?: string | null
  vehicle_type?: string | null
  vehicle_type_key?: string | null
  state?: string | null
  city_slug?: string | null
  is_new?: boolean | null
  iaai_360_view?: string | null
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
  company_id: number
  company_name: string
  total_price: number
  delivery_time_days?: number | null
  breakdown: QuoteBreakdown
  company_rating?: number
  company_review_count?: number
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
  search?: string
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
  source?: string
  price_from?: number
  price_to?: number
  buy_now?: boolean
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
