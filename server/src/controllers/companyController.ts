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
import { ValidationError, NotFoundError } from '../types/errors.js';
import { ShippingQuoteService } from '../services/ShippingQuoteService.js';
import { FxRateService } from '../services/FxRateService.js';

interface CalculatedQuoteResponse {
  company_name: string;
  total_price: number;
  delivery_time_days: number | null;
  breakdown: any;
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
  private shippingQuoteService: ShippingQuoteService;
  private fxRateService: FxRateService;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.companyModel = new CompanyModel(fastify);
    this.vehicleModel = new VehicleModel(fastify);
    this.shippingQuoteService = new ShippingQuoteService(fastify);
    this.fxRateService = new FxRateService(fastify);
  }

  // ---------------------------------------------------------------------------
  // Companies (core, independent entities)
  // ---------------------------------------------------------------------------

  async createCompany(data: CompanyCreate): Promise<Company> {
    return this.companyModel.create(data);
  }

  async getCompanyById(id: number): Promise<CompanyWithRelations> {
    const company = await this.companyModel.getWithRelations(id);
    if (!company) {
      throw new NotFoundError('Company');
    }
    return company;
  }

  async getCompanies(limit: number = 100, offset: number = 0): Promise<Company[]> {
    return this.companyModel.findAll(limit, offset);
  }

  async updateCompany(id: number, updates: CompanyUpdate): Promise<Company> {
    const updated = await this.companyModel.update(id, updates);
    if (!updated) {
      throw new NotFoundError('Company');
    }
    return updated;
  }

  async deleteCompany(id: number): Promise<void> {
    const deleted = await this.companyModel.delete(id);
    if (!deleted) {
      throw new NotFoundError('Company');
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
        if (typeof breakdown.total_price === 'number') {
          breakdown.total_price = breakdown.total_price * rate;
        }
      }

      return {
        company_name: q.company_name,
        total_price: convertedTotal,
        delivery_time_days: q.delivery_time_days,
        breakdown,
      };
    });
  }
  private async ensureVehicleExists(vehicleId: number): Promise<void> {
    const exists = await this.vehicleModel.existsById(vehicleId);
    if (!exists) {
      throw new NotFoundError('Vehicle');
    }
  }

  /**
   * Calculate and persist quotes for all companies for a given vehicle.
   *
   * Workflow:
   * - Load full vehicle data (make, model, year, yard_name, source)
   * - Derive distance_miles from yard_name -> Poti, Georgia
   * - Load all companies and, for each company:
   *   - Apply default pricing OR override with company.final_formula JSON
   *   - Compute total_price
   *   - Build a detailed breakdown JSON for transparency
   *   - Insert a row into company_quotes
   * - Return a vehicle + quotes response DTO for the frontend.
   */
  async calculateQuotesForVehicle(
    vehicleId: number,
    currency?: string,
  ): Promise<VehicleQuotesResponse> {
    const vehicle: Vehicle | null = await this.vehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Fetch all companies to calculate quotes for each
    const companies = await this.companyModel.findAll(1000, 0);
    if (!companies.length) {
      throw new ValidationError('No companies configured for quote calculation');
    }

    // Delegate numeric distance and price computation to the
    // ShippingQuoteService so that pricing rules can evolve
    // independently of HTTP and persistence concerns.
    const { distanceMiles, quotes: computedQuotes } =
      await this.shippingQuoteService.computeQuotesForVehicle(vehicle, companies);

    const quotes: CalculatedQuoteResponse[] = [];

    for (const cq of computedQuotes) {
      const quoteCreate: CompanyQuoteCreate = {
        company_id: cq.companyId,
        vehicle_id: vehicleId,
        total_price: cq.totalPrice,
        breakdown: cq.breakdown,
        delivery_time_days: cq.deliveryTimeDays,
      };

      const created = await this.companyModel.createQuote(quoteCreate);

      quotes.push({
        company_name: cq.companyName,
        total_price: created.total_price,
        delivery_time_days: created.delivery_time_days,
        breakdown: created.breakdown,
      });
    }

    const normalizedCurrency = this.normalizeCurrencyCode(currency);
    const convertedQuotes = await this.maybeConvertQuoteTotals(quotes, normalizedCurrency);

    // Sort quotes by total_price ascending so the client sees the
    // cheapest offers first.
    convertedQuotes.sort((a, b) => a.total_price - b.total_price);

    return {
      vehicle_id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: (vehicle as any).mileage ?? null,
      yard_name: vehicle.yard_name,
      source: vehicle.source,
      distance_miles: distanceMiles,
      quotes: convertedQuotes,
    };
  }

  /**
   * Calculate quotes for a filtered, paginated list of vehicles without
   * persisting results to company_quotes.
   *
   * This is useful for search screens where the client wants to see
   * multiple vehicle + quote options in a single call based on
   * make/model/year filters.
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

  async createQuoteAdmin(data: CompanyQuoteCreate): Promise<CompanyQuote> {
    // Admin-only operation: both company_id and vehicle_id must be valid
    const company = await this.companyModel.findById(data.company_id);
    if (!company) {
      throw new NotFoundError('Company');
    }

    await this.ensureVehicleExists(data.vehicle_id);

    return this.companyModel.createQuote(data);
  }

  async updateQuote(id: number, updates: CompanyQuoteUpdate): Promise<CompanyQuote> {
    const updated = await this.companyModel.updateQuote(id, updates);
    if (!updated) {
      throw new NotFoundError('Quote');
    }
    return updated;
  }

  async deleteQuote(id: number): Promise<void> {
    const deleted = await this.companyModel.deleteQuote(id);
    if (!deleted) {
      throw new NotFoundError('Quote');
    }
  }
}
