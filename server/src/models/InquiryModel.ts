import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import {
  Inquiry,
  InquiryStatus,
  InquiryWithDetails,
  InquiryListFilters,
} from '../types/inquiry.js';

/**
 * Inquiry Model
 *
 * Handles database operations for the inquiries table.
 * Manages user-company inquiries about vehicles.
 */
export class InquiryModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  /**
   * Find inquiry by ID
   */
  async findById(id: number): Promise<Inquiry | null> {
    const rows = await this.executeQuery(
      `SELECT id, user_id, company_id, vehicle_id, quote_id, status, subject,
              quoted_total_price, quoted_currency, final_price, final_currency,
              last_message_at, created_at, updated_at, expires_at
       FROM inquiries WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as Inquiry) : null;
  }

  /**
   * Find inquiry by ID with full details (user, company, vehicle info)
   */
  async findByIdWithDetails(id: number): Promise<InquiryWithDetails | null> {
    const rows = await this.executeQuery(
      `SELECT 
        i.id, i.user_id, i.company_id, i.vehicle_id, i.quote_id, i.status, i.subject,
        i.quoted_total_price, i.quoted_currency, i.final_price, i.final_currency,
        i.last_message_at, i.created_at, i.updated_at, i.expires_at,
        u.username AS user_username, u.email AS user_email,
        c.name AS company_name,
        v.brand_name AS vehicle_make, v.model_name AS vehicle_model, v.year AS vehicle_year,
        v.vin AS vehicle_vin
       FROM inquiries i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN companies c ON i.company_id = c.id
       LEFT JOIN vehicles v ON i.vehicle_id = v.id
       WHERE i.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return this.mapRowToInquiryWithDetails(row);
  }

  /**
   * Find inquiries by user ID with pagination
   */
  async findByUserId(
    userId: number,
    limit: number,
    offset: number,
    filters?: InquiryListFilters
  ): Promise<InquiryWithDetails[]> {
    const { whereClause, params } = this.buildWhereClause({ ...filters, user_id: userId });

    const rows = await this.executeQuery(
      `SELECT 
        i.id, i.user_id, i.company_id, i.vehicle_id, i.quote_id, i.status, i.subject,
        i.quoted_total_price, i.quoted_currency, i.final_price, i.final_currency,
        i.last_message_at, i.created_at, i.updated_at, i.expires_at,
        u.username AS user_username, u.email AS user_email,
        c.name AS company_name,
        v.brand_name AS vehicle_make, v.model_name AS vehicle_model, v.year AS vehicle_year,
        v.vin AS vehicle_vin,
        (SELECT m.message FROM inquiry_messages m WHERE m.inquiry_id = i.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_text
       FROM inquiries i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN companies c ON i.company_id = c.id
       LEFT JOIN vehicles v ON i.vehicle_id = v.id
       ${whereClause}
       ORDER BY i.last_message_at DESC, i.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return rows.map((row: any) => this.mapRowToInquiryWithDetails(row));
  }

  /**
   * Find inquiries by company ID with pagination
   */
  async findByCompanyId(
    companyId: number,
    limit: number,
    offset: number,
    filters?: InquiryListFilters
  ): Promise<InquiryWithDetails[]> {
    const { whereClause, params } = this.buildWhereClause({ ...filters, company_id: companyId });

    const rows = await this.executeQuery(
      `SELECT 
        i.id, i.user_id, i.company_id, i.vehicle_id, i.quote_id, i.status, i.subject,
        i.quoted_total_price, i.quoted_currency, i.final_price, i.final_currency,
        i.last_message_at, i.created_at, i.updated_at, i.expires_at,
        u.username AS user_username, u.email AS user_email,
        c.name AS company_name,
        v.brand_name AS vehicle_make, v.model_name AS vehicle_model, v.year AS vehicle_year,
        v.vin AS vehicle_vin,
        (SELECT m.message FROM inquiry_messages m WHERE m.inquiry_id = i.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_text
       FROM inquiries i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN companies c ON i.company_id = c.id
       LEFT JOIN vehicles v ON i.vehicle_id = v.id
       ${whereClause}
       ORDER BY i.last_message_at DESC, i.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return rows.map((row: any) => this.mapRowToInquiryWithDetails(row));
  }

  /**
   * Count inquiries by user ID
   */
  async countByUserId(userId: number, filters?: InquiryListFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause({ ...filters, user_id: userId });

    const rows = await this.executeQuery(
      `SELECT COUNT(*) as count FROM inquiries i ${whereClause}`,
      params
    );
    return rows[0].count;
  }

  /**
   * Count inquiries by company ID
   */
  async countByCompanyId(companyId: number, filters?: InquiryListFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause({ ...filters, company_id: companyId });

    const rows = await this.executeQuery(
      `SELECT COUNT(*) as count FROM inquiries i ${whereClause}`,
      params
    );
    return rows[0].count;
  }

  /**
   * Get inquiry stats for a company (counts by status + total unread)
   */
  async getStatsByCompanyId(companyId: number, companyUserId: number): Promise<{
    pending: number;
    active: number;
    accepted: number;
    declined: number;
    expired: number;
    cancelled: number;
    total_unread: number;
  }> {
    const statusRows = await this.executeQuery(
      `SELECT status, COUNT(*) as count
       FROM inquiries
       WHERE company_id = ?
       GROUP BY status`,
      [companyId]
    );

    const stats = {
      pending: 0,
      active: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      cancelled: 0,
      total_unread: 0,
    };

    for (const row of statusRows) {
      if (row.status in stats) {
        (stats as any)[row.status] = Number(row.count);
      }
    }

    // Calculate total unread messages across all inquiries for this company user
    const unreadRows = await this.executeQuery(
      `SELECT COALESCE(SUM(
        (SELECT COUNT(*) FROM inquiry_messages im
         WHERE im.inquiry_id = i.id
         AND im.id > COALESCE(ip.last_read_message_id, 0)
         AND im.sender_id != ?)
      ), 0) as total_unread
       FROM inquiries i
       LEFT JOIN inquiry_participants ip ON ip.inquiry_id = i.id AND ip.user_id = ?
       WHERE i.company_id = ? AND i.status IN ('pending', 'active')`,
      [companyUserId, companyUserId, companyId]
    );

    stats.total_unread = Number(unreadRows[0]?.total_unread ?? 0);

    return stats;
  }

  /**
   * Check if an open inquiry exists for user-company-vehicle combination
   */
  async hasOpenInquiry(userId: number, companyId: number, vehicleId: number): Promise<boolean> {
    const rows = await this.executeQuery(
      `SELECT 1 FROM inquiries
       WHERE user_id = ? AND company_id = ? AND vehicle_id = ?
       AND status IN ('pending', 'active')
       LIMIT 1`,
      [userId, companyId, vehicleId]
    );
    return rows.length > 0;
  }

  /**
   * Find an open inquiry for user-company-vehicle combination
   * Returns the most recent open inquiry (pending or active), or null if none exists
   */
  async findOpenInquiry(userId: number, companyId: number, vehicleId: number): Promise<Inquiry | null> {
    const rows = await this.executeQuery(
      `SELECT id, user_id, company_id, vehicle_id, quote_id, status, subject,
              quoted_total_price, quoted_currency, final_price, final_currency,
              last_message_at, created_at, updated_at, expires_at
       FROM inquiries
       WHERE user_id = ? AND company_id = ? AND vehicle_id = ?
       AND status IN ('pending', 'active')
       ORDER BY id DESC
       LIMIT 1`,
      [userId, companyId, vehicleId]
    );
    return rows.length > 0 ? (rows[0] as Inquiry) : null;
  }

  /**
   * Create a new inquiry (without message - use InquiryService for full creation)
   */
  async create(data: {
    user_id: number;
    company_id: number;
    vehicle_id: number;
    quote_id?: number | null;
    subject?: string | null;
    quoted_total_price?: number | null;
    quoted_currency?: string;
  }): Promise<number> {
    const result = await this.executeCommand(
      `INSERT INTO inquiries 
        (user_id, company_id, vehicle_id, quote_id, subject, quoted_total_price, quoted_currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.user_id,
        data.company_id,
        data.vehicle_id,
        data.quote_id ?? null,
        data.subject ?? null,
        data.quoted_total_price ?? null,
        data.quoted_currency ?? 'USD',
      ]
    );
    return result.insertId;
  }

  /**
   * Update inquiry status
   */
  async updateStatus(id: number, status: InquiryStatus): Promise<boolean> {
    const result = await this.executeCommand(
      `UPDATE inquiries SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Update inquiry with final price (company offer)
   */
  async updateFinalPrice(
    id: number,
    finalPrice: number | null,
    finalCurrency: string | null
  ): Promise<boolean> {
    const result = await this.executeCommand(
      `UPDATE inquiries SET final_price = ?, final_currency = ? WHERE id = ?`,
      [finalPrice, finalCurrency, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Update last_message_at timestamp
   */
  async updateLastMessageAt(id: number, timestamp: Date): Promise<boolean> {
    const result = await this.executeCommand(
      `UPDATE inquiries SET last_message_at = ? WHERE id = ?`,
      [timestamp, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: InquiryListFilters & { user_id?: number; company_id?: number }): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.user_id !== undefined) {
      conditions.push('i.user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.company_id !== undefined) {
      conditions.push('i.company_id = ?');
      params.push(filters.company_id);
    }

    if (filters.vehicle_id !== undefined) {
      conditions.push('i.vehicle_id = ?');
      params.push(filters.vehicle_id);
    }

    if (filters.status !== undefined) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length > 0) {
          conditions.push(`i.status IN (${filters.status.map(() => '?').join(', ')})`);
          params.push(...filters.status);
        }
      } else {
        conditions.push('i.status = ?');
        params.push(filters.status);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  /**
   * Map database row to InquiryWithDetails
   */
  private mapRowToInquiryWithDetails(row: any): InquiryWithDetails {
    return {
      id: row.id,
      user_id: row.user_id,
      company_id: row.company_id,
      vehicle_id: row.vehicle_id,
      quote_id: row.quote_id,
      status: row.status,
      subject: row.subject,
      quoted_total_price: row.quoted_total_price,
      quoted_currency: row.quoted_currency,
      final_price: row.final_price,
      final_currency: row.final_currency,
      last_message_at: row.last_message_at,
      last_message_text: row.last_message_text || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      expires_at: row.expires_at,
      user: row.user_username
        ? {
            id: row.user_id,
            username: row.user_username,
            email: row.user_email,
          }
        : undefined,
      company: row.company_name
        ? {
            id: row.company_id,
            name: row.company_name,
            logo_url: null,
          }
        : undefined,
      vehicle: row.vehicle_make
        ? {
            id: row.vehicle_id,
            make: row.vehicle_make,
            model: row.vehicle_model,
            year: row.vehicle_year,
            vin: row.vehicle_vin,
            primary_photo_url: null,
          }
        : undefined,
    };
  }
}
