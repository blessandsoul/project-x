// Frontend-only API client for Company (network) Dashboard.
// Currently returns MOCK DATA only, matching shapes in server/docs/to-do/dashboard-company.md.

export interface CompanyNetworkStats {
  totalProfileViews: number
  dealersCount: number
  activeCompaniesCount: number
}

export interface CompanyDealerActivityItem {
  state: string
  leads: number
}

export interface CompanyDealerActivityByStateResponse {
  items: CompanyDealerActivityItem[]
}

export interface CompanyBrandHealth {
  averageRating: number
  totalReviews: number
}

export interface CompanyServiceQuality {
  avgReplyMinutes: number
  handledPercent: number
}

export async function fetchCompanyNetworkStatsMock(): Promise<CompanyNetworkStats> {
  return {
    totalProfileViews: 3200,
    dealersCount: 42,
    activeCompaniesCount: 35,
  }
}

export async function fetchCompanyDealerActivityByStateMock(): Promise<CompanyDealerActivityByStateResponse> {
  return {
    items: [
      { state: 'Tbilisi', leads: 140 },
      { state: 'Batumi', leads: 60 },
      { state: 'Kutaisi', leads: 35 },
    ],
  }
}

export async function fetchCompanyBrandHealthMock(): Promise<CompanyBrandHealth> {
  return {
    averageRating: 4.7,
    totalReviews: 128,
  }
}

export async function fetchCompanyServiceQualityMock(): Promise<CompanyServiceQuality> {
  return {
    avgReplyMinutes: 18,
    handledPercent: 92,
  }
}
