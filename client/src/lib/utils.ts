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

export function formatRating(rating: number | undefined | null): string {
  if (rating === undefined || rating === null || isNaN(rating)) return '0.0'
  return Number(rating).toFixed(1)
}

export function getRatingLabel(rating: number): string {
  if (rating >= 9.5) return 'rating_perfect';
  if (rating >= 9) return 'rating_exceptional';
  if (rating >= 8) return 'rating_excellent';
  if (rating >= 7) return 'rating_very_good';
  if (rating >= 6) return 'rating_good';
  if (rating >= 5) return 'rating_average';
  return 'rating_poor';
}
