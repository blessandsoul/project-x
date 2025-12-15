/**
 * Company Logo Upload Service
 *
 * Handles logo upload for companies via POST /companies/:id/logo
 * Uses apiClient for automatic CSRF header attachment
 */

import { apiClient } from '@/lib/apiClient'

export interface LogoUploadResponse {
  logoUrl: string
  originalLogoUrl: string
}

export interface LogoUploadError {
  type: 'validation' | 'unauthorized' | 'forbidden' | 'not_found' | 'network' | 'unknown'
  message: string
}

// Logo constraints
export const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
export const LOGO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const LOGO_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * Validate logo file before upload
 */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: JPEG, PNG, WEBP`,
    }
  }

  // Check file size
  if (file.size > LOGO_MAX_SIZE_BYTES) {
    const maxSizeMB = LOGO_MAX_SIZE_BYTES / (1024 * 1024)
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB} MB`,
    }
  }

  return { valid: true }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Upload company logo
 *
 * @param companyId - The company ID
 * @param file - The logo file to upload
 * @returns Logo URLs on success
 * @throws LogoUploadError on failure
 */
export async function uploadCompanyLogo(
  companyId: number | string,
  file: File
): Promise<LogoUploadResponse> {
  // Validate file first
  const validation = validateLogoFile(file)
  if (!validation.valid) {
    throw {
      type: 'validation',
      message: validation.error,
    } as LogoUploadError
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    // Use apiClient which handles CSRF automatically via interceptor
    const response = await apiClient.post<LogoUploadResponse>(
      `/companies/${companyId}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response.data
  } catch (error: any) {
    // Parse error response
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
        case 422:
          throw {
            type: 'validation',
            message: data?.message || 'Invalid file. Please check file type and size.',
          } as LogoUploadError
        case 401:
          throw {
            type: 'unauthorized',
            message: 'Please log in to upload logo.',
          } as LogoUploadError
        case 403:
          throw {
            type: 'forbidden',
            message: data?.message || 'You do not have permission to upload logo for this company.',
          } as LogoUploadError
        case 404:
          throw {
            type: 'not_found',
            message: 'Company not found.',
          } as LogoUploadError
        default:
          throw {
            type: 'unknown',
            message: data?.message || 'Failed to upload logo. Please try again.',
          } as LogoUploadError
      }
    }

    // Network error
    if (!error.response) {
      throw {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
      } as LogoUploadError
    }

    throw {
      type: 'unknown',
      message: 'An unexpected error occurred while uploading logo.',
    } as LogoUploadError
  }
}
