import { apiAuthorizedGet } from '@/lib/apiClient'

export type CompanyLeadStatus = 'NEW' | 'OFFER_SENT' | 'WON' | 'LOST' | 'EXPIRED'

export interface CompanyLeadSummary {
  budgetUsdMin: string | null
  budgetUsdMax: string | null
  carType: string | null
  auctionSources: string[]
  priority: 'price' | 'speed' | 'premium_service' | null
  source: string
  desiredBudgetText: string | null
  desiredVehicleTypeText: string | null
  auctionText: string | null
  comment: string | null
}

export interface CompanyLeadVehicle {
  id: number | string
  title: string
  year: number
  mainImageUrl: string
  auctionLotUrl: string
}

export interface CompanyLeadItem {
  leadCompanyId: number
  leadId: number
  status: CompanyLeadStatus
  invitedAt: string
  expiresAt: string | null
  leadSummary: CompanyLeadSummary
  vehicle: CompanyLeadVehicle
}

export type CompanyLeadsResponse = CompanyLeadItem[]

export async function fetchCompanyLeads(): Promise<CompanyLeadsResponse> {
  // TODO-FX: Replace mock implementation description once backend is fully stable.
  // API Endpoint: GET /company/leads
  // Expected Data:
  //   type: array
  //   items:
  //     type: object
  //     properties:
  //       leadCompanyId:
  //         type: integer
  //       leadId:
  //         type: integer
  //       status:
  //         type: string
  //         enum: ["NEW", "OFFER_SENT", "WON", "LOST", "EXPIRED"]
  //       invitedAt:
  //         type: string
  //         format: date-time
  //       expiresAt:
  //         type: string
  //         format: date-time
  //         nullable: true
  //       leadSummary:
  //         type: object
  //       vehicle:
  //         type: object
  return apiAuthorizedGet<CompanyLeadsResponse>('/company/leads')
}
