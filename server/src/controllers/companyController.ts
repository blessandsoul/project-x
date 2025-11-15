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

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.companyModel = new CompanyModel(fastify);
    this.vehicleModel = new VehicleModel(fastify);
    this.shippingQuoteService = new ShippingQuoteService(fastify);
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
  async calculateQuotesForVehicle(vehicleId: number): Promise<VehicleQuotesResponse> {
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

    // Sort quotes by total_price ascending so the client sees the
    // cheapest offers first.
    quotes.sort((a, b) => a.total_price - b.total_price);

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

      const quotes: CalculatedQuoteResponse[] = filteredComputedQuotes.map((cq) => ({
        company_name: cq.companyName,
        total_price: cq.totalPrice,
        delivery_time_days: cq.deliveryTimeDays,
        breakdown: cq.breakdown,
      }));

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

  async getQuotesByVehicle(vehicleId: number): Promise<CompanyQuote[]> {
    // Validate vehicle exists to avoid leaking orphaned records
    await this.ensureVehicleExists(vehicleId);
    return this.companyModel.getQuotesByVehicleId(vehicleId);
  }

  async getQuotesByCompany(companyId: number): Promise<CompanyQuote[]> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company');
    }
    return this.companyModel.getQuotesByCompanyId(companyId);
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
