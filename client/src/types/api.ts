// Type definitions based on Server API Documentation

export type UserRole = 'user' | 'dealer' | 'company';

export interface User {
  id: number;
  email: string;
  username: string;
  /** Optional display name used in the UI (may mirror username) */
  name?: string;
  /** Optional avatar URL generated on the frontend */
  avatar?: string;
  role?: UserRole;
  dealerSlug?: string | null;
  companyId?: string | null;
  companySlug?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SocialLink {
  id: number;
  company_id: number;
  link_type: 'website' | 'social';
  platform?: 'facebook' | 'instagram';
  url: string;
  created_at: string;
  updated_at: string;
}


export interface Company {
  id: number;
  name: string;
  logo: string | null;
  base_price: number;
  price_per_mile: number;
  customs_fee: number;
  service_fee: number;
  broker_fee: number;
  insurance?: number;
  final_formula: Record<string, any> | null;
  description_geo: string | null;
  description_eng: string | null;
  description_rus: string | null;
  phone_number: string | null;
  rating: number;
  reviewCount: number;
  trustScore?: number;
  created_at: string;
  updated_at: string;
  // Extended fields often used in UI but might need optionality if not always fetched
  social_links?: SocialLink[];
  socialLinks?: {
    id: string;
    url: string;
    label: string;
    icon: string;
  }[];
  // Derived/Frontend specific (from mock data legacy, keeping for compatibility if needed)
  slug?: string;
  location?: {
    state: string;
    city: string;
  };
  contact?: {
    email: string;
    phone: string;
    website: string;
  };
  services?: string[];
  vipStatus?: boolean;
  onboarding?: {
    isFree: boolean;
    endsAt: string | null;
  };
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  establishedYear?: number;
  reviews?: any[]; // Todo: Define Review type if needed
}

export interface Vehicle {
  id: number;
  brand_name: string;
  model_name: string;
  make: string; // alias for brand_name
  model: string; // alias for model_name
  year: number;
  yard_name: string;
  source: string;
  retail_value: number | string;
  calc_price: number | string;
  mileage: number | null;
  engine_fuel: string | null;
  engine_fuel_rus: string | null;
  vehicle_type: string | null;
  drive: string | null;
  primary_photo_url?: string | null;
  primary_thumb_url?: string | null;
}

export interface QuoteBreakdown {
  base_price: number;
  distance_miles: number;
  price_per_mile: number;
  mileage_cost: number;
  customs_fee: number;
  service_fee: number;
  broker_fee: number;
  retail_value: number;
  insurance_rate: number;
  insurance_fee: number;
  shipping_total: number;
  calc_price: number;
  total_price: number;
  formula_source: string;
}

export interface Quote {
  company_id?: number;
  company_name: string;
  total_price: number;
  delivery_time_days?: number;
  breakdown: QuoteBreakdown;
  created_at?: string;
}

export interface SearchFilters {
  geography: string[];
  services: string[];
  priceRange: number[]; // [min, max]
  rating: number;
  vipOnly: boolean;
}
