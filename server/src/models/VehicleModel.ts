import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import { Vehicle, VehiclePhoto } from '../types/vehicle.js';
import {
  normalizeLocationName,
  buildLocationLikePatterns,
  scoreLocationMatch,
} from '../utils/locationMatcher.js';
import {
  toCanonicalBrandKey,
  toCanonicalModelKey,
  canonicalizeVehicle,
} from '../utils/vehicleCanonicalizer.js';

export class VehicleModel extends BaseModel {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    super(fastify);
    this.fastify = fastify;
  }

  /**
   * Build ORDER BY clause based on sort parameter.
   * Supported values:
   * - price_asc: calc_price ASC (low to high)
   * - price_desc: calc_price DESC (high to low)
   * - year_desc: year DESC (newest first)
   * - year_asc: year ASC (oldest first)
   * - mileage_asc: mileage ASC (low to high)
   * - mileage_desc: mileage DESC (high to low)
   * - sold_date_desc: sold_at_date DESC (recently sold first)
   * - sold_date_asc: sold_at_date ASC (oldest sold first)
   * - best_value: low price + low mileage combined score
   * Default: id DESC (most recently added)
   */
  private getSortClause(
    sort?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'mileage_asc' | 'mileage_desc' | 'sold_date_desc' | 'sold_date_asc' | 'best_value',
  ): string {
    // Price sorting uses last_bid (from vehicle_lot_bids) with fallback to calc_price
    // The last_bid_value alias is defined in the SELECT clause
    switch (sort) {
      case 'price_asc':
        return 'COALESCE(last_bid_value, calc_price, 999999999) ASC, id DESC';
      case 'price_desc':
        return 'COALESCE(last_bid_value, calc_price, 0) DESC, id DESC';
      case 'year_desc':
        return 'year DESC, id DESC';
      case 'year_asc':
        return 'year ASC, id DESC';
      case 'mileage_asc':
        return 'mileage ASC, id DESC';
      case 'mileage_desc':
        return 'mileage DESC, id DESC';
      case 'sold_date_desc':
        return 'sold_at_date DESC, sold_at_time DESC, id DESC';
      case 'sold_date_asc':
        return 'sold_at_date ASC, sold_at_time ASC, id DESC';
      case 'best_value':
        // Normalized score: lower price (last_bid or calc_price) + lower mileage = better value
        // Using COALESCE to handle NULLs, putting them last
        return 'COALESCE(last_bid_value, calc_price, 999999999) + COALESCE(mileage, 999999999) * 0.1 ASC, id DESC';
      default:
        return 'id DESC';
    }
  }

  /**
   * Check if a vehicle exists by ID
   */
  async existsById(id: number): Promise<boolean> {
    const rows = await this.executeQuery('SELECT id FROM vehicles WHERE id = ? LIMIT 1', [id]);
    return Array.isArray(rows) && rows.length > 0;
  }

  /**
   * Fetch full vehicle details by ID
   *
   * Used when calculating quotes so that we can access make, model,
   * year, yard_name, and source for distance and response payloads.
   *
   * With the new vehicles schema, make/model are aliases for
   * brand_name/model_name stored on the vehicles table.
   */
  async findById(id: number): Promise<Vehicle | null> {
    const rows = await this.executeQuery(
      'SELECT * FROM vehicles WHERE id = ? LIMIT 1',
      [id],
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const row: any = rows[0];

    // Preserve legacy make/model aliases expected by existing code by
    // mapping them from brand_name/model_name on the vehicles table.
    if (row && row.brand_name && !row.make) {
      row.make = row.brand_name;
    }
    if (row && row.model_name && !row.model) {
      row.model = row.model_name;
    }

    return row as Vehicle;
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<Vehicle[]> {
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 1000 ? limit : 100;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    const rows = await this.executeQuery(
      `SELECT id, brand_name AS make, model_name AS model, year, yard_name, source, retail_value FROM vehicles ORDER BY id DESC LIMIT ${Math.floor(safeLimit)} OFFSET ${Math.floor(safeOffset)}`,
      [],
    );

    return Array.isArray(rows) ? (rows as Vehicle[]) : [];
  }

  /**
   * Search vehicles by optional filters with pagination.
   *
   * Supported filters (if present):
   * - make/model: partial match on brand_name/model_name
   * - year: exact year
   * - yearFrom/yearTo: inclusive year range
   * - priceFrom/priceTo: inclusive range on calc_price
   * - mileageFrom/mileageTo: inclusive range on mileage
   * - fuelType: partial match on engine_fuel / engine_fuel_rus
   * - category: exact match on vehicle_type code ('v' vehicles, 'c' motorcycles)
   * - drive: partial match on drive
   */
  async searchByFilters(
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
      fuelTypes?: string[];
      categoryCodes?: ('v' | 'c')[];
      drive?: string;
      driveTypes?: string[];
      source?: string;
      sourceTypes?: string[];
      buyNow?: boolean;
      vin?: string;
      sourceLotId?: string;
      titleTypes?: string[];
      transmissionTypes?: string[];
      cylinderTypes?: string[];
      soldFrom?: string;
      soldTo?: string;
      location?: string;
      fuzzyLocation?: boolean;
      date?: string;
      keyword?: string;
    },
    limit: number = 50,
    offset: number = 0,
    sort?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'mileage_asc' | 'mileage_desc' | 'sold_date_desc' | 'sold_date_asc' | 'best_value',
  ): Promise<Vehicle[]> {
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 250 ? limit : 50;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    const conditions: string[] = [];
    const params: any[] = [];

    // Canonical make matching: exact match on pre-computed canonical_brand_key
    if (filters.make) {
      const canonicalBrandKey = toCanonicalBrandKey(filters.make);
      conditions.push('canonical_brand_key = ?');
      params.push(canonicalBrandKey);
    }
    // Canonical model matching: exact match on pre-computed canonical_model_key
    if (filters.model) {
      const canonicalModelKey = toCanonicalModelKey(filters.make || '', filters.model);
      conditions.push('canonical_model_key = ?');
      params.push(canonicalModelKey);
    }
    // Keyword search: fallback to title column for free-text search
    // This catches trim levels, editions, and vehicles with missing structured data
    if (filters.keyword) {
      conditions.push('title LIKE ?');
      params.push(`%${filters.keyword}%`);
    }
    if (typeof filters.year === 'number' && Number.isFinite(filters.year)) {
      conditions.push('year = ?');
      params.push(filters.year);
    }
    if (typeof filters.yearFrom === 'number' && Number.isFinite(filters.yearFrom)) {
      conditions.push('year >= ?');
      params.push(filters.yearFrom);
    }
    if (typeof filters.yearTo === 'number' && Number.isFinite(filters.yearTo)) {
      conditions.push('year <= ?');
      params.push(filters.yearTo);
    }
    // Price filtering uses last_bid (from vehicle_lot_bids) with fallback to calc_price
    if (typeof filters.priceFrom === 'number' && Number.isFinite(filters.priceFrom)) {
      conditions.push(`COALESCE(
        (SELECT vlb.bid FROM vehicle_lot_bids vlb WHERE vlb.vehicle_id = vehicles.id ORDER BY vlb.bid_time DESC LIMIT 1),
        calc_price
      ) >= ?`);
      params.push(filters.priceFrom);
    }
    // When priceTo is 500000, it means "500000 and more" - don't apply upper bound
    if (typeof filters.priceTo === 'number' && Number.isFinite(filters.priceTo) && filters.priceTo < 500000) {
      conditions.push(`COALESCE(
        (SELECT vlb.bid FROM vehicle_lot_bids vlb WHERE vlb.vehicle_id = vehicles.id ORDER BY vlb.bid_time DESC LIMIT 1),
        calc_price
      ) <= ?`);
      params.push(filters.priceTo);
    }
    if (typeof filters.mileageFrom === 'number' && Number.isFinite(filters.mileageFrom)) {
      conditions.push('mileage >= ?');
      params.push(filters.mileageFrom);
    }
    // When mileageTo is 250000, it means "250000 and more" - don't apply upper bound
    if (typeof filters.mileageTo === 'number' && Number.isFinite(filters.mileageTo) && filters.mileageTo < 250000) {
      conditions.push('mileage <= ?');
      params.push(filters.mileageTo);
    }
    if (filters.fuelType) {
      conditions.push('(engine_fuel LIKE ? OR engine_fuel_rus LIKE ?)');
      const pattern = `%${filters.fuelType}%`;
      params.push(pattern, pattern);
    }
    // Category codes filter (v = vehicles/cars, c = motorcycles)
    if (filters.categoryCodes && filters.categoryCodes.length > 0) {
      const placeholders = filters.categoryCodes.map(() => '?').join(', ');
      conditions.push(`vehicle_type IN (${placeholders})`);
      params.push(...filters.categoryCodes);
    }
    if (filters.drive) {
      conditions.push('drive LIKE ?');
      params.push(`%${filters.drive}%`);
    }
    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }
    // Multi-value source filter
    if (filters.sourceTypes && filters.sourceTypes.length > 0) {
      const placeholders = filters.sourceTypes.map(() => '?').join(', ');
      conditions.push(`LOWER(source) IN (${placeholders})`);
      params.push(...filters.sourceTypes.map((s) => s.toLowerCase()));
    }
    if (filters.buyNow) {
      conditions.push('buy_it_now IS NOT NULL AND buy_it_now > 0');
    }
    if (filters.vin) {
      conditions.push('vin LIKE ?');
      params.push(`%${filters.vin}%`);
    }
    if (filters.sourceLotId) {
      conditions.push('source_lot_id = ?');
      params.push(filters.sourceLotId);
    }

    // Multi-value drive filter with special handling for 'full'
    if (filters.driveTypes && filters.driveTypes.length > 0) {
      const driveConditions: string[] = [];
      for (const driveType of filters.driveTypes) {
        if (driveType === 'full') {
          // 'full' should match 'full', 'full/front', 'full/rear'
          driveConditions.push('(LOWER(drive) = ? OR LOWER(drive) LIKE ? OR LOWER(drive) LIKE ?)');
          params.push('full', 'full/%', '%/full');
        } else {
          driveConditions.push('LOWER(drive) = ?');
          params.push(driveType.toLowerCase());
        }
      }
      conditions.push(`(${driveConditions.join(' OR ')})`);
    }

    // Title type filter (document column) - uses LIKE for partial matching
    // e.g. "clean title" matches "CLEAN TITLE - GA", "SALVAGE TITLE - TX", etc.
    if (filters.titleTypes && filters.titleTypes.length > 0) {
      const titleConditions: string[] = [];
      for (const titleType of filters.titleTypes) {
        titleConditions.push('LOWER(document) LIKE ?');
        params.push(`%${titleType.toLowerCase()}%`);
      }
      conditions.push(`(${titleConditions.join(' OR ')})`);
    }

    // Transmission filter
    if (filters.transmissionTypes && filters.transmissionTypes.length > 0) {
      const placeholders = filters.transmissionTypes.map(() => '?').join(', ');
      conditions.push(`LOWER(transmission) IN (${placeholders})`);
      params.push(...filters.transmissionTypes.map((t) => t.toLowerCase()));
    }

    // Multi-value fuel filter
    if (filters.fuelTypes && filters.fuelTypes.length > 0) {
      const fuelConditions: string[] = [];
      for (const fuel of filters.fuelTypes) {
        fuelConditions.push('(LOWER(engine_fuel) = ? OR LOWER(engine_fuel_rus) = ?)');
        params.push(fuel.toLowerCase(), fuel.toLowerCase());
      }
      conditions.push(`(${fuelConditions.join(' OR ')})`);
    }

    // Cylinders filter (kept as strings)
    if (filters.cylinderTypes && filters.cylinderTypes.length > 0) {
      const placeholders = filters.cylinderTypes.map(() => '?').join(', ');
      conditions.push(`UPPER(cylinders) IN (${placeholders})`);
      params.push(...filters.cylinderTypes.map((c) => c.toUpperCase()));
    }

    // Sale date filter (combines sold_at_date and sold_at_time)
    if (filters.soldFrom) {
      const parts = filters.soldFrom.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '00:00:00';
      conditions.push('(sold_at_date > ? OR (sold_at_date = ? AND (sold_at_time IS NULL OR sold_at_time >= ?)))');
      params.push(datePart, datePart, timePart);
    }
    if (filters.soldTo) {
      const parts = filters.soldTo.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '23:59:59';
      conditions.push('(sold_at_date < ? OR (sold_at_date = ? AND (sold_at_time IS NULL OR sold_at_time <= ?)))');
      params.push(datePart, datePart, timePart);
    }

    // Location filter (matches yard_name)
    // Two modes: exact match (default) or fuzzy match (when fuzzyLocation=true)
    if (filters.location) {
      if (filters.fuzzyLocation) {
        // Fuzzy matching: use LIKE patterns for broad DB-level filtering
        const likePatterns = buildLocationLikePatterns(filters.location);
        if (likePatterns.length > 0) {
          // Use OR for multiple patterns to get candidate matches
          const likeConditions = likePatterns.slice(0, 3).map(() => 'UPPER(yard_name) LIKE ?').join(' OR ');
          conditions.push(`(${likeConditions})`);
          params.push(...likePatterns.slice(0, 3).map(p => p.toUpperCase()));
        }
      } else {
        // Exact matching (legacy behavior): lowercase with spaces removed
        conditions.push('LOWER(REPLACE(yard_name, \' \', \'\')) = ?');
        params.push(filters.location.toLowerCase().replace(/\s/g, ''));
      }
    }

    // Exact date filter (sold_at_date = date)
    // If sold_at_date is a DATE column, direct comparison works.
    // If it's DATETIME, use DATE(sold_at_date) = ?
    if (filters.date) {
      conditions.push('DATE(sold_at_date) = ?');
      params.push(filters.date);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        id,
        vin,
        source_lot_id,
        brand_name AS make,
        model_name AS model,
        year,
        mileage,
        yard_name,
        source,
        retail_value,
        calc_price,
        buy_it_now_price,
        buy_it_now,
        engine_fuel,
        engine_volume,
        vehicle_type AS category,
        drive,
        document,
        transmission,
        cylinders,
        sold_at_date,
        sold_at_time,
        CASE
          WHEN sold_at_date IS NOT NULL AND sold_at_time IS NOT NULL
          THEN CONCAT(sold_at_date, ' ', sold_at_time)
          WHEN sold_at_date IS NOT NULL
          THEN CONCAT(sold_at_date, ' 00:00:00')
          ELSE NULL
        END AS sold_at,
        (
          SELECT vp.url
          FROM vehicle_photos vp
          WHERE vp.vehicle_id = vehicles.id
          ORDER BY vp.id ASC
          LIMIT 1
        ) AS primary_photo_url,
        (
          SELECT vp.thumb_url_min
          FROM vehicle_photos vp
          WHERE vp.vehicle_id = vehicles.id
          ORDER BY vp.id ASC
          LIMIT 1
        ) AS primary_thumb_url,
        (
          SELECT vlb.bid
          FROM vehicle_lot_bids vlb
          WHERE vlb.vehicle_id = vehicles.id
          ORDER BY vlb.bid_time DESC
          LIMIT 1
        ) AS last_bid_value
      FROM vehicles
      ${where}
      ORDER BY ${this.getSortClause(sort)}
      LIMIT ${Math.floor(safeLimit)} OFFSET ${Math.floor(safeOffset)}
    `;

    const rows = await this.executeQuery(query, params);
    return Array.isArray(rows) ? (rows as Vehicle[]) : [];
  }

  /**
   * Count vehicles matching the same filters used by searchByFilters.
   * Used to derive total pages for pagination.
   */
  async countByFilters(filters: {
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
    fuelTypes?: string[];
    categoryCodes?: ('v' | 'c')[];
    drive?: string;
    driveTypes?: string[];
    source?: string;
    sourceTypes?: string[];
    buyNow?: boolean;
    vin?: string;
    titleTypes?: string[];
    transmissionTypes?: string[];
    cylinderTypes?: string[];
    soldFrom?: string;
    soldTo?: string;
    sourceLotId?: string;
    location?: string;
    fuzzyLocation?: boolean;
    date?: string;
    keyword?: string;
  }): Promise<number> {
    const conditions: string[] = [];
    const params: any[] = [];

    // Canonical make matching: exact match on pre-computed canonical_brand_key
    if (filters.make) {
      const canonicalBrandKey = toCanonicalBrandKey(filters.make);
      conditions.push('canonical_brand_key = ?');
      params.push(canonicalBrandKey);
    }
    // Canonical model matching: exact match on pre-computed canonical_model_key
    if (filters.model) {
      const canonicalModelKey = toCanonicalModelKey(filters.make || '', filters.model);
      conditions.push('canonical_model_key = ?');
      params.push(canonicalModelKey);
    }
    // Keyword search: fallback to title column for free-text search
    if (filters.keyword) {
      conditions.push('title LIKE ?');
      params.push(`%${filters.keyword}%`);
    }
    if (typeof filters.year === 'number' && Number.isFinite(filters.year)) {
      conditions.push('year = ?');
      params.push(filters.year);
    }
    if (typeof filters.yearFrom === 'number' && Number.isFinite(filters.yearFrom)) {
      conditions.push('year >= ?');
      params.push(filters.yearFrom);
    }
    if (typeof filters.yearTo === 'number' && Number.isFinite(filters.yearTo)) {
      conditions.push('year <= ?');
      params.push(filters.yearTo);
    }
    // Price filtering uses last_bid (from vehicle_lot_bids) with fallback to calc_price
    if (typeof filters.priceFrom === 'number' && Number.isFinite(filters.priceFrom)) {
      conditions.push(`COALESCE(
        (SELECT vlb.bid FROM vehicle_lot_bids vlb WHERE vlb.vehicle_id = vehicles.id ORDER BY vlb.bid_time DESC LIMIT 1),
        calc_price
      ) >= ?`);
      params.push(filters.priceFrom);
    }
    // When priceTo is 500000, it means "500000 and more" - don't apply upper bound
    if (typeof filters.priceTo === 'number' && Number.isFinite(filters.priceTo) && filters.priceTo < 500000) {
      conditions.push(`COALESCE(
        (SELECT vlb.bid FROM vehicle_lot_bids vlb WHERE vlb.vehicle_id = vehicles.id ORDER BY vlb.bid_time DESC LIMIT 1),
        calc_price
      ) <= ?`);
      params.push(filters.priceTo);
    }
    if (typeof filters.mileageFrom === 'number' && Number.isFinite(filters.mileageFrom)) {
      conditions.push('mileage >= ?');
      params.push(filters.mileageFrom);
    }
    // When mileageTo is 250000, it means "250000 and more" - don't apply upper bound
    if (typeof filters.mileageTo === 'number' && Number.isFinite(filters.mileageTo) && filters.mileageTo < 250000) {
      conditions.push('mileage <= ?');
      params.push(filters.mileageTo);
    }
    if (filters.fuelType) {
      conditions.push('(engine_fuel LIKE ? OR engine_fuel_rus LIKE ?)');
      const pattern = `%${filters.fuelType}%`;
      params.push(pattern, pattern);
    }
    // Category codes filter (v = vehicles/cars, c = motorcycles)
    if (filters.categoryCodes && filters.categoryCodes.length > 0) {
      const placeholders = filters.categoryCodes.map(() => '?').join(', ');
      conditions.push(`vehicle_type IN (${placeholders})`);
      params.push(...filters.categoryCodes);
    }
    if (filters.drive) {
      conditions.push('drive LIKE ?');
      params.push(`%${filters.drive}%`);
    }
    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }
    // Multi-value source filter
    if (filters.sourceTypes && filters.sourceTypes.length > 0) {
      const placeholders = filters.sourceTypes.map(() => '?').join(', ');
      conditions.push(`LOWER(source) IN (${placeholders})`);
      params.push(...filters.sourceTypes.map((s) => s.toLowerCase()));
    }
    if (filters.buyNow) {
      conditions.push('buy_it_now IS NOT NULL AND buy_it_now > 0');
    }
    if (filters.vin) {
      conditions.push('vin LIKE ?');
      params.push(`%${filters.vin}%`);
    }
    if (filters.sourceLotId) {
      conditions.push('source_lot_id = ?');
      params.push(filters.sourceLotId);
    }

    // Multi-value drive filter with special handling for 'full'
    if (filters.driveTypes && filters.driveTypes.length > 0) {
      const driveConditions: string[] = [];
      for (const driveType of filters.driveTypes) {
        if (driveType === 'full') {
          driveConditions.push('(LOWER(drive) = ? OR LOWER(drive) LIKE ? OR LOWER(drive) LIKE ?)');
          params.push('full', 'full/%', '%/full');
        } else {
          driveConditions.push('LOWER(drive) = ?');
          params.push(driveType.toLowerCase());
        }
      }
      conditions.push(`(${driveConditions.join(' OR ')})`);
    }

    // Title type filter (document column) - uses LIKE for partial matching
    // e.g. "clean title" matches "CLEAN TITLE - GA", "SALVAGE TITLE - TX", etc.
    if (filters.titleTypes && filters.titleTypes.length > 0) {
      const titleConditions: string[] = [];
      for (const titleType of filters.titleTypes) {
        titleConditions.push('LOWER(document) LIKE ?');
        params.push(`%${titleType.toLowerCase()}%`);
      }
      conditions.push(`(${titleConditions.join(' OR ')})`);
    }

    // Transmission filter
    if (filters.transmissionTypes && filters.transmissionTypes.length > 0) {
      const placeholders = filters.transmissionTypes.map(() => '?').join(', ');
      conditions.push(`LOWER(transmission) IN (${placeholders})`);
      params.push(...filters.transmissionTypes.map((t) => t.toLowerCase()));
    }

    // Multi-value fuel filter
    if (filters.fuelTypes && filters.fuelTypes.length > 0) {
      const fuelConditions: string[] = [];
      for (const fuel of filters.fuelTypes) {
        fuelConditions.push('(LOWER(engine_fuel) = ? OR LOWER(engine_fuel_rus) = ?)');
        params.push(fuel.toLowerCase(), fuel.toLowerCase());
      }
      conditions.push(`(${fuelConditions.join(' OR ')})`);
    }

    // Cylinders filter
    if (filters.cylinderTypes && filters.cylinderTypes.length > 0) {
      const placeholders = filters.cylinderTypes.map(() => '?').join(', ');
      conditions.push(`UPPER(cylinders) IN (${placeholders})`);
      params.push(...filters.cylinderTypes.map((c) => c.toUpperCase()));
    }

    // Sale date filter
    if (filters.soldFrom) {
      const parts = filters.soldFrom.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '00:00:00';
      conditions.push('(sold_at_date > ? OR (sold_at_date = ? AND (sold_at_time IS NULL OR sold_at_time >= ?)))');
      params.push(datePart, datePart, timePart);
    }
    if (filters.soldTo) {
      const parts = filters.soldTo.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '23:59:59';
      conditions.push('(sold_at_date < ? OR (sold_at_date = ? AND (sold_at_time IS NULL OR sold_at_time <= ?)))');
      params.push(datePart, datePart, timePart);
    }

    // Location filter (matches yard_name)
    // Two modes: exact match (default) or fuzzy match (when fuzzyLocation=true)
    if (filters.location) {
      if (filters.fuzzyLocation) {
        // Fuzzy matching: use LIKE patterns for broad DB-level filtering
        const likePatterns = buildLocationLikePatterns(filters.location);
        if (likePatterns.length > 0) {
          const likeConditions = likePatterns.slice(0, 3).map(() => 'UPPER(yard_name) LIKE ?').join(' OR ');
          conditions.push(`(${likeConditions})`);
          params.push(...likePatterns.slice(0, 3).map(p => p.toUpperCase()));
        }
      } else {
        // Exact matching (legacy behavior): lowercase with spaces removed
        conditions.push('LOWER(REPLACE(yard_name, \' \', \'\')) = ?');
        params.push(filters.location.toLowerCase().replace(/\s/g, ''));
      }
    }

    // Exact date filter (sold_at_date = date)
    if (filters.date) {
      conditions.push('DATE(sold_at_date) = ?');
      params.push(filters.date);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT COUNT(*) AS count FROM vehicles ${where}`;

    const rows = await this.executeQuery(query, params);
    if (!Array.isArray(rows) || rows.length === 0) {
      return 0;
    }

    const row = rows[0] as { count: number | string };
    const value = typeof row.count === 'number' ? row.count : Number(row.count);
    return Number.isFinite(value) ? value : 0;
  }

  /**
   * Find vehicles similar to the given base vehicle ID.
   *
   * Similarity is currently based only on brand_name/model_name (aliased as
   * make/model). Additional criteria (such as year ranges, price bands,
   * vehicle_type, engine_fuel, etc.) can be added later without changing the
   * public API.
   */
  async findSimilarById(
    id: number,
    options?: {
      limit?: number;
      offset?: number;
      yearRange?: number;
      priceRadius?: number;
    },
  ): Promise<{ items: Vehicle[]; total: number }> {
    const base = await this.findById(id);
    if (!base) {
      return { items: [], total: 0 };
    }

    const limit = Number.isFinite(options?.limit || 0) && (options?.limit || 0) > 0
      ? (options as any).limit
      : 10;
    const offset = Number.isFinite(options?.offset) && (options?.offset as number) >= 0
      ? (options as any).offset
      : 0;
    const yearRange = Number.isFinite(options?.yearRange || 0) && (options?.yearRange || 0) > 0
      ? (options as any).yearRange
      : 2;
    const priceRadius = Number.isFinite(options?.priceRadius || 0) && (options?.priceRadius || 0) > 0
      ? (options as any).priceRadius
      : 0.2;

    const rawPrice =
      base && (base as any).calc_price != null
        ? Number((base as any).calc_price)
        : base && (base as any).retail_value != null
          ? Number((base as any).retail_value)
          : null;

    const conditions: string[] = [];
    const params: any[] = [];

    // Always exclude the base vehicle itself.
    conditions.push('id <> ?');
    params.push(id);

    if ((base as any).brand_name) {
      conditions.push('brand_name = ?');
      params.push((base as any).brand_name);
    }
    if ((base as any).model_name) {
      conditions.push('model_name = ?');
      params.push((base as any).model_name);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query for pagination
    const countQuery = `SELECT COUNT(*) AS total FROM vehicles ${where}`;
    const countResult = await this.executeQuery(countQuery, [...params]);
    const total = Array.isArray(countResult) && countResult.length > 0
      ? Number((countResult[0] as any).total)
      : 0;

    const query = `
      SELECT
        id,
        brand_name AS make,
        model_name AS model,
        year,
        mileage,
        yard_name,
        source,
        retail_value,
        calc_price,
        buy_it_now_price,
        buy_it_now,
        engine_fuel AS fuel_type,
        vehicle_type AS category,
        drive,
        (
          SELECT vp.url
          FROM vehicle_photos vp
          WHERE vp.vehicle_id = vehicles.id
          ORDER BY vp.id ASC
          LIMIT 1
        ) AS primary_photo_url,
        (
          SELECT vp.thumb_url_min
          FROM vehicle_photos vp
          WHERE vp.vehicle_id = vehicles.id
          ORDER BY vp.id ASC
          LIMIT 1
        ) AS primary_thumb_url
      FROM vehicles
      ${where}
      ORDER BY
        RAND(),
        id DESC
      LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}
    `;

    const rows = await this.executeQuery(query, params);
    const items = Array.isArray(rows) ? (rows as Vehicle[]) : [];
    return { items, total };
  }

  async getPhotosByVehicleId(vehicleId: number): Promise<VehiclePhoto[]> {
    const rows = await this.executeQuery(
      'SELECT id, vehicle_id, url, thumb_url, thumb_url_min, thumb_url_middle FROM vehicle_photos WHERE vehicle_id = ? ORDER BY id ASC',
      [vehicleId],
    );

    return Array.isArray(rows) ? (rows as VehiclePhoto[]) : [];
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.executeCommand(
      'DELETE FROM vehicles WHERE id = ?',
      [id],
    );

    return Boolean(result && typeof result.affectedRows === 'number' && result.affectedRows > 0);
  }

  // ---------------------------------------------------------------------------
  // Auction ingestion
  // ---------------------------------------------------------------------------

  async upsertFromAuctionLots(lots: any[]): Promise<void> {
    if (!Array.isArray(lots) || !lots.length) return;

    // Process vehicles/photos/bids in parallel batches to speed up
    // ingestion while avoiding overwhelming the DB.
    const configuredConcurrency = process.env.AUCTION_INGEST_CONCURRENCY
      ? Number.parseInt(process.env.AUCTION_INGEST_CONCURRENCY, 10)
      : NaN;
    const concurrency = Number.isFinite(configuredConcurrency) && configuredConcurrency > 0
      ? configuredConcurrency
      : 20; // tune based on DB capacity
    const total = lots.length;
    let processed = 0;

    for (let i = 0; i < lots.length; i += concurrency) {
      const batch = lots.slice(i, i + concurrency);

      await Promise.all(
        batch.map(async (lot) => {
          try {
            const vehicleId = await this.upsertVehicleFromAuction(lot);

            if (Array.isArray(lot.photo)) {
              await this.replaceVehiclePhotosFromAuction(vehicleId, lot.photo);
            }

            await this.replaceVehicleBidsFromAuction(vehicleId, lot.lot_bid_histories);

            processed += 1;
            if (processed % 100 === 0 || processed === total) {
              this.fastify.log.info(
                { processed, total },
                'Auction active lots DB ingestion progress',
              );
            }
          } catch (error) {
            this.fastify.log.error(
              { error, lotId: lot?.id, vin: lot?.vin },
              'Failed to upsert auction lot into database',
            );
          }
        }),
      );
    }
  }

  private async upsertVehicleFromAuction(lot: any): Promise<number> {
    // Extract brand and model names
    const brandName = lot.brand_name ?? (lot.model?.brand?.name ?? null);
    const modelName = lot.model_name ?? lot.model?.name ?? null;

    // Calculate canonical values for deterministic search
    const canonical = brandName && modelName
      ? canonicalizeVehicle(brandName, modelName)
      : { canonical_brand: null, canonical_model_key: null };

    const query = `
      INSERT INTO vehicles (
        id,
        number,
        source_lot_id,
        model_id,
        vehicle_type,
        vehicle_type_key,
        sale_title_state,
        sale_title_state_id,
        sale_title_type,
        sale_title_type_id,
        salvage_id,
        has_keys,
        lot_cond_code,
        lot_cond_code_key,
        retail_value,
        repair_cost,
        cylinders,
        seller,
        document,
        buy_it_now_price,
        price_future,
        trim,
        vin,
        engine_volume,
        engine_fuel,
        drive,
        transmission,
        mileage,
        year,
        color,
        color_id,
        status,
        damage_status,
        damage_status_key,
        damage_main_damages,
        damage_main_damages_key,
        damage_secondary_damages,
        damage_secondary_damages_key,
        damage_notes,
        odometer_brand,
        airbags,
        yard_number,
        yard_name,
        iaai_360_view,
        engine_view,
        title,
        copart_360_interior_view,
        copart_360_exterior_view,
        equipment,
        state,
        city,
        city_slug,
        bid_country,
        source,
        buy_it_now,
        final_bid,
        views,
        timezone,
        is_new,
        created_at,
        updated_at,
        sold_at,
        seller_type_id,
        seller_type,
        link,
        relative_link,
        clear_link,
        engine_fuel_rus,
        brand_name,
        model_name,
        canonical_brand,
        canonical_model_key,
        has_keys_readable,
        run_and_drive,
        calc_price,
        sold_at_date,
        sold_at_time,
        timezone_rus
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        number = VALUES(number),
        source_lot_id = VALUES(source_lot_id),
        model_id = VALUES(model_id),
        vehicle_type = VALUES(vehicle_type),
        vehicle_type_key = VALUES(vehicle_type_key),
        sale_title_state = VALUES(sale_title_state),
        sale_title_state_id = VALUES(sale_title_state_id),
        sale_title_type = VALUES(sale_title_type),
        sale_title_type_id = VALUES(sale_title_type_id),
        salvage_id = VALUES(salvage_id),
        has_keys = VALUES(has_keys),
        lot_cond_code = VALUES(lot_cond_code),
        lot_cond_code_key = VALUES(lot_cond_code_key),
        retail_value = VALUES(retail_value),
        repair_cost = VALUES(repair_cost),
        cylinders = VALUES(cylinders),
        seller = VALUES(seller),
        document = VALUES(document),
        buy_it_now_price = VALUES(buy_it_now_price),
        price_future = VALUES(price_future),
        trim = VALUES(trim),
        vin = VALUES(vin),
        engine_volume = VALUES(engine_volume),
        engine_fuel = VALUES(engine_fuel),
        drive = VALUES(drive),
        transmission = VALUES(transmission),
        mileage = VALUES(mileage),
        year = VALUES(year),
        color = VALUES(color),
        color_id = VALUES(color_id),
        status = VALUES(status),
        damage_status = VALUES(damage_status),
        damage_status_key = VALUES(damage_status_key),
        damage_main_damages = VALUES(damage_main_damages),
        damage_main_damages_key = VALUES(damage_main_damages_key),
        damage_secondary_damages = VALUES(damage_secondary_damages),
        damage_secondary_damages_key = VALUES(damage_secondary_damages_key),
        damage_notes = VALUES(damage_notes),
        odometer_brand = VALUES(odometer_brand),
        airbags = VALUES(airbags),
        yard_number = VALUES(yard_number),
        yard_name = VALUES(yard_name),
        iaai_360_view = VALUES(iaai_360_view),
        engine_view = VALUES(engine_view),
        title = VALUES(title),
        copart_360_interior_view = VALUES(copart_360_interior_view),
        copart_360_exterior_view = VALUES(copart_360_exterior_view),
        equipment = VALUES(equipment),
        state = VALUES(state),
        city = VALUES(city),
        city_slug = VALUES(city_slug),
        bid_country = VALUES(bid_country),
        source = VALUES(source),
        buy_it_now = VALUES(buy_it_now),
        final_bid = VALUES(final_bid),
        views = VALUES(views),
        timezone = VALUES(timezone),
        is_new = VALUES(is_new),
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at),
        sold_at = VALUES(sold_at),
        seller_type_id = VALUES(seller_type_id),
        seller_type = VALUES(seller_type),
        link = VALUES(link),
        relative_link = VALUES(relative_link),
        clear_link = VALUES(clear_link),
        engine_fuel_rus = VALUES(engine_fuel_rus),
        brand_name = VALUES(brand_name),
        model_name = VALUES(model_name),
        canonical_brand = VALUES(canonical_brand),
        canonical_model_key = VALUES(canonical_model_key),
        has_keys_readable = VALUES(has_keys_readable),
        run_and_drive = VALUES(run_and_drive),
        calc_price = VALUES(calc_price),
        sold_at_date = VALUES(sold_at_date),
        sold_at_time = VALUES(sold_at_time),
        timezone_rus = VALUES(timezone_rus)
    `;

    const params = [
      lot.id,
      lot.number ?? null,
      lot.source_lot_id ?? null,
      lot.model_id,
      lot.vehicle_type ?? null,
      lot.vehicle_type_key ?? null,
      lot.sale_title_state ?? null,
      lot.sale_title_state_id ?? null,
      lot.sale_title_type ?? null,
      lot.sale_title_type_id ?? null,
      lot.salvage_id ?? null,
      lot.has_keys ?? null,
      lot.lot_cond_code ?? null,
      lot.lot_cond_code_key ?? null,
      lot.retail_value ?? null,
      lot.repair_cost ?? null,
      lot.cylinders ?? null,
      lot.seller ?? null,
      lot.document ?? null,
      lot.buy_it_now_price ?? null,
      lot.price_future ?? null,
      lot.trim ?? null,
      lot.vin,
      lot.engine_volume ?? null,
      lot.engine_fuel ?? null,
      lot.drive ?? null,
      lot.transmission ?? null,
      lot.mileage ?? null,
      lot.year ?? null,
      lot.color ?? null,
      lot.color_id ?? null,
      lot.status ?? null,
      lot.damage_status ?? null,
      lot.damage_status_key ?? null,
      lot.damage_main_damages ?? null,
      lot.damage_main_damages_key ?? null,
      lot.damage_secondary_damages ?? null,
      lot.damage_secondary_damages_key ?? null,
      lot.damage_notes ?? null,
      lot.odometer_brand ?? null,
      lot.airbags ?? null,
      lot.yard_number ?? null,
      lot.yard_name ?? null,
      lot.iaai_360_view ?? null,
      lot.engine_view ?? null,
      lot.title ?? null,
      lot.copart_360_interior_view ?? null,
      lot.copart_360_exterior_view ?? null,
      lot.equipment ?? null,
      lot.state ?? null,
      lot.city ?? null,
      lot.city_slug ?? null,
      lot.bid_country ?? null,
      lot.source ?? null,
      lot.buy_it_now ?? null,
      lot.final_bid ?? null,
      lot.views ?? null,
      lot.timezone ?? null,
      lot.is_new ?? null,
      this.normalizeDateTime(lot.created_at),
      this.normalizeDateTime(lot.updated_at),
      this.normalizeDateTime(lot.sold_at),
      lot.seller_type_id ?? null,
      lot.seller_type ?? null,
      lot.link ?? null,
      lot.relative_link ?? null,
      lot.clear_link ?? null,
      lot.engine_fuel_rus ?? null,
      brandName,
      modelName,
      canonical.canonical_brand,
      canonical.canonical_model_key,
      lot.has_keys_readable ?? null,
      lot.run_and_drive ?? null,
      lot.calc_price ?? null,
      this.normalizeSoldAtDate(lot.sold_at_date),
      lot.sold_at_time ?? null,
      lot.timezone_rus ?? null,
    ];

    await this.executeCommand(query, params);
    return lot.id as number;
  }

  private normalizeDateTime(value: any): string | null {
    if (!value) return null;
    const s = String(value);
    return s.replace('T', ' ').replace('Z', '');
  }

  private normalizeSoldAtDate(value: any): string | null {
    if (!value) return null;
    const s = String(value);
    const m = /^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/.exec(s);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  private async replaceVehiclePhotosFromAuction(vehicleId: number, photos: any[]): Promise<void> {
    await this.executeCommand('DELETE FROM vehicle_photos WHERE vehicle_id = ?', [vehicleId]);

    if (!Array.isArray(photos) || photos.length === 0) {
      return;
    }

    const baseInsert = `
      INSERT INTO vehicle_photos (vehicle_id, url, thumb_url, thumb_url_min, thumb_url_middle)
      VALUES
    `;

    const values: string[] = [];
    const params: any[] = [];

    for (const photo of photos) {
      values.push('(?, ?, ?, ?, ?)');
      params.push(
        vehicleId,
        photo.url ?? null,
        photo.thumb_url ?? null,
        photo.thumb_url_min ?? null,
        photo.thumb_url_middle ?? null,
      );
    }

    const insert = `${baseInsert} ${values.join(', ')}`;
    await this.executeCommand(insert, params);
  }

  private async replaceVehicleBidsFromAuction(
    vehicleId: number,
    lotBidHistories: string | null,
  ): Promise<void> {
    await this.executeCommand('DELETE FROM vehicle_lot_bids WHERE vehicle_id = ?', [vehicleId]);

    if (!lotBidHistories) {
      return;
    }

    let parsed: any[] = [];
    try {
      parsed = JSON.parse(lotBidHistories);
      if (!Array.isArray(parsed)) {
        parsed = [];
      }
    } catch (error) {
      this.fastify.log.error(
        { error, vehicleId },
        'Failed to parse lot_bid_histories JSON for vehicle',
      );
      return;
    }

    if (!parsed.length) {
      return;
    }

    const baseInsert = `
      INSERT INTO vehicle_lot_bids (vehicle_id, bid, bid_time)
      VALUES
    `;

    const values: string[] = [];
    const params: any[] = [];

    for (const entry of parsed) {
      values.push('(?, ?, ?)');
      params.push(
        vehicleId,
        entry.bid ?? null,
        entry.time ?? null,
      );
    }

    const insert = `${baseInsert} ${values.join(', ')}`;
    await this.executeCommand(insert, params);
  }

  /**
   * Fetch bid histories for multiple vehicles at once.
   * Returns a map of vehicle_id -> array of bids (sorted by bid_time DESC).
   */
  async getBidsForVehicles(vehicleIds: number[]): Promise<Map<number, { bid: number | null; bid_time: string | null }[]>> {
    const result = new Map<number, { bid: number | null; bid_time: string | null }[]>();

    if (!vehicleIds.length) {
      return result;
    }

    const placeholders = vehicleIds.map(() => '?').join(', ');
    const query = `
      SELECT vehicle_id, bid, bid_time
      FROM vehicle_lot_bids
      WHERE vehicle_id IN (${placeholders})
      ORDER BY vehicle_id, bid_time DESC
    `;

    const rows = await this.executeQuery(query, vehicleIds);

    if (!Array.isArray(rows)) {
      return result;
    }

    for (const row of rows as { vehicle_id: number; bid: number | null; bid_time: Date | null }[]) {
      const vehicleId = row.vehicle_id;
      if (!result.has(vehicleId)) {
        result.set(vehicleId, []);
      }
      result.get(vehicleId)!.push({
        bid: row.bid,
        bid_time: row.bid_time ? row.bid_time.toISOString() : null,
      });
    }

    return result;
  }
}
