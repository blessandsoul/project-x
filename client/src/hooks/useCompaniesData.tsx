import { useEffect, useState } from 'react'
import type { Company } from '@/mocks/_mockData'
import { mockCompanies } from '@/mocks/_mockData'
import { fetchCompaniesFromApi } from '@/services/companiesApi'

interface UseCompaniesDataState {
  companies: Company[]
  isLoading: boolean
  error: string | null
}

export function useCompaniesData(): UseCompaniesDataState {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const apiCompanies = await fetchCompaniesFromApi()

        if (!isCancelled && Array.isArray(apiCompanies) && apiCompanies.length > 0) {
          setCompanies(apiCompanies)
        }
      } catch (err) {
        console.error('[useCompaniesData] Failed to load companies from API, falling back to mocks', err)
        if (!isCancelled) {
          setError('Failed to load companies from API')
          setCompanies(mockCompanies)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    companies,
    isLoading,
    error,
  }
}
