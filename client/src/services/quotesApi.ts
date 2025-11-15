const API_BASE_URL = 'http://localhost:3000'

export type VehicleQuotesRequest = {
  vehicle: {
    vin?: string | null
    price: number
    distance_miles: number
  }
  filters?: {
    min_company_rating?: number
    max_total_price?: number | null
  }
}

export type VehicleQuoteItem = {
  company: {
    id: number
    name: string
  }
  shipping_total: number
  insurance_fee: number
  vehicle_price: number
  total_price: number
}

export type VehicleQuotesResponse = {
  results: VehicleQuoteItem[]
}

export async function searchVehicleQuotes(
  payload: VehicleQuotesRequest,
): Promise<VehicleQuoteItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/search-quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const raw = (await response.json()) as VehicleQuotesResponse | VehicleQuoteItem[]

    if (Array.isArray(raw)) {
      return raw
    }

    if (!raw || !Array.isArray(raw.results)) {
      throw new Error('Invalid search-quotes payload')
    }

    return raw.results
  } catch (error) {
    console.error('[QuotesAPI] Failed to search vehicle quotes', error)
    throw error
  }
}
