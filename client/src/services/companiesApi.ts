import axios, { type AxiosError } from 'axios'
import { API_BASE_URL, apiAuthorizedMutation, apiAuthorizedGet } from '@/lib/apiClient'
import type { Company } from '@/types/api'

export type ApiCompanyReview = {
  id: number
  company_id: number
  user_id: number
  user_name?: string | null
  avatar?: string | null
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export type CompanyReviewsResponse = {
  items: ApiCompanyReview[]
  total: number
  limit: number
  offset: number
  page: number
  totalPages: number
}

type ApiCompanySocialLink = {
  id: number | string
  company_id?: number
  url?: string | null
  label?: string | null
}

const SOCIAL_ICON_BY_HOST: Record<string, string> = {
  'facebook.com': 'mdi:facebook',
  'instagram.com': 'mdi:instagram',
  'linkedin.com': 'mdi:linkedin',
  'youtube.com': 'mdi:youtube',
  'tiktok.com': 'mdi:tiktok',
  'x.com': 'mdi:twitter',
  'twitter.com': 'mdi:twitter',
}

type NormalizedCompanySocialLink = NonNullable<Company['socialLinks']>[number]

export type ApiCompany = {
  id: number
  slug?: string | null
  name: string
  logo?: string | null
  logo_url?: string | null
  base_price: number | string
  price_per_mile: number | string
  customs_fee: number | string
  service_fee: number | string
  broker_fee: number | string
  insurance?: number | string | null
  final_formula: Record<string, unknown> | null
  description: string | null
  services?: string[] | null
  phone_number: string | null
  contact_email?: string | null
  website?: string | null
  rating?: number | string | null
  reviewCount?: number | string | null
  country?: string | null
  city?: string | null
  state?: string | null
  is_vip?: number | boolean | null
  subscription_free?: number | boolean | null
  subscription_ends_at?: string | null
  cheapest_score?: number | string | null
  established_year?: number | null
  social_links?: ApiCompanySocialLink[] | null
  created_at: string
  updated_at: string
}

function normalizeNumber(value: number | string): number {
  if (typeof value === 'number') {
    return value
  }

  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    return 0
  }

  return parsed
}

function resolveLogoUrl(logoPath?: string | null): string {
  if (typeof logoPath !== 'string' || logoPath.trim().length === 0) {
    return '/car-logos/toyota.png'
  }

  if (logoPath.startsWith('http')) {
    return logoPath
  }

  return `${API_BASE_URL}${logoPath}`
}

function extractServices(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((service): service is string => typeof service === 'string' && service.trim().length > 0)
    .map((service) => service.trim())
}

function normalizeSocialLinks(value: unknown): NormalizedCompanySocialLink[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((link): NormalizedCompanySocialLink | null => {
      if (!link || typeof link !== 'object') {
        return null
      }

      const typedLink = link as ApiCompanySocialLink
      if (typeof typedLink.url !== 'string' || typedLink.url.trim().length === 0) {
        return null
      }

      try {
        const parsedUrl = new URL(typedLink.url)
        const host = parsedUrl.hostname.replace(/^www\./, '')
        const icon = SOCIAL_ICON_BY_HOST[host] ?? 'mdi:web'
        const label = typedLink.label?.trim() ?? host

        return {
          id: String(typedLink.id ?? typedLink.url),
          url: typedLink.url,
          label,
          icon,
        }
      } catch (error) {
        console.warn('[CompaniesAPI] Skipping invalid social link', { link, error })
        return null
      }
    })
    .filter((link): link is NormalizedCompanySocialLink => link !== null)
}

function mapApiCompanyToUiCompany(apiCompany: ApiCompany): Company {
  const basePrice = normalizeNumber(apiCompany.base_price)
  const customsFee = normalizeNumber(apiCompany.customs_fee)
  const serviceFee = normalizeNumber(apiCompany.service_fee)
  const brokerFee = normalizeNumber(apiCompany.broker_fee)
  const insurance = normalizeNumber(apiCompany.insurance ?? 0)

  const pricePerMile = normalizeNumber(apiCompany.price_per_mile)
  // Approximate min/max shipping totals based on backend fee structure.
  // min = base + fixed fees; max = min + per-mile component for a long-haul route.
  const minPrice = basePrice + customsFee + serviceFee + brokerFee
  const assumedDistanceMiles = 8000
  const maxPrice = minPrice + pricePerMile * assumedDistanceMiles

  const slugCandidate = typeof apiCompany.slug === 'string' && apiCompany.slug.trim().length > 0
    ? apiCompany.slug.trim()
    : apiCompany.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const rating = normalizeNumber(apiCompany.rating ?? 0)
  const reviewCount = Math.max(0, Math.floor(normalizeNumber(apiCompany.reviewCount ?? 0)))

  const onboardingEndsAt = typeof apiCompany.subscription_ends_at === 'string'
    ? apiCompany.subscription_ends_at
    : null

  // Backend already sends established_year as a year (e.g. 2018), not a timestamp.
  const establishedYear = typeof apiCompany.established_year === 'number'
    ? apiCompany.established_year
    : new Date(apiCompany.created_at).getFullYear()

  return {
    id: apiCompany.id,
    slug: slugCandidate,
    name: apiCompany.name,
    logo: resolveLogoUrl(apiCompany.logo_url ?? apiCompany.logo ?? null),
    description: apiCompany.description ?? '',
    services: extractServices(apiCompany.services),
    base_price: basePrice,
    price_per_mile: pricePerMile,
    customs_fee: customsFee,
    service_fee: serviceFee,
    broker_fee: brokerFee,
    insurance,
    priceRange: {
      min: minPrice,
      max: maxPrice,
      currency: 'USD',
    },
    // @ts-ignore: Mock data compatibility
    fees: {
      base: basePrice,
      pricePerMile,
      customs: customsFee,
      service: serviceFee,
      broker: brokerFee,
    },
    final_formula: apiCompany.final_formula,
    rating,
    reviewCount,
    vipStatus: !!apiCompany.is_vip,
    onboarding: {
      isFree: !!apiCompany.subscription_free,
      endsAt: onboardingEndsAt,
    },
    location: {
      state: apiCompany.state ?? apiCompany.country ?? '',
      city: apiCompany.city ?? '',
    },
    contact: {
      email: apiCompany.contact_email ?? '',
      phone: apiCompany.phone_number ?? '',
      website: apiCompany.website ?? '',
    },
    // @ts-ignore: Mock data compatibility
    socialLinks: normalizeSocialLinks(apiCompany.social_links),
    establishedYear: establishedYear,
    reviews: [],
  }
}

export async function uploadCompanyLogoFromApi(
  companyId: string | number,
  file: File,
): Promise<{ logoUrl: string; originalLogoUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const token = window.localStorage.getItem('projectx_auth_token')

  const response = await axios.post<{ logoUrl: string; originalLogoUrl: string }>(
    `${API_BASE_URL}/companies/${companyId}/logo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  )

  return response.data
}

export async function fetchCompaniesFromApi(): Promise<Company[]> {
  try {
    const response = await axios.get<ApiCompany[]>(`${API_BASE_URL}/companies`)

    const raw = response.data as unknown

    if (!Array.isArray(raw)) {
      throw new Error('Invalid companies payload')
    }

    return raw.map((item) => mapApiCompanyToUiCompany(item as ApiCompany))
  } catch (error) {
    console.error('[CompaniesAPI] Failed to fetch companies', error)
    throw error
  }
}

export type UpdateCompanyPayload = {
  name?: string
  base_price?: number
  customs_fee?: number
  service_fee?: number
  broker_fee?: number
  price_per_mile?: number
  description?: string | null
  country?: string | null
  city?: string | null
  phone_number?: string | null
  contact_email?: string | null
  website?: string | null
  established_year?: number | null
  services?: string[]
}

export async function updateCompanyFromApi(
  id: string | number,
  payload: UpdateCompanyPayload,
): Promise<ApiCompany> {
  const response = await apiAuthorizedMutation<ApiCompany>(
    'PUT',
    `/companies/${id}`,
    payload,
  )

  return response
}

export async function deleteCompanySocialLinkFromApi(
  socialLinkId: string | number,
): Promise<void> {
  await apiAuthorizedMutation<unknown>(
    'DELETE',
    `/social-links/${socialLinkId}`,
    undefined as any,
  )
}

export async function createCompanySocialLinkFromApi(
  companyId: string | number,
  url: string,
): Promise<ApiCompanySocialLink> {
  const response = await apiAuthorizedMutation<ApiCompanySocialLink>(
    'POST',
    `/companies/${companyId}/social-links`,
    { url },
  )

  return response
}

export async function fetchRawCompanyByIdFromApi(id: string | number): Promise<ApiCompany | null> {
  try {
    const response = await axios.get<ApiCompany>(`${API_BASE_URL}/companies/${id}`)
    return response.data
  } catch (error) {
    console.error('[CompaniesAPI] Failed to fetch raw company by id', {
      id,
      error,
    })
    throw error
  }
}

export type CompaniesSearchParams = {
  limit?: number
  offset?: number
  search?: string
  minRating?: number
  minBasePrice?: number
  maxBasePrice?: number
  maxTotalFee?: number
  country?: string
  city?: string
  isVip?: boolean
  onboardingFree?: boolean
  orderBy?: 'rating' | 'cheapest' | 'name' | 'newest'
  orderDirection?: 'asc' | 'desc'
}

export async function searchCompaniesFromApi(
  params: CompaniesSearchParams,
): Promise<{ companies: Company[]; total: number; limit: number; offset: number }> {
  const searchParams = new URLSearchParams()

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit))
  }

  if (typeof params.offset === 'number') {
    searchParams.set('offset', String(params.offset))
  }

  const trimmedSearch = params.search?.trim() ?? ''
  if (trimmedSearch.length >= 4) {
    searchParams.set('search', trimmedSearch)
  }

  if (typeof params.minRating === 'number' && params.minRating > 0) {
    searchParams.set('min_rating', String(params.minRating))
  }

  if (typeof params.minBasePrice === 'number') {
    searchParams.set('min_base_price', String(params.minBasePrice))
  }

  if (typeof params.maxBasePrice === 'number') {
    searchParams.set('max_base_price', String(params.maxBasePrice))
  }

  if (typeof params.maxTotalFee === 'number') {
    searchParams.set('max_total_fee', String(params.maxTotalFee))
  }

  if (params.country) {
    searchParams.set('country', params.country)
  }

  if (params.city) {
    searchParams.set('city', params.city)
  }

  if (params.isVip) {
    searchParams.set('is_vip', 'true')
  }

  if (params.onboardingFree) {
    searchParams.set('onboarding_free', 'true')
  }

  if (params.orderBy) {
    searchParams.set('order_by', params.orderBy)

    if (params.orderDirection) {
      searchParams.set('order_direction', params.orderDirection)
    }
  }

  const queryString = searchParams.toString()
  const url = queryString
    ? `${API_BASE_URL}/companies/search?${queryString}`
    : `${API_BASE_URL}/companies/search`

  try {
    const response = await axios.get<{
      items: ApiCompany[]
      total: number
      limit: number
      offset: number
    }>(url)

    const raw = response.data

    const companies = Array.isArray(raw.items)
      ? raw.items.map((item: ApiCompany) => mapApiCompanyToUiCompany(item))
      : []

    return {
      companies,
      total: typeof raw.total === 'number' ? raw.total : companies.length,
      limit: typeof raw.limit === 'number' ? raw.limit : params.limit ?? companies.length,
      offset: typeof raw.offset === 'number' ? raw.offset : params.offset ?? 0,
    }
  } catch (error) {
    console.error('[CompaniesAPI] Failed to search companies', {
      params,
      error,
    })
    throw error
  }
}

export async function fetchCompanyByIdFromApi(id: string | number): Promise<Company | null> {
  try {
    const response = await axios.get<ApiCompany>(`${API_BASE_URL}/companies/${id}`) 

    return mapApiCompanyToUiCompany(response.data)
  } catch (error) {
    console.error('[CompaniesAPI] Failed to fetch company by id', {
      id,
      error,
    })
    throw error
  }
}

export type CompanyReviewsParams = {
  limit?: number
  offset?: number
}

export async function fetchCompanyReviewsFromApi(
  companyId: string | number,
  params: CompanyReviewsParams = {},
): Promise<{ items: ApiCompanyReview[]; total: number; limit: number; offset: number; page: number; totalPages: number }> {
  const searchParams = new URLSearchParams()

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit))
  }

  if (typeof params.offset === 'number') {
    searchParams.set('offset', String(params.offset))
  }

  const queryString = searchParams.toString()
  const path = queryString
    ? `/companies/${companyId}/reviews?${queryString}`
    : `/companies/${companyId}/reviews`

  try {
    const raw = await apiAuthorizedGet<{
      items: ApiCompanyReview[]
      total: number
      limit: number
      offset: number
      page: number
      totalPages: number
    }>(path)

    return {
      items: Array.isArray(raw.items) ? raw.items : [],
      total: typeof raw.total === 'number' ? raw.total : 0,
      limit: typeof raw.limit === 'number' ? raw.limit : params.limit ?? 10,
      offset: typeof raw.offset === 'number' ? raw.offset : params.offset ?? 0,
      page: typeof raw.page === 'number' ? raw.page : 1,
      totalPages: typeof raw.totalPages === 'number' ? raw.totalPages : 0,
    }
  } catch (error) {
    console.error('[CompaniesAPI] Failed to fetch company reviews', {
      companyId,
      params,
      error,
    })
    throw error
  }
}

export type CreateCompanyReviewPayload = {
  company_id: number
  rating: number
  comment?: string
}

export type UpdateCompanyReviewPayload = {
  rating?: number
  comment?: string | null
}

export type LeadFromQuotesPayload = {
  vehicleId: number
  selectedCompanyIds: number[]
  name: string
  contact: string
  message: string
  priority: 'price'
}

export async function createCompanyReviewFromApi(payload: CreateCompanyReviewPayload): Promise<ApiCompanyReview> {
  const requestBody: { rating: number; comment?: string | null } = {
    rating: payload.rating,
  }

  if (payload.comment && payload.comment.trim().length >= 10) {
    requestBody.comment = payload.comment.trim()
  }

  const response = await apiAuthorizedMutation<ApiCompanyReview>(
    'POST',
    `/companies/${payload.company_id}/reviews`,
    requestBody
  )

  console.log('[CompaniesAPI] Successfully created company review', {
    reviewId: response.id,
    companyId: payload.company_id,
  })

  return response
}

export async function createLeadFromQuotes(payload: LeadFromQuotesPayload): Promise<void> {
  try {
    const response = await axios.post(`${API_BASE_URL}/leads/from-quotes`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('[CompaniesAPI] Successfully created lead from quotes', {
      status: response.status,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError

      console.error('[CompaniesAPI] Failed to create lead from quotes', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      })
    } else {
      console.error('[CompaniesAPI] Failed to create lead from quotes', {
        error,
      })
    }

    throw error
  }
}

export async function updateCompanyReviewFromApi(
  companyId: string | number,
  reviewId: string | number,
  payload: UpdateCompanyReviewPayload
): Promise<ApiCompanyReview> {
  const requestBody: { rating?: number; comment?: string | null } = {}

  if (payload.rating !== undefined) {
    requestBody.rating = payload.rating
  }

  if (payload.comment !== undefined) {
    requestBody.comment = payload.comment
  }

  const response = await apiAuthorizedMutation<ApiCompanyReview>(
    'PUT',
    `/companies/${companyId}/reviews/${reviewId}`,
    requestBody
  )

  console.log('[CompaniesAPI] Successfully updated company review', {
    companyId,
    reviewId,
  })

  return response
}

export async function deleteCompanyReviewFromApi(
  companyId: string | number,
  reviewId: string | number
): Promise<void> {
  await apiAuthorizedMutation<unknown>(
    'DELETE',
    `/companies/${companyId}/reviews/${reviewId}`
  )

  console.log('[CompaniesAPI] Successfully deleted company review', {
    companyId,
    reviewId,
  })
}
