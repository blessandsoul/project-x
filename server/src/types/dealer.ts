export interface DealerProfile {
  user_id: number;
  business_name: string;
  tax_id: string | null;
  license_number: string | null;
  address: any | null; // JSON
  inventory_size: '0-10' | '10-50' | '50+' | null;
  specialty_brands: string[] | null;
  feed_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DealerProfileCreate {
  user_id: number;
  business_name: string;
  tax_id?: string;
  license_number?: string;
  address?: any;
  inventory_size?: '0-10' | '10-50' | '50+';
  specialty_brands?: string[];
  feed_url?: string;
}

export interface DealerProfileUpdate extends Partial<Omit<DealerProfileCreate, 'user_id'>> {}

