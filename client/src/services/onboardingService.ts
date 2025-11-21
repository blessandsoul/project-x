import { apiAuthorizedMutation } from '@/lib/apiClient';

// Types for onboarding forms
export interface UserOnboardingData {
  budget_min?: number;
  budget_max?: number;
  body_types?: string[];
  fuel_types?: string[];
  usage_goal?: 'family' | 'commute' | 'resale' | 'fun' | 'other';
  target_regions?: string[];
  purchase_timeframe?: 'immediate' | '1-3_months' | '3-6_months' | 'planning';
}

export interface DealerOnboardingData {
  business_name: string;
  tax_id?: string;
  license_number?: string;
  address?: any;
  inventory_size?: '0-10' | '10-50' | '50+';
  specialty_brands?: string[];
  feed_url?: string;
}

export interface CompanyOnboardingData {
  name?: string;
  services?: string[];
  base_price?: number;
  price_per_mile?: number;
  country?: string;
  city?: string;
  description?: string;
  website?: string;
  phone_number?: string;
}

export const onboardingApi = {
  submitUserOnboarding: (data: UserOnboardingData) => {
    return apiAuthorizedMutation('POST', '/api/onboarding/user', data);
  },

  submitDealerOnboarding: (data: DealerOnboardingData) => {
    return apiAuthorizedMutation('POST', '/api/onboarding/dealer', data);
  },

  submitCompanyOnboarding: (data: CompanyOnboardingData) => {
    return apiAuthorizedMutation('POST', '/api/onboarding/company', data);
  }
};
