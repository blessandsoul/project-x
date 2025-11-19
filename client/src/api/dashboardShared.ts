// Shared dashboard API client (frontend-only, MOCK DATA).
// Shapes aligned with server/docs/to-do/dashboard-shared.md.

export type DashboardRole = 'user' | 'dealer' | 'company'

export type KpiTrend = 'up' | 'down' | 'flat'

export interface DashboardKpi {
  key: string
  label: string
  value: number
  trend: KpiTrend
}

export interface DashboardSummaryResponse {
  role: DashboardRole
  kpis: DashboardKpi[]
}

export async function fetchDashboardSummaryMock(role: DashboardRole): Promise<DashboardSummaryResponse> {
  if (role === 'dealer') {
    return {
      role,
      kpis: [
        { key: 'dealer.leads', label: 'Leads this week', value: 18, trend: 'up' },
        { key: 'dealer.deals', label: 'Closed deals', value: 5, trend: 'flat' },
        { key: 'dealer.margin', label: 'Avg margin %', value: 17, trend: 'down' },
      ],
    }
  }

  if (role === 'company') {
    return {
      role,
      kpis: [
        { key: 'company.dealers', label: 'Active dealers', value: 42, trend: 'up' },
        { key: 'company.views', label: 'Network views', value: 3200, trend: 'up' },
        { key: 'company.rating', label: 'Avg rating', value: 4.7, trend: 'flat' },
      ],
    }
  }

  // default: user
  return {
    role: 'user',
    kpis: [
      { key: 'user.viewed', label: 'Viewed companies', value: 5, trend: 'up' },
      { key: 'user.favorites', label: 'Favorites', value: 3, trend: 'flat' },
      { key: 'user.requests', label: 'Open requests', value: 1, trend: 'flat' },
    ],
  }
}
