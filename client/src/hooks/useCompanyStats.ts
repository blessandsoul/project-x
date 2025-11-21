import { useMemo } from 'react'
import type { Company } from '@/types/api'
import { mockCompanies } from '@/mocks/_mockData'

export interface CompanyStats {
  total: number
  vip: number
  avgRating: number
}

// @ts-ignore: Mock data compatibility
export const useCompanyStats = (companies: Company[] = mockCompanies): CompanyStats => {
  const stats = useMemo(() => {
    const total = companies.length

    if (total === 0) {
      return { total: 0, vip: 0, avgRating: 0 }
    }

    const vip = companies.filter((c) => c.vipStatus).length

    const ratedCompanies = companies.filter(
      (company) => typeof company.rating === 'number' && !Number.isNaN(company.rating),
    )

    const ratingsCount = ratedCompanies.length
    const avgRatingRaw =
      ratingsCount === 0
        ? 0
        : ratedCompanies.reduce((sum, company) => sum + (company.rating as number), 0) /
            ratingsCount

    const avgRating = Math.round(avgRatingRaw * 10) / 10

    return { total, vip, avgRating }
  }, [companies])

  return stats
}
