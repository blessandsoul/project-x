import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';

export interface LeadOfferRecord {
  id: number;
  lead_id: number;
  company_id: number;
  lead_company_id: number;
  estimated_total_usd: number;
  estimated_total_usd_max: number | null;
  service_fee_usd: number | null;
  estimated_duration_days: number | null;
  comment: string | null;
  status: 'ACTIVE' | 'SELECTED' | 'REJECTED' | 'EXPIRED';
  created_at: Date;
  updated_at: Date;
}

export interface LeadOfferCreateData {
  leadId: number;
  companyId: number;
  leadCompanyId: number;
  estimatedTotalUsd: number;
  estimatedTotalUsdMax?: number | null;
  serviceFeeUsd?: number | null;
  estimatedDurationDays?: number | null;
  comment?: string | null;
}

export class LeadOfferModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async createOffer(data: LeadOfferCreateData): Promise<LeadOfferRecord> {
    const {
      leadId,
      companyId,
      leadCompanyId,
      estimatedTotalUsd,
      estimatedTotalUsdMax = null,
      serviceFeeUsd = null,
      estimatedDurationDays = null,
      comment = null,
    } = data;

    const result = await this.executeCommand(
      `INSERT INTO lead_offers (
        lead_id,
        company_id,
        lead_company_id,
        estimated_total_usd,
        estimated_total_usd_max,
        service_fee_usd,
        estimated_duration_days,
        comment,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW())`,
      [
        leadId,
        companyId,
        leadCompanyId,
        estimatedTotalUsd,
        estimatedTotalUsdMax,
        serviceFeeUsd,
        estimatedDurationDays,
        comment,
      ],
    );

    const id = (result as any).insertId as number;
    const rows = await this.executeQuery(
      `SELECT
        id,
        lead_id,
        company_id,
        lead_company_id,
        estimated_total_usd,
        estimated_total_usd_max,
        service_fee_usd,
        estimated_duration_days,
        comment,
        status,
        created_at,
        updated_at
      FROM lead_offers
      WHERE id = ?
      LIMIT 1`,
      [id],
    );

    return rows[0] as LeadOfferRecord;
  }

  async getOffersByLeadId(leadId: number): Promise<LeadOfferRecord[]> {
    const rows = await this.executeQuery(
      `SELECT
        id,
        lead_id,
        company_id,
        lead_company_id,
        estimated_total_usd,
        estimated_total_usd_max,
        service_fee_usd,
        estimated_duration_days,
        comment,
        status,
        created_at,
        updated_at
      FROM lead_offers
      WHERE lead_id = ?
      ORDER BY created_at DESC`,
      [leadId],
    );

    return rows as LeadOfferRecord[];
  }

  async markSelectedAndOthersRejected(leadId: number, selectedOfferId: number): Promise<void> {
    // Mark selected offer
    await this.executeCommand(
      'UPDATE lead_offers SET status = "SELECTED", updated_at = NOW() WHERE id = ? AND lead_id = ?',
      [selectedOfferId, leadId],
    );

    // Mark other offers as REJECTED if they are still ACTIVE
    await this.executeCommand(
      'UPDATE lead_offers SET status = "REJECTED", updated_at = NOW() WHERE lead_id = ? AND id != ? AND status = "ACTIVE"',
      [leadId, selectedOfferId],
    );
  }
}
