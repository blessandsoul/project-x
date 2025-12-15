export interface Company {
  id: number;
  owner_user_id: number | null;
  name: string;
  slug: string;
  base_price: number;
  price_per_mile: number;
  customs_fee: number;
  service_fee: number;
  broker_fee: number;
  insurance: number | null;
  final_formula: any | null;
  description: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  rating: number;
  is_vip: boolean;
  subscription_free: boolean;
  subscription_ends_at: Date | null;
  services: string[] | null;
  phone_number: string | null;
  contact_email: string | null;
  website: string | null;
  established_year: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyCreate {
  name: string;
  owner_user_id?: number | null;
  slug?: string; // if omitted, will be auto-generated from name
  base_price?: number;
  price_per_mile?: number;
  customs_fee?: number;
  service_fee?: number;
  broker_fee?: number;
   insurance?: number | null;
  final_formula?: any | null;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number; // defaults to 0.0
  is_vip?: boolean; // defaults to false
  subscription_free?: boolean; // defaults to true
  subscription_ends_at?: Date | null;
  services?: string[] | null;
  phone_number?: string | null;
  contact_email?: string | null;
  website?: string | null;
  established_year?: number | null;
}

export interface CompanyUpdate {
  name?: string;
  slug?: string;
  base_price?: number;
  price_per_mile?: number;
  customs_fee?: number;
  service_fee?: number;
  broker_fee?: number;
  insurance?: number | null;
  final_formula?: any | null;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number;
  is_vip?: boolean;
  subscription_free?: boolean;
  subscription_ends_at?: Date | null;
  services?: string[] | null;
  phone_number?: string | null;
  contact_email?: string | null;
  website?: string | null;
  established_year?: number | null;
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
