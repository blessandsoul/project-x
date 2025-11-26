import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import { Vehicle, VehiclePhoto } from '../types/vehicle.js';

export class VehicleModel extends BaseModel {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    super(fastify);
    this.fastify = fastify;
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
      'SELECT id, brand_name, model_name, brand_name AS make, model_name AS model, year, yard_name, source, retail_value FROM vehicles ORDER BY id DESC LIMIT ? OFFSET ?',
      [safeLimit, safeOffset],
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
   * - category: partial match on vehicle_type
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
      category?: string;
      drive?: string;
      source?: string;
      buyNow?: boolean;
    },
    limit: number = 50,
    offset: number = 0,
  ): Promise<Vehicle[]> {
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 250 ? limit : 50;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.make) {
      conditions.push('brand_name LIKE ?');
      params.push(`%${filters.make}%`);
    }
    if (filters.model) {
      conditions.push('model_name LIKE ?');
      params.push(`%${filters.model}%`);
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
    if (typeof filters.priceFrom === 'number' && Number.isFinite(filters.priceFrom)) {
      conditions.push('calc_price >= ?');
      params.push(filters.priceFrom);
    }
    if (typeof filters.priceTo === 'number' && Number.isFinite(filters.priceTo)) {
      conditions.push('calc_price <= ?');
      params.push(filters.priceTo);
    }
    if (typeof filters.mileageFrom === 'number' && Number.isFinite(filters.mileageFrom)) {
      conditions.push('mileage >= ?');
      params.push(filters.mileageFrom);
    }
    if (typeof filters.mileageTo === 'number' && Number.isFinite(filters.mileageTo)) {
      conditions.push('mileage <= ?');
      params.push(filters.mileageTo);
    }
    if (filters.fuelType) {
      conditions.push('(engine_fuel LIKE ? OR engine_fuel_rus LIKE ?)');
      const pattern = `%${filters.fuelType}%`;
      params.push(pattern, pattern);
    }
    if (filters.category) {
      conditions.push('vehicle_type LIKE ?');
      params.push(`%${filters.category}%`);
    }
    if (filters.drive) {
      conditions.push('drive LIKE ?');
      params.push(`%${filters.drive}%`);
    }
    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }
    if (filters.buyNow) {
      conditions.push('buy_it_now = 1');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        id,
        brand_name,
        model_name,
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
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    params.push(safeLimit, safeOffset);

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
    category?: string;
    drive?: string;
    source?: string;
    buyNow?: boolean;
  }): Promise<number> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.make) {
      conditions.push('brand_name LIKE ?');
      params.push(`%${filters.make}%`);
    }
    if (filters.model) {
      conditions.push('model_name LIKE ?');
      params.push(`%${filters.model}%`);
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
    if (typeof filters.priceFrom === 'number' && Number.isFinite(filters.priceFrom)) {
      conditions.push('calc_price >= ?');
      params.push(filters.priceFrom);
    }
    if (typeof filters.priceTo === 'number' && Number.isFinite(filters.priceTo)) {
      conditions.push('calc_price <= ?');
      params.push(filters.priceTo);
    }
    if (typeof filters.mileageFrom === 'number' && Number.isFinite(filters.mileageFrom)) {
      conditions.push('mileage >= ?');
      params.push(filters.mileageFrom);
    }
    if (typeof filters.mileageTo === 'number' && Number.isFinite(filters.mileageTo)) {
      conditions.push('mileage <= ?');
      params.push(filters.mileageTo);
    }
    if (filters.fuelType) {
      conditions.push('(engine_fuel LIKE ? OR engine_fuel_rus LIKE ?)');
      const pattern = `%${filters.fuelType}%`;
      params.push(pattern, pattern);
    }
    if (filters.category) {
      conditions.push('vehicle_type LIKE ?');
      params.push(`%${filters.category}%`);
    }
    if (filters.drive) {
      conditions.push('drive LIKE ?');
      params.push(`%${filters.drive}%`);
    }
    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
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
      yearRange?: number;
      priceRadius?: number;
    },
  ): Promise<Vehicle[]> {
    const base = await this.findById(id);
    if (!base) {
      return [];
    }

    const limit = Number.isFinite(options?.limit || 0) && (options?.limit || 0) > 0
      ? (options as any).limit
      : 10;
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

    const query = `
      SELECT
        id,
        brand_name,
        model_name,
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
      LIMIT ?
    `;

    params.push(limit);

    const rows = await this.executeQuery(query, params);
    return Array.isArray(rows) ? (rows as Vehicle[]) : [];
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

    // 1) Deduplicate brands and models so we don't upsert the same
    //    brand/model thousands of times.
    const brandMap = new Map<any, any>();
    const modelMap = new Map<any, any>();

    for (const lot of lots) {
      const model = lot.model || null;
      const brand = model?.brand || null;

      if (brand && brand.id != null && !brandMap.has(brand.id)) {
        brandMap.set(brand.id, brand);
      }
      if (model && model.id != null && !modelMap.has(model.id)) {
        modelMap.set(model.id, model);
      }
    }

    const brandUpserts = Array.from(brandMap.values()).map((brand) =>
      this.upsertBrandFromAuction(brand),
    );
    const modelUpserts = Array.from(modelMap.values()).map((model) =>
      this.upsertModelFromAuction(model),
    );

    await Promise.all([...brandUpserts, ...modelUpserts]);

    // 2) Process vehicles/photos/bids in parallel batches to speed up
    //    ingestion while avoiding overwhelming the DB.
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

  private async upsertBrandFromAuction(brand: any): Promise<void> {
    const query = `
      INSERT INTO brands (id, slug, name, popular, count, created_at, updated_at, markabrand_ru)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        slug = VALUES(slug),
        name = VALUES(name),
        popular = VALUES(popular),
        count = VALUES(count),
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at),
        markabrand_ru = VALUES(markabrand_ru)
    `;

    await this.executeCommand(query, [
      brand.id,
      brand.slug,
      brand.name,
      brand.popular ?? 0,
      brand.count ?? 0,
      brand.created_at ?? null,
      brand.updated_at ?? null,
      brand.markabrand_ru ?? null,
    ]);
  }

  private async upsertModelFromAuction(model: any): Promise<void> {
    const query = `
      INSERT INTO models (id, clean_model_id, brand_id, slug, name, clean_model_name, clean_model_slug, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        clean_model_id = VALUES(clean_model_id),
        brand_id = VALUES(brand_id),
        slug = VALUES(slug),
        name = VALUES(name),
        clean_model_name = VALUES(clean_model_name),
        clean_model_slug = VALUES(clean_model_slug),
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at)
    `;

    await this.executeCommand(query, [
      model.id,
      model.clean_model_id ?? null,
      model.brand_id,
      model.slug,
      model.name,
      model.clean_model_name ?? null,
      model.clean_model_slug ?? null,
      model.created_at ?? null,
      model.updated_at ?? null,
    ]);
  }

  private async upsertVehicleFromAuction(lot: any): Promise<number> {
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
        has_keys_readable,
        run_and_drive,
        calc_price,
        sold_at_date,
        sold_at_time,
        timezone_rus
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
      lot.brand_name ?? (lot.model?.brand?.name ?? null),
      lot.model_name ?? lot.model?.name ?? null,
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
}
