// Frontend-only API client for Dealer Dashboard.
// Currently returns MOCK DATA only. Shapes follow server/docs/to-do/dashboard-dealer.md.

export interface DealerFunnelStats {
  profileViews: number
  requests: number
  deals: number
}

export interface DealerLeadsStats {
  todayNew: number
  weekNew: number
  inProgress: number
  closed: number
  funnel: DealerFunnelStats
}

export interface DealerTrafficStats {
  totalViews: number
  fromSearch: number
  fromCatalog: number
  fromOffers: number
}

export interface DealerComparisonStats {
  leadsDeltaPercent: number
  conversionDeltaPercent: number
  marginDeltaPercent: number
}

export async function fetchDealerLeadsStatsMock(): Promise<DealerLeadsStats> {
  return {
    todayNew: 4,
    weekNew: 18,
    inProgress: 7,
    closed: 11,
    funnel: {
      profileViews: 240,
      requests: 23,
      deals: 5,
    },
  }
}

export async function fetchDealerTrafficStatsMock(): Promise<DealerTrafficStats> {
  return {
    totalViews: 540,
    fromSearch: 310,
    fromCatalog: 150,
    fromOffers: 80,
  }
}

export async function fetchDealerComparisonStatsMock(): Promise<DealerComparisonStats> {
  return {
    leadsDeltaPercent: 12,
    conversionDeltaPercent: 4,
    marginDeltaPercent: -3,
  }
}
