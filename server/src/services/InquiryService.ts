import { FastifyInstance } from 'fastify';
import { Pool, PoolConnection } from 'mysql2/promise';
import { InquiryModel } from '../models/InquiryModel.js';
import { InquiryMessageModel } from '../models/InquiryMessageModel.js';
import { InquiryParticipantModel } from '../models/InquiryParticipantModel.js';
import {
  Inquiry,
  InquiryCreate,
  InquiryStatus,
  InquiryWithDetails,
  InquiryMessage,
  InquiryMessageWithSender,
  InquiryListFilters,
  InquiryStats,
  SendMessageRequest,
  canTransitionTo,
  isTerminalStatus,
} from '../types/inquiry.js';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../types/errors.js';
import {
  emitInquiryNew,
  emitMessageNew,
  emitInquiryUpdated,
  emitReadUpdated,
} from '../realtime/events.js';

/**
 * Inquiry Service
 *
 * Business logic layer for the inquiry system.
 * Handles transactions, authorization, and status transitions.
 */
export class InquiryService {
  private fastify: FastifyInstance;
  private pool: Pool;
  private inquiryModel: InquiryModel;
  private messageModel: InquiryMessageModel;
  private participantModel: InquiryParticipantModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.pool = fastify.mysql;
    this.inquiryModel = new InquiryModel(fastify);
    this.messageModel = new InquiryMessageModel(fastify);
    this.participantModel = new InquiryParticipantModel(fastify);
  }

  // ===========================================================================
  // User Operations
  // ===========================================================================

  /**
   * Create a new inquiry (user -> company about a vehicle)
   * Creates inquiry + initial message + participants in a transaction
   * If an open inquiry already exists, returns it instead of creating a new one
   */
  async createInquiry(
    userId: number,
    data: InquiryCreate
  ): Promise<InquiryWithDetails> {
    // Check for existing open inquiry - return it if found
    const existingOpen = await this.inquiryModel.findOpenInquiry(
      userId,
      data.company_id,
      data.vehicle_id
    );

    if (existingOpen) {
      // Return existing open inquiry with full details
      const withDetails = await this.inquiryModel.findByIdWithDetails(existingOpen.id);
      if (withDetails) {
        return withDetails;
      }
    }

    // Use transaction for atomic creation
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create inquiry
      const [inquiryResult] = await connection.execute(
        `INSERT INTO inquiries 
          (user_id, company_id, vehicle_id, quote_id, subject, quoted_total_price, quoted_currency, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          userId,
          data.company_id,
          data.vehicle_id,
          data.quote_id ?? null,
          data.subject ?? null,
          data.quoted_total_price ?? null,
          data.quoted_currency ?? 'USD',
        ]
      );

      const inquiryId = (inquiryResult as any).insertId;

      // Create initial message
      const [messageResult] = await connection.execute(
        `INSERT INTO inquiry_messages (inquiry_id, sender_id, message_type, message)
         VALUES (?, ?, 'text', ?)`,
        [inquiryId, userId, data.message]
      );

      const messageId = (messageResult as any).insertId;

      // Get message timestamp for last_message_at
      const [messageRows] = await connection.execute(
        `SELECT created_at FROM inquiry_messages WHERE id = ?`,
        [messageId]
      );
      const messageCreatedAt = (messageRows as any[])[0]?.created_at;

      // Update last_message_at
      await connection.execute(
        `UPDATE inquiries SET last_message_at = ? WHERE id = ?`,
        [messageCreatedAt, inquiryId]
      );

      // Create participant for user
      await connection.execute(
        `INSERT INTO inquiry_participants (inquiry_id, user_id, role, last_read_message_id, last_read_at)
         VALUES (?, ?, 'user', ?, NOW(3))`,
        [inquiryId, userId, messageId]
      );

      // Find company owner user(s) and create participant(s)
      const [companyUsers] = await connection.execute(
        `SELECT id FROM users WHERE company_id = ? AND role = 'company' LIMIT 1`,
        [data.company_id]
      );

      for (const companyUser of companyUsers as any[]) {
        await connection.execute(
          `INSERT INTO inquiry_participants (inquiry_id, user_id, role)
           VALUES (?, ?, 'company')`,
          [inquiryId, companyUser.id]
        );
      }

      await connection.commit();

      // Return full inquiry with details
      const inquiry = await this.inquiryModel.findByIdWithDetails(inquiryId);
      if (!inquiry) {
        throw new Error('Failed to retrieve created inquiry');
      }

      // Emit real-time event after successful commit
      emitInquiryNew(inquiryId, userId, data.company_id);

      return inquiry;
    } catch (error: any) {
      await connection.rollback();

      // Handle unique constraint violation (duplicate open inquiry)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictError(
          'You already have an open inquiry with this company for this vehicle'
        );
      }

      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get user's inquiries with pagination
   */
  async getUserInquiries(
    userId: number,
    limit: number,
    offset: number,
    filters?: InquiryListFilters
  ): Promise<{ items: InquiryWithDetails[]; total: number }> {
    const [items, total] = await Promise.all([
      this.inquiryModel.findByUserId(userId, limit, offset, filters),
      this.inquiryModel.countByUserId(userId, filters),
    ]);

    // Attach unread counts
    for (const inquiry of items) {
      const lastReadId = await this.participantModel.getLastReadMessageId(
        inquiry.id,
        userId
      );
      inquiry.unread_count = await this.messageModel.countUnread(
        inquiry.id,
        userId,
        lastReadId
      );
    }

    return { items, total };
  }

  /**
   * Get inquiry by ID for user (with authorization check)
   */
  async getUserInquiry(
    inquiryId: number,
    userId: number
  ): Promise<InquiryWithDetails> {
    const inquiry = await this.inquiryModel.findByIdWithDetails(inquiryId);

    if (!inquiry) {
      throw new NotFoundError('Inquiry');
    }

    if (inquiry.user_id !== userId) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    // Attach unread count
    const lastReadId = await this.participantModel.getLastReadMessageId(
      inquiryId,
      userId
    );
    inquiry.unread_count = await this.messageModel.countUnread(
      inquiryId,
      userId,
      lastReadId
    );

    // Attach last message
    inquiry.last_message = await this.messageModel.getLastMessage(inquiryId);

    return inquiry;
  }

  /**
   * Update inquiry status (user actions: accept, cancel)
   */
  async updateInquiryByUser(
    inquiryId: number,
    userId: number,
    status: 'accepted' | 'cancelled'
  ): Promise<InquiryWithDetails> {
    const inquiry = await this.inquiryModel.findById(inquiryId);

    if (!inquiry) {
      throw new NotFoundError('Inquiry');
    }

    if (inquiry.user_id !== userId) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    if (isTerminalStatus(inquiry.status)) {
      throw new ValidationError(
        `Cannot update inquiry in terminal status: ${inquiry.status}`
      );
    }

    if (!canTransitionTo(inquiry.status, status)) {
      throw new ValidationError(
        `Cannot transition from ${inquiry.status} to ${status}`
      );
    }

    await this.inquiryModel.updateStatus(inquiryId, status);

    const updated = await this.inquiryModel.findByIdWithDetails(inquiryId);
    if (!updated) {
      throw new Error('Failed to retrieve updated inquiry');
    }

    // Emit real-time event after successful update
    emitInquiryUpdated(inquiryId, inquiry.user_id, inquiry.company_id);

    return updated;
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
    limit: number,
    offset: number,
    filters?: InquiryListFilters
  ): Promise<{ items: InquiryWithDetails[]; total: number }> {
    const [items, total] = await Promise.all([
      this.inquiryModel.findByCompanyId(companyId, limit, offset, filters),
      this.inquiryModel.countByCompanyId(companyId, filters),
    ]);

    // Attach unread counts
    for (const inquiry of items) {
      const lastReadId = await this.participantModel.getLastReadMessageId(
        inquiry.id,
        companyUserId
      );
      inquiry.unread_count = await this.messageModel.countUnread(
        inquiry.id,
        companyUserId,
        lastReadId
      );
    }

    return { items, total };
  }

  /**
   * Get inquiry by ID for company (with authorization check)
   */
  async getCompanyInquiry(
    inquiryId: number,
    companyId: number,
    companyUserId: number
  ): Promise<InquiryWithDetails> {
    const inquiry = await this.inquiryModel.findByIdWithDetails(inquiryId);

    if (!inquiry) {
      throw new NotFoundError('Inquiry');
    }

    if (inquiry.company_id !== companyId) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    // Ensure company user is a participant
    await this.participantModel.createIfNotExists({
      inquiry_id: inquiryId,
      user_id: companyUserId,
      role: 'company',
    });

    // Attach unread count
    const lastReadId = await this.participantModel.getLastReadMessageId(
      inquiryId,
      companyUserId
    );
    inquiry.unread_count = await this.messageModel.countUnread(
      inquiryId,
      companyUserId,
      lastReadId
    );

    // Attach last message
    inquiry.last_message = await this.messageModel.getLastMessage(inquiryId);

    return inquiry;
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
    const inquiry = await this.inquiryModel.findById(inquiryId);

    if (!inquiry) {
      throw new NotFoundError('Inquiry');
    }

    if (inquiry.company_id !== companyId) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    if (isTerminalStatus(inquiry.status)) {
      throw new ValidationError(
        `Cannot update inquiry in terminal status: ${inquiry.status}`
      );
    }

    // Update status if provided
    if (updates.status) {
      if (!canTransitionTo(inquiry.status, updates.status)) {
        throw new ValidationError(
          `Cannot transition from ${inquiry.status} to ${updates.status}`
        );
      }
      await this.inquiryModel.updateStatus(inquiryId, updates.status);
    }

    // Update final price if provided
    if (updates.final_price !== undefined) {
      await this.inquiryModel.updateFinalPrice(
        inquiryId,
        updates.final_price,
        updates.final_currency ?? 'USD'
      );
    }

    const updated = await this.inquiryModel.findByIdWithDetails(inquiryId);
    if (!updated) {
      throw new Error('Failed to retrieve updated inquiry');
    }

    // Emit real-time event after successful update
    emitInquiryUpdated(inquiryId, inquiry.user_id, inquiry.company_id);

    return updated;
  }

  /**
   * Get inquiry stats for a company
   */
  async getCompanyStats(companyId: number, companyUserId: number): Promise<InquiryStats> {
    return this.inquiryModel.getStatsByCompanyId(companyId, companyUserId);
  }

  // ===========================================================================
  // Message Operations
  // ===========================================================================

  /**
   * Send a message in an inquiry
   * Auto-transitions pending -> active when company replies
   * Supports idempotent sends via client_message_id
   */
  async sendMessage(
    inquiryId: number,
    senderId: number,
    senderRole: 'user' | 'company',
    data: SendMessageRequest
  ): Promise<InquiryMessageWithSender> {
    const inquiry = await this.inquiryModel.findById(inquiryId);

    if (!inquiry) {
      throw new NotFoundError('Inquiry');
    }

    // Authorization check
    if (senderRole === 'user' && inquiry.user_id !== senderId) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    // For company, we check via participant model (already validated in route)

    if (isTerminalStatus(inquiry.status)) {
      throw new ValidationError(
        `Cannot send messages to inquiry in terminal status: ${inquiry.status}`
      );
    }

    // Idempotency check: if client_message_id provided, check for existing message
    if (data.client_message_id) {
      const existingMessage = await this.messageModel.findByClientMessageId(
        inquiryId,
        data.client_message_id
      );
      if (existingMessage) {
        // Return existing message (idempotent retry)
        const [senderRows] = await this.pool.execute(
          `SELECT username, role FROM users WHERE id = ?`,
          [existingMessage.sender_id]
        );
        const senderInfo = (senderRows as any[])[0];
        return {
          ...existingMessage,
          sender: senderInfo
            ? {
                id: existingMessage.sender_id,
                username: senderInfo.username,
                role: senderInfo.role,
              }
            : undefined,
        };
      }
    }

    // Use transaction
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create message
      const [messageResult] = await connection.execute(
        `INSERT INTO inquiry_messages (inquiry_id, sender_id, client_message_id, message_type, message, attachments)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          inquiryId,
          senderId,
          data.client_message_id ?? null,
          data.message_type ?? 'text',
          data.message,
          data.attachments ? JSON.stringify(data.attachments) : null,
        ]
      );

      const messageId = (messageResult as any).insertId;

      // Get message timestamp
      const [messageRows] = await connection.execute(
        `SELECT created_at FROM inquiry_messages WHERE id = ?`,
        [messageId]
      );
      const messageCreatedAt = (messageRows as any[])[0]?.created_at;

      // Update inquiry last_message_at
      await connection.execute(
        `UPDATE inquiries SET last_message_at = ? WHERE id = ?`,
        [messageCreatedAt, inquiryId]
      );

      // Auto-transition pending -> active when company replies
      if (senderRole === 'company' && inquiry.status === 'pending') {
        await connection.execute(
          `UPDATE inquiries SET status = 'active' WHERE id = ?`,
          [inquiryId]
        );
      }

      // Mark as read for sender
      await connection.execute(
        `UPDATE inquiry_participants
         SET last_read_message_id = ?, last_read_at = NOW(3)
         WHERE inquiry_id = ? AND user_id = ?`,
        [messageId, inquiryId, senderId]
      );

      await connection.commit();

      // Return message with sender info
      const message = await this.messageModel.findById(messageId);
      if (!message) {
        throw new Error('Failed to retrieve created message');
      }

      // Get sender info
      const [senderRows] = await this.pool.execute(
        `SELECT username, role FROM users WHERE id = ?`,
        [senderId]
      );
      const senderInfo = (senderRows as any[])[0];

      // Emit real-time event after successful commit
      emitMessageNew(inquiryId, messageId, inquiry.user_id, inquiry.company_id);

      return {
        ...message,
        sender: senderInfo
          ? {
              id: senderId,
              username: senderInfo.username,
              role: senderInfo.role,
            }
          : undefined,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get messages for an inquiry with cursor-based pagination
   */
  async getMessages(
    inquiryId: number,
    userId: number,
    limit: number,
    cursor?: number | null
  ): Promise<{ messages: InquiryMessageWithSender[]; hasMore: boolean }> {
    // Authorization is handled at route level

    const messages = await this.messageModel.findByInquiryId(
      inquiryId,
      limit + 1, // Fetch one extra to check if there are more
      cursor
    );

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }

    return { messages, hasMore };
  }

  /**
   * Get unread count for a participant
   */
  async getUnreadCount(inquiryId: number, userId: number): Promise<number> {
    const lastReadId = await this.participantModel.getLastReadMessageId(
      inquiryId,
      userId
    );
    return this.messageModel.countUnread(inquiryId, userId, lastReadId);
  }

  /**
   * Get read watermarks for "seen" status
   */
  async getReadWatermarks(inquiryId: number, userId: number) {
    return this.participantModel.getReadWatermarks(inquiryId, userId);
  }

  /**
   * Mark all messages as read for a participant
   */
  async markAsRead(inquiryId: number, userId: number, role: 'user' | 'company'): Promise<void> {
    const latestMessageId = await this.messageModel.getLatestMessageId(inquiryId);

    if (latestMessageId !== null) {
      await this.participantModel.markAsRead(inquiryId, userId, latestMessageId);

      // Emit real-time event for read receipts
      emitReadUpdated(inquiryId, userId, role, latestMessageId);
    }
  }

  // ===========================================================================
  // Authorization Helpers
  // ===========================================================================

  /**
   * Check if user can access an inquiry (as user or company)
   */
  async canAccessInquiry(
    inquiryId: number,
    userId: number,
    companyId?: number | null
  ): Promise<{ canAccess: boolean; role: 'user' | 'company' | null }> {
    const inquiry = await this.inquiryModel.findById(inquiryId);

    if (!inquiry) {
      return { canAccess: false, role: null };
    }

    if (inquiry.user_id === userId) {
      return { canAccess: true, role: 'user' };
    }

    if (companyId && inquiry.company_id === companyId) {
      return { canAccess: true, role: 'company' };
    }

    return { canAccess: false, role: null };
  }
}
