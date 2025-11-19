import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';

export type DashboardRole = 'user' | 'dealer' | 'company' | 'admin';

export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  trend: 'up' | 'down' | 'flat';
}

export interface DashboardSummary {
  role: DashboardRole;
  kpis: DashboardKpi[];
}

export class DashboardModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async getSummaryForUser(userId: number, role: DashboardRole): Promise<DashboardSummary> {
    switch (role) {
      case 'company':
        return this.getCompanySummary(userId);
      case 'user':
      case 'dealer':
      case 'admin':
      default:
        return this.getEndUserSummary(userId, role);
    }
  }

  private async getCompanySummary(userId: number): Promise<DashboardSummary> {
    // Look up company_id for this user
    const userRows = await this.executeQuery(
      'SELECT company_id FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    const companyId = Array.isArray(userRows) && userRows[0] && (userRows[0] as any).company_id
      ? Number((userRows[0] as any).company_id)
      : null;

    let totalLeads = 0;
    let newLeads = 0;
    let wonDeals = 0;
    let offersSent = 0;

    if (Number.isFinite(companyId) && companyId) {
      const leadRows = await this.executeQuery(
        `SELECT
           SUM(CASE WHEN status IN ('NEW', 'OFFER_SENT', 'WON', 'LOST') THEN 1 ELSE 0 END) AS total_leads,
           SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) AS new_leads,
           SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) AS won_deals,
           SUM(CASE WHEN status = 'OFFER_SENT' THEN 1 ELSE 0 END) AS offers_sent
         FROM lead_companies
         WHERE company_id = ?`,
        [companyId],
      );

      if (Array.isArray(leadRows) && leadRows[0]) {
        const row = leadRows[0] as any;
        totalLeads = Number(row.total_leads ?? 0) || 0;
        newLeads = Number(row.new_leads ?? 0) || 0;
        wonDeals = Number(row.won_deals ?? 0) || 0;
        offersSent = Number(row.offers_sent ?? 0) || 0;
      }
    }

    const kpis: DashboardKpi[] = [
      {
        key: 'company.leads.total',
        label: 'Total Leads',
        value: totalLeads,
        trend: 'flat',
      },
      {
        key: 'company.leads.new',
        label: 'New Leads',
        value: newLeads,
        trend: 'flat',
      },
      {
        key: 'company.offers.sent',
        label: 'Offers Sent',
        value: offersSent,
        trend: 'flat',
      },
      {
        key: 'company.deals.won',
        label: 'Deals Won',
        value: wonDeals,
        trend: 'flat',
      },
    ];

    return { role: 'company', kpis };
  }

  private async getEndUserSummary(userId: number, role: DashboardRole): Promise<DashboardSummary> {
    // Total leads created by this user
    const leadRows = await this.executeQuery(
      'SELECT COUNT(*) AS total_leads FROM leads WHERE user_id = ?',
      [userId],
    );
    const totalLeads =
      Array.isArray(leadRows) && leadRows[0]
        ? Number((leadRows[0] as any).total_leads ?? 0) || 0
        : 0;

    // Favorite vehicles (existing table user_favorite_vehicles)
    const favVehicleRows = await this.executeQuery(
      'SELECT COUNT(*) AS total_fav_vehicles FROM user_favorite_vehicles WHERE user_id = ?',
      [userId],
    );
    const favoriteVehicles =
      Array.isArray(favVehicleRows) && favVehicleRows[0]
        ? Number((favVehicleRows[0] as any).total_fav_vehicles ?? 0) || 0
        : 0;

    // Favorite companies (new table user_favorite_companies)
    const favCompanyRows = await this.executeQuery(
      'SELECT COUNT(*) AS total_fav_companies FROM user_favorite_companies WHERE user_id = ?',
      [userId],
    );
    const favoriteCompanies =
      Array.isArray(favCompanyRows) && favCompanyRows[0]
        ? Number((favCompanyRows[0] as any).total_fav_companies ?? 0) || 0
        : 0;

    const kpis: DashboardKpi[] = [
      {
        key: 'user.leads.total',
        label: 'Total Leads',
        value: totalLeads,
        trend: 'flat',
      },
      {
        key: 'user.favorites.vehicles',
        label: 'Favorite Vehicles',
        value: favoriteVehicles,
        trend: 'flat',
      },
      {
        key: 'user.favorites.companies',
        label: 'Favorite Companies',
        value: favoriteCompanies,
        trend: 'flat',
      },
    ];

    const safeRole: DashboardRole = role ?? 'user';
    return { role: safeRole, kpis };
  }
}
