export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
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

export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  services: string[];
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  rating: number;
  reviewCount: number;
  vipStatus: boolean;
  location: {
    state: string;
    city: string;
  };
  contact: {
    email: string;
    phone: string;
    website: string;
  };
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

export interface SearchFilters {
  geography: string[];
  services: string[];
  priceRange: [number, number];
  rating: number;
  vipOnly: boolean;
}

export declare const mockUser: User;
export declare const mockNavigationItems: NavigationItem[];
export declare const mockContent: ContentData;
export declare const mockFooterLinks: FooterLink[];
export declare const mockCompanies: Company[];
export declare const mockSearchFilters: SearchFilters;
