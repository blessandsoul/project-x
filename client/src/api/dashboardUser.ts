import type { Company } from '@/types/api'

// Frontend-only API client for User Dashboard.
// Currently returns MOCK DATA only. Shapes are aligned with planned backend endpoints
// described in server/docs/to-do/dashboard-user.md.

export interface UserDashboardStats {
  viewedCount: number
  favoritesCount: number
  requestsCount: number
}

export interface UserFavoriteCompanyRef {
  company_id: number
  added_at: string
}

export interface UserFavoritesResponse {
  items: UserFavoriteCompanyRef[]
}

export interface UserQuotesItem {
  id: number
  companyName: string
  vehicleId: number
  status: string
}

export interface UserQuotesResponse {
  items: UserQuotesItem[]
}

export interface RecommendedCompaniesResponse {
  items: Company[]
}

// NOTE: All functions below are MOCK implementations.
// When backend is ready, replace internals with real apiGet/apiPost calls
// to the endpoints described in server/docs/to-do/dashboard-user.md.

export async function fetchUserDashboardStatsMock(): Promise<UserDashboardStats> {
  return {
    viewedCount: 5,
    favoritesCount: 3,
    requestsCount: 1,
  }
}

export async function fetchUserFavoritesMock(): Promise<UserFavoritesResponse> {
  return {
    items: [
      { company_id: 1, added_at: new Date().toISOString() },
      { company_id: 2, added_at: new Date().toISOString() },
    ],
  }
}

export async function fetchUserQuotesMock(): Promise<UserQuotesResponse> {
  return {
    items: [
      {
        id: 1,
        companyName: 'ACME Shipping',
        vehicleId: 123,
        status: 'open',
      },
    ],
  }
}
