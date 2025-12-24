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

/**
 * Safely parse JSON with logging on failure.
 * Returns the original value if parsing fails.
 */
function safeJsonParse(value: unknown, fieldName: string, recordId?: number): unknown {
  if (!value || typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    // Log warning for corrupted JSON data
    console.warn(
      `[CompanyModel] Failed to parse ${fieldName} JSON${recordId ? ` for record ${recordId}` : ''}:`,
      err instanceof Error ? err.message : 'Unknown error',
    );
    return value; // Return original string if parse fails
  }
}

export class CompanyModel extends BaseModel {
  private fastifyInstance: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    super(fastify);
    this.fastifyInstance = fastify;
  }

  async create(companyData: CompanyCreate): Promise<Company> {
    const {
      name,
      owner_user_id = null,
      slug,
      base_price = 0,
      price_per_mile = 0,
      customs_fee = 0,
      service_fee = 0,
      broker_fee = 0,
      insurance = null,
      final_formula = null,
      description = null,
      country = null,
      city = null,
      state = null,
      rating = 0,
      is_vip = false,
      subscription_free = true,
      subscription_ends_at = null,
      services = null,
      phone_number = null,
      contact_email = null,
      website = null,
      established_year = null,
    } = companyData;

    const baseSlug = (slug ?? name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const computedSlug = baseSlug || `company-${Date.now()}`;

    const cheapestScore =
      (base_price ?? 0) +
      (customs_fee ?? 0) +
      (service_fee ?? 0) +
      (broker_fee ?? 0);

    const result = await this.executeCommand(
      'INSERT INTO companies (owner_user_id, name, slug, base_price, price_per_mile, customs_fee, service_fee, broker_fee, insurance, cheapest_score, final_formula, description, country, city, state, services, phone_number, contact_email, website, established_year, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        owner_user_id,
        name,
        computedSlug,
        base_price,
        price_per_mile,
        customs_fee,
        service_fee,
        broker_fee,
        insurance,
        cheapestScore,
        final_formula ? JSON.stringify(final_formula) : null,
        description,
        country,
        city,
        state,
        services ? JSON.stringify(services) : null,
        phone_number,
        contact_email,
        website,
        established_year,
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
      'SELECT id, owner_user_id, name, slug, base_price, price_per_mile, customs_fee, service_fee, broker_fee, insurance, final_formula, description, country, city, state, rating, is_vip, subscription_free, subscription_ends_at, services, phone_number, contact_email, website, established_year, created_at, updated_at FROM companies WHERE id = ?',
      [id],
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    row.final_formula = safeJsonParse(row.final_formula, 'final_formula', row.id);
    row.services = safeJsonParse(row.services, 'services', row.id);
    return row as Company;
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<Company[]> {
    const safeLimit = Math.floor(limit);
    const safeOffset = Math.floor(offset);
    const rows = await this.executeQuery(
      `SELECT id, owner_user_id, name, slug, base_price, price_per_mile, customs_fee, service_fee, broker_fee, insurance, final_formula, description, country, city, state, rating, is_vip, subscription_free, subscription_ends_at, services, phone_number, contact_email, website, established_year, created_at, updated_at FROM companies ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [],
    );

    for (const row of rows) {
      row.final_formula = safeJsonParse(row.final_formula, 'final_formula', row.id);
      row.services = safeJsonParse(row.services, 'services', row.id);
    }

    return rows as Company[];
  }

  async countAll(): Promise<number> {
    const rows = await this.executeQuery(
      'SELECT COUNT(*) AS cnt FROM companies',
      [],
    );
    return rows.length ? (rows[0] as { cnt: number }).cnt : 0;
  }

  async findByIds(ids: number[]): Promise<Company[]> {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(ids));
    const placeholders = uniqueIds.map(() => '?').join(', ');

    const rows = await this.executeQuery(
      `SELECT id, owner_user_id, name, slug, base_price, price_per_mile, customs_fee, service_fee, broker_fee, insurance, final_formula, description, country, city, state, rating, is_vip, subscription_free, subscription_ends_at, services, phone_number, contact_email, website, established_year, created_at, updated_at FROM companies WHERE id IN (${placeholders})`,
      uniqueIds,
    );

    for (const row of rows) {
      row.final_formula = safeJsonParse(row.final_formula, 'final_formula', row.id);
      row.services = safeJsonParse(row.services, 'services', row.id);
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
    if (updates.insurance !== undefined) {
      fields.push('insurance = ?');
      values.push(updates.insurance);
    }
    if (updates.final_formula !== undefined) {
      fields.push('final_formula = ?');
      values.push(updates.final_formula ? JSON.stringify(updates.final_formula) : null);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.country !== undefined) {
      fields.push('country = ?');
      values.push(updates.country);
    }
    if (updates.city !== undefined) {
      fields.push('city = ?');
      values.push(updates.city);
    }
    if (updates.state !== undefined) {
      fields.push('state = ?');
      values.push(updates.state);
    }
    if (updates.rating !== undefined) {
      fields.push('rating = ?');
      values.push(updates.rating);
    }
    if (updates.is_vip !== undefined) {
      fields.push('is_vip = ?');
      values.push(updates.is_vip ? 1 : 0);
    }
    if (updates.subscription_free !== undefined) {
      fields.push('subscription_free = ?');
      values.push(updates.subscription_free ? 1 : 0);
    }
    if (updates.subscription_ends_at !== undefined) {
      fields.push('subscription_ends_at = ?');
      values.push(updates.subscription_ends_at);
    }
    if (updates.services !== undefined) {
      fields.push('services = ?');
      values.push(updates.services ? JSON.stringify(updates.services) : null);
    }
    if (updates.phone_number !== undefined) {
      fields.push('phone_number = ?');
      values.push(updates.phone_number);
    }
    if (updates.contact_email !== undefined) {
      fields.push('contact_email = ?');
      values.push(updates.contact_email);
    }
    if (updates.website !== undefined) {
      fields.push('website = ?');
      values.push(updates.website);
    }
    if (updates.established_year !== undefined) {
      fields.push('established_year = ?');
      values.push(updates.established_year);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('cheapest_score = COALESCE(base_price, 0) + COALESCE(customs_fee, 0) + COALESCE(service_fee, 0) + COALESCE(broker_fee, 0)');
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

  async getSocialLinkById(id: number): Promise<CompanySocialLink | null> {
    const rows = await this.executeQuery(
      'SELECT id, company_id, url FROM company_social_links WHERE id = ?',
      [id],
    );
    return rows.length ? (rows[0] as CompanySocialLink) : null;
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
      row.breakdown = safeJsonParse(row.breakdown, 'breakdown', row.id);
    }

    return rows as CompanyQuote[];
  }

  async deleteQuotesByVehicleId(vehicleId: number): Promise<number> {
    const result = await this.executeCommand(
      'DELETE FROM company_quotes WHERE vehicle_id = ?',
      [vehicleId],
    );

    return (result as any).affectedRows ?? 0;
  }

  async getQuotesByVehicleId(vehicleId: number): Promise<CompanyQuote[]> {
    const rows = await this.executeQuery(
      'SELECT id, company_id, vehicle_id, total_price, breakdown, delivery_time_days, created_at FROM company_quotes WHERE vehicle_id = ? ORDER BY created_at DESC',
      [vehicleId],
    );

    for (const row of rows) {
      row.breakdown = safeJsonParse(row.breakdown, 'breakdown', row.id);
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
    row.breakdown = safeJsonParse(row.breakdown, 'breakdown', row.id);
    return row as CompanyQuote;
  }

  async updateQuote(id: number, updates: CompanyQuoteUpdate): Promise<CompanyQuote | null> {
    const fields: string[] = [];
    const values: any[] = [];

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
      row.breakdown = safeJsonParse(row.breakdown, 'breakdown', row.id);
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
    row.breakdown = safeJsonParse(row.breakdown, 'breakdown', row.id);
    return row as CompanyQuote;
  }

  async deleteQuote(id: number): Promise<boolean> {
    const result = await this.executeCommand(
      'DELETE FROM company_quotes WHERE id = ?',
      [id],
    );
    return (result as any).affectedRows > 0;
  }

  async search(params: {
    limit?: number | undefined;
    offset?: number | undefined;
    minRating?: number | undefined;
    minBasePrice?: number | undefined;
    maxBasePrice?: number | undefined;
    maxTotalFee?: number | undefined;
    country?: string | undefined;
    city?: string | undefined;
    isVip?: boolean | undefined;
    isOnboardingFree?: boolean | undefined;
    search?: string | undefined;
    orderBy?: 'rating' | 'cheapest' | 'name' | 'newest' | undefined;
    orderDirection?: 'asc' | 'desc' | undefined;
  }): Promise<{ items: Company[]; total: number }> {
    const {
      limit = 20,
      offset = 0,
      minRating,
      minBasePrice,
      maxBasePrice,
      maxTotalFee,
      country,
      city,
      isVip,
      isOnboardingFree,
      search,
      orderBy,
      orderDirection,
    } = params;

    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (typeof minRating === 'number' && Number.isFinite(minRating)) {
      whereClauses.push('c.rating >= ?');
      queryParams.push(minRating);
    }
    if (typeof minBasePrice === 'number' && Number.isFinite(minBasePrice)) {
      whereClauses.push('c.base_price >= ?');
      queryParams.push(minBasePrice);
    }
    if (typeof maxBasePrice === 'number' && Number.isFinite(maxBasePrice)) {
      whereClauses.push('c.base_price <= ?');
      queryParams.push(maxBasePrice);
    }
    if (typeof maxTotalFee === 'number' && Number.isFinite(maxTotalFee)) {
      whereClauses.push('c.cheapest_score <= ?');
      queryParams.push(maxTotalFee);
    }
    if (typeof country === 'string' && country.trim().length > 0) {
      whereClauses.push('c.country = ?');
      queryParams.push(country.trim());
    }
    if (typeof city === 'string' && city.trim().length > 0) {
      whereClauses.push('c.city = ?');
      queryParams.push(city.trim());
    }
    if (typeof isVip === 'boolean') {
      whereClauses.push('c.is_vip = ?');
      queryParams.push(isVip ? 1 : 0);
    }
    if (typeof isOnboardingFree === 'boolean') {
      whereClauses.push('c.subscription_free = ?');
      queryParams.push(isOnboardingFree ? 1 : 0);
    }
    if (typeof search === 'string' && search.trim().length > 0) {
      whereClauses.push('c.name LIKE ?');
      queryParams.push(`%${search.trim()}%`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderSql = 'ORDER BY created_at DESC';
    const dir = orderDirection && orderDirection.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const weightedRatingOrder = 'ORDER BY (c.rating * LEAST(IFNULL(r.review_count, 0), 20)) DESC, c.rating DESC';

    switch (orderBy) {
      case 'rating': {
        orderSql = weightedRatingOrder;
        break;
      }
      case 'cheapest': {
        const cheapestDir = orderDirection
          ? dir
          : 'ASC';
        orderSql = `ORDER BY cheapest_score ${cheapestDir}`;
        break;
      }
      case 'name': {
        orderSql = `ORDER BY name ${dir}`;
        break;
      }
      case 'newest': {
        orderSql = `ORDER BY created_at ${dir}`;
        break;
      }
      default: {
        if (search && search.trim().length > 0) {
          orderSql = weightedRatingOrder;
        }
        break;
      }
    }

    const countRows = await this.executeQuery(
      `SELECT COUNT(*) AS cnt FROM companies c ${whereSql}`,
      queryParams,
    );
    const total = countRows.length ? (countRows[0] as { cnt: number }).cnt : 0;

    if (total === 0) {
      return { items: [], total: 0 };
    }

    const rows = await this.executeQuery(
      `SELECT c.id, c.owner_user_id, c.name, c.slug, c.base_price, c.price_per_mile, c.customs_fee, c.service_fee, c.broker_fee, c.insurance, c.final_formula, c.description, c.country, c.city, c.state, c.rating, c.is_vip, c.subscription_free, c.subscription_ends_at, c.services, c.phone_number, c.contact_email, c.website, c.established_year, c.cheapest_score, c.created_at, c.updated_at
       FROM companies c
        LEFT JOIN (
          SELECT company_id, COUNT(*) AS review_count
          FROM company_reviews
          GROUP BY company_id
       ) r ON r.company_id = c.id
       ${whereSql} ${orderSql} LIMIT ${Math.floor(safeLimit)} OFFSET ${Math.floor(safeOffset)}`,
      queryParams,
    );

    for (const row of rows) {
      row.final_formula = safeJsonParse(row.final_formula, 'final_formula', row.id);
      row.services = safeJsonParse(row.services, 'services', row.id);
    }

    return { items: rows as Company[], total };
  }

  async findByOwnerUserId(ownerUserId: number): Promise<Company | null> {
    const rows = await this.executeQuery(
      'SELECT id, owner_user_id, name, slug, base_price, price_per_mile, customs_fee, service_fee, broker_fee, insurance, final_formula, description, country, city, state, rating, is_vip, subscription_free, subscription_ends_at, services, phone_number, contact_email, website, established_year, created_at, updated_at FROM companies WHERE owner_user_id = ?',
      [ownerUserId],
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    row.final_formula = safeJsonParse(row.final_formula, 'final_formula', row.id);
    row.services = safeJsonParse(row.services, 'services', row.id);
    return row as Company;
  }
}
