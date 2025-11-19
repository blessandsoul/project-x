import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';

export interface UserFavoriteCompanyRow {
  user_id: number;
  company_id: number;
  created_at: Date;
}

export interface UserRecentCompanyRow {
  id: number;
  user_id: number;
  company_id: number;
  viewed_at: Date;
}

export class UserCompanyActivityModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async listFavoriteCompanies(userId: number): Promise<UserFavoriteCompanyRow[]> {
    const rows = await this.executeQuery(
      `SELECT user_id, company_id, created_at
       FROM user_favorite_companies
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );
    return Array.isArray(rows) ? (rows as UserFavoriteCompanyRow[]) : [];
  }

  async addFavoriteCompany(userId: number, companyId: number): Promise<void> {
    await this.executeCommand(
      `INSERT IGNORE INTO user_favorite_companies (user_id, company_id, created_at)
       VALUES (?, ?, NOW())`,
      [userId, companyId],
    );
  }

  async removeFavoriteCompany(userId: number, companyId: number): Promise<void> {
    await this.executeCommand(
      `DELETE FROM user_favorite_companies
       WHERE user_id = ? AND company_id = ?`,
      [userId, companyId],
    );
  }

  async listRecentCompanies(userId: number, limit: number = 20): Promise<UserRecentCompanyRow[]> {
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;

    const rows = await this.executeQuery(
      `SELECT id, user_id, company_id, viewed_at
       FROM user_recent_companies
       WHERE user_id = ?
       ORDER BY viewed_at DESC
       LIMIT ?`,
      [userId, safeLimit],
    );
    return Array.isArray(rows) ? (rows as UserRecentCompanyRow[]) : [];
  }

  async addRecentCompany(userId: number, companyId: number): Promise<void> {
    // Insert a new view row; cleanup/compaction can be added later if needed.
    await this.executeCommand(
      `INSERT INTO user_recent_companies (user_id, company_id, viewed_at)
       VALUES (?, ?, NOW())`,
      [userId, companyId],
    );
  }
}
