import { FastifyInstance } from 'fastify';
import { AuctionApiService } from '../services/AuctionApiService.js';
import { ShippingQuoteService } from '../services/ShippingQuoteService.js';
import { NotFoundError, ValidationError } from '../types/errors.js';
import { Company } from '../types/company.js';

interface CalculateShippingRequest {
  address: string;
  source: 'copart' | 'iaai';
  port?: string;
}

interface ShippingQuoteResult {
  distanceMiles: number;
  quotes: Array<{
    companyId: number;
    companyName: string;
    shippingPrice: number;
  }>;
}

export class AuctionController {
  private fastify: FastifyInstance;
  private auctionApiService: AuctionApiService;
  private shippingQuoteService: ShippingQuoteService;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.auctionApiService = new AuctionApiService(fastify);
    this.shippingQuoteService = new ShippingQuoteService(fastify);
  }

  async getActiveLots(): Promise<{ time: string; fetched_at: string; data: any }> {
    const cached = AuctionApiService.getLatestActiveLots();

    if (!cached || !cached.data) {
      throw new NotFoundError('Active lots');
    }

    return {
      time: cached.time,
      fetched_at: cached.fetchedAt,
      data: cached.data,
    };
  }

  /**
   * Calculate shipping quotes for all companies based on an auction branch address.
   *
   * This endpoint:
   * 1. Geocodes the auction branch address to get coordinates
   * 2. Calculates the distance to Poti, Georgia (destination port)
   * 3. Caches the result in auction_branch_distances table
   * 4. Returns shipping quotes for all configured companies
   */
  async calculateShipping(body: CalculateShippingRequest): Promise<ShippingQuoteResult> {
    const { address, source } = body;

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      throw new ValidationError('Address is required');
    }

    if (!source || !['copart', 'iaai'].includes(source)) {
      throw new ValidationError('Source must be "copart" or "iaai"');
    }

    // Get distance from auction branch to selected port
    const port = body.port || 'poti_georgia';
    const distanceMiles = await this.shippingQuoteService.getDistanceForAddress(address, source, port);

    // Fetch all companies
    const anyFastify: any = this.fastify as any;
    const db = anyFastify.mysql;

    if (!db || typeof db.execute !== 'function') {
      throw new ValidationError('Database connection unavailable');
    }

    const [companyRows] = await db.execute(
      `SELECT id, name, base_price, price_per_mile, customs_fee, service_fee, broker_fee, insurance, final_formula
       FROM companies
       ORDER BY name ASC`,
    );

    const companies: Company[] = (companyRows as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      base_price: row.base_price,
      price_per_mile: row.price_per_mile,
      customs_fee: row.customs_fee,
      service_fee: row.service_fee,
      broker_fee: row.broker_fee,
      insurance: row.insurance,
      final_formula: row.final_formula,
    })) as Company[];

    // Compute shipping quotes for all companies
    const quotes = await this.shippingQuoteService.computeShippingQuotesForDistance(distanceMiles, companies);

    return {
      distanceMiles,
      quotes,
    };
  }
}
