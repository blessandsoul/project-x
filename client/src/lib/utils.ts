import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Company, SearchFilters } from "@/mocks/_mockData"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function filterCompaniesBySearchFilters(
  companies: Company[],
  filters: SearchFilters,
): Company[] {
  const [minPrice, maxPrice] = filters.priceRange

  return companies.filter((company) => {
    if (filters.geography.length > 0 && !filters.geography.includes(company.location.state)) {
      return false
    }

    if (
      filters.services.length > 0 &&
      !company.services.some((service) => filters.services.includes(service))
    ) {
      return false
    }

    if (company.priceRange.min > maxPrice || company.priceRange.max < minPrice) {
      return false
    }

    if (company.rating < filters.rating) {
      return false
    }

    if (filters.vipOnly && !company.vipStatus) {
      return false
    }

    return true
  })
}
