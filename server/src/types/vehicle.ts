export interface Brand {
  id: number;
  slug: string;
  name: string;
  popular: number;
  count: number;
  created_at: Date | null;
  updated_at: Date | null;
  markabrand_ru: string | null;
}

export interface Model {
  id: number;
  clean_model_id: number | null;
  brand_id: number;
  slug: string;
  name: string;
  clean_model_name: string | null;
  clean_model_slug: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface VehiclePhoto {
  id: number;
  vehicle_id: number;
  url: string | null;
  thumb_url: string | null;
  thumb_url_min: string | null;
  thumb_url_middle: string | null;
}

export interface VehicleLotBid {
  id: number;
  vehicle_id: number;
  bid: number | null;
  bid_time: Date | null;
}

/**
 * Core Vehicle shape used across the application.
 *
 * For quote calculation we primarily rely on make, model, year,
 * yard_name, and source. Additional fields mirror the auction
 * vehicles table for richer UI and filtering.
 */
export interface Vehicle {
  id: number;

  // Identification
  number: string | null;
  source_lot_id: string | null;
  vin: string;

  // Brand / model
  brand_id?: number | null;
  brand_name: string; // mapped from vehicles.brand_name
  model_id: number;
  model_name: string; // mapped from vehicles.model_name

  // Backwards compatible fields used by existing code
  make: string; // alias of brand_name
  model: string; // alias of model_name

  // Specs
  year: number;
  vehicle_type: string | null;
  vehicle_type_key?: string | null;
  trim?: string | null;
  engine_volume?: number | null;
  fuel_type?: string | null;
  engine_fuel?: string | null;
  drive: string | null;
  transmission?: string | null;
  cylinders?: string | null;
  category?: string | null;

  // Primary image for list/search views
  primary_photo_url?: string | null;
  primary_thumb_url?: string | null;

  // Whether this vehicle is in the current user's favorites (only populated when authenticated)
  is_favorite?: boolean;

  // Pricing
  retail_value?: number | null;
  repair_cost?: number | null;
  buy_it_now_price?: number | null;
  buy_it_now?: number | null;
  price_future?: number | null;
  final_bid?: number | null;
  calc_price?: number | null;

  // Damage / status
  status?: string | null;
  damage_status?: string | null;
  damage_main_damages?: string | null;

  // Location / yard
  yard_number?: number | null;
  yard_name: string;
  source: string;
  state?: string | null;
  city?: string | null;
  city_slug?: string | null;
  bid_country?: string | null;
  timezone?: string | null;

  // Meta
  title?: string | null;
  seller?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  sold_at?: Date | null;
}

export interface VehicleWithRelations extends Vehicle {
  brand?: Brand | null;
  model_entity?: Model | null;
  photos: VehiclePhoto[];
  bids: VehicleLotBid[];
}
