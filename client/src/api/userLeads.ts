import { apiAuthorizedGet } from '@/lib/apiClient'

export interface UserLeadOffer {
  offerId: number
  companyId: number
  companyName: string
  companyRating: string
  companyCompletedDeals: number | null
  estimatedTotalUsd: string
  estimatedTotalUsdMax: string
  serviceFeeUsd: string
  estimatedDurationDays: number
  comment: string | null
  status: string
}

export async function fetchUserLeadOffers(): Promise<UserLeadOffer[]> {
  return apiAuthorizedGet<UserLeadOffer[]>('/user/leads')
}
