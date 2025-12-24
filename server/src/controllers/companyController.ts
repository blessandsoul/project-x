import { FastifyInstance } from 'fastify';
import {
  Company,
  CompanyCreate,
  CompanyUpdate,
  CompanySocialLink,
  CompanySocialLinkUpdate,
  CompanyQuote,
  CompanyQuoteCreate,
  CompanyQuoteUpdate,
  CompanyWithRelations,
} from '../types/company.js';
import { Vehicle } from '../types/vehicle.js';
import { CompanyModel } from '../models/CompanyModel.js';
import { VehicleModel } from '../models/VehicleModel.js';
import { CompanyReviewModel } from '../models/CompanyReviewModel.js';
import { UserModel } from '../models/UserModel.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../types/errors.js';
import { CompanyReview, CompanyReviewCreate, CompanyReviewUpdate } from '../types/companyReview.js';
import { ShippingQuoteService } from '../services/ShippingQuoteService.js';
import { FxRateService } from '../services/FxRateService.js';
import { withTransaction } from '../utils/transactions.js';
import type { PoolConnection } from 'mysql2/promise';
import { getUserAvatarUrls, getCompanyLogoUrls } from '../services/ImageUploadService.js';
import { CalculatorRequestBody } from '../services/CalculatorRequestBuilder.js';

interface CalculatedQuoteResponse {
  company_id: number;
  company_name: string;
  website?: string | null;
  total_price: number;
  delivery_time_days: number | null;
  breakdown: any;
  company_rating?: number;
  company_review_count?: number;
}

interface VehicleQuotesResponse {
  vehicle_id: number;
  make: string;
  model: string;
  year: number;
  mileage: number | null;
  yard_name: string;
  source: string;
  distance_miles: number;
  quotes: CalculatedQuoteResponse[];
}

/**
 * Company Controller
 *
 * Encapsulates business logic for companies, their social links,
 * and shipping quotes. Uses CompanyModel for all DB operations and
 * VehicleModel only to validate vehicle_id foreign key constraints.
 */
export class CompanyController {
  private fastify: FastifyInstance;
  private companyModel: CompanyModel;
  private vehicleModel: VehicleModel;
  private companyReviewModel: CompanyReviewModel;
  private shippingQuoteService: ShippingQuoteService;
  private fxRateService: FxRateService;
  private userModel: UserModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.companyModel = new CompanyModel(fastify);
    this.vehicleModel = new VehicleModel(fastify);
    this.companyReviewModel = new CompanyReviewModel(fastify);
    this.shippingQuoteService = new ShippingQuoteService(fastify);
    this.fxRateService = new FxRateService(fastify);
    this.userModel = new UserModel(fastify);
  }


  /**
   * Get user avatar URLs using ImageUploadService
   */
  private async computeUserAvatarUrls(username: string | null | undefined): Promise<{ avatar_url: string | null; original_avatar_url: string | null }> {
    const urls = await getUserAvatarUrls(username);
    return {
      avatar_url: urls.url,
      original_avatar_url: urls.originalUrl,
    };
  }

  /**
   * Get company logo URLs using ImageUploadService
   */
  private async computeLogoUrls(slug: string): Promise<{ logo_url: string | null; original_logo_url: string | null }> {
    const urls = await getCompanyLogoUrls(slug);
    return {
      logo_url: urls.url,
      original_logo_url: urls.originalUrl,
    };
  }

  // ---------------------------------------------------------------------------
  // Companies (core, independent entities)
  // ---------------------------------------------------------------------------

  async createCompany(data: CompanyCreate): Promise<Company> {
    return this.companyModel.create(data);
  }

  async getCompanyById(id: number): Promise<Company & { social_links: CompanySocialLink[]; reviewCount: number; logo_url: string | null; original_logo_url: string | null }> {
    const withRelations = await this.companyModel.getWithRelations(id);
    if (!withRelations) {
      throw new NotFoundError('Company');
    }

    const { social_links, quotes: _quotes, ...company } = withRelations;
    const agg = await this.companyReviewModel.getAggregatedRating(id);

    const { logo_url, original_logo_url } = await this.computeLogoUrls(company.slug);

    return {
      ...(company as Company),
      social_links,
      // rating on the company row is already maintained by
      // updateCompanyRating; reviewCount is derived from the
      // aggregation so the frontend can show "X reviews".
      reviewCount: agg.count,
      logo_url,
      original_logo_url,
    };
  }

  async getCompanies(limit: number = 100, offset: number = 0): Promise<Array<Company & { reviewCount: number; logo_url: string | null; original_logo_url: string | null }>> {
    // Use findAllActive to exclude deactivated companies from public listings
    const companies = await this.companyModel.findAllActive(limit, offset);
    if (!companies.length) {
      return [];
    }

    const ids = companies.map((c) => c.id);
    const counts = await this.companyReviewModel.countByCompanyIds(ids);
    const logoMeta = await Promise.all(
      companies.map((c) => this.computeLogoUrls(c.slug)),
    );

    return companies.map((c, index) => ({
      ...c,
      reviewCount: counts[c.id] ?? 0,
      logo_url: logoMeta[index]?.logo_url ?? null,
      original_logo_url: logoMeta[index]?.original_logo_url ?? null,
    }));
  }

  async searchCompanies(params: {
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
  }): Promise<{ items: Array<Company & { reviewCount: number; logo_url: string | null; original_logo_url: string | null }>; total: number; limit: number; offset: number }> {
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

    const { items, total } = await this.companyModel.search({
      limit: safeLimit,
      offset: safeOffset,
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
    });

    if (!items.length) {
      return { items: [], total, limit: safeLimit, offset: safeOffset };
    }

    const ids = items.map((c) => c.id);
    const counts = await this.companyReviewModel.countByCompanyIds(ids);
    const logoMeta = await Promise.all(
      items.map((c) => this.computeLogoUrls(c.slug)),
    );

    const withCounts = items.map((c, index) => ({
      ...c,
      reviewCount: counts[c.id] ?? 0,
      logo_url: logoMeta[index]?.logo_url ?? null,
      original_logo_url: logoMeta[index]?.original_logo_url ?? null,
    }));

    return { items: withCounts, total, limit: safeLimit, offset: safeOffset };
  }

  async updateCompany(id: number, updates: CompanyUpdate): Promise<Company> {
    const updated = await this.companyModel.update(id, updates);
    if (!updated) {
      throw new NotFoundError('Company');
    }
    return updated;
  }

  async deleteCompany(id: number): Promise<void> {
    // Fetch company details BEFORE deletion to get slug for asset cleanup
    const company = await this.companyModel.findById(id);
    if (!company) {
      throw new NotFoundError('Company');
    }

    // Store owner_user_id for user role reversion
    const ownerUserId = company.owner_user_id;

    // Delete from database (hard delete with cascading to quotes and social links)
    const deleted = await this.companyModel.delete(id);
    if (!deleted) {
      throw new NotFoundError('Company');
    }

    // Revert owner user's role from 'company' back to 'user' and clear company_id
    // This allows the user to create a new company in the future if needed
    if (ownerUserId) {
      try {
        await this.userModel.update(ownerUserId, {
          role: 'user',
          company_id: null,
        });
        this.fastify.log.info({
          companyId: id,
          userId: ownerUserId,
        }, 'User role reverted from company to user');
      } catch (error) {
        // Log error but don't fail the deletion - user role update is best-effort
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.fastify.log.error({
          companyId: id,
          userId: ownerUserId,
          error: message,
        }, 'Failed to revert user role - manual update may be required');
      }
    }

    // Clean up uploaded assets AFTER successful DB deletion
    // This is best-effort - if it fails, we log but don't fail the operation
    if (company.slug) {
      try {
        const { deleteCompanyAssets } = await import('../utils/fs.js');
        const assetsDeleted = await deleteCompanyAssets(company.slug);
        if (assetsDeleted) {
          this.fastify.log.info({
            companyId: id,
            slug: company.slug,
          }, 'Company assets deleted successfully');
        }
      } catch (error) {
        // Log error but don't fail the deletion - filesystem cleanup is best-effort
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.fastify.log.error({
          companyId: id,
          slug: company.slug,
          error: message,
        }, 'Failed to delete company assets - manual cleanup may be required');
      }
    }
  }


  // ---------------------------------------------------------------------------
  // Social Links (optional, dependent on company_id)
  // ---------------------------------------------------------------------------

  async getSocialLinks(companyId: number): Promise<CompanySocialLink[]> {
    // Ensure parent company exists before returning dependent records
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }
    return this.companyModel.getSocialLinksByCompanyId(companyId);
  }

  async getSocialLinkById(id: number): Promise<CompanySocialLink> {
    const link = await this.companyModel.getSocialLinkById(id);
    if (!link) {
      throw new NotFoundError('Social link');
    }
    return link;
  }

  async createSocialLink(companyId: number, url: string): Promise<CompanySocialLink> {
    // Validate parent company exists (FK constraint in code, not just DB)
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }

    if (!url || typeof url !== 'string') {
      throw new ValidationError('Social link URL is required');
    }

    return this.companyModel.createSocialLink({ company_id: companyId, url });
  }

  async updateSocialLink(id: number, updates: CompanySocialLinkUpdate): Promise<CompanySocialLink> {
    const updated = await this.companyModel.updateSocialLink(id, updates);
    if (!updated) {
      throw new NotFoundError('Social link');
    }
    return updated;
  }

  async deleteSocialLink(id: number): Promise<void> {
    const deleted = await this.companyModel.deleteSocialLink(id);
    if (!deleted) {
      throw new NotFoundError('Social link');
    }
  }

  // ---------------------------------------------------------------------------
  // Reviews (user-generated, dependent on company_id)
  // ---------------------------------------------------------------------------

  async getCompanyReviewsPaginated(companyId: number, limit: number = 10, offset: number = 0): Promise<{
    items: CompanyReview[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }

    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 50 ? limit : 10;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    const [rawItems, total] = await Promise.all([
      this.companyReviewModel.getByCompanyId(companyId, safeLimit, safeOffset),
      this.companyReviewModel.countByCompanyId(companyId),
    ]);

    const items = await Promise.all(
      rawItems.map(async (review) => {
        const avatarMeta = await this.computeUserAvatarUrls((review as any).user_name ?? null);
        return {
          ...review,
          avatar: avatarMeta.avatar_url,
        } as CompanyReview & { avatar?: string | null };
      }),
    );

    return { items, total, limit: safeLimit, offset: safeOffset };
  }

  async createCompanyReview(companyId: number, userId: number, payload: { rating: number; comment?: string | null }): Promise<CompanyReview> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }

    const { rating, comment = null } = payload;
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be a number between 1 and 5');
    }

    const createData: CompanyReviewCreate = {
      company_id: companyId,
      user_id: userId,
      rating,
      comment,
    };

    return withTransaction(this.fastify, async (conn: PoolConnection) => {
      // Insert review
      const insertResult = await conn.execute(
        'INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [createData.company_id, createData.user_id, createData.rating, createData.comment],
      );

      const insertInfo = insertResult[0] as any;
      const reviewId = insertInfo.insertId as number;

      const [reviewRows] = await conn.execute(
        'SELECT r.id, r.company_id, r.user_id, u.username AS user_name, r.rating, r.comment, r.created_at, r.updated_at FROM company_reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?',
        [reviewId],
      );
      const typedReviewRows = reviewRows as (CompanyReview & { user_name?: string | null })[];
      const created = typedReviewRows[0];
      if (!created) {
        throw new Error('Failed to load created review');
      }

      const avatarMeta = await this.computeUserAvatarUrls(created.user_name ?? null);
      const createdWithAvatar: CompanyReview & { avatar?: string | null } = {
        ...created,
        avatar: avatarMeta.avatar_url,
      };

      // Recalculate and update company rating
      const [aggRows] = await conn.execute(
        'SELECT AVG(rating) AS rating, COUNT(*) AS count FROM company_reviews WHERE company_id = ?',
        [companyId],
      );

      const agg = (aggRows as Array<{ rating: number | null; count: number }>)?.[0];
      const newRating = agg && agg.rating != null ? agg.rating : 0;

      await conn.execute('UPDATE companies SET rating = ? WHERE id = ?', [newRating, companyId]);

      return createdWithAvatar;
    });
  }

  async updateCompanyReview(companyId: number, reviewId: number, userId: number, updates: CompanyReviewUpdate): Promise<CompanyReview> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }

    const existing = await this.companyReviewModel.getById(reviewId);
    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundError('Review');
    }

    if (existing.user_id !== userId) {
      throw new AuthorizationError('You can only modify your own reviews');
    }

    if (updates.rating !== undefined) {
      const r = updates.rating;
      if (!Number.isFinite(r) || r < 1 || r > 5) {
        throw new ValidationError('Rating must be a number between 1 and 5');
      }
    }

    return withTransaction(this.fastify, async (conn: PoolConnection) => {
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

      if (fields.length) {
        fields.push('updated_at = NOW()');
        values.push(reviewId);
        await conn.execute(
          `UPDATE company_reviews SET ${fields.join(', ')} WHERE id = ?`,
          values,
        );
      }

      const [reviewRows] = await conn.execute(
        'SELECT r.id, r.company_id, r.user_id, u.username AS user_name, r.rating, r.comment, r.created_at, r.updated_at FROM company_reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?',
        [reviewId],
      );
      const typedReviewRows = reviewRows as (CompanyReview & { user_name?: string | null })[];
      const updated = typedReviewRows[0];
      if (!updated) {
        throw new NotFoundError('Review');
      }

      const avatarMeta = await this.computeUserAvatarUrls(updated.user_name ?? null);
      const updatedWithAvatar: CompanyReview & { avatar?: string | null } = {
        ...updated,
        avatar: avatarMeta.avatar_url,
      };

      const [aggRows] = await conn.execute(
        'SELECT AVG(rating) AS rating, COUNT(*) AS count FROM company_reviews WHERE company_id = ?',
        [companyId],
      );
      const agg = (aggRows as Array<{ rating: number | null; count: number }>)?.[0];
      const newRating = agg && agg.rating != null ? agg.rating : 0;

      await conn.execute('UPDATE companies SET rating = ? WHERE id = ?', [newRating, companyId]);

      return updatedWithAvatar;
    });
  }

  async deleteCompanyReview(companyId: number, reviewId: number, userId: number): Promise<void> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }

    const existing = await this.companyReviewModel.getById(reviewId);
    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundError('Review');
    }

    if (existing.user_id !== userId) {
      throw new AuthorizationError('You can only delete your own reviews');
    }

    await withTransaction(this.fastify, async (conn: PoolConnection) => {
      const [deleteResult] = await conn.execute(
        'DELETE FROM company_reviews WHERE id = ?',
        [reviewId],
      );
      const info = deleteResult as any;
      if (!info.affectedRows) {
        throw new NotFoundError('Review');
      }

      const [aggRows] = await conn.execute(
        'SELECT AVG(rating) AS rating, COUNT(*) AS count FROM company_reviews WHERE company_id = ?',
        [companyId],
      );
      const agg = (aggRows as Array<{ rating: number | null; count: number }>)?.[0];
      const newRating = agg && agg.rating != null ? agg.rating : 0;

      await conn.execute('UPDATE companies SET rating = ? WHERE id = ?', [newRating, companyId]);
    });
  }

  // ---------------------------------------------------------------------------
  // Quotes (auto-calculated per vehicle & company)
  // ---------------------------------------------------------------------------
  private normalizeCurrencyCode(rawCurrency?: string): 'USD' | 'GEL' {
    if (!rawCurrency) {
      return 'USD';
    }

    const upper = rawCurrency.trim().toUpperCase();
    if (upper === 'USD') return 'USD';
    if (upper === 'GEL') return 'GEL';

    throw new ValidationError('Unsupported currency. Allowed values: usd, gel');
  }

  private async maybeConvertQuoteTotals(
    quotes: CalculatedQuoteResponse[],
    currency: 'USD' | 'GEL',
  ): Promise<CalculatedQuoteResponse[]> {
    if (currency === 'USD') {
      return quotes;
    }

    const rate = await this.fxRateService.getLatestUsdGelRate();
    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new ValidationError('Exchange rate for USD->GEL is not available');
    }

    return quotes.map((q) => {
      const convertedTotal = q.total_price * rate;
      const breakdown = q.breakdown ? { ...q.breakdown } : q.breakdown;

      if (breakdown && typeof breakdown === 'object') {
        if (typeof (breakdown as any).total_price === 'number') {
          (breakdown as any).total_price = (breakdown as any).total_price * rate;
        }
      }

      return {
        ...q,
        total_price: convertedTotal,
        breakdown,
      };
    });
  }

  async getCompanyQuotesPaginated(companyId: number, limit: number = 20, offset: number = 0, currency?: string): Promise<{
    items: CompanyQuote[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }

    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    const allQuotes = await this.companyModel.getQuotesByCompanyId(companyId);
    const total = allQuotes.length;

    const pageSlice = allQuotes.slice(safeOffset, safeOffset + safeLimit);

    const normalizedCurrency = this.normalizeCurrencyCode(currency);
    if (normalizedCurrency === 'USD') {
      return {
        items: pageSlice,
        total,
        limit: safeLimit,
        offset: safeOffset,
      };
    }

    const rate = await this.fxRateService.getLatestUsdGelRate();
    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new ValidationError('Exchange rate for USD->GEL is not available');
    }

    const convertedItems = pageSlice.map((q) => {
      const converted: CompanyQuote = {
        ...q,
        total_price: q.total_price * rate,
      };

      if (converted.breakdown && typeof converted.breakdown === 'object') {
        try {
          const breakdown: any = converted.breakdown;
          if (typeof breakdown.total_price === 'number') {
            breakdown.total_price = breakdown.total_price * rate;
          }
          converted.breakdown = breakdown;
        } catch {
          // ignore breakdown conversion errors
        }
      }

      return converted;
    });

    return {
      items: convertedItems,
      total,
      limit: safeLimit,
      offset: safeOffset,
    };
  }
  private async ensureVehicleExists(vehicleId: number): Promise<void> {
    const exists = await this.vehicleModel.existsById(vehicleId);
    if (!exists) {
      throw new NotFoundError('Vehicle');
    }
  }

  /**
   * Calculate quotes for a single vehicle across all companies.
   *
   * Quotes are calculated fresh from the calculator API on each request.
   * Results are NOT persisted to the database since calculator API prices
   * can change anytime. Caching is handled by the ShippingQuoteService
   * via Redis with a short TTL.
   */
  async calculateQuotesForVehicle(
    vehicleId: number,
    currency?: string,
    options?: { limit?: number; offset?: number; minRating?: number },
  ): Promise<VehicleQuotesResponse & { totalCompanies: number }> {
    const vehicle: Vehicle | null = await this.vehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Always calculate quotes fresh from calculator API.
    // No DB persistence - calculator prices can change anytime.
    // Only use active companies (exclude those where owner has deactivated)
    const companies = await this.companyModel.findAllActive(1000, 0);

    if (!companies.length) {
      throw new ValidationError('No companies configured for quote calculation');
    }

    const { distanceMiles, quotes: computedQuotes } =
      await this.shippingQuoteService.computeQuotesForVehicle(vehicle, companies);

    const companyIds = companies.map((c) => c.id);
    const reviewCounts = await this.companyReviewModel.countByCompanyIds(companyIds);
    const companyMetaById = new Map<number, { rating: number; reviewCount: number }>();
    for (const company of companies) {
      const rating = typeof (company as any).rating === 'number' ? (company as any).rating : 0;
      const reviewCount = reviewCounts[company.id] ?? 0;
      companyMetaById.set(company.id, { rating, reviewCount });
    }

    let quotes: CalculatedQuoteResponse[] = computedQuotes.map((cq) => {
      const meta = companyMetaById.get(cq.companyId);
      return {
        company_id: cq.companyId,
        company_name: cq.companyName,
        total_price: cq.totalPrice,
        delivery_time_days: cq.deliveryTimeDays,
        breakdown: cq.breakdown,
        company_rating: meta?.rating ?? 0,
        company_review_count: meta?.reviewCount ?? 0,
      };
    });

    const normalizedCurrency = this.normalizeCurrencyCode(currency);
    quotes = await this.maybeConvertQuoteTotals(quotes, normalizedCurrency);

    quotes.sort((a, b) => a.total_price - b.total_price);

    if (options?.minRating !== undefined && options.minRating > 0) {
      quotes = quotes.filter((q) => (q.company_rating ?? 0) >= options.minRating!);
    }

    const totalCompanies = quotes.length;

    if (options && (typeof options.limit === 'number' || typeof options.offset === 'number')) {
      const safeLimit = Number.isFinite(options.limit as number) && (options.limit as number) > 0 && (options.limit as number) <= 100
        ? (options.limit as number)
        : 20;
      const safeOffset = Number.isFinite(options.offset as number) && (options.offset as number) >= 0
        ? (options.offset as number)
        : 0;
      quotes = quotes.slice(safeOffset, safeOffset + safeLimit);
    }

    return {
      vehicle_id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: (vehicle as any).mileage ?? null,
      yard_name: vehicle.yard_name,
      source: vehicle.source,
      distance_miles: distanceMiles,
      quotes,
      totalCompanies,
    };
  }

  /**
   * Calculate quotes for a single vehicle using pre-built calculator input.
   * 
   * This method accepts a normalized CalculatorRequestBody that has already
   * been validated and normalized by CalculatorRequestBuilder.
   * 
   * Used by POST /vehicles/:vehicleId/calculate-quotes which accepts
   * auction and usacity from the client and normalizes them before calling this.
   */
  async calculateQuotesForVehicleWithInput(
    vehicleId: number,
    calculatorInput: CalculatorRequestBody,
    currency?: string,
    options?: { limit?: number; offset?: number; minRating?: number },
  ): Promise<VehicleQuotesResponse & { totalCompanies: number }> {
    const vehicle: Vehicle | null = await this.vehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Load all active companies (exclude those where owner has deactivated)
    const companies = await this.companyModel.findAllActive(1000, 0);
    if (!companies.length) {
      throw new ValidationError('No companies configured for quote calculation');
    }

    // Calculate quotes using the pre-built calculator input
    const { distanceMiles, quotes: computedQuotes } =
      await this.shippingQuoteService.computeQuotesWithCalculatorInput(calculatorInput, companies);

    // Build company metadata (ratings, review counts, logo URLs)
    const companyIds = companies.map((c) => c.id);
    const reviewCounts = await this.companyReviewModel.countByCompanyIds(companyIds);
    const companyMetaById = new Map<number, { rating: number; reviewCount: number; logoUrl: string | null; website: string | null }>();

    // Compute logo URLs for all companies
    const logoUrlPromises = companies.map(async (company) => {
      const logoMeta = await this.computeLogoUrls(company.slug || company.name);
      return { companyId: company.id, logoUrl: logoMeta.logo_url };
    });
    const logoResults = await Promise.all(logoUrlPromises);
    const logoUrlsById = new Map(logoResults.map(r => [r.companyId, r.logoUrl]));

    for (const company of companies) {
      const rating = typeof (company as any).rating === 'number' ? (company as any).rating : 0;
      const reviewCount = reviewCounts[company.id] ?? 0;
      const logoUrl = logoUrlsById.get(company.id) ?? null;
      const website = company.website ?? null;
      companyMetaById.set(company.id, { rating, reviewCount, logoUrl, website });
    }

    // Map computed quotes to response format
    let quotes: CalculatedQuoteResponse[] = computedQuotes.map((cq) => {
      const meta = companyMetaById.get(cq.companyId);
      return {
        company_id: cq.companyId,
        company_name: cq.companyName,
        website: meta?.website ?? null,
        logoUrl: meta?.logoUrl ?? null,
        total_price: cq.totalPrice,
        delivery_time_days: cq.deliveryTimeDays,
        breakdown: cq.breakdown,
        company_rating: meta?.rating ?? 0,
        company_review_count: meta?.reviewCount ?? 0,
      };
    });

    // Currency conversion if needed
    const normalizedCurrency = this.normalizeCurrencyCode(currency);
    quotes = await this.maybeConvertQuoteTotals(quotes, normalizedCurrency);

    // Sort by price (cheapest first)
    quotes.sort((a, b) => a.total_price - b.total_price);

    // Filter by minimum rating if specified
    if (options?.minRating !== undefined && options.minRating > 0) {
      quotes = quotes.filter((q) => (q.company_rating ?? 0) >= options.minRating!);
    }

    const totalCompanies = quotes.length;

    // Apply pagination
    if (options && (typeof options.limit === 'number' || typeof options.offset === 'number')) {
      const safeLimit = Number.isFinite(options.limit as number) && (options.limit as number) > 0 && (options.limit as number) <= 100
        ? (options.limit as number)
        : 20;
      const safeOffset = Number.isFinite(options.offset as number) && (options.offset as number) >= 0
        ? (options.offset as number)
        : 0;
      quotes = quotes.slice(safeOffset, safeOffset + safeLimit);
    }

    return {
      vehicle_id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: (vehicle as any).mileage ?? null,
      yard_name: vehicle.yard_name,
      source: vehicle.source,
      distance_miles: distanceMiles,
      quotes,
      totalCompanies,
    };
  }

  /**
   * Search for vehicles matching filters and compute quotes without
   * persisting results to company_quotes.
   */
  async searchQuotesForVehicles(
    filters: {
      make?: string;
      model?: string;
      year?: number;
      yearFrom?: number;
      yearTo?: number;
      priceFrom?: number;
      priceTo?: number;
      mileageFrom?: number;
      mileageTo?: number;
      fuelType?: string;
      category?: string;
      drive?: string;
    },
    limit: number = 20,
    offset: number = 0,
    currency?: string,
  ): Promise<{
    items: VehicleQuotesResponse[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  }> {
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 50 ? limit : 20;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    const minTotalPrice =
      typeof filters.priceFrom === 'number' && Number.isFinite(filters.priceFrom)
        ? filters.priceFrom
        : null;
    const maxTotalPrice =
      typeof filters.priceTo === 'number' && Number.isFinite(filters.priceTo)
        ? filters.priceTo
        : null;

    const total = await this.vehicleModel.countByFilters(filters);
    if (total === 0) {
      throw new ValidationError('No vehicles found for the given filters');
    }

    const vehicles: Vehicle[] = await this.vehicleModel.searchByFilters(filters, safeLimit, safeOffset);

    // For search flows, limit the number of companies we calculate
    // quotes for to keep the response time reasonable. This limit can
    // be tuned via SEARCH_QUOTES_COMPANY_LIMIT.
    const rawCompanyLimit = process.env.SEARCH_QUOTES_COMPANY_LIMIT;
    let companyLimit = Number(rawCompanyLimit ?? 10);
    if (!Number.isFinite(companyLimit) || companyLimit <= 0) {
      companyLimit = 10;
    }
    if (companyLimit > 1000) {
      companyLimit = 1000;
    }

    const companies = await this.companyModel.findAll(companyLimit, 0);
    if (!companies.length) {
      throw new ValidationError('No companies configured for quote calculation');
    }

    const items: VehicleQuotesResponse[] = [];
    const normalizedCurrency = this.normalizeCurrencyCode(currency);

    for (const vehicle of vehicles) {
      const { distanceMiles, quotes: computedQuotes } =
        await this.shippingQuoteService.computeQuotesForVehicle(vehicle, companies);

      // If price range filters are provided, apply them to the computed
      // totalPrice (vehicle + shipping), not the raw calc_price from DB.
      const filteredComputedQuotes = computedQuotes.filter((cq) => {
        if (minTotalPrice !== null && cq.totalPrice < minTotalPrice) {
          return false;
        }
        if (maxTotalPrice !== null && cq.totalPrice > maxTotalPrice) {
          return false;
        }
        return true;
      });

      // If no quotes fall into the requested total price range for this
      // vehicle, skip it so the client only sees relevant options.
      if (filteredComputedQuotes.length === 0) {
        continue;
      }

      let quotes: CalculatedQuoteResponse[] = filteredComputedQuotes.map((cq) => ({
        company_id: cq.companyId,
        company_name: cq.companyName,
        total_price: cq.totalPrice,
        delivery_time_days: cq.deliveryTimeDays,
        breakdown: cq.breakdown,
      }));

      quotes = await this.maybeConvertQuoteTotals(quotes, normalizedCurrency);

      items.push({
        vehicle_id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: (vehicle as any).mileage ?? null,
        yard_name: vehicle.yard_name,
        source: vehicle.source,
        distance_miles: distanceMiles,
        quotes,
      });
    }

    const page = Math.floor(safeOffset / safeLimit) + 1;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return { items, total, limit: safeLimit, offset: safeOffset, page, totalPages };
  }

  /**
   * Compare quotes for a fixed list of vehicles.
   *
   * This method is intended for "compare vehicles" flows where the
   * client already knows a small set of vehicle IDs (e.g. from
   * favorites or a search result) and wants to see quotes for each in
   * a single response.
   */
  async compareVehicles(
    vehicleIds: number[],
    quotesPerVehicle: number = 3,
    currency?: string,
  ): Promise<{
    currency: 'USD' | 'GEL';
    vehicles: Array<{
      vehicle_id: number;
      make: string;
      model: string;
      year: number;
      mileage: number | null;
      yard_name: string;
      source: string;
      distance_miles: number;
      quotes: CalculatedQuoteResponse[];
    }>;
  }> {
    if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      throw new ValidationError('vehicle_ids array is required');
    }

    // De-duplicate vehicle IDs while preserving the original order so
    // that clients can safely send arrays that may contain
    // duplicates (e.g. from UI selections) without receiving
    // duplicate entries in the response.
    const uniqueIds: number[] = [];
    const seen = new Set<number>();
    for (const rawId of vehicleIds) {
      const id = rawId;
      if (!seen.has(id)) {
        seen.add(id);
        uniqueIds.push(id);
      }
    }

    if (!uniqueIds.length) {
      throw new ValidationError('vehicle_ids array is required');
    }

    if (uniqueIds.length > 5) {
      throw new ValidationError('You can compare at most 5 vehicles at a time');
    }

    const normalizedCurrency = this.normalizeCurrencyCode(currency);

    // For comparison flows we expect a small number of vehicles, but we
    // still reuse the same company limiting logic as search flows so
    // that performance characteristics remain predictable.
    const rawCompanyLimit = process.env.SEARCH_QUOTES_COMPANY_LIMIT;
    let companyLimit = Number(rawCompanyLimit ?? 10);
    if (!Number.isFinite(companyLimit) || companyLimit <= 0) {
      companyLimit = 10;
    }
    if (companyLimit > 1000) {
      companyLimit = 1000;
    }

    const companies = await this.companyModel.findAll(companyLimit, 0);
    if (!companies.length) {
      throw new ValidationError('No companies configured for quote calculation');
    }

    const vehicles: Vehicle[] = [];
    for (const id of uniqueIds) {
      if (!Number.isFinite(id) || id <= 0) {
        throw new ValidationError('Invalid vehicle id in vehicle_ids array');
      }
      const vehicle = await this.vehicleModel.findById(id);
      if (!vehicle) {
        throw new NotFoundError('Vehicle');
      }
      vehicles.push(vehicle);
    }

    const results: Array<{
      vehicle_id: number;
      make: string;
      model: string;
      year: number;
      mileage: number | null;
      yard_name: string;
      source: string;
      distance_miles: number;
      quotes: CalculatedQuoteResponse[];
    }> = [];

    // Normalize quotesPerVehicle to a safe positive integer.
    let quotesLimit = Number(quotesPerVehicle);
    if (!Number.isFinite(quotesLimit) || quotesLimit <= 0) {
      quotesLimit = 3;
    }

    for (const vehicle of vehicles) {
      const { distanceMiles, quotes: computedQuotes } =
        await this.shippingQuoteService.computeQuotesForVehicle(vehicle, companies);

      let quotes: CalculatedQuoteResponse[] = computedQuotes.map((cq) => ({
        company_id: cq.companyId,
        company_name: cq.companyName,
        total_price: cq.totalPrice,
        delivery_time_days: cq.deliveryTimeDays,
        breakdown: cq.breakdown,
      }));

      quotes = await this.maybeConvertQuoteTotals(quotes, normalizedCurrency);

      // Sort by total_price ascending and limit to quotesPerVehicle so
      // the response remains small and focused on the best options.
      quotes.sort((a, b) => a.total_price - b.total_price);
      const limitedQuotes = quotes.slice(0, quotesLimit);

      results.push({
        vehicle_id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: (vehicle as any).mileage ?? null,
        yard_name: vehicle.yard_name,
        source: vehicle.source,
        distance_miles: distanceMiles,
        quotes: limitedQuotes,
      });
    }

    return {
      currency: normalizedCurrency,
      vehicles: results,
    };
  }

  /**
   * @deprecated Quotes are no longer persisted to DB. This method returns
   * historical quotes only. Use calculateQuotesForVehicle for fresh quotes.
   */
  async getQuotesByVehicle(vehicleId: number, currency?: string): Promise<CompanyQuote[]> {
    // Validate vehicle exists to avoid leaking orphaned records
    await this.ensureVehicleExists(vehicleId);
    const quotes = await this.companyModel.getQuotesByVehicleId(vehicleId);

    const normalizedCurrency = this.normalizeCurrencyCode(currency);
    if (normalizedCurrency === 'USD') {
      return quotes;
    }

    const rate = await this.fxRateService.getLatestUsdGelRate();
    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new ValidationError('Exchange rate for USD->GEL is not available');
    }

    return quotes.map((q) => {
      const converted: CompanyQuote = {
        ...q,
        total_price: q.total_price * rate,
      };

      if (converted.breakdown && typeof converted.breakdown === 'object') {
        try {
          const breakdown: any = converted.breakdown;
          if (typeof breakdown.total_price === 'number') {
            breakdown.total_price = breakdown.total_price * rate;
          }
          converted.breakdown = breakdown;
        } catch {
          // ignore breakdown conversion errors
        }
      }

      return converted;
    });
  }

  /**
   * @deprecated Quotes are no longer persisted to DB. This method returns
   * historical quotes only.
   */
  async getQuotesByCompany(companyId: number, currency?: string): Promise<CompanyQuote[]> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }
    const quotes = await this.companyModel.getQuotesByCompanyId(companyId);

    const normalizedCurrency = this.normalizeCurrencyCode(currency);
    if (normalizedCurrency === 'USD') {
      return quotes;
    }

    const rate = await this.fxRateService.getLatestUsdGelRate();
    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new ValidationError('Exchange rate for USD->GEL is not available');
    }

    return quotes.map((q) => {
      const converted: CompanyQuote = {
        ...q,
        total_price: q.total_price * rate,
      };

      if (converted.breakdown && typeof converted.breakdown === 'object') {
        try {
          const breakdown: any = converted.breakdown;
          if (typeof breakdown.total_price === 'number') {
            breakdown.total_price = breakdown.total_price * rate;
          }
          converted.breakdown = breakdown;
        } catch {
          // ignore breakdown conversion errors
        }
      }

      return converted;
    });
  }

  /**
   * @deprecated Quotes are no longer persisted to DB since calculator API
   * prices can change anytime. Use calculateQuotesForVehicle instead.
   */
  async createQuoteAdmin(data: Pick<CompanyQuoteCreate, 'company_id' | 'vehicle_id'>): Promise<CompanyQuote> {
    // Admin-only operation: compute quote on-the-fly without persisting.
    const company = await this.companyModel.findById(data.company_id);
    if (!company) {
      throw new NotFoundError('Company');
    }

    const vehicle: Vehicle | null = await this.vehicleModel.findById(data.vehicle_id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Compute quote using calculator API (not persisted)
    const { quotes: computedQuotes } = await this.shippingQuoteService.computeQuotesForVehicle(vehicle, [company]);
    const [cq] = computedQuotes;
    if (!cq) {
      throw new ValidationError('Unable to compute quote for the given company and vehicle');
    }

    // Return as CompanyQuote shape without persisting
    return {
      id: 0, // Not persisted
      company_id: data.company_id,
      vehicle_id: data.vehicle_id,
      total_price: cq.totalPrice,
      breakdown: cq.breakdown,
      delivery_time_days: cq.deliveryTimeDays,
    } as CompanyQuote;
  }

  /**
   * @deprecated Quotes are no longer persisted to DB.
   */
  async updateQuote(id: number, updates: CompanyQuoteUpdate): Promise<CompanyQuote> {
    const updated = await this.companyModel.updateQuote(id, updates);
    if (!updated) {
      throw new NotFoundError('Quote');
    }
    return updated;
  }

  /**
   * @deprecated Quotes are no longer persisted to DB.
   */
  async deleteQuote(id: number): Promise<void> {
    const deleted = await this.companyModel.deleteQuote(id);
    if (!deleted) {
      throw new NotFoundError('Quote');
    }
  }
}
