import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import {
  InquiryMessage,
  InquiryMessageCreate,
  InquiryMessageWithSender,
  MessageAttachment,
} from '../types/inquiry.js';

/**
 * Inquiry Message Model
 *
 * Handles database operations for the inquiry_messages table.
 * Manages conversation messages within inquiries.
 */
export class InquiryMessageModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  /**
   * Find message by ID
   */
  async findById(id: number): Promise<InquiryMessage | null> {
    const rows = await this.executeQuery(
      `SELECT id, inquiry_id, sender_id, client_message_id, message_type, message, attachments, created_at
       FROM inquiry_messages WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    return this.mapRowToMessage(rows[0]);
  }

  /**
   * Find message by client_message_id (for idempotency)
   */
  async findByClientMessageId(inquiryId: number, clientMessageId: string): Promise<InquiryMessage | null> {
    const rows = await this.executeQuery(
      `SELECT id, inquiry_id, sender_id, client_message_id, message_type, message, attachments, created_at
       FROM inquiry_messages WHERE inquiry_id = ? AND client_message_id = ?`,
      [inquiryId, clientMessageId]
    );

    if (rows.length === 0) return null;

    return this.mapRowToMessage(rows[0]);
  }

  /**
   * Find messages by inquiry ID with pagination (cursor-based)
   * Returns messages older than cursor (for loading history)
   */
  async findByInquiryId(
    inquiryId: number,
    limit: number,
    cursor?: number | null,
    direction: 'older' | 'newer' = 'older'
  ): Promise<InquiryMessageWithSender[]> {
    let query = `
      SELECT 
        im.id, im.inquiry_id, im.sender_id, im.message_type, im.message, im.attachments, im.created_at,
        u.username AS sender_username, u.role AS sender_role
      FROM inquiry_messages im
      LEFT JOIN users u ON im.sender_id = u.id
      WHERE im.inquiry_id = ?
    `;
    const params: any[] = [inquiryId];

    if (cursor !== undefined && cursor !== null) {
      if (direction === 'older') {
        query += ' AND im.id < ?';
      } else {
        query += ' AND im.id > ?';
      }
      params.push(cursor);
    }

    query += direction === 'older'
      ? ' ORDER BY im.id DESC'
      : ' ORDER BY im.id ASC';

    query += ' LIMIT ?';
    params.push(limit);

    const rows = await this.executeQuery(query, params);

    // If loading older messages, reverse to get chronological order
    if (direction === 'older') {
      rows.reverse();
    }

    return rows.map((row: any) => this.mapRowToMessageWithSender(row));
  }

  /**
   * Get the latest N messages for an inquiry
   */
  async getLatestMessages(inquiryId: number, limit: number = 10): Promise<InquiryMessageWithSender[]> {
    const rows = await this.executeQuery(
      `SELECT 
        im.id, im.inquiry_id, im.sender_id, im.message_type, im.message, im.attachments, im.created_at,
        u.username AS sender_username, u.role AS sender_role
       FROM inquiry_messages im
       LEFT JOIN users u ON im.sender_id = u.id
       WHERE im.inquiry_id = ?
       ORDER BY im.id DESC
       LIMIT ?`,
      [inquiryId, limit]
    );

    // Reverse to get chronological order
    rows.reverse();
    return rows.map((row: any) => this.mapRowToMessageWithSender(row));
  }

  /**
   * Get the last message for an inquiry
   */
  async getLastMessage(inquiryId: number): Promise<InquiryMessage | null> {
    const rows = await this.executeQuery(
      `SELECT id, inquiry_id, sender_id, message_type, message, attachments, created_at
       FROM inquiry_messages
       WHERE inquiry_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [inquiryId]
    );

    if (rows.length === 0) return null;
    return this.mapRowToMessage(rows[0]);
  }

  /**
   * Get the latest message ID for an inquiry
   */
  async getLatestMessageId(inquiryId: number): Promise<number | null> {
    const rows = await this.executeQuery(
      `SELECT id FROM inquiry_messages WHERE inquiry_id = ? ORDER BY id DESC LIMIT 1`,
      [inquiryId]
    );
    return rows.length > 0 ? rows[0].id : null;
  }

  /**
   * Count messages in an inquiry
   */
  async countByInquiryId(inquiryId: number): Promise<number> {
    const rows = await this.executeQuery(
      `SELECT COUNT(*) as count FROM inquiry_messages WHERE inquiry_id = ?`,
      [inquiryId]
    );
    return rows[0].count;
  }

  /**
   * Count unread messages for a participant
   * Unread = messages with id > last_read_message_id AND not sent by the participant
   */
  async countUnread(
    inquiryId: number,
    userId: number,
    lastReadMessageId: number | null
  ): Promise<number> {
    const rows = await this.executeQuery(
      `SELECT COUNT(*) as count
       FROM inquiry_messages
       WHERE inquiry_id = ?
       AND id > ?
       AND sender_id != ?`,
      [inquiryId, lastReadMessageId ?? 0, userId]
    );
    return rows[0].count;
  }

  /**
   * Create a new message
   */
  async create(data: InquiryMessageCreate): Promise<number> {
    const attachmentsJson = data.attachments ? JSON.stringify(data.attachments) : null;

    const result = await this.executeCommand(
      `INSERT INTO inquiry_messages (inquiry_id, sender_id, client_message_id, message_type, message, attachments)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.inquiry_id,
        data.sender_id,
        data.client_message_id ?? null,
        data.message_type ?? 'text',
        data.message,
        attachmentsJson,
      ]
    );

    return result.insertId;
  }

  /**
   * Map database row to InquiryMessage
   */
  private mapRowToMessage(row: any): InquiryMessage {
    let attachments: MessageAttachment[] | null = null;
    if (row.attachments) {
      try {
        attachments = typeof row.attachments === 'string'
          ? JSON.parse(row.attachments)
          : row.attachments;
      } catch {
        attachments = null;
      }
    }

    return {
      id: row.id,
      inquiry_id: row.inquiry_id,
      sender_id: row.sender_id,
      client_message_id: row.client_message_id || null,
      message_type: row.message_type,
      message: row.message,
      attachments,
      created_at: row.created_at,
    };
  }

  /**
   * Map database row to InquiryMessageWithSender
   */
  private mapRowToMessageWithSender(row: any): InquiryMessageWithSender {
    const message = this.mapRowToMessage(row);
    return {
      ...message,
      sender: row.sender_username
        ? {
            id: row.sender_id,
            username: row.sender_username,
            role: row.sender_role,
          }
        : undefined,
    };
  }
}
