import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import type { CompanyReview, CompanyReviewCreate, CompanyReviewUpdate } from '../types/companyReview';

export class CompanyReviewModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async getByCompanyId(companyId: number, limit: number, offset: number): Promise<CompanyReview[]> {
    const safeLimit = Math.floor(limit);
    const safeOffset = Math.floor(offset);
    const rows = await this.executeQuery(
      `SELECT r.id, r.company_id, r.user_id, u.username AS user_name, r.rating, r.comment, r.created_at, r.updated_at FROM company_reviews r JOIN users u ON u.id = r.user_id WHERE r.company_id = ? ORDER BY r.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [companyId],
    );
    return rows as CompanyReview[];
  }

  async countByCompanyId(companyId: number): Promise<number> {
    const rows = await this.executeQuery(
      'SELECT COUNT(*) AS cnt FROM company_reviews WHERE company_id = ?',
      [companyId],
    );
    if (!rows.length) return 0;
    const row = rows[0] as { cnt: number };
    return row.cnt ?? 0;
  }

  async countByCompanyIds(companyIds: number[]): Promise<Record<number, number>> {
    if (!companyIds.length) {
      return {};
    }

    const placeholders = companyIds.map(() => '?').join(', ');
    const rows = await this.executeQuery(
      `SELECT company_id, COUNT(*) AS cnt FROM company_reviews WHERE company_id IN (${placeholders}) GROUP BY company_id`,
      companyIds,
    );

    const result: Record<number, number> = {};
    for (const row of rows as Array<{ company_id: number; cnt: number }>) {
      result[row.company_id] = row.cnt ?? 0;
    }
    return result;
  }

  async getById(id: number): Promise<CompanyReview | null> {
    const rows = await this.executeQuery(
      'SELECT r.id, r.company_id, r.user_id, u.username AS user_name, r.rating, r.comment, r.created_at, r.updated_at FROM company_reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?',
      [id],
    );
    if (!rows.length) return null;
    return rows[0] as CompanyReview;
  }

  async create(data: CompanyReviewCreate): Promise<CompanyReview> {
    const { company_id, user_id, rating, comment } = data;
    const result = await this.executeCommand(
      'INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [company_id, user_id, rating, comment],
    );

    const id = (result as any).insertId;
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to load created review');
    }
    return created;
  }

  async update(id: number, updates: CompanyReviewUpdate): Promise<CompanyReview | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.rating !== undefined) {
      fields.push('rating = ?');
      values.push(updates.rating);
    }
    if (updates.comment !== undefined) {
      fields.push('comment = ?');
      values.push(updates.comment);
    }

    if (!fields.length) {
      return this.getById(id);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    await this.executeCommand(
      `UPDATE company_reviews SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.executeCommand('DELETE FROM company_reviews WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async getAggregatedRating(companyId: number): Promise<{ rating: number; count: number }> {
    const rows = await this.executeQuery(
      'SELECT AVG(rating) AS rating, COUNT(*) AS count FROM company_reviews WHERE company_id = ?',
      [companyId],
    );
    if (!rows.length) {
      return { rating: 0, count: 0 };
    }
    const row = rows[0] as { rating: number | null; count: number };
    return {
      rating: row.rating ?? 0,
      count: row.count,
    };
  }

  async updateCompanyRating(companyId: number): Promise<void> {
    const { rating } = await this.getAggregatedRating(companyId);
    await this.executeCommand('UPDATE companies SET rating = ? WHERE id = ?', [rating, companyId]);
  }
}
