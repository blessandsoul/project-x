/**
 * VehicleMake - Represents a vehicle make from the vehicle_makes table
 */
export interface VehicleMake {
  id: number;
  name: string;
  is_valid: boolean;
}

/**
 * VehicleModel - Represents a vehicle model from the vehicle_models table
 */
export interface VehicleModelEntity {
  id: number;
  make_id: number;
  name: string;
  vehicle_type: string | null;
  is_valid: boolean;
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

  // Make / Model (stored as strings on the vehicles table)
  make: string;
  model: string;

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

  // Title / document info
  document?: string | null;
  sale_title_type?: string | null;

  // Sale date fields
  sold_at_date?: string | null;
  sold_at_time?: string | null;

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
  make_entity?: VehicleMake | null;
  model_entity?: VehicleModelEntity | null;
  photos: VehiclePhoto[];
  bids: VehicleLotBid[];
}
