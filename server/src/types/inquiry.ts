/**
 * Inquiry System Types
 *
 * Type definitions for the user-company inquiry/messaging system.
 * Supports the flow: User sees quote → Creates inquiry → Company responds → Negotiation → Accept/Decline
 */

// =============================================================================
// Enums
// =============================================================================

export type InquiryStatus = 'pending' | 'active' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export type InquiryMessageType = 'text' | 'offer' | 'system';

export type InquiryParticipantRole = 'user' | 'company';

// =============================================================================
// Inquiry Types
// =============================================================================

export interface Inquiry {
  id: number;
  user_id: number;
  company_id: number;
  vehicle_id: number;
  quote_id: number | null;
  status: InquiryStatus;
  subject: string | null;
  quoted_total_price: number | null;
  quoted_currency: string;
  final_price: number | null;
  final_currency: string | null;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
  expires_at: Date | null;
}

export interface InquiryCreate {
  user_id: number;
  company_id: number;
  vehicle_id: number;
  quote_id?: number | null | undefined;
  subject?: string | null | undefined;
  message: string;
  quoted_total_price?: number | null | undefined;
  quoted_currency?: string | undefined;
}

export interface InquiryUpdateUser {
  status?: 'accepted' | 'cancelled';
}

export interface InquiryUpdateCompany {
  status?: 'active' | 'declined';
  final_price?: number | null;
  final_currency?: string | null;
}

export interface InquiryWithDetails extends Inquiry {
  user?: {
    id: number;
    username: string;
    email: string;
  } | undefined;
  company?: {
    id: number;
    name: string;
    logo_url?: string | null;
  } | undefined;
  vehicle?: {
    id: number;
    make: string;
    model: string;
    year: number;
    vin?: string | null;
    primary_photo_url?: string | null;
  } | undefined;
  unread_count?: number | undefined;
  last_message?: InquiryMessage | null | undefined;
  last_message_text?: string | null;
}

// =============================================================================
// Inquiry Message Types
// =============================================================================

export interface InquiryMessage {
  id: number;
  inquiry_id: number;
  sender_id: number;
  client_message_id: string | null;
  message_type: InquiryMessageType;
  message: string;
  attachments: MessageAttachment[] | null;
  created_at: Date;
}

export interface InquiryMessageCreate {
  inquiry_id: number;
  sender_id: number;
  client_message_id?: string | null;
  message_type?: InquiryMessageType;
  message: string;
  attachments?: MessageAttachment[] | null;
}

export interface InquiryMessageWithSender extends InquiryMessage {
  sender?: {
    id: number;
    username: string;
    role: string;
  } | undefined;
}

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

// =============================================================================
// Inquiry Participant Types
// =============================================================================

export interface InquiryParticipant {
  id: number;
  inquiry_id: number;
  user_id: number;
  role: InquiryParticipantRole;
  last_read_message_id: number | null;
  last_read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface InquiryParticipantCreate {
  inquiry_id: number;
  user_id: number;
  role: InquiryParticipantRole;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface CreateInquiryRequest {
  company_id: number;
  vehicle_id: number;
  quote_id?: number | null;
  subject?: string | null;
  message: string;
  quoted_total_price?: number | null;
  quoted_currency?: string;
}

export interface SendMessageRequest {
  message: string;
  message_type?: InquiryMessageType;
  client_message_id?: string | null;
  attachments?: MessageAttachment[] | null;
}

export interface UpdateInquiryUserRequest {
  status: 'accepted' | 'cancelled';
}

export interface UpdateInquiryCompanyRequest {
  status?: 'active' | 'declined';
  final_price?: number | null;
  final_currency?: string | null;
}

export interface InquiryListFilters {
  status?: InquiryStatus | InquiryStatus[];
  company_id?: number;
  vehicle_id?: number;
}

export interface InquiryStats {
  pending: number;
  active: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
  total_unread: number;
}

// =============================================================================
// Status Transition Rules
// =============================================================================

export const ALLOWED_STATUS_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  pending: ['active', 'cancelled', 'expired'],
  active: ['accepted', 'declined', 'cancelled', 'expired'],
  accepted: [], // Terminal state
  declined: [], // Terminal state
  expired: [], // Terminal state
  cancelled: [], // Terminal state
};

export const TERMINAL_STATUSES: InquiryStatus[] = ['accepted', 'declined', 'expired', 'cancelled'];

export function isTerminalStatus(status: InquiryStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransitionTo(currentStatus: InquiryStatus, newStatus: InquiryStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
