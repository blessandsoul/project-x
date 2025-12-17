/**
 * Inquiry API Client
 * 
 * API functions for the user-company inquiry/messaging system.
 * All unsafe methods include CSRF token automatically via apiClient interceptor.
 */

import { apiAuthorizedGet, apiAuthorizedMutation, apiClient } from '@/lib/apiClient'

// =============================================================================
// Types
// =============================================================================

export type InquiryStatus = 'pending' | 'active' | 'accepted' | 'declined' | 'expired' | 'cancelled'

export interface Inquiry {
  id: number
  user_id: number
  company_id: number
  vehicle_id: number
  quote_id: number | null
  status: InquiryStatus
  subject: string | null
  quoted_total_price: number | null
  quoted_currency: string
  final_price: number | null
  final_currency: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
  user?: {
    id: number
    username: string
    email: string
  }
  company?: {
    id: number
    name: string
    logo_url?: string | null
  }
  vehicle?: {
    id: number
    make: string
    model: string
    year: number
    vin?: string | null
    primary_photo_url?: string | null
  }
  unread_count?: number
  last_message?: InquiryMessage | null
  last_message_text?: string | null
}

export interface InquiryMessage {
  id: number
  inquiry_id: number
  sender_id: number
  client_message_id?: string | null
  message_type: 'text' | 'offer' | 'system'
  message: string
  attachments: MessageAttachment[] | null
  created_at: string
  sender?: {
    id: number
    username: string
    role: string
  }
}

// Extended message type for optimistic UI
export type LocalMessageStatus = 'sending' | 'sent' | 'failed'

export interface OptimisticMessage extends InquiryMessage {
  _localId: string // temp_id for React key stability
  _localStatus: LocalMessageStatus
  _localCreatedAt: number // Date.now() for sorting
}

export interface MessageAttachment {
  url: string
  name: string
  type: string
  size: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  page: number
  totalPages: number
}

export interface ParticipantReadInfo {
  user_id?: number
  role: 'user' | 'company'
  last_read_message_id: number | null
}

// =============================================================================
// Helper: Get counterparty info for display
// =============================================================================

export interface CounterpartyInfo {
  title: string
  subtitle: string
  avatarText: string
}

/**
 * Get the "other participant" info for display in conversation list/header
 * - If current user is a regular user: show company info
 * - If current user is a company: show customer/user info
 */
export function getInquiryCounterparty(
  inquiry: Inquiry,
  currentUserRole: 'user' | 'company' | null
): CounterpartyInfo {
  const vehicleSubtitle = inquiry.vehicle
    ? `${inquiry.vehicle.year} ${inquiry.vehicle.make} ${inquiry.vehicle.model}`
    : `Vehicle #${inquiry.vehicle_id}`

  if (currentUserRole === 'company') {
    // Company viewing: show customer/user info
    const userName = inquiry.user?.username || inquiry.user?.email || `User #${inquiry.user_id}`
    return {
      title: userName,
      subtitle: vehicleSubtitle,
      avatarText: (inquiry.user?.username?.charAt(0) || inquiry.user?.email?.charAt(0) || 'U').toUpperCase(),
    }
  } else {
    // User viewing: show company info
    const companyName = inquiry.company?.name || `Company #${inquiry.company_id}`
    return {
      title: companyName,
      subtitle: vehicleSubtitle,
      avatarText: (inquiry.company?.name?.charAt(0) || 'C').toUpperCase(),
    }
  }
}

export interface MessagesResponse {
  messages: InquiryMessage[]
  hasMore: boolean
  participants?: {
    me: ParticipantReadInfo | null
    other: ParticipantReadInfo | null
  }
}

export interface InquiryStats {
  pending: number
  active: number
  accepted: number
  declined: number
  expired: number
  cancelled: number
  total_unread: number
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Create a new inquiry
 * Includes idempotency key to prevent duplicate submissions
 */
export async function createInquiry(data: {
  company_id: number
  vehicle_id: number
  quote_id?: number | null
  subject?: string | null
  message: string
  quoted_total_price?: number | null
  quoted_currency?: string
}): Promise<Inquiry> {
  // Server handles "find or create" logic:
  // - Returns existing open inquiry if one exists (pending/active)
  // - Creates new inquiry if no open inquiry exists (even if cancelled ones exist)
  const response = await apiClient.post<Inquiry>('/inquiries', data)
  return response.data
}

/**
 * List user's inquiries with pagination
 */
export async function listInquiries(params?: {
  limit?: number
  offset?: number
  status?: InquiryStatus | InquiryStatus[]
}): Promise<PaginatedResult<Inquiry>> {
  const searchParams = new URLSearchParams()
  
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  if (params?.status) {
    if (Array.isArray(params.status)) {
      params.status.forEach(s => searchParams.append('status', s))
    } else {
      searchParams.set('status', params.status)
    }
  }
  
  const query = searchParams.toString()
  return apiAuthorizedGet<PaginatedResult<Inquiry>>(`/inquiries${query ? `?${query}` : ''}`)
}

/**
 * Get a single inquiry by ID
 */
export async function getInquiry(id: number): Promise<Inquiry> {
  return apiAuthorizedGet<Inquiry>(`/inquiries/${id}`)
}

/**
 * Get messages for an inquiry with cursor-based pagination
 */
export async function getInquiryMessages(
  inquiryId: number,
  params?: { limit?: number; cursor?: number }
): Promise<MessagesResponse> {
  const searchParams = new URLSearchParams()
  
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.cursor) searchParams.set('cursor', String(params.cursor))
  
  const query = searchParams.toString()
  return apiAuthorizedGet<MessagesResponse>(
    `/inquiries/${inquiryId}/messages${query ? `?${query}` : ''}`
  )
}

/**
 * Send a message in an inquiry
 * Supports client_message_id for optimistic UI and idempotency
 */
export async function sendInquiryMessage(
  inquiryId: number,
  data: {
    message: string
    message_type?: 'text' | 'offer'
    client_message_id?: string
    attachments?: MessageAttachment[] | null
  }
): Promise<InquiryMessage> {
  return apiAuthorizedMutation<InquiryMessage>(
    'POST',
    `/inquiries/${inquiryId}/messages`,
    data
  )
}

/**
 * Mark all messages in an inquiry as read
 */
export async function markInquiryRead(inquiryId: number): Promise<{ success: boolean }> {
  return apiAuthorizedMutation<{ success: boolean }>(
    'POST',
    `/inquiries/${inquiryId}/mark-read`
  )
}

/**
 * Get unread message count for an inquiry
 */
export async function getUnreadCount(inquiryId: number): Promise<{ unread_count: number }> {
  return apiAuthorizedGet<{ unread_count: number }>(`/inquiries/${inquiryId}/unread-count`)
}

/**
 * Update inquiry status (user actions: accept, cancel)
 */
export async function patchInquiry(
  inquiryId: number,
  data: { status: 'accepted' | 'cancelled' }
): Promise<Inquiry> {
  return apiAuthorizedMutation<Inquiry>('PATCH', `/inquiries/${inquiryId}`, data)
}

/**
 * Check if user has an existing open inquiry for a company+vehicle
 */
export async function findExistingInquiry(
  companyId: number,
  vehicleId: number
): Promise<Inquiry | null> {
  try {
    const result = await listInquiries({ status: ['pending', 'active'], limit: 50 })
    console.log('[findExistingInquiry] List result:', result)
    return result.items.find(
      i => i.company_id === companyId && i.vehicle_id === vehicleId
    ) || null
  } catch (error) {
    console.error('[findExistingInquiry] Error listing inquiries:', error)
    return null
  }
}
