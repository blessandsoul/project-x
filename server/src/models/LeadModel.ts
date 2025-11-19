import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import { Lead } from '../types/lead.js';

export interface LeadCreateData {
  userId: number | null;
  name: string;
  contact: string;
  budgetUsdMin: number | null;
  budgetUsdMax: number | null;
  carType: string | null;
  auctionSources: string[] | null;
  brand: string | null;
  model: string | null;
  yearFrom: number | null;
  color: string | null;
  message: string | null;
  priority: 'price' | 'speed' | 'premium_service' | null;
  desiredBudgetText?: string | null;
  desiredVehicleType?: string | null;
  auctionText?: string | null;
  termsAccepted?: boolean;
  source?: 'quotes' | 'general_form';
  desiredDurationDays?: number | null;
  maxAcceptableDurationDays?: number | null;
  damageTolerance?: 'minimal' | 'moderate' | 'any' | null;
  serviceExtras?: string[] | null;
  preferredContactChannel?: 'whatsapp' | 'telegram' | 'phone' | 'email' | null;
  vehicleId?: number | null;
}

export class LeadModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async createLead(data: LeadCreateData): Promise<Lead> {
    const {
      userId,
      name,
      contact,
      budgetUsdMin,
      budgetUsdMax,
      carType,
      auctionSources,
      brand,
      model,
      yearFrom,
      color,
      message,
      priority,
      desiredBudgetText = null,
      desiredVehicleType = null,
      auctionText = null,
      termsAccepted = false,
      source = 'quotes',
      desiredDurationDays = null,
      maxAcceptableDurationDays = null,
      damageTolerance = null,
      serviceExtras = null,
      preferredContactChannel = null,
      vehicleId = null,
    } = data;

    const result = await this.executeCommand(
      `INSERT INTO leads (
        user_id,
        vehicle_id,
        name,
        contact,
        budget_usd_min,
        budget_usd_max,
        car_type,
        auction_sources,
        brand,
        model,
        year_from,
        color,
        message,
        priority,
        desired_duration_days,
        max_acceptable_duration_days,
        damage_tolerance,
        service_extras,
        preferred_contact_channel,
        desired_budget_text,
        desired_vehicle_type,
        auction_text,
        terms_accepted,
        source,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', NOW(), NOW())`,
      [
        userId,
        vehicleId,
        name,
        contact,
        budgetUsdMin,
        budgetUsdMax,
        carType,
        auctionSources ? JSON.stringify(auctionSources) : null,
        brand,
        model,
        yearFrom,
        color,
        message,
        priority ?? null,
        desiredDurationDays,
        maxAcceptableDurationDays,
        damageTolerance,
        serviceExtras ? JSON.stringify(serviceExtras) : null,
        preferredContactChannel,
        desiredBudgetText,
        desiredVehicleType,
        auctionText,
        termsAccepted ? 1 : 0,
        source,
      ],
    );

    const id = (result as any).insertId as number;
    const rows = await this.executeQuery(
      'SELECT id, user_id, vehicle_id, name, contact, budget_usd_min, budget_usd_max, car_type, auction_sources, brand, model, year_from, color, message, priority, desired_duration_days, max_acceptable_duration_days, damage_tolerance, service_extras, preferred_contact_channel, desired_budget_text, desired_vehicle_type, auction_text, terms_accepted, source, status, created_at, updated_at FROM leads WHERE id = ? LIMIT 1',
      [id],
    );
    const row = rows[0];

    if (row && row.auction_sources) {
      try {
        row.auction_sources = JSON.parse(row.auction_sources as string);
      } catch {
        row.auction_sources = null;
      }
    }

    return row as Lead;
  }

  async createLeadCompanies(leadId: number, companyIds: number[], expiresAt: Date | null): Promise<void> {
    if (!companyIds.length) {
      return;
    }

    const values: any[] = [];
    const placeholders: string[] = [];

    for (const companyId of companyIds) {
      placeholders.push('(?, ?, ?, NOW(), NULL, NULL)');
      values.push(leadId, companyId, expiresAt ? expiresAt.toISOString().slice(0, 19).replace('T', ' ') : null);
    }

    await this.executeCommand(
      `INSERT INTO lead_companies (
        lead_id,
        company_id,
        expires_at,
        invited_at,
        viewed_at,
        responded_at
      ) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  async getUserLeads(userId: number): Promise<
    Array<{
      id: number;
      status: string;
      created_at: Date;
      budget_usd_min: number | null;
      budget_usd_max: number | null;
      car_type: string | null;
      priority: string | null;
      offers_count: number;
    }>
  > {
    const rows = await this.executeQuery(
      `SELECT
        l.id,
        l.status,
        l.created_at,
        l.budget_usd_min,
        l.budget_usd_max,
        l.car_type,
        l.priority,
        (
          SELECT COUNT(*) FROM lead_offers lo WHERE lo.lead_id = l.id
        ) AS offers_count
      FROM leads l
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC`,
      [userId],
    );

    return rows as any;
  }

  async getLeadForUser(userId: number, leadId: number): Promise<Lead | null> {
    const rows = await this.executeQuery(
      `SELECT
        id,
        user_id,
        name,
        contact,
        budget_usd_min,
        budget_usd_max,
        car_type,
        auction_sources,
        brand,
        model,
        year_from,
        color,
        message,
        priority,
        status,
        created_at,
        updated_at
      FROM leads
      WHERE id = ? AND user_id = ?
      LIMIT 1`,
      [leadId, userId],
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    if (row.auction_sources) {
      try {
        row.auction_sources = JSON.parse(row.auction_sources as string);
      } catch {
        row.auction_sources = null;
      }
    }

    return row as Lead;
  }

  async markLeadClosed(leadId: number): Promise<void> {
    await this.executeCommand('UPDATE leads SET status = "CLOSED", updated_at = NOW() WHERE id = ?', [leadId]);
  }

  async getCompanyLeads(companyId: number): Promise<
    Array<{
      lead_company_id: number;
      lead_id: number;
      status: string;
      invited_at: Date;
      expires_at: Date | null;
      budget_usd_min: number | null;
      budget_usd_max: number | null;
      car_type: string | null;
      auction_sources: string | null;
      priority: string | null;
      source: 'quotes' | 'general_form';
      desired_budget_text: string | null;
      desired_vehicle_type: string | null;
      auction_text: string | null;
      vehicle_id: number | null;
      vehicle_title: string | null;
      vehicle_year: number | null;
      vehicle_main_image_url: string | null;
      vehicle_auction_lot_url: string | null;
      message: string | null;
    }>
  > {
    const rows = await this.executeQuery(
      `SELECT
        lc.id AS lead_company_id,
        lc.lead_id,
        lc.status,
        lc.invited_at,
        lc.expires_at,
        l.budget_usd_min,
        l.budget_usd_max,
        l.car_type,
        l.auction_sources,
        l.priority,
        l.source,
        l.desired_budget_text,
        l.desired_vehicle_type,
        l.auction_text,
        l.message,
        l.vehicle_id,
        CONCAT(v.brand_name, ' ', v.model_name) AS vehicle_title,
        v.year AS vehicle_year,
        (
          SELECT vp.url
          FROM vehicle_photos vp
          WHERE vp.vehicle_id = v.id
          ORDER BY vp.id ASC
          LIMIT 1
        ) AS vehicle_main_image_url,
        v.link AS vehicle_auction_lot_url
      FROM lead_companies lc
      JOIN leads l ON l.id = lc.lead_id
      LEFT JOIN vehicles v ON v.id = l.vehicle_id
      WHERE lc.company_id = ?
      ORDER BY lc.invited_at DESC`,
      [companyId],
    );

    return rows as any;
  }

  async getLeadCompanyForCompany(companyId: number, leadCompanyId: number): Promise<
    | {
        lead_company_id: number;
        lead_id: number;
        status: string;
        invited_at: Date;
        expires_at: Date | null;
        budget_usd_min: number | null;
        budget_usd_max: number | null;
        car_type: string | null;
        auction_sources: string | null;
        message: string | null;
        priority: string | null;
        vehicle_id: number | null;
        vehicle_title: string | null;
        vehicle_year: number | null;
        vehicle_main_image_url: string | null;
        vehicle_auction_lot_url: string | null;
      }
    | null
  > {
    const rows = await this.executeQuery(
      `SELECT
        lc.id AS lead_company_id,
        lc.lead_id,
        lc.status,
        lc.invited_at,
        lc.expires_at,
        l.budget_usd_min,
        l.budget_usd_max,
        l.car_type,
        l.auction_sources,
        l.message,
        l.priority,
        l.vehicle_id,
        CONCAT(v.brand_name, ' ', v.model_name) AS vehicle_title,
        v.year AS vehicle_year,
        (
          SELECT vp.url
          FROM vehicle_photos vp
          WHERE vp.vehicle_id = v.id
          ORDER BY vp.id ASC
          LIMIT 1
        ) AS vehicle_main_image_url,
        v.link AS vehicle_auction_lot_url
      FROM lead_companies lc
      JOIN leads l ON l.id = lc.lead_id
      LEFT JOIN vehicles v ON v.id = l.vehicle_id
      WHERE lc.company_id = ? AND lc.id = ?
      LIMIT 1`,
      [companyId, leadCompanyId],
    );

    if (!rows.length) {
      return null;
    }

    return rows[0] as any;
  }

  async markLeadCompanyViewed(companyId: number, leadCompanyId: number): Promise<void> {
    await this.executeCommand(
      'UPDATE lead_companies SET viewed_at = NOW() WHERE company_id = ? AND id = ? AND viewed_at IS NULL',
      [companyId, leadCompanyId],
    );
  }

  async markLeadCompanyResponded(companyId: number, leadCompanyId: number): Promise<void> {
    await this.executeCommand(
      'UPDATE lead_companies SET responded_at = NOW() WHERE company_id = ? AND id = ? AND responded_at IS NULL',
      [companyId, leadCompanyId],
    );
  }

  async markLeadCompanyOfferSent(companyId: number, leadCompanyId: number): Promise<void> {
    await this.executeCommand(
      'UPDATE lead_companies SET status = "OFFER_SENT" WHERE company_id = ? AND id = ? AND status = "NEW"',
      [companyId, leadCompanyId],
    );
  }

  async markLeadCompanyWon(leadCompanyId: number): Promise<void> {
    await this.executeCommand(
      'UPDATE lead_companies SET status = "WON" WHERE id = ?',
      [leadCompanyId],
    );
  }

  async markOtherLeadCompaniesLost(leadId: number, winningLeadCompanyId: number): Promise<void> {
    await this.executeCommand(
      'UPDATE lead_companies SET status = "LOST" WHERE lead_id = ? AND id != ? AND status IN ("NEW", "OFFER_SENT")',
      [leadId, winningLeadCompanyId],
    );
  }
}
