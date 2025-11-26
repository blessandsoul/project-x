export type UserRole = 'user' | 'dealer' | 'company' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;

  // Local-only fields for role-based dashboard
  role?: UserRole;
  dealerSlug?: string | null;
  companyId?: string | null;
  companySlug?: string | null;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
}

export interface ContentData {
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface CompanySocialLink {
  id: string;
  url: string;
  label: string;
  icon?: string;
}

export interface CompanyFees {
  base: number;
  pricePerMile: number;
  customs: number;
  service: number;
  broker: number;
}

export interface CompanyOnboarding {
  isFree: boolean;
  endsAt: string | null;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  logo: string;
  description: string;
  services: string[];
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  fees: CompanyFees;
  pricingFormula: Record<string, unknown> | null;
  rating: number;
  reviewCount: number;
  vipStatus: boolean;
  trustScore?: number;
  onboarding: CompanyOnboarding;
  location: {
    state: string;
    city: string;
  };
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  socialLinks: CompanySocialLink[];
  establishedYear: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Car {
  id: string;
  companyId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  imageUrl: string;
  vin: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
}

export interface SearchFilters {
  geography: string[];
  services: string[];
  priceRange: [number, number];
  rating: number;
  vipOnly: boolean;
}

export declare const mockUser: User;
export declare const mockContent: ContentData;
export declare const mockCompanies: Company[];
export declare const mockSearchFilters: SearchFilters;
export declare const mockCars: Car[];
