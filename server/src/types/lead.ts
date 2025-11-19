export interface Lead {
  id: number;
  user_id: number | null;
  name: string;
  contact: string;
  budget_usd_min: number | null;
  budget_usd_max: number | null;
  car_type: string | null;
  auction_sources: string[] | null;
  brand: string | null;
  model: string | null;
  year_from: number | null;
  color: string | null;
  message: string | null;
  priority: 'price' | 'speed' | 'premium_service' | null;
  status: 'NEW' | 'MATCHED' | 'CLOSED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
}

export interface LeadCreateFromQuotesInput {
  vehicleId: number;
  selectedCompanyIds: number[];
  name: string;
  contact: string;
  message?: string | null | undefined;
  priority?: 'price' | 'speed' | 'premium_service' | null | undefined;
  userId?: number | null | undefined;
}

export interface UserLeadSummary {
  id: number;
  status: 'NEW' | 'MATCHED' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  summary: {
    budgetUsdMin: number | null;
    budgetUsdMax: number | null;
    carType: string | null;
    priority: 'price' | 'speed' | 'premium_service' | null;
  };
  offersCount: number;
}

export interface UserLeadOfferView {
  offerId: number;
  companyId: number;
  companyName: string;
  companyRating: number | null;
  companyCompletedDeals: number | null;
  estimatedTotalUsd: number;
  estimatedTotalUsdMax: number | null;
  serviceFeeUsd: number | null;
  estimatedDurationDays: number | null;
  comment: string | null;
  status: 'ACTIVE' | 'SELECTED' | 'REJECTED' | 'EXPIRED';
}
