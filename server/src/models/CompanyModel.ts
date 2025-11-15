import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import {
  Company,
  CompanyCreate,
  CompanyUpdate,
  CompanyQuote,
  CompanyQuoteCreate,
  CompanyQuoteUpdate,
  CompanySocialLink,
  CompanySocialLinkCreate,
  CompanySocialLinkUpdate,
  CompanyWithRelations,
} from '../types/company.js';
import { DatabaseError } from '../types/errors.js';

export class CompanyModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async create(companyData: CompanyCreate): Promise<Company> {
    const {
      name,
      logo = null,
      base_price,
      price_per_mile,
      customs_fee,
      service_fee,
      broker_fee,
      final_formula = null,
      description = null,
      phone_number = null,
    } = companyData;

    const result = await this.executeCommand(
      'INSERT INTO companies (name, logo, base_price, price_per_mile, customs_fee, service_fee, broker_fee, final_formula, description, phone_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        name,
        logo,
        base_price,
        price_per_mile,
        customs_fee,
        service_fee,
        broker_fee,
        final_formula ? JSON.stringify(final_formula) : null,
        description,
        phone_number,
      ],
    );

    const companyId = (result as any).insertId;
    const company = await this.findById(companyId);
    if (!company) {
      throw new DatabaseError('Failed to retrieve created company');
    }
    return company;
  }

  async findById(id: number): Promise<Company | null> {
    const rows = await this.executeQuery(
      'SELECT id, name, logo, base_price, price_per_mile, customs_fee, service_fee, broker_fee, final_formula, description, phone_number, created_at, updated_at FROM companies WHERE id = ?',
      [id],
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];

    if (row.final_formula) {
      try {
        row.final_formula = JSON.parse(row.final_formula as string);
      } catch {
        // leave as-is if parse fails
      }
    }

    return row as Company;
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<Company[]> {
    const rows = await this.executeQuery(
      'SELECT id, name, logo, base_price, price_per_mile, customs_fee, service_fee, broker_fee, final_formula, description, phone_number, created_at, updated_at FROM companies ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset],
    );

    for (const row of rows) {
      if (row.final_formula) {
        try {
          row.final_formula = JSON.parse(row.final_formula as string);
        } catch {
          // ignore parse error
        }
      }
    }

    return rows as Company[];
  }

  async update(id: number, updates: CompanyUpdate): Promise<Company | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.logo !== undefined) {
      fields.push('logo = ?');
      values.push(updates.logo);
    }
    if (updates.base_price !== undefined) {
      fields.push('base_price = ?');
      values.push(updates.base_price);
    }
    if (updates.price_per_mile !== undefined) {
      fields.push('price_per_mile = ?');
      values.push(updates.price_per_mile);
    }
    if (updates.customs_fee !== undefined) {
      fields.push('customs_fee = ?');
      values.push(updates.customs_fee);
    }
    if (updates.service_fee !== undefined) {
      fields.push('service_fee = ?');
      values.push(updates.service_fee);
    }
    if (updates.broker_fee !== undefined) {
      fields.push('broker_fee = ?');
      values.push(updates.broker_fee);
    }
    if (updates.final_formula !== undefined) {
      fields.push('final_formula = ?');
      values.push(updates.final_formula ? JSON.stringify(updates.final_formula) : null);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.phone_number !== undefined) {
      fields.push('phone_number = ?');
      values.push(updates.phone_number);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    await this.executeCommand(
      `UPDATE companies SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    await this.executeCommand('DELETE FROM company_quotes WHERE company_id = ?', [id]);
    await this.executeCommand('DELETE FROM company_social_links WHERE company_id = ?', [id]);

    const result = await this.executeCommand('DELETE FROM companies WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async getWithRelations(id: number): Promise<CompanyWithRelations | null> {
    const company = await this.findById(id);
    if (!company) {
      return null;
    }

    const [socialLinks, quotes] = await Promise.all([
      this.getSocialLinksByCompanyId(id),
      this.getQuotesByCompanyId(id),
    ]);

    return {
      ...company,
      social_links: socialLinks,
      quotes,
    };
  }

  async getSocialLinksByCompanyId(companyId: number): Promise<CompanySocialLink[]> {
    const rows = await this.executeQuery(
      'SELECT id, company_id, url FROM company_social_links WHERE company_id = ?',
      [companyId],
    );
    return rows as CompanySocialLink[];
  }

  async createSocialLink(data: CompanySocialLinkCreate): Promise<CompanySocialLink> {
    const { company_id, url } = data;
    const result = await this.executeCommand(
      'INSERT INTO company_social_links (company_id, url) VALUES (?, ?)',
      [company_id, url],
    );

    const id = (result as any).insertId;
    const rows = await this.executeQuery(
      'SELECT id, company_id, url FROM company_social_links WHERE id = ?',
      [id],
    );
    return rows[0] as CompanySocialLink;
  }

  async updateSocialLink(id: number, updates: CompanySocialLinkUpdate): Promise<CompanySocialLink | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.url !== undefined) {
      fields.push('url = ?');
      values.push(updates.url);
    }

    if (fields.length === 0) {
      const rows = await this.executeQuery(
        'SELECT id, company_id, url FROM company_social_links WHERE id = ?',
        [id],
      );
      return rows.length ? (rows[0] as CompanySocialLink) : null;
    }

    values.push(id);
    await this.executeCommand(
      `UPDATE company_social_links SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    const rows = await this.executeQuery(
      'SELECT id, company_id, url FROM company_social_links WHERE id = ?',
      [id],
    );
    return rows.length ? (rows[0] as CompanySocialLink) : null;
  }

  async deleteSocialLink(id: number): Promise<boolean> {
    const result = await this.executeCommand(
      'DELETE FROM company_social_links WHERE id = ?',
      [id],
    );
    return (result as any).affectedRows > 0;
  }

  async getQuotesByCompanyId(companyId: number): Promise<CompanyQuote[]> {
    const rows = await this.executeQuery(
      'SELECT id, company_id, vehicle_id, total_price, breakdown, delivery_time_days, created_at FROM company_quotes WHERE company_id = ? ORDER BY created_at DESC',
      [companyId],
    );

    for (const row of rows) {
      if (row.breakdown) {
        try {
          row.breakdown = JSON.parse(row.breakdown as string);
        } catch {
          // ignore parse error
        }
      }
    }

    return rows as CompanyQuote[];
  }

  async getQuotesByVehicleId(vehicleId: number): Promise<CompanyQuote[]> {
    const rows = await this.executeQuery(
      'SELECT id, company_id, vehicle_id, total_price, breakdown, delivery_time_days, created_at FROM company_quotes WHERE vehicle_id = ? ORDER BY created_at DESC',
      [vehicleId],
    );

    for (const row of rows) {
      if (row.breakdown) {
        try {
          row.breakdown = JSON.parse(row.breakdown as string);
        } catch {
          // ignore parse error
        }
      }
    }

    return rows as CompanyQuote[];
  }

  async createQuote(data: CompanyQuoteCreate): Promise<CompanyQuote> {
    const {
      company_id,
      vehicle_id,
      total_price,
      breakdown = null,
      delivery_time_days = null,
    } = data;

    const result = await this.executeCommand(
      'INSERT INTO company_quotes (company_id, vehicle_id, total_price, breakdown, delivery_time_days, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [
        company_id,
        vehicle_id,
        total_price,
        breakdown ? JSON.stringify(breakdown) : null,
        delivery_time_days,
      ],
    );

    const id = (result as any).insertId;
    const rows = await this.executeQuery(
      'SELECT id, company_id, vehicle_id, total_price, breakdown, delivery_time_days, created_at FROM company_quotes WHERE id = ?',
      [id],
    );

    const row = rows[0];
    if (row.breakdown) {
      try {
        row.breakdown = JSON.parse(row.breakdown as string);
      } catch {
        // ignore parse error
      }
    }

    return row as CompanyQuote;
  }

  async updateQuote(id: number, updates: CompanyQuoteUpdate): Promise<CompanyQuote | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.total_price !== undefined) {
      fields.push('total_price = ?');
      values.push(updates.total_price);
    }
    if (updates.breakdown !== undefined) {
      fields.push('breakdown = ?');
      values.push(updates.breakdown ? JSON.stringify(updates.breakdown) : null);
    }
    if (updates.delivery_time_days !== undefined) {
      fields.push('delivery_time_days = ?');
      values.push(updates.delivery_time_days);
    }

    if (fields.length === 0) {
      const rows = await this.executeQuery(
        'SELECT id, company_id, vehicle_id, total_price, breakdown, delivery_time_days, created_at FROM company_quotes WHERE id = ?',
        [id],
      );
      if (!rows.length) return null;
      const row = rows[0];
      if (row.breakdown) {
        try {
          row.breakdown = JSON.parse(row.breakdown as string);
        } catch {
          // ignore
        }
      }
      return row as CompanyQuote;
    }

    values.push(id);
    await this.executeCommand(
      `UPDATE company_quotes SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    const rows = await this.executeQuery(
      'SELECT id, company_id, vehicle_id, total_price, breakdown, delivery_time_days, created_at FROM company_quotes WHERE id = ?',
      [id],
    );
    if (!rows.length) return null;
    const row = rows[0];
    if (row.breakdown) {
      try {
        row.breakdown = JSON.parse(row.breakdown as string);
      } catch {
        // ignore
      }
    }
    return row as CompanyQuote;
  }

  async deleteQuote(id: number): Promise<boolean> {
    const result = await this.executeCommand(
      'DELETE FROM company_quotes WHERE id = ?',
      [id],
    );
    return (result as any).affectedRows > 0;
  }
}
