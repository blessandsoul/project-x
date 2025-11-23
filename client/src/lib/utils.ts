import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Company, SearchFilters } from "@/types/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function filterCompaniesBySearchFilters(
  companies: Company[],
  filters: SearchFilters,
): Company[] {
  const [minPrice, maxPrice] = filters.priceRange

  return companies.filter((company) => {
    const locationState = company.location?.state

    if (filters.geography.length > 0 && (!locationState || !filters.geography.includes(locationState))) {
      return false
    }

    if (
      filters.services.length > 0 &&
      (!company.services ||
        !company.services.some((service) => filters.services.includes(service)))
    ) {
      return false
    }

    const priceRange = company.priceRange

    if (!priceRange || priceRange.min > maxPrice || priceRange.max < minPrice) {
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
