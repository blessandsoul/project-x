import { apiPost } from '@/lib/apiClient'

export type LeadPriority = 'price' | 'speed' | 'premium_service'

export interface CreateLeadFromQuotesRequest {
  vehicleId: number
  company_ids: number[]
  name: string
  contact: string
  message?: string
  priority?: LeadPriority
  budgetUsdMin?: number | null
  budgetUsdMax?: number | null
  desiredDurationDays?: number | null
  maxAcceptableDurationDays?: number | null
  damageTolerance?: 'minimal' | 'moderate' | 'any' | null
  serviceExtras?: string[] | null
  preferredContactChannel?: 'whatsapp' | 'telegram' | 'phone' | 'email' | null
}

export interface CreateLeadFromQuotesResponse {
  leadId: number
  invitedCompanyIds: number[]
  estimatedResponseTimeHours: number
}

export async function createLeadFromQuotes(
  payload: CreateLeadFromQuotesRequest,
): Promise<CreateLeadFromQuotesResponse> {
  // TODO-FX: Replace mock IDs mapping once real company IDs are wired from backend.
  // API Endpoint: POST /leads/from-quotes
  // Expected Data:
  //   type: object
  //   properties:
  //     vehicleId:
  //       type: integer
  //     company_ids:
  //       type: array
  //       items:
  //         type: integer
  //     name:
  //       type: string
  //     contact:
  //       type: string
  //     message:
  //       type: string
  //     priority:
  //       type: string
  //       enum: ["price", "speed", "premium_service"]
  //     budgetUsdMin:
  //       type: number
  //       nullable: true
  //     budgetUsdMax:
  //       type: number
  //       nullable: true
  //     desiredDurationDays:
  //       type: integer
  //       nullable: true
  //     maxAcceptableDurationDays:
  //       type: integer
  //       nullable: true
  //     damageTolerance:
  //       type: string
  //       nullable: true
  //       enum: ["minimal", "moderate", "any"]
  //     serviceExtras:
  //       type: array
  //       nullable: true
  //       items:
  //         type: string
  //     preferredContactChannel:
  //       type: string
  //       nullable: true
  //       enum: ["whatsapp", "telegram", "phone", "email"]
  // eslint-disable-next-line no-console
  console.log('[leads] createLeadFromQuotes:request', payload)

  const response = await apiPost<CreateLeadFromQuotesResponse>('/leads/from-quotes', payload)

  // eslint-disable-next-line no-console
  console.log('[leads] createLeadFromQuotes:response', response)

  return response
}
