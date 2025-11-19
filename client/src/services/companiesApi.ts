import type { Company } from '@/mocks/_mockData'

const API_BASE_URL = 'http://localhost:3000'

export type ApiCompanyReview = {
  id: number
  company_id: number
  user_id: number
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

export type ApiCompany = {
  id: number
  name: string
  logo: string | null
  base_price: number | string
  price_per_mile: number | string
  customs_fee: number | string
  service_fee: number | string
  broker_fee: number | string
  final_formula: Record<string, unknown> | null
  description: string | null
  phone_number: string | null
  rating?: number | null
  reviewCount?: number | null
  country?: string | null
  city?: string | null
  is_vip?: boolean | null
  is_onboarding_free?: boolean | null
  cheapest_score?: number | string | null
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

function mapApiCompanyToUiCompany(apiCompany: ApiCompany): Company {
  const basePrice = normalizeNumber(apiCompany.base_price)
  const customsFee = normalizeNumber(apiCompany.customs_fee)
  const serviceFee = normalizeNumber(apiCompany.service_fee)
  const brokerFee = normalizeNumber(apiCompany.broker_fee)

  const pricePerMile = normalizeNumber(apiCompany.price_per_mile)

  const minPrice = basePrice + customsFee + serviceFee + brokerFee
  const maxPrice = minPrice + pricePerMile * 1000

  return {
    id: String(apiCompany.id),
    name: apiCompany.name,
    logo: apiCompany.logo ?? '',
    description: apiCompany.description ?? '',
    services: [],
    priceRange: {
      min: minPrice,
      max: maxPrice,
      currency: 'USD',
    },
    rating: apiCompany.rating ?? 0,
    reviewCount: apiCompany.reviewCount ?? 0,
    vipStatus: !!apiCompany.is_vip,
    location: {
      state: apiCompany.country ?? '',
      city: apiCompany.city ?? '',
    },
    contact: {
      email: '',
      phone: apiCompany.phone_number ?? '',
      website: '',
    },
    establishedYear: new Date(apiCompany.created_at).getFullYear(),
    reviews: [],
  }
}

export async function fetchCompaniesFromApi(): Promise<Company[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/companies`)

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const raw = (await response.json()) as unknown

    if (!Array.isArray(raw)) {
      throw new Error('Invalid companies payload')
    }

    return raw.map((item) => mapApiCompanyToUiCompany(item as ApiCompany))
  } catch (error) {
    console.error('[CompaniesAPI] Failed to fetch companies', error)
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

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const raw = (await response.json()) as {
    items: ApiCompany[]
    total: number
    limit: number
    offset: number
  }

  const companies = Array.isArray(raw.items)
    ? raw.items.map((item) => mapApiCompanyToUiCompany(item))
    : []

  return {
    companies,
    total: typeof raw.total === 'number' ? raw.total : companies.length,
    limit: typeof raw.limit === 'number' ? raw.limit : params.limit ?? companies.length,
    offset: typeof raw.offset === 'number' ? raw.offset : params.offset ?? 0,
  }
}

export async function fetchCompanyByIdFromApi(id: string | number): Promise<Company | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }

      throw new Error(`Request failed with status ${response.status}`)
    }

    const raw = (await response.json()) as ApiCompany

    return mapApiCompanyToUiCompany(raw)
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
  const url = queryString
    ? `${API_BASE_URL}/companies/${companyId}/reviews?${queryString}`
    : `${API_BASE_URL}/companies/${companyId}/reviews`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const raw = (await response.json()) as CompanyReviewsResponse

  if (!Array.isArray(raw.items)) {
    return {
      items: [],
      total: 0,
      limit: typeof raw.limit === 'number' ? raw.limit : params.limit ?? 0,
      offset: typeof raw.offset === 'number' ? raw.offset : params.offset ?? 0,
      page: typeof raw.page === 'number' ? raw.page : 1,
      totalPages: typeof raw.totalPages === 'number' ? raw.totalPages : 0,
    }
  }

  return raw
}
