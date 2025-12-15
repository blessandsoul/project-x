/**
 * Company Social Links Service
 *
 * Handles creating social links for companies via POST /companies/:companyId/social-links
 * Used for storing additional websites during onboarding (Option A strategy)
 */

import { apiClient } from '@/lib/apiClient'

export interface SocialLink {
  id: number | string
  company_id?: number
  url: string
  label?: string | null
}

export interface CreateSocialLinkError {
  type: 'validation' | 'unauthorized' | 'forbidden' | 'not_found' | 'network' | 'unknown'
  message: string
  url?: string // The URL that failed
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Normalize URL (trim whitespace, ensure protocol)
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  
  // If no protocol, add https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  
  return trimmed
}

/**
 * Create a social link for a company
 *
 * @param companyId - The company ID
 * @param url - The URL to add as social link
 * @returns Created social link
 * @throws CreateSocialLinkError on failure
 */
export async function createCompanySocialLink(
  companyId: number | string,
  url: string
): Promise<SocialLink> {
  const normalizedUrl = normalizeUrl(url)

  if (!isValidUrl(normalizedUrl)) {
    throw {
      type: 'validation',
      message: 'Invalid URL format',
      url: normalizedUrl,
    } as CreateSocialLinkError
  }

  try {
    const response = await apiClient.post<SocialLink>(
      `/companies/${companyId}/social-links`,
      { url: normalizedUrl }
    )

    return response.data
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
        case 422:
          throw {
            type: 'validation',
            message: data?.message || 'Invalid URL',
            url: normalizedUrl,
          } as CreateSocialLinkError
        case 401:
          throw {
            type: 'unauthorized',
            message: 'Please log in to add links.',
            url: normalizedUrl,
          } as CreateSocialLinkError
        case 403:
          throw {
            type: 'forbidden',
            message: data?.message || 'You do not have permission to add links to this company.',
            url: normalizedUrl,
          } as CreateSocialLinkError
        case 404:
          throw {
            type: 'not_found',
            message: 'Company not found.',
            url: normalizedUrl,
          } as CreateSocialLinkError
        default:
          throw {
            type: 'unknown',
            message: data?.message || 'Failed to add link.',
            url: normalizedUrl,
          } as CreateSocialLinkError
      }
    }

    if (!error.response) {
      throw {
        type: 'network',
        message: 'Network error while adding link.',
        url: normalizedUrl,
      } as CreateSocialLinkError
    }

    throw {
      type: 'unknown',
      message: 'An unexpected error occurred.',
      url: normalizedUrl,
    } as CreateSocialLinkError
  }
}

/**
 * Create multiple social links for a company (sequential)
 * Returns results for each URL (success or failure)
 *
 * @param companyId - The company ID
 * @param urls - Array of URLs to add
 * @returns Array of results for each URL
 */
export async function createMultipleSocialLinks(
  companyId: number | string,
  urls: string[]
): Promise<Array<{ url: string; success: boolean; error?: string; link?: SocialLink }>> {
  const results: Array<{ url: string; success: boolean; error?: string; link?: SocialLink }> = []

  for (const url of urls) {
    try {
      const link = await createCompanySocialLink(companyId, url)
      results.push({ url, success: true, link })
    } catch (error) {
      const err = error as CreateSocialLinkError
      results.push({ url, success: false, error: err.message })
    }
  }

  return results
}
