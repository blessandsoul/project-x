import type { Company } from '@/mocks/_mockData'
import { mockSearchFilters } from '@/mocks/_mockData'

const API_BASE_URL = 'http://localhost:3000'

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

  const defaultStates = mockSearchFilters.geography
  const defaultServices = mockSearchFilters.services

  const pickedState = defaultStates.length > 0
    ? defaultStates[apiCompany.id % defaultStates.length]
    : ''

  const pickedServices = defaultServices.length > 0
    ? defaultServices.slice(0, Math.min(3, defaultServices.length))
    : []

  return {
    id: String(apiCompany.id),
    name: apiCompany.name,
    logo: apiCompany.logo ?? '',
    description: apiCompany.description ?? '',
    services: pickedServices,
    priceRange: {
      min: minPrice,
      max: maxPrice,
      currency: 'USD',
    },
    rating: 0,
    reviewCount: 0,
    vipStatus: false,
    location: {
      state: pickedState,
      city: 'Tbilisi',
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
