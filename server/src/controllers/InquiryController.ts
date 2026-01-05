import { FastifyInstance } from 'fastify';
import { InquiryService } from '../services/InquiryService.js';
import {
  InquiryWithDetails,
  InquiryMessageWithSender,
  InquiryListFilters,
  InquiryStats,
  CreateInquiryRequest,
  SendMessageRequest,
} from '../types/inquiry.js';
import { parsePagination, buildPaginatedResult, PaginatedResult } from '../utils/pagination.js';

/**
 * Inquiry Controller
 *
 * Handles HTTP request/response logic for inquiry endpoints.
 * Delegates business logic to InquiryService.
 */
export class InquiryController {
  private service: InquiryService;

  constructor(fastify: FastifyInstance) {
    this.service = new InquiryService(fastify);
  }

  // ===========================================================================
  // User Operations
  // ===========================================================================

  /**
   * Create a new inquiry
   */
  async createInquiry(
    userId: number,
    data: CreateInquiryRequest
  ): Promise<InquiryWithDetails> {
    return this.service.createInquiry(userId, {
      user_id: userId,
      company_id: data.company_id,
      vehicle_id: data.vehicle_id,
      quote_id: data.quote_id,
      subject: data.subject,
      message: data.message,
      quoted_total_price: data.quoted_total_price,
      quoted_currency: data.quoted_currency,
    });
  }

  /**
   * Get user's inquiries with pagination
   */
  async getUserInquiries(
    userId: number,
    queryParams: { limit?: unknown; offset?: unknown; status?: string | string[] }
  ): Promise<PaginatedResult<InquiryWithDetails>> {
    const { limit, offset } = parsePagination(queryParams, { limit: 20, maxLimit: 50 });

    const filters: InquiryListFilters = {};
    if (queryParams.status) {
      filters.status = Array.isArray(queryParams.status)
        ? (queryParams.status as any)
        : (queryParams.status as any);
    }

    const { items, total } = await this.service.getUserInquiries(
      userId,
      limit,
      offset,
      filters
    );

    return buildPaginatedResult(items, total, limit, offset);
  }

  /**
   * Get single inquiry for user
   */
  async getUserInquiry(
    inquiryId: number,
    userId: number
  ): Promise<InquiryWithDetails> {
    return this.service.getUserInquiry(inquiryId, userId);
  }

  /**
   * Update inquiry by user (accept/cancel)
   */
  async updateInquiryByUser(
    inquiryId: number,
    userId: number,
    status: 'accepted' | 'cancelled'
  ): Promise<InquiryWithDetails> {
    return this.service.updateInquiryByUser(inquiryId, userId, status);
  }

  // ===========================================================================
  // Company Operations
  // ===========================================================================

  /**
   * Get company's inquiries with pagination
   */
  async getCompanyInquiries(
    companyId: number,
    companyUserId: number,
    queryParams: { limit?: unknown; offset?: unknown; status?: string | string[] }
  ): Promise<PaginatedResult<InquiryWithDetails>> {
    const { limit, offset } = parsePagination(queryParams, { limit: 20, maxLimit: 50 });

    const filters: InquiryListFilters = {};
    if (queryParams.status) {
      filters.status = Array.isArray(queryParams.status)
        ? (queryParams.status as any)
        : (queryParams.status as any);
    }

    const { items, total } = await this.service.getCompanyInquiries(
      companyId,
      companyUserId,
      limit,
      offset,
      filters
    );

    return buildPaginatedResult(items, total, limit, offset);
  }

  /**
   * Get single inquiry for company
   */
  async getCompanyInquiry(
    inquiryId: number,
    companyId: number,
    companyUserId: number
  ): Promise<InquiryWithDetails> {
    return this.service.getCompanyInquiry(inquiryId, companyId, companyUserId);
  }

  /**
   * Update inquiry by company (status, final price)
   */
  async updateInquiryByCompany(
    inquiryId: number,
    companyId: number,
    updates: {
      status?: 'active' | 'declined';
      final_price?: number | null;
      final_currency?: string | null;
    }
  ): Promise<InquiryWithDetails> {
    return this.service.updateInquiryByCompany(inquiryId, companyId, updates);
  }

  /**
   * Get company inquiry stats
   */
  async getCompanyStats(
    companyId: number,
    companyUserId: number
  ): Promise<InquiryStats> {
    return this.service.getCompanyStats(companyId, companyUserId);
  }

  // ===========================================================================
  // Message Operations
  // ===========================================================================

  /**
   * Send a message in an inquiry
   */
  async sendMessage(
    inquiryId: number,
    senderId: number,
    senderRole: 'user' | 'company',
    data: SendMessageRequest
  ): Promise<InquiryMessageWithSender> {
    return this.service.sendMessage(inquiryId, senderId, senderRole, data);
  }

  /**
   * Get messages for an inquiry with cursor-based pagination
   */
  async getMessages(
    inquiryId: number,
    userId: number,
    queryParams: { limit?: unknown; cursor?: unknown }
  ): Promise<{ messages: InquiryMessageWithSender[]; hasMore: boolean }> {
    let limit = Number(queryParams.limit ?? 50);
    if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
      limit = 50;
    }

    let cursor: number | null = null;
    if (queryParams.cursor !== undefined && queryParams.cursor !== null) {
      const parsed = Number(queryParams.cursor);
      if (Number.isFinite(parsed) && parsed > 0) {
        cursor = parsed;
      }
    }

    return this.service.getMessages(inquiryId, userId, limit, cursor);
  }

  /**
   * Get unread count for an inquiry
   */
  async getUnreadCount(inquiryId: number, userId: number): Promise<{ unread_count: number }> {
    const count = await this.service.getUnreadCount(inquiryId, userId);
    return { unread_count: count };
  }

  /**
   * Get read watermarks for "seen" status
   */
  async getReadWatermarks(inquiryId: number, userId: number) {
    return this.service.getReadWatermarks(inquiryId, userId);
  }

  /**
   * Mark all messages as read
   */
  async markAsRead(inquiryId: number, userId: number, role: 'user' | 'company'): Promise<{ success: boolean }> {
    await this.service.markAsRead(inquiryId, userId, role);
    return { success: true };
  }

  // ===========================================================================
  // Authorization Helpers
  // ===========================================================================

  /**
   * Check if user can access an inquiry
   */
  async canAccessInquiry(
    inquiryId: number,
    userId: number,
    companyId?: number | null
  ): Promise<{ canAccess: boolean; role: 'user' | 'company' | null }> {
    return this.service.canAccessInquiry(inquiryId, userId, companyId);
  }
}
