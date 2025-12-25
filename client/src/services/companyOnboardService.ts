/**
 * Company Onboarding Service
 *
 * Handles the POST /companies/onboard API call for 2-step registration.
 * User must be authenticated but NOT have a company yet.
 *
 * Auth: Cookie-based (HttpOnly access token)
 * CSRF: Required (X-CSRF-Token header) - handled automatically by apiClient interceptor
 */

import { apiClient } from '@/lib/apiClient'
import axios from 'axios'

/**
 * Request payload for company onboarding
 * Matches backend POST /companies/onboard schema
 */
export interface CompanyOnboardRequest {
  // Required
  name: string
  // Contact info (optional)
  companyPhone?: string
  contactEmail?: string
  website?: string
  // Location (optional)
  country?: string
  city?: string
  state?: string
  // Company details (optional) - Multi-language descriptions
  descriptionGeo?: string
  descriptionEng?: string
  descriptionRus?: string
  establishedYear?: number
  services?: string[]
  // Pricing (optional, defaults to 0)
  basePrice?: number
  pricePerMile?: number
  customsFee?: number
  serviceFee?: number
  brokerFee?: number
}

/**
 * Response from company onboarding
 */
export interface CompanyOnboardResponse {
  company: {
    id: number
    name: string
    slug: string
    phone_number: string | null
    contact_email: string | null
    website: string | null
    country: string | null
    city: string | null
    state: string | null
    description_geo: string | null
    description_eng: string | null
    description_rus: string | null
    established_year: number | null
    base_price: number
    price_per_mile: number
    customs_fee: number
    service_fee: number
    broker_fee: number
    rating: number
    is_vip: boolean
    created_at: string
  }
  user: {
    id: number
    email: string
    username: string
    role: 'company'
    company_id: number
  } | null
}

/**
 * Error types for company onboarding
 */
export type OnboardErrorType =
  | 'unauthorized'      // 401 - not authenticated
  | 'forbidden'         // 403 - account blocked
  | 'conflict'          // 409 - user already has company
  | 'validation'        // 422 - invalid input
  | 'rate_limit'        // 429 - too many attempts
  | 'network'           // Network error
  | 'unknown'           // Unknown error

export interface OnboardError {
  type: OnboardErrorType
  message: string
  details?: Record<string, string[]>
}

/**
 * Create a company for the authenticated user (2-step onboarding)
 *
 * Prerequisites:
 * - User must be authenticated (cookie auth)
 * - User must NOT already have a company (company_id IS NULL)
 *
 * After success:
 * - Creates company with owner_user_id = user.id
 * - Updates user.role = 'company'
 * - Updates user.company_id = company.id
 *
 * @throws OnboardError with specific error type
 */
export async function onboardCompany(
  data: CompanyOnboardRequest
): Promise<CompanyOnboardResponse> {
  try {
    const response = await apiClient.post<CompanyOnboardResponse>(
      '/companies/onboard',
      data
    )
    return response.data
  } catch (error) {
    throw parseOnboardError(error)
  }
}

/**
 * Parse API error into typed OnboardError
 */
function parseOnboardError(error: unknown): OnboardError {
  if (!axios.isAxiosError(error)) {
    return {
      type: 'unknown',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }

  const status = error.response?.status
  const data = error.response?.data as {
    error?: string
    message?: string
    details?: Record<string, string[]>
  } | undefined

  // No response - network error
  if (!error.response) {
    return {
      type: 'network',
      message: 'Network error. Please check your connection and try again.',
    }
  }

  switch (status) {
    case 401:
      return {
        type: 'unauthorized',
        message: 'Please log in to create a company.',
      }
    case 403:
      return {
        type: 'forbidden',
        message: data?.message || 'Your account is blocked. Please contact support.',
      }
    case 409:
      return {
        type: 'conflict',
        message: data?.message || 'You already have a company.',
      }
    case 422:
      return {
        type: 'validation',
        message: data?.message || 'Please check your input and try again.',
        details: data?.details,
      }
    case 429:
      return {
        type: 'rate_limit',
        message: 'Too many attempts. Please try again later.',
      }
    default:
      return {
        type: 'unknown',
        message: data?.message || 'An unexpected error occurred. Please try again.',
      }
  }
}
