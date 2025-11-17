import { useMemo } from 'react'
import type { Company } from '@/mocks/_mockData'
import { mockCompanies } from '@/mocks/_mockData'

export interface CompanyStats {
  total: number
  vip: number
  avgRating: number
}

export const useCompanyStats = (companies: Company[] = mockCompanies): CompanyStats => {
  const stats = useMemo(() => {
    const total = companies.length

    if (total === 0) {
      return { total: 0, vip: 0, avgRating: 0 }
    }

    const vip = companies.filter((c) => c.vipStatus).length
    const avgRatingRaw = companies.reduce((sum, c) => sum + c.rating, 0) / total
    const avgRating = Math.round(avgRatingRaw * 10) / 10

    return { total, vip, avgRating }
  }, [companies])

  return stats
}
