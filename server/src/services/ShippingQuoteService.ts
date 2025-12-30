/**
 * ShippingQuoteService
 *
 * This service is the single source of truth for all quote/price calculations.
 * All quote computations now use the external calculator API via POST /api/calculator.
 *
 * The calculator API handles:
 * - Distance calculations (no geocoding needed on our side)
 * - Shipping cost computation
 * - All pricing formula logic
 * - Insurance and customs calculations
 *
 * This service:
 * - Maps vehicle/company data to calculator request format
 * - Calls the calculator API
 * - Transforms responses for use by controllers
 * - Handles errors gracefully with proper logging
 * - Caches calculator responses (in-memory and Redis)
 *
 * IMPORTANT: The old distance-based calculation logic (Geoapify geocoding,
 * haversine formula, company pricing fields) has been moved to
 * legacyShippingQuoteService.ts for historical reference only.
 */

import { FastifyInstance } from 'fastify';
import { ValidationError, CalculatorApiError } from '../types/errors.js';
import { Vehicle } from '../types/vehicle.js';
import { Company } from '../types/company.js';
import { CalculatorService } from './CalculatorService.js';
import {
  CalculatorAdapterFactory,
  StandardCalculatorRequest,
  StandardCalculatorResponse,
} from './adapters/index.js';

/**
 * Calculator API request body structure
 */
interface CalculatorRequest {
  buyprice: number;
  auction: string;
  vehicletype: string;
  usacity?: string;
  coparturl?: string;
  destinationport?: string;
  vehiclecategory?: string;
}

/**
 * Computed quote result from calculator
 */
interface ComputedQuote {
  companyId: number;
  companyName: string;
  totalPrice: number;
  deliveryTimeDays: number | null;
  breakdown: any;
}

/**
 * Result of quote computation for a vehicle
 */
interface QuoteComputationResult {
  distanceMiles: number;
  quotes: ComputedQuote[];
}

/**
 * ShippingQuoteService
 *
 * Encapsulates quote calculation rules using the external calculator API.
 * All pricing logic is now delegated to POST /api/calculator.
 */
export class ShippingQuoteService {
  private fastify: FastifyInstance;
  private calculatorService: CalculatorService;
  private calculatorAdapterFactory: CalculatorAdapterFactory;

  // Redis cache TTL for calculator responses (24 hours)
  private readonly CALCULATOR_CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.calculatorService = new CalculatorService(fastify);
    this.calculatorAdapterFactory = new CalculatorAdapterFactory(fastify);
  }

  /**
   * Map auction source to calculator-compatible auction name
   */
  private mapAuctionSource(source: string): string {
    const normalized = (source || '').toLowerCase().trim();

    switch (normalized) {
      case 'copart':
        return 'Copart';
      case 'iaai':
        return 'IAAI';
      case 'manheim':
        return 'Manheim';
      case 'adesa':
        return 'Adesa';
      default:
        // Default to Copart for unknown sources
        this.fastify.log.warn({ source }, 'Unknown auction source, defaulting to Copart');
        return 'Copart';
    }
  }

  /**
   * Map vehicle type/category to calculator-compatible vehicle type
   *
   * Calculator accepts: 'standard' or 'heavy'
   */
  private mapVehicleType(vehicle: Vehicle): string {
    const vehicleType = ((vehicle as any).vehicle_type || '').toLowerCase();
    const category = ((vehicle as any).category || '').toLowerCase();

    // Heavy vehicles: trucks, vans, large SUVs, pickups
    const heavyKeywords = ['truck', 'van', 'pickup', 'big suv', 'heavy', 'commercial'];

    for (const keyword of heavyKeywords) {
      if (vehicleType.includes(keyword) || category.includes(keyword)) {
        return 'heavy';
      }
    }

    return 'standard';
  }

  /**
   * Map vehicle category to calculator-compatible category
   *
   * Calculator accepts: 'Sedan', 'Bike', 'Small SUV', 'Big SUV', 'Pickup', 'Van', 'Big Van'
   */
  private mapVehicleCategory(vehicle: Vehicle): string | undefined {
    const vehicleType = ((vehicle as any).vehicle_type || '').toLowerCase();
    const category = ((vehicle as any).category || '').toLowerCase();
    const combined = `${vehicleType} ${category}`;

    if (combined.includes('sedan') || combined.includes('coupe') || combined.includes('hatchback')) {
      return 'Sedan';
    }
    if (combined.includes('motorcycle') || combined.includes('bike')) {
      return 'Bike';
    }
    if (combined.includes('big suv') || combined.includes('large suv') || combined.includes('full-size suv')) {
      return 'Big SUV';
    }
    if (combined.includes('suv') || combined.includes('crossover')) {
      return 'Small SUV';
    }
    if (combined.includes('pickup') || combined.includes('truck')) {
      return 'Pickup';
    }
    if (combined.includes('big van') || combined.includes('cargo van') || combined.includes('commercial van')) {
      return 'Big Van';
    }
    if (combined.includes('van') || combined.includes('minivan')) {
      return 'Van';
    }

    // Return undefined if we can't determine the category
    return undefined;
  }

  /**
   * Extract city from yard name for calculator
   */
  private extractCityFromYard(yardName: string): string | undefined {
    if (!yardName) return undefined;

    // Yard names are typically in format "City, ST" or "City (ST)"
    // Extract just the city part
    const cleaned = yardName.trim();

    // Try to extract city before comma or parenthesis
    const commaMatch = cleaned.match(/^([^,]+)/);
    if (commaMatch && commaMatch[1]) {
      return commaMatch[1].trim();
    }

    const parenMatch = cleaned.match(/^([^(]+)/);
    if (parenMatch && parenMatch[1]) {
      return parenMatch[1].trim();
    }

    return cleaned;
  }

  /**
   * Safely convert a value to a number for pricing calculations.
   */
  private toNumber(value: unknown, field: string): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) {
      throw new ValidationError(`Invalid numeric value for ${field}`);
    }

    return num;
  }

  /**
   * Build calculator request from vehicle data
   */
  private buildCalculatorRequest(vehicle: Vehicle, destinationPort?: string): CalculatorRequest {
    // Validate vehicle has required data
    if (!vehicle) {
      throw new ValidationError('Vehicle data is required for quote calculation');
    }

    if (!vehicle.id) {
      throw new ValidationError('Vehicle ID is required for quote calculation');
    }

    const rawCalcPrice = (vehicle as any).calc_price;
    const buyprice = this.toNumber(rawCalcPrice, 'calc_price');

    if (buyprice <= 0) {
      throw new ValidationError(
        `Vehicle (ID: ${vehicle.id}) does not have a valid price (calc_price). ` +
        'Please ensure the vehicle has a calculated price before requesting quotes.'
      );
    }

    if (!vehicle.source) {
      throw new ValidationError(
        `Vehicle (ID: ${vehicle.id}) does not have an auction source. ` +
        'Please ensure the vehicle has a valid source (e.g., copart, iaai).'
      );
    }

    const request: CalculatorRequest = {
      buyprice,
      auction: this.mapAuctionSource(vehicle.source),
      vehicletype: this.mapVehicleType(vehicle),
      // Default destination port to POTI if not provided
      destinationport: destinationPort || 'POTI',
    };

    // Add optional fields if available
    const usacity = this.extractCityFromYard(vehicle.yard_name);
    if (usacity) {
      request.usacity = usacity;
    }

    const vehiclecategory = this.mapVehicleCategory(vehicle);
    if (vehiclecategory) {
      request.vehiclecategory = vehiclecategory;
    }

    // Add copart URL if available (for Copart vehicles)
    const lotUrl = (vehicle as any).lot_url || (vehicle as any).copart_url;
    if (lotUrl && vehicle.source?.toLowerCase() === 'copart') {
      request.coparturl = lotUrl;
    }

    return request;
  }

  /**
   * Call the calculator API and get pricing data.
   * Uses Redis caching when available (24 hour TTL).
   */
  private async callCalculator(request: CalculatorRequest): Promise<any> {
    // Build cache key from request parameters
    const cacheKey = `calculator:${JSON.stringify({
      buyprice: request.buyprice,
      auction: request.auction,
      vehicletype: request.vehicletype,
      usacity: request.usacity,
      destinationport: request.destinationport,
      vehiclecategory: request.vehiclecategory,
    })}`;

    // Check Redis cache if available
    const anyFastify: any = this.fastify as any;
    if (anyFastify.redis && typeof anyFastify.redis.get === 'function') {
      try {
        const cached = await anyFastify.redis.get(cacheKey);
        if (cached) {
          this.fastify.log.info({ cacheKey }, 'Using Redis cached calculator response');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.fastify.log.warn({ error }, 'Failed to read from Redis cache');
      }
    }

    this.fastify.log.info(
      {
        request,
        requestSummary: `buyprice=${request.buyprice}, auction=${request.auction}, usacity=${request.usacity}, vehicletype=${request.vehicletype}`
      },
      'Calling external calculator API'
    );

    const result = await this.calculatorService.calculate(request);

    this.fastify.log.info(
      {
        success: result.success,
        data: result.data,
        error: result.error,
      },
      'Calculator API response received'
    );

    if (!result.success) {
      this.fastify.log.error(
        { request, error: result.error },
        'Calculator API returned error',
      );
      const errorMessage = result.error || 'Unable to calculate shipping price. Please try again later.';
      throw new CalculatorApiError(`Calculator API error: ${errorMessage}`);
    }

    // Validate that we got a valid response
    if (!result.data || typeof result.data !== 'object') {
      this.fastify.log.error({ request, data: result.data }, 'Calculator API returned invalid response');
      throw new CalculatorApiError('Calculator API returned an invalid response. Please try again later.');
    }

    // Cache in Redis if available
    if (anyFastify.redis && typeof anyFastify.redis.set === 'function') {
      try {
        await anyFastify.redis.set(
          cacheKey,
          JSON.stringify(result.data),
          'EX',
          this.CALCULATOR_CACHE_TTL_SECONDS,
        );
        this.fastify.log.info({ cacheKey }, 'Cached calculator response in Redis');
      } catch (error) {
        this.fastify.log.warn({ error }, 'Failed to cache calculator response in Redis');
      }
    }

    return result.data;
  }

  /**
   * Compute quotes for a vehicle across all companies using the calculator API.
   *
   * This method calls POST /api/calculator for each company and returns
   * the computed quotes. It does not persist anything to the database.
   */
  async computeQuotesForVehicle(
    vehicle: Vehicle,
    companies: Company[],
    destinationPort?: string,
  ): Promise<QuoteComputationResult> {
    if (!companies.length) {
      throw new ValidationError(
        'No shipping companies are configured in the system. ' +
        'Please contact support to set up shipping providers.'
      );
    }

    // Build the base calculator request from vehicle data
    const baseRequest = this.buildCalculatorRequest(vehicle, destinationPort);

    this.fastify.log.info(
      {
        vehicleId: vehicle.id,
        companyCount: companies.length,
        request: baseRequest,
      },
      'Computing quotes for vehicle using calculator API',
    );

    // Call calculator API once to get the base calculation
    // The calculator returns a comprehensive pricing breakdown
    let calculatorResponse: any;
    try {
      calculatorResponse = await this.callCalculator(baseRequest);
    } catch (error) {
      this.fastify.log.error(
        { vehicleId: vehicle.id, error },
        'Failed to call calculator API for vehicle',
      );
      throw error;
    }

    // Extract distance from calculator response if available
    // The calculator may return distance_miles in its response
    const distanceMiles = calculatorResponse?.distance_miles ||
      calculatorResponse?.distanceMiles ||
      calculatorResponse?.distance ||
      0;

    const quotes: ComputedQuote[] = [];

    // Extract transportation_total from calculator response
    // Handle both direct response { transportation_total, currency }
    // and nested response { data: { transportation_total, currency } } (legacy cache)
    const responseData = calculatorResponse?.data || calculatorResponse;

    const transportationTotal = this.toNumber(
      responseData?.transportation_total ||
      responseData?.transportationTotal ||
      responseData?.shipping_total ||
      responseData?.total ||
      0,
      'transportation_total',
    );

    const currency = responseData?.currency || 'USD';

    if (transportationTotal <= 0) {
      this.fastify.log.warn(
        { vehicleId: vehicle.id, calculatorResponse },
        'Calculator API returned zero or invalid transportation_total',
      );
    }

    // Process each company - for now all companies use the same calculator API
    // In the future, different companies may have different pricing APIs
    for (const company of companies) {
      try {
        // Get delivery time from company formula if available
        const formulaOverrides =
          company.final_formula && typeof company.final_formula === 'object'
            ? (company.final_formula as any)
            : null;

        const deliveryTimeDays: number | null = formulaOverrides?.delivery_time_days ?? null;

        // Simple breakdown - just the calculator response
        // In future, different companies may have different formula_source values
        const breakdown = {
          transportation_total: transportationTotal,
          currency,
          distance_miles: distanceMiles,
          formula_source: 'calculator_api', // Future: company-specific API sources
        };

        quotes.push({
          companyId: company.id,
          companyName: company.name,
          totalPrice: transportationTotal,
          deliveryTimeDays,
          breakdown,
        });
      } catch (error) {
        this.fastify.log.error(
          { companyId: company.id, companyName: company.name, error },
          'Failed to compute quote for company',
        );
        // Continue with other companies even if one fails
      }
    }

    return {
      distanceMiles,
      quotes,
    };
  }

  /**
   * Compute quotes using a pre-built calculator request.
   * 
   * This method uses the Adapter Pattern to support per-company calculator APIs.
   * Each company can have its own calculator (configured via calculator_type,
   * calculator_api_url, and calculator_config fields).
   * 
   * Execution is parallel using Promise.allSettled() for better performance.
   * If one company's calculator fails, other companies still get quotes.
   * 
   * Used by POST /vehicles/:vehicleId/calculate-quotes which accepts
   * auction and usacity from the client.
   */
  async computeQuotesWithCalculatorInput(
    calculatorInput: CalculatorRequest,
    companies: Company[],
  ): Promise<QuoteComputationResult> {
    if (!companies.length) {
      throw new ValidationError(
        'No shipping companies are configured in the system. ' +
        'Please contact support to set up shipping providers.'
      );
    }

    this.fastify.log.info(
      {
        calculatorInput,
        companyCount: companies.length,
      },
      'Computing quotes using adapter pattern (per-company calculators)',
    );

    // Convert legacy CalculatorRequest to StandardCalculatorRequest
    const standardRequest: StandardCalculatorRequest = {
      buyprice: calculatorInput.buyprice,
      auction: calculatorInput.auction,
      vehicletype: calculatorInput.vehicletype,
      destinationport: calculatorInput.destinationport || 'POTI',
      vehiclecategory: calculatorInput.vehiclecategory || 'Sedan',
      ...(calculatorInput.usacity && { usacity: calculatorInput.usacity }),
    };

    // Call each company's calculator in parallel
    const calculatorPromises = companies.map(async (company) => {
      const adapter = this.calculatorAdapterFactory.getAdapter(company);
      const result = await adapter.calculate(standardRequest, company);
      return { company, result };
    });

    // Wait for all calculators (some may fail, others succeed)
    const settledResults = await Promise.allSettled(calculatorPromises);

    const quotes: ComputedQuote[] = [];
    let distanceMiles = 0;
    let successCount = 0;
    let failureCount = 0;

    // Process results
    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        const { company, result } = settled.value;

        if (result.success && result.totalPrice > 0) {
          // Get delivery time from company formula if available
          const formulaOverrides =
            company.final_formula && typeof company.final_formula === 'object'
              ? (company.final_formula as any)
              : null;

          const deliveryTimeDays: number | null = formulaOverrides?.delivery_time_days ?? null;

          // Use distance from first successful result
          if (distanceMiles === 0 && result.distanceMiles > 0) {
            distanceMiles = result.distanceMiles;
          }

          quotes.push({
            companyId: company.id,
            companyName: company.name,
            totalPrice: result.totalPrice,
            deliveryTimeDays,
            breakdown: {
              transportation_total: result.totalPrice,
              currency: result.currency,
              distance_miles: result.distanceMiles,
              formula_source: company.calculator_type || 'default',
              ...result.breakdown,
            },
          });

          successCount++;
        } else {
          // Calculator returned but with error or zero price
          this.fastify.log.warn(
            {
              companyId: company.id,
              companyName: company.name,
              error: result.error,
              totalPrice: result.totalPrice,
            },
            'Calculator returned invalid result for company',
          );
          failureCount++;
        }
      } else {
        // Promise rejected (e.g., network error)
        this.fastify.log.error(
          {
            error: settled.reason,
          },
          'Calculator promise rejected for company',
        );
        failureCount++;
      }
    }

    this.fastify.log.info(
      {
        successCount,
        failureCount,
        quoteCount: quotes.length,
        distanceMiles,
      },
      'Computed quotes using adapter pattern',
    );

    return {
      distanceMiles,
      quotes,
    };
  }

  /**
   * Compute shipping quotes for all companies based on a given distance.
   *
   * This method is used for catalog page calculations where we have
   * an address but not a full vehicle. It calls the calculator API
   * with minimal parameters.
   */
  async computeShippingQuotesForDistance(
    distanceMiles: number,
    companies: Company[],
  ): Promise<Array<{ companyId: number; companyName: string; shippingPrice: number }>> {
    if (distanceMiles <= 0) {
      throw new ValidationError(
        'Distance must be a positive number. ' +
        'Please provide a valid distance in miles.'
      );
    }

    if (!companies.length) {
      return [];
    }

    // Build a minimal calculator request with placeholder values
    const request: CalculatorRequest = {
      buyprice: 5000, // Placeholder - not used for shipping calculation
      auction: 'Copart',
      vehicletype: 'standard',
      destinationport: 'POTI',
    };

    let calculatorResponse: any;
    try {
      calculatorResponse = await this.callCalculator(request);
    } catch (error) {
      this.fastify.log.error(
        { distanceMiles, error },
        'Failed to call calculator API for distance-based quote',
      );
      throw new CalculatorApiError(
        'Unable to calculate shipping quotes. Please try again later.'
      );
    }

    // Extract transportation_total from calculator response
    // Handle both direct and nested response structures
    const responseData = calculatorResponse?.data || calculatorResponse;

    const transportationTotal = this.toNumber(
      responseData?.transportation_total ||
      responseData?.transportationTotal ||
      responseData?.shipping_total ||
      0,
      'transportation_total',
    );

    // All companies get the same price from calculator API
    // In future, different companies may have different pricing APIs
    return companies.map((company) => ({
      companyId: company.id,
      companyName: company.name,
      shippingPrice: Math.round(transportationTotal),
    }));
  }

  /**
   * Get distance from an auction branch address to selected port.
   *
   * The calculator API handles all location/distance calculations internally.
   * No geocoding fallback is needed.
   */
  async getDistanceForAddress(
    address: string,
    source: string,
    port: string = 'poti_georgia',
  ): Promise<number> {
    const trimmedAddress = (address || '').trim();
    if (!trimmedAddress) {
      throw new ValidationError(
        'Auction branch address is required. ' +
        'Please provide a valid US address to calculate shipping distance.'
      );
    }

    if (!source) {
      throw new ValidationError(
        'Auction source is required. ' +
        'Please specify the auction source (e.g., "copart" or "iaai").'
      );
    }

    // Call calculator API - it handles location calculation internally
    const destinationPort = this.mapPortToCalculatorFormat(port);
    const request: CalculatorRequest = {
      buyprice: 5000, // Placeholder price (required by API but not used for distance)
      auction: this.mapAuctionSource(source),
      vehicletype: 'standard',
      usacity: trimmedAddress,
      destinationport: destinationPort,
    };

    try {
      const response = await this.callCalculator(request);

      // Extract distance from calculator response
      const distance = response?.distance_miles ||
        response?.distanceMiles ||
        response?.distance ||
        0;

      if (distance > 0) {
        return Math.round(distance);
      }

      // Calculator didn't return distance - log warning
      this.fastify.log.warn(
        { address, source, port, response },
        'Calculator API did not return distance',
      );
      return 0;
    } catch (error) {
      this.fastify.log.error(
        { address, source, port, error },
        'Calculator API failed for distance calculation',
      );
      throw error;
    }
  }

  /**
   * Map internal port identifier to calculator-compatible format
   */
  private mapPortToCalculatorFormat(port: string): string {
    const portMap: { [key: string]: string } = {
      poti_georgia: 'POTI',
      klaipeda_lithuania: 'KLAIPEDA',
      odessa_ukraine: 'ODESSA',
      jebel_ali_uae: 'JEBEL_ALI',
    };

    return portMap[port] || 'POTI';
  }
}
