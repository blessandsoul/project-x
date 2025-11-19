export interface Company {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  base_price: number;
  price_per_mile: number;
  customs_fee: number;
  service_fee: number;
  broker_fee: number;
  final_formula: any | null;
  description: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  rating: number;
  is_vip: boolean;
  is_onboarding_free: boolean;
  onboarding_ends_at: Date | null;
  phone_number: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyCreate {
  name: string;
  slug?: string; // if omitted, will be auto-generated from name
  logo?: string | null;
  base_price?: number;
  price_per_mile?: number;
  customs_fee?: number;
  service_fee?: number;
  broker_fee?: number;
  final_formula?: any | null;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number; // defaults to 0.0
  is_vip?: boolean; // defaults to false
  is_onboarding_free?: boolean; // defaults to true
  onboarding_ends_at?: Date | null;
  phone_number?: string | null;
}

export interface CompanyUpdate {
  name?: string;
  slug?: string;
  logo?: string | null;
  base_price?: number;
  price_per_mile?: number;
  customs_fee?: number;
  service_fee?: number;
  broker_fee?: number;
  final_formula?: any | null;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number;
  is_vip?: boolean;
  is_onboarding_free?: boolean;
  onboarding_ends_at?: Date | null;
  phone_number?: string | null;
}

export interface CompanySocialLink {
  id: number;
  company_id: number;
  url: string;
}

export interface CompanySocialLinkCreate {
  company_id: number;
  url: string;
}

export interface CompanySocialLinkUpdate {
  url?: string;
}

export interface CompanyQuote {
  id: number;
  company_id: number;
  vehicle_id: number;
  total_price: number;
  breakdown: any | null;
  delivery_time_days: number | null;
  created_at: Date;
}

export interface CompanyQuoteCreate {
  company_id: number;
  vehicle_id: number;
  total_price: number;
  breakdown?: any | null;
  delivery_time_days?: number | null;
}

export interface CompanyQuoteUpdate {
  // Only non-derived fields should be editable via updates.
  // total_price and breakdown are always computed by backend logic.
  delivery_time_days?: number | null;
}

export interface CompanyWithRelations extends Company {
  social_links: CompanySocialLink[];
  quotes: CompanyQuote[];
}
