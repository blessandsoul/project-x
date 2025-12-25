/**
 * Company Social Links Service
 *
 * Handles structured social links for companies:
 * - 1 Website link (any URL)
 * - Max 2 Social links (facebook/instagram only)
 */

import { apiClient } from '@/lib/apiClient'

// ============================================================================
// Types
// ============================================================================

export type SocialLinkType = 'website' | 'social'
export type SocialPlatform = 'facebook' | 'instagram'

export const SUPPORTED_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram']

export interface SocialLink {
  id: number
  company_id: number
  link_type: SocialLinkType
  platform: SocialPlatform | null
  url: string
  created_at?: string
  updated_at?: string
}

export interface StructuredSocialLinks {
  website: { id: number; url: string } | null
  social_links: Array<{
    id: number
    platform: SocialPlatform
    url: string
  }>
}

export interface CreateSocialLinkRequest {
  link_type: SocialLinkType
  platform?: SocialPlatform
  url: string
}

export interface CreateSocialLinkError {
  type: 'validation' | 'conflict' | 'unauthorized' | 'forbidden' | 'not_found' | 'network' | 'unknown'
  message: string
  url?: string
}

// ============================================================================
// URL Utilities
// ============================================================================

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
 * Auto-detect platform from URL
 */
export function detectPlatformFromUrl(url: string): SocialPlatform | null {
  const lowerUrl = url.toLowerCase()

  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
    return 'facebook'
  }
  if (lowerUrl.includes('instagram.com')) {
    return 'instagram'
  }

  return null
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get structured social links for a company
 * Returns: { website: {...} | null, social_links: [...] }
 */
export async function getCompanySocialLinks(
  companyId: number | string
): Promise<StructuredSocialLinks> {
  const response = await apiClient.get<StructuredSocialLinks>(
    `/companies/${companyId}/social-links`
  )
  return response.data
}

/**
 * Create a social link for a company
 *
 * @param companyId - The company ID
 * @param linkType - 'website' or 'social'
 * @param url - The URL to add
 * @param platform - Required if linkType='social' (facebook/instagram)
 */
export async function createCompanySocialLink(
  companyId: number | string,
  linkType: SocialLinkType,
  url: string,
  platform?: SocialPlatform
): Promise<SocialLink> {
  const normalizedUrl = normalizeUrl(url)

  if (!isValidUrl(normalizedUrl)) {
    throw {
      type: 'validation',
      message: 'Invalid URL format',
      url: normalizedUrl,
    } as CreateSocialLinkError
  }

  // Validate platform for social links
  if (linkType === 'social' && !platform) {
    throw {
      type: 'validation',
      message: 'Platform is required for social links',
      url: normalizedUrl,
    } as CreateSocialLinkError
  }

  const payload: CreateSocialLinkRequest = {
    link_type: linkType,
    url: normalizedUrl,
  }

  if (linkType === 'social' && platform) {
    payload.platform = platform
  }

  try {
    const response = await apiClient.post<SocialLink>(
      `/companies/${companyId}/social-links`,
      payload
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
            message: data?.message || 'Invalid input',
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
        case 409:
          throw {
            type: 'conflict',
            message: data?.message || 'Link limit reached or duplicate.',
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
 * Create website link for a company
 */
export async function createWebsiteLink(
  companyId: number | string,
  url: string
): Promise<SocialLink> {
  return createCompanySocialLink(companyId, 'website', url)
}

/**
 * Create social link for a company (Facebook or Instagram)
 */
export async function createSocialMediaLink(
  companyId: number | string,
  platform: SocialPlatform,
  url: string
): Promise<SocialLink> {
  return createCompanySocialLink(companyId, 'social', url, platform)
}

/**
 * Delete a social link
 */
export async function deleteSocialLink(linkId: number | string): Promise<void> {
  await apiClient.delete(`/social-links/${linkId}`)
}

/**
 * Update a social link
 */
export async function updateSocialLink(
  linkId: number | string,
  updates: { url?: string; platform?: SocialPlatform }
): Promise<SocialLink> {
  const response = await apiClient.put<SocialLink>(
    `/social-links/${linkId}`,
    updates
  )
  return response.data
}

/**
 * Batch create social links during onboarding
 * Creates website + social links in sequence
 * 
 * @param companyId - Company ID
 * @param website - Website URL (optional)
 * @param socialLinks - Array of { platform, url } for social links
 */
export async function createOnboardingSocialLinks(
  companyId: number | string,
  website: string | null,
  socialLinks: Array<{ platform: SocialPlatform; url: string }>
): Promise<{
  website: SocialLink | null
  social_links: SocialLink[]
  errors: Array<{ type: string; message: string; url: string }>
}> {
  const result = {
    website: null as SocialLink | null,
    social_links: [] as SocialLink[],
    errors: [] as Array<{ type: string; message: string; url: string }>,
  }

  // Create website link first
  if (website && website.trim()) {
    try {
      result.website = await createWebsiteLink(companyId, website)
    } catch (error) {
      const err = error as CreateSocialLinkError
      result.errors.push({
        type: err.type,
        message: err.message,
        url: website,
      })
    }
  }

  // Create social links (max 2)
  for (const social of socialLinks.slice(0, 2)) {
    if (social.url && social.url.trim()) {
      try {
        const link = await createSocialMediaLink(companyId, social.platform, social.url)
        result.social_links.push(link)
      } catch (error) {
        const err = error as CreateSocialLinkError
        result.errors.push({
          type: err.type,
          message: err.message,
          url: social.url,
        })
      }
    }
  }

  return result
}
