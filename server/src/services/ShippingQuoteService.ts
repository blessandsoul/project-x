import { FastifyInstance } from 'fastify';
import { ValidationError } from '../types/errors.js';
import { Vehicle } from '../types/vehicle.js';
import { Company } from '../types/company.js';
import { GeoLocatorService } from './GeoLocatorService.js';

interface ComputedQuote {
  companyId: number;
  companyName: string;
  totalPrice: number;
  deliveryTimeDays: number | null;
  breakdown: any;
}

interface QuoteComputationResult {
  distanceMiles: number;
  quotes: ComputedQuote[];
}

/**
 * ShippingQuoteService
 *
 * Encapsulates quote calculation rules so they can be reused from
 * controllers, background jobs, and future features without duplicating
 * pricing logic.
 */
export class ShippingQuoteService {
  private fastify: FastifyInstance;
  private geoLocatorService: GeoLocatorService;
  private yardGeoCache: Map<string, { lat: number; lon: number }>;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.geoLocatorService = new GeoLocatorService(fastify);
    this.yardGeoCache = new Map();
  }

  /**
   * Determine the approximate distance from the vehicle's yard to Poti, Georgia.
   *
   * For now this uses a simple yard_name-based lookup with hard-coded
   * distances (e.g. Dallas/Ft Worth -> 8000 miles). This is intentionally
   * centralized so it can later be replaced with a geocoding or
   * Google Maps based implementation without touching callers.
   */
  private getDistanceForYard(yardName: string, source: string): number {
    const normalized = (yardName || '').toLowerCase();

    if (normalized.includes('dallas')) {
      return 8000;
    }

    if (normalized.includes('new york') || normalized.includes('ny')) {
      return 7800;
    }

    // Default baseline distance for unknown yards. This keeps the
    // endpoint usable even if new yards are added, while still making
    // it easy to update the mapping in one place.
    this.fastify.log.warn({ yardName, source }, 'Using default distance for unknown yard');
    return 8000;
  }

  /**
   * Compute great-circle distance between two coordinates in miles
   * using the haversine formula.
   */
  private haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Derive distance from the vehicle's yard to Poti, Georgia.
   *
   * Primary strategy:
   * - Use GeoLocatorService to geocode the yard_name into coordinates
   * - Use a fixed coordinate for Poti (port)
   * - Compute great-circle distance in miles
   *
   * Fallback strategy:
   * - If geocoding fails or is unavailable, fall back to the
   *   existing yard-name-based distance mapping so the API stays
   *   functional even without Geoapify.
   */
  private async getDistanceForVehicle(vehicle: Vehicle): Promise<number> {
    const yardName = vehicle.yard_name;

    try {
      // If yard name is missing, fall back immediately.
      if (!yardName) {
        return this.getDistanceForYard(yardName, vehicle.source);
      }

      const key = yardName.trim().toLowerCase();
      // 1) Try in-memory cache first
      const cached = this.yardGeoCache.get(key);
      if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lon)) {
        const POTI_LAT = 42.1537;
        const POTI_LON = 41.6714;
        const distance = this.haversineMiles(cached.lat, cached.lon, POTI_LAT, POTI_LON);
        if (Number.isFinite(distance) && distance > 0) {
          return Math.round(distance);
        }
      }

      // 2) Try Redis cache if available
      let cachedOrigin: { lat: number; lon: number } | null = null;
      const anyFastify: any = this.fastify as any;
      if (anyFastify.redis && typeof anyFastify.redis.get === 'function') {
        try {
          const redisKey = `yard_geo:${key}`;
          const cachedJson = await anyFastify.redis.get(redisKey);
          if (cachedJson) {
            const parsed = JSON.parse(cachedJson) as { lat: number; lon: number };
            if (
              parsed &&
              typeof parsed.lat === 'number' &&
              typeof parsed.lon === 'number' &&
              Number.isFinite(parsed.lat) &&
              Number.isFinite(parsed.lon)
            ) {
              cachedOrigin = parsed;
            }
          }
        } catch (error) {
          this.fastify.log.error({ error, yardName }, 'Failed to read yard geocache from Redis');
        }
      }

      if (cachedOrigin) {
        this.yardGeoCache.set(key, cachedOrigin);
        const POTI_LAT = 42.1537;
        const POTI_LON = 41.6714;
        const distance = this.haversineMiles(cachedOrigin.lat, cachedOrigin.lon, POTI_LAT, POTI_LON);
        if (Number.isFinite(distance) && distance > 0) {
          return Math.round(distance);
        }
      }

      // 3) Try yards table for durable precomputed distance
      const anyFastifyDb: any = this.fastify as any;
      const db = anyFastifyDb.mysql;
      if (db && typeof db.execute === 'function') {
        try {
          const [rows] = await db.execute(
            'SELECT distance_to_poti_miles, lat, lon FROM yards WHERE yard_name = ? AND source = ? LIMIT 1',
            [yardName, vehicle.source ?? ''],
          );

          if (Array.isArray(rows) && rows.length > 0) {
            const row: any = rows[0];
            const precomputed = Number(row.distance_to_poti_miles);

            if (Number.isFinite(precomputed) && precomputed > 0) {
              return precomputed;
            }

            const lat = typeof row.lat === 'number' ? row.lat : null;
            const lon = typeof row.lon === 'number' ? row.lon : null;
            if (lat != null && lon != null) {
              const POTI_LAT = 42.1537;
              const POTI_LON = 41.6714;
              const distance = this.haversineMiles(lat, lon, POTI_LAT, POTI_LON);
              if (Number.isFinite(distance) && distance > 0) {
                const rounded = Math.round(distance);
                try {
                  await db.execute(
                    'UPDATE yards SET distance_to_poti_miles = ? WHERE yard_name = ? AND source = ? LIMIT 1',
                    [rounded, yardName, vehicle.source ?? ''],
                  );
                } catch (error) {
                  this.fastify.log.error({ error, yardName }, 'Failed to update precomputed yard distance');
                }
                return rounded;
              }
            }
          }
        } catch (error) {
          this.fastify.log.error({ error, yardName }, 'Failed to read yards table for distance');
        }
      }

      // 4) Cache + DB miss: call Geoapify and persist to yards
      const query = `${yardName}`;
      const results = await this.geoLocatorService.searchLocation(query, 1);

      const origin = results[0];
      if (!origin || origin.lat == null || origin.lon == null) {
        this.fastify.log.warn({ yardName }, 'GeoLocatorService returned no coordinates, falling back to default distance');
        return this.getDistanceForYard(yardName, vehicle.source);
      }

      // Fixed coordinates for Poti, Georgia (port)
      const POTI_LAT = 42.1537;
      const POTI_LON = 41.6714;

      const originCoords = { lat: origin.lat, lon: origin.lon };

      // Update in-memory cache
      this.yardGeoCache.set(key, originCoords);

      // Update Redis cache if available
      if (anyFastify.redis && typeof anyFastify.redis.set === 'function') {
        try {
          const redisKey = `yard_geo:${key}`;
          await anyFastify.redis.set(redisKey, JSON.stringify(originCoords), 'EX', 60 * 60 * 24);
        } catch (error) {
          this.fastify.log.error({ error, yardName }, 'Failed to write yard geocache to Redis');
        }
      }

      // Persist coordinates and distance into yards table so that
      // future requests never need to geocode this yard again.
      if (db && typeof db.execute === 'function') {
        try {
          const POTI_LAT = 42.1537;
          const POTI_LON = 41.6714;
          const distanceForInsert = this.haversineMiles(originCoords.lat, originCoords.lon, POTI_LAT, POTI_LON);
          const roundedDistance = Number.isFinite(distanceForInsert) && distanceForInsert > 0
            ? Math.round(distanceForInsert)
            : null;

          await db.execute(
            `INSERT INTO yards (yard_name, source, lat, lon, distance_to_poti_miles)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               lat = VALUES(lat),
               lon = VALUES(lon),
               distance_to_poti_miles = VALUES(distance_to_poti_miles)`,
            [yardName, vehicle.source ?? '', originCoords.lat, originCoords.lon, roundedDistance],
          );
        } catch (error) {
          this.fastify.log.error({ error, yardName }, 'Failed to upsert yard into yards table');
        }
      }

      const distance = this.haversineMiles(originCoords.lat, originCoords.lon, POTI_LAT, POTI_LON);

      // Guard against zero / NaN distances.
      if (!Number.isFinite(distance) || distance <= 0) {
        this.fastify.log.warn({ yardName }, 'Computed distance was invalid, falling back to default');
        return this.getDistanceForYard(yardName, vehicle.source);
      }

      return Math.round(distance);
    } catch (error) {
      this.fastify.log.error({ error, yardName }, 'Failed to compute distance using GeoLocatorService, falling back');
      return this.getDistanceForYard(yardName, vehicle.source);
    }
  }

  /**
   * Safely convert a value to a number for pricing calculations.
   *
   * MySQL DECIMAL fields are often returned as strings. This helper
   * ensures we always perform numeric math instead of string
   * concatenation. If the value cannot be converted, we throw a
   * validation error so misconfigured company pricing is visible.
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
   * Port coordinates lookup
   */
  private getPortCoordinates(port: string): { lat: number; lon: number } {
    const ports: { [key: string]: { lat: number; lon: number } } = {
      poti_georgia: { lat: 42.1537, lon: 41.6714 },
      klaipeda_lithuania: { lat: 55.7033, lon: 21.1443 },
      odessa_ukraine: { lat: 46.4825, lon: 30.7233 },
      jebel_ali_uae: { lat: 25.0657, lon: 55.1713 },
    };
    const defaultPort = { lat: 42.1537, lon: 41.6714 }; // Poti, Georgia
    return ports[port] || defaultPort;
  }

  /**
   * Get distance from an auction branch address to selected port.
   *
   * This is used by the catalog page to calculate shipping costs
   * when a user selects an auction branch. Results are cached in
   * the auction_branch_distances table to avoid repeated geocoding.
   *
   * @param address - Full address string (e.g. "6089 HIGHWAY 20, 30052")
   * @param source - Auction source (copart or iaai)
   * @param port - Destination port identifier (e.g. "poti_georgia")
   */
  async getDistanceForAddress(address: string, source: string, port: string = 'poti_georgia'): Promise<number> {
    const trimmedAddress = (address || '').trim();
    if (!trimmedAddress) {
      throw new ValidationError('Address is required');
    }

    const portCoords = this.getPortCoordinates(port);
    const cacheKey = `${source}:${port}:${trimmedAddress}`.toLowerCase();

    // 1) Check in-memory cache
    const cached = this.yardGeoCache.get(cacheKey);
    if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lon)) {
      const distance = this.haversineMiles(cached.lat, cached.lon, portCoords.lat, portCoords.lon);
      if (Number.isFinite(distance) && distance > 0) {
        return Math.round(distance);
      }
    }

    // 2) Check database cache - but we need to recalculate distance for different ports
    // So we only use cached coordinates, not cached distance
    const anyFastifyDb: any = this.fastify as any;
    const db = anyFastifyDb.mysql;
    if (db && typeof db.execute === 'function') {
      try {
        const [rows] = await db.execute(
          'SELECT lat, lon FROM auction_branch_distances WHERE address = ? AND source = ? LIMIT 1',
          [trimmedAddress, source],
        );

        if (Array.isArray(rows) && rows.length > 0) {
          const row: any = rows[0];
          const lat = Number(row.lat);
          const lon = Number(row.lon);

          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            // Update in-memory cache
            this.yardGeoCache.set(cacheKey, { lat, lon });
            // Calculate distance to selected port
            const distance = this.haversineMiles(lat, lon, portCoords.lat, portCoords.lon);
            if (Number.isFinite(distance) && distance > 0) {
              return Math.round(distance);
            }
          }
        }
      } catch (error) {
        this.fastify.log.error({ error, address }, 'Failed to read auction_branch_distances table');
      }
    }

    // 3) Geocode the address
    const results = await this.geoLocatorService.searchLocation(trimmedAddress, 1);
    const origin = results[0];

    if (!origin || origin.lat == null || origin.lon == null) {
      this.fastify.log.warn({ address }, 'GeoLocatorService returned no coordinates for auction branch');
      // Return a default distance for US locations
      return 8000;
    }

    const originCoords = { lat: origin.lat, lon: origin.lon };
    const distance = this.haversineMiles(originCoords.lat, originCoords.lon, portCoords.lat, portCoords.lon);
    const roundedDistance = Number.isFinite(distance) && distance > 0 ? Math.round(distance) : 8000;

    // Update in-memory cache
    this.yardGeoCache.set(cacheKey, originCoords);

    // 4) Persist to database
    if (db && typeof db.execute === 'function') {
      try {
        await db.execute(
          `INSERT INTO auction_branch_distances (address, source, lat, lon, distance_to_poti_miles)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             lat = VALUES(lat),
             lon = VALUES(lon),
             distance_to_poti_miles = VALUES(distance_to_poti_miles)`,
          [trimmedAddress, source, originCoords.lat, originCoords.lon, roundedDistance],
        );
      } catch (error) {
        this.fastify.log.error({ error, address }, 'Failed to upsert auction_branch_distances');
      }
    }

    return roundedDistance;
  }

  /**
   * Compute shipping quotes for all companies based on a given distance.
   *
   * This is a simplified version of computeQuotesForVehicle that doesn't
   * require a vehicle - just the distance. Used for the catalog page
   * where we want to show shipping costs per company for a selected
   * auction branch.
   */
  async computeShippingQuotesForDistance(
    distanceMiles: number,
    companies: Company[],
  ): Promise<Array<{ companyId: number; companyName: string; shippingPrice: number }>> {
    if (distanceMiles <= 0) {
      throw new ValidationError('Distance must be positive');
    }

    if (!companies.length) {
      return [];
    }

    const quotes: Array<{ companyId: number; companyName: string; shippingPrice: number }> = [];

    for (const company of companies) {
      const formulaOverrides =
        company.final_formula && typeof company.final_formula === 'object'
          ? (company.final_formula as any)
          : null;

      const rawBasePrice = formulaOverrides?.base_price ?? company.base_price;
      const rawPricePerMile = formulaOverrides?.price_per_mile ?? company.price_per_mile;
      const rawCustomsFee = formulaOverrides?.customs_fee ?? company.customs_fee;
      const rawServiceFee = formulaOverrides?.service_fee ?? company.service_fee;
      const rawBrokerFee = formulaOverrides?.broker_fee ?? company.broker_fee;

      const numericBasePrice = typeof rawBasePrice === 'number' ? rawBasePrice : Number(rawBasePrice ?? 0);
      const numericPricePerMile = typeof rawPricePerMile === 'number' ? rawPricePerMile : Number(rawPricePerMile ?? 0);
      const numericCustomsFee = typeof rawCustomsFee === 'number' ? rawCustomsFee : Number(rawCustomsFee ?? 0);
      const numericServiceFee = typeof rawServiceFee === 'number' ? rawServiceFee : Number(rawServiceFee ?? 0);
      const numericBrokerFee = typeof rawBrokerFee === 'number' ? rawBrokerFee : Number(rawBrokerFee ?? 0);

      const allFeesZero =
        numericBasePrice === 0 &&
        numericPricePerMile === 0 &&
        numericCustomsFee === 0 &&
        numericServiceFee === 0 &&
        numericBrokerFee === 0;

      // For catalog page, include all companies but mark those with no pricing
      // with shippingPrice = -1 so the UI can show "Contact for price"
      if (allFeesZero) {
        quotes.push({
          companyId: company.id,
          companyName: company.name,
          shippingPrice: -1, // Signals "no pricing configured"
        });
        continue;
      }

      const basePrice = this.toNumber(rawBasePrice, 'base_price');
      const pricePerMile = this.toNumber(rawPricePerMile, 'price_per_mile');
      const customsFee = this.toNumber(rawCustomsFee, 'customs_fee');
      const serviceFee = this.toNumber(rawServiceFee, 'service_fee');
      const brokerFee = this.toNumber(rawBrokerFee, 'broker_fee');

      const mileageCost = pricePerMile * distanceMiles;
      const shippingPrice = basePrice + mileageCost + customsFee + serviceFee + brokerFee;

      quotes.push({
        companyId: company.id,
        companyName: company.name,
        shippingPrice: Math.round(shippingPrice),
      });
    }

    return quotes;
  }

  /**
   * Compute quotes for a vehicle across all companies.
   *
   * This method is pure with respect to persistence: it does not touch
   * the database. Callers are responsible for inserting rows into
   * company_quotes using the returned breakdown and totals.
   */
  async computeQuotesForVehicle(vehicle: Vehicle, companies: Company[]): Promise<QuoteComputationResult> {
    const distanceMiles = await this.getDistanceForVehicle(vehicle);
    if (distanceMiles <= 0) {
      throw new ValidationError('Unable to determine distance for vehicle yard');
    }

    if (!companies.length) {
      throw new ValidationError('No companies configured for quote calculation');
    }

    const quotes: ComputedQuote[] = [];

    for (const company of companies) {
      // If final_formula JSON is present, treat it as an override for
      // individual fee components. This keeps the default formula simple
      // while allowing per-company customization without code changes.
      const formulaOverrides =
        company.final_formula && typeof company.final_formula === 'object'
          ? (company.final_formula as any)
          : null;

      // Guard: skip companies that effectively have no pricing configured.
      // Newly created companies from registration currently persist all
      // fee fields as 0 by default. Using them in calculations would
      // produce misleading 0$ quotes. We consider a company "unpriced"
      // when all fee components resolve to 0 and there is no meaningful
      // override provided via final_formula.
      const rawBasePrice = formulaOverrides?.base_price ?? company.base_price;
      const rawPricePerMile =
        formulaOverrides?.price_per_mile ?? company.price_per_mile;
      const rawCustomsFee =
        formulaOverrides?.customs_fee ?? company.customs_fee;
      const rawServiceFee =
        formulaOverrides?.service_fee ?? company.service_fee;
      const rawBrokerFee =
        formulaOverrides?.broker_fee ?? company.broker_fee;
      const rawInsuranceRate =
        formulaOverrides?.insurance ?? company.insurance;

      const numericBasePrice =
        typeof rawBasePrice === 'number' ? rawBasePrice : Number(rawBasePrice ?? 0);
      const numericPricePerMile =
        typeof rawPricePerMile === 'number'
          ? rawPricePerMile
          : Number(rawPricePerMile ?? 0);
      const numericCustomsFee =
        typeof rawCustomsFee === 'number' ? rawCustomsFee : Number(rawCustomsFee ?? 0);
      const numericServiceFee =
        typeof rawServiceFee === 'number'
          ? rawServiceFee
          : Number(rawServiceFee ?? 0);
      const numericBrokerFee =
        typeof rawBrokerFee === 'number' ? rawBrokerFee : Number(rawBrokerFee ?? 0);

      const allFeesZero =
        numericBasePrice === 0 &&
        numericPricePerMile === 0 &&
        numericCustomsFee === 0 &&
        numericServiceFee === 0 &&
        numericBrokerFee === 0;

      if (allFeesZero) {
        // Skip this company entirely – it has no usable pricing yet.
        continue;
      }

      // Normalize all fee components to numbers before calculation to
      // avoid string concatenation (DECIMAL fields from MySQL are often
      // returned as strings).
      const basePrice: number = this.toNumber(
        rawBasePrice,
        'base_price',
      );
      const pricePerMile: number = this.toNumber(
        rawPricePerMile,
        'price_per_mile',
      );
      const customsFee: number = this.toNumber(
        rawCustomsFee,
        'customs_fee',
      );
      const serviceFee: number = this.toNumber(
        rawServiceFee,
        'service_fee',
      );
      const brokerFee: number = this.toNumber(
        rawBrokerFee,
        'broker_fee',
      );
      const deliveryTimeDays: number | null =
        formulaOverrides?.delivery_time_days ?? null;

      // Default formula (possibly with overrides applied):
      // total_price = base_price + (price_per_mile * distance) +
      //               customs_fee + service_fee + broker_fee
      const mileageCost = pricePerMile * distanceMiles;

      // Base shipping total (independent of vehicle price)
      const shippingTotal =
        basePrice + mileageCost + customsFee + serviceFee + brokerFee;

      // Lightweight adjustment using a simple insurance component.
      // insurance is stored as a percentage (e.g., 1.5 = 1.5%).
      // Vehicle "cost" component from the auction data. In your
      // schema, calc_price is the calculated vehicle price (what you
      // effectively pay for the car itself).
      const rawCalcPrice = (vehicle as any).calc_price;
      const vehiclePrice = this.toNumber(rawCalcPrice, 'calc_price');

      // Retail value is still included in the breakdown for
      // transparency, but it is no longer the base for the
      // insurance calculation itself.
      const rawRetailValue = (vehicle as any).retail_value;
      const retailValue = this.toNumber(rawRetailValue, 'retail_value');

      // If no company-specific insurance is configured, treat it as 0%
      // (no insurance applied).
      const effectiveInsurancePercent =
        rawInsuranceRate == null
          ? 0
          : this.toNumber(rawInsuranceRate, 'insurance');
      const insuranceRate = effectiveInsurancePercent / 100;

      // Insurance should be calculated from the total price before
      // insurance: vehicle price + shipping total.
      const totalBeforeInsurance = vehiclePrice + shippingTotal;
      const insuranceFee = totalBeforeInsurance * insuranceRate;

      // total_price now represents the full amount for the client:
      // vehicle price + shipping + insurance.
      const totalPrice = totalBeforeInsurance + insuranceFee;

      const breakdown = {
        base_price: basePrice,
        distance_miles: distanceMiles,
        price_per_mile: pricePerMile,
        mileage_cost: mileageCost,
        customs_fee: customsFee,
        service_fee: serviceFee,
        broker_fee: brokerFee,
        retail_value: retailValue,
        insurance_rate: insuranceRate,
        insurance_fee: insuranceFee,
        shipping_total: shippingTotal,
        calc_price: vehiclePrice,
        total_price: totalPrice,
        formula_source: formulaOverrides ? 'final_formula' : 'default',
      };

      quotes.push({
        companyId: company.id,
        companyName: company.name,
        totalPrice,
        deliveryTimeDays,
        breakdown,
      });
    }

    return {
      distanceMiles,
      quotes,
    };
  }
}
