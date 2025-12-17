import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import {
  InquiryParticipant,
  InquiryParticipantCreate,
  InquiryParticipantRole,
} from '../types/inquiry.js';

/**
 * Inquiry Participant Model
 *
 * Handles database operations for the inquiry_participants table.
 * Tracks read status per participant to avoid per-message is_read booleans.
 */
export class InquiryParticipantModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  /**
   * Find participant by inquiry ID and user ID
   */
  async findByInquiryAndUser(inquiryId: number, userId: number): Promise<InquiryParticipant | null> {
    const rows = await this.executeQuery(
      `SELECT id, inquiry_id, user_id, role, last_read_message_id, last_read_at, created_at, updated_at
       FROM inquiry_participants
       WHERE inquiry_id = ? AND user_id = ?`,
      [inquiryId, userId]
    );
    return rows.length > 0 ? (rows[0] as InquiryParticipant) : null;
  }

  /**
   * Find all participants for an inquiry
   */
  async findByInquiryId(inquiryId: number): Promise<InquiryParticipant[]> {
    const rows = await this.executeQuery(
      `SELECT id, inquiry_id, user_id, role, last_read_message_id, last_read_at, created_at, updated_at
       FROM inquiry_participants
       WHERE inquiry_id = ?`,
      [inquiryId]
    );
    return rows as InquiryParticipant[];
  }

  /**
   * Find participant by role in an inquiry
   */
  async findByInquiryAndRole(inquiryId: number, role: InquiryParticipantRole): Promise<InquiryParticipant[]> {
    const rows = await this.executeQuery(
      `SELECT id, inquiry_id, user_id, role, last_read_message_id, last_read_at, created_at, updated_at
       FROM inquiry_participants
       WHERE inquiry_id = ? AND role = ?`,
      [inquiryId, role]
    );
    return rows as InquiryParticipant[];
  }

  /**
   * Create a new participant
   */
  async create(data: InquiryParticipantCreate): Promise<number> {
    const result = await this.executeCommand(
      `INSERT INTO inquiry_participants (inquiry_id, user_id, role)
       VALUES (?, ?, ?)`,
      [data.inquiry_id, data.user_id, data.role]
    );
    return result.insertId;
  }

  /**
   * Create participant if not exists (upsert)
   */
  async createIfNotExists(data: InquiryParticipantCreate): Promise<void> {
    await this.executeCommand(
      `INSERT IGNORE INTO inquiry_participants (inquiry_id, user_id, role)
       VALUES (?, ?, ?)`,
      [data.inquiry_id, data.user_id, data.role]
    );
  }

  /**
   * Update last read message ID (mark as read)
   */
  async markAsRead(inquiryId: number, userId: number, lastReadMessageId: number): Promise<boolean> {
    const result = await this.executeCommand(
      `UPDATE inquiry_participants
       SET last_read_message_id = ?, last_read_at = NOW(3)
       WHERE inquiry_id = ? AND user_id = ?
       AND (last_read_message_id IS NULL OR last_read_message_id < ?)`,
      [lastReadMessageId, inquiryId, userId, lastReadMessageId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get last read message ID for a participant
   */
  async getLastReadMessageId(inquiryId: number, userId: number): Promise<number | null> {
    const rows = await this.executeQuery(
      `SELECT last_read_message_id FROM inquiry_participants
       WHERE inquiry_id = ? AND user_id = ?`,
      [inquiryId, userId]
    );
    return rows.length > 0 ? rows[0].last_read_message_id : null;
  }

  /**
   * Check if user is a participant in an inquiry
   */
  async isParticipant(inquiryId: number, userId: number): Promise<boolean> {
    const rows = await this.executeQuery(
      `SELECT 1 FROM inquiry_participants
       WHERE inquiry_id = ? AND user_id = ?
       LIMIT 1`,
      [inquiryId, userId]
    );
    return rows.length > 0;
  }

  /**
   * Get participant role in an inquiry
   */
  async getParticipantRole(inquiryId: number, userId: number): Promise<InquiryParticipantRole | null> {
    const rows = await this.executeQuery(
      `SELECT role FROM inquiry_participants
       WHERE inquiry_id = ? AND user_id = ?`,
      [inquiryId, userId]
    );
    return rows.length > 0 ? rows[0].role : null;
  }

  /**
   * Get read watermarks for an inquiry (for "seen" status)
   * Returns the current user's watermark and the "other" side's watermark
   * For company side, uses MAX(last_read_message_id) across all company participants
   */
  async getReadWatermarks(
    inquiryId: number,
    currentUserId: number
  ): Promise<{
    me: { user_id: number; role: InquiryParticipantRole; last_read_message_id: number | null } | null;
    other: { role: InquiryParticipantRole; last_read_message_id: number | null } | null;
  }> {
    // Get current user's participant info
    const myParticipant = await this.findByInquiryAndUser(inquiryId, currentUserId);
    
    if (!myParticipant) {
      return { me: null, other: null };
    }

    const myRole = myParticipant.role;
    const otherRole: InquiryParticipantRole = myRole === 'user' ? 'company' : 'user';

    // Get the "other" side's read watermark
    // For company, use MAX to show "seen" if any company rep has read
    const otherRows = await this.executeQuery(
      `SELECT MAX(last_read_message_id) as max_read_id
       FROM inquiry_participants
       WHERE inquiry_id = ? AND role = ?`,
      [inquiryId, otherRole]
    );

    const otherLastRead = otherRows.length > 0 ? otherRows[0].max_read_id : null;

    return {
      me: {
        user_id: myParticipant.user_id,
        role: myParticipant.role,
        last_read_message_id: myParticipant.last_read_message_id,
      },
      other: {
        role: otherRole,
        last_read_message_id: otherLastRead,
      },
    };
  }
}
