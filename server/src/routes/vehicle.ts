import { FastifyPluginAsync } from 'fastify';
import { VehicleModel } from '../models/VehicleModel.js';
import { FavoriteModel } from '../models/FavoriteModel.js';
import { ValidationError, NotFoundError } from '../types/errors.js';
import { withVersionedCache, incrementCacheVersion, CACHE_TTL } from '../utils/cache.js';
import {
  vehicleSearchQuerySchema,
  VehicleSearchFilters,
} from '../schemas/vehicleSearchSchema.js';
import {
  idParamsSchema,
  positiveIntegerSchema,
  paginationLimitSchema,
  paginationOffsetSchema,
} from '../schemas/commonSchemas.js';

/**
 * Vehicle Routes
 *
 * Simple HTTP API for working with vehicles stored in the `vehicles` table.
 * These routes use `VehicleModel` directly and are intended mainly for
 * admin / internal tooling (browsing vehicles, inspecting details, deleting).
 */
const vehicleRoutes: FastifyPluginAsync = async (fastify) => {
  const vehicleModel = new VehicleModel(fastify);
  const favoriteModel = new FavoriteModel(fastify);

  // ---------------------------------------------------------------------------
  // GET /vehicles/search
  //
  // Search vehicles by filters suitable for frontend search UI.
  // Supports make/model/year range, price range, mileage/odometer range,
  // title type, transmission, fuel, drive, cylinders, sale date, and more.
  // Returns paginated results with meta data.
  //
  // All query params are validated with Zod before processing.
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles/search', async (request, reply) => {
    // Debug logging for source filter issue
    if (request.query && typeof request.query === 'object' && 'source' in request.query) {
      fastify.log.info({ source: request.query.source, queryType: typeof request.query.source }, 'DEBUG: Source filter received');
    }

    // Validate query params with Zod
    const parseResult = vehicleSearchQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      // Zod v4 uses .issues instead of .errors
      const issues = parseResult.error.issues || [];
      const messages = issues.map((issue: { message: string }) => issue.message).join(', ');
      fastify.log.error({ query: request.query, issues }, 'Validation failed for /vehicles/search');
      throw new ValidationError(messages || 'Invalid query parameters');
    }

    const query = parseResult.data;

    // Build filters object for model layer
    const filters: VehicleSearchFilters = {};

    // Optional combined search param: search="make model year" or VIN / lot id.
    if (query.search && query.search.trim().length > 0) {
      const raw = query.search.trim();

      // First, try to interpret the search as VIN or lot id.
      const compact = raw.replace(/\s+/g, '');
      const looksLikeVin = /[A-Za-z]/.test(compact) && /[0-9]/.test(compact) && compact.length >= 11;
      const looksLikeLotId = !looksLikeVin && /^\d+$/.test(compact);

      if (looksLikeVin && !filters.vin) {
        filters.vin = compact.toUpperCase();
      } else if (looksLikeLotId && !filters.sourceLotId) {
        filters.sourceLotId = compact;
      }

      // Only attempt make/model/year derivation when the string does NOT
      // look like a VIN or numeric lot id.
      if (!looksLikeVin && !looksLikeLotId) {
        const yearMatch = raw.match(/\b(19[5-9]\d|20[0-9]{2})\b/);

        let derivedYear: number | undefined;
        let derivedMake: string | undefined;
        let derivedModel: string | undefined;

        let withoutYear = raw;
        if (yearMatch && yearMatch[0]) {
          derivedYear = Number.parseInt(yearMatch[0], 10);
          withoutYear = raw.replace(yearMatch[0], '').trim();
        }

        const parts = withoutYear.split(/\s+/).filter(Boolean);
        if (parts.length > 0) {
          derivedMake = parts[0];
        }
        if (parts.length > 1) {
          derivedModel = parts.slice(1).join(' ');
        }

        if (!filters.make && derivedMake) {
          filters.make = derivedMake;
        }
        if (!filters.model && derivedModel) {
          filters.model = derivedModel;
        }
        if (!filters.year && typeof derivedYear === 'number' && Number.isFinite(derivedYear)) {
          filters.year = derivedYear;
        }
      }
    }

    // Explicit make/model override search-derived values
    if (query.make && query.make.trim().length > 0) {
      filters.make = query.make.trim();
    }
    if (query.model && query.model.trim().length > 0) {
      filters.model = query.model.trim();
    }

    // Year filters
    if (query.year !== undefined) filters.year = query.year;
    if (query.year_from !== undefined) filters.yearFrom = query.year_from;
    if (query.year_to !== undefined) filters.yearTo = query.year_to;

    // Price filters
    if (query.price_from !== undefined) filters.priceFrom = query.price_from;
    if (query.price_to !== undefined) filters.priceTo = query.price_to;

    // Odometer/mileage filters (odometer_from/to take precedence, fallback to mileage_from/to)
    if (query.odometer_from !== undefined) {
      filters.mileageFrom = query.odometer_from;
    } else if (query.mileage_from !== undefined) {
      filters.mileageFrom = query.mileage_from;
    }
    if (query.odometer_to !== undefined) {
      filters.mileageTo = query.odometer_to;
    } else if (query.mileage_to !== undefined) {
      filters.mileageTo = query.mileage_to;
    }

    // Title type filter (multi-value)
    if (query.title_type && query.title_type.length > 0) {
      filters.titleTypes = query.title_type;
    }

    // Transmission filter (multi-value)
    if (query.transmission && query.transmission.length > 0) {
      filters.transmissionTypes = query.transmission;
    }

    // Fuel filter (multi-value, new param takes precedence over legacy fuel_type)
    if (query.fuel && query.fuel.length > 0) {
      filters.fuelTypes = query.fuel;
    } else if (query.fuel_type && query.fuel_type.trim().length > 0) {
      filters.fuelType = query.fuel_type.trim();
    }

    // Drive filter (multi-value, new param takes precedence over legacy drive)
    if (query.drive && query.drive.length > 0) {
      filters.driveTypes = query.drive;
    }

    // Location filter (city name)
    if (query.location && query.location.trim().length > 0) {
      filters.location = query.location.trim();
    }

    // Fuzzy location matching flag
    if (query.fuzzy_location === true) {
      filters.fuzzyLocation = true;
    }

    // Cylinders filter (multi-value)
    if (query.cylinders && query.cylinders.length > 0) {
      filters.cylinderTypes = query.cylinders;
    }

    // Sale date filter
    if (query.sold_from) {
      filters.soldFrom = query.sold_from;
    }
    if (query.sold_to) {
      filters.soldTo = query.sold_to;
    }

    // Exact date filter (sold_at_date = date)
    if (query.date) {
      filters.date = query.date;
    }

    // Category filter (supports multiple codes: v,c)
    if (query.category && Array.isArray(query.category) && query.category.length > 0) {
      filters.categoryCodes = query.category;
    }

    // Source filter (multi-value, validated against allowed values)
    if (query.source && query.source.length > 0) {
      filters.sourceTypes = query.source;
    }

    // Buy now flag (already validated and transformed to boolean by schema)
    if (query.buy_now === true) {
      filters.buyNow = true;
    }

    // Pagination
    const limit = query.limit;
    const page = query.page;
    const offset = (page - 1) * limit;

    // Sort
    const sort = query.sort;

    // Attempt optional cookie-based authentication to attach is_favorite flags.
    // If authentication fails, we treat the request as anonymous (don't block the search).
    try {
      await fastify.authenticateCookieOptional(request, reply);
    } catch (authError) {
      fastify.log.debug({ error: authError }, 'Optional auth failed, continuing as anonymous');
      (request as any).user = undefined;
    }
    // If authenticate already sent a response (e.g., 401), stop here
    if (reply.sent) {
      return;
    }

    // Try to get cached results (versioned, excluding user-specific data like favorites)
    const cachedResult = await withVersionedCache(
      fastify,
      'vehicles',
      ['search', JSON.stringify({ ...filters, limit, offset, sort })],
      CACHE_TTL.SHORT, // 5 minutes
      async () => {
        const total = await vehicleModel.countByFilters(filters);
        if (total === 0) {
          return { items: [], total: 0 };
        }
        const items = await vehicleModel.searchByFilters(filters, limit, offset, sort);
        return { items, total };
      },
    );

    const { items, total } = cachedResult;
    if (total === 0) {
      if (reply.sent || request.raw.aborted) {
        return;
      }
      return reply.send({ items: [], total: 0, limit, page: 1, totalPages: 1 });
    }

    // Fetch bid histories for all vehicles in the result set
    const vehicleIds = items.map((v: any) => v.id as number);
    const bidsMap = await vehicleModel.getBidsForVehicles(vehicleIds);

    // Attach only the last (most recent) bid to each vehicle for search results
    let itemsWithBids = items.map((v: any) => {
      const allBids = bidsMap.get(v.id) || [];
      const lastBid = allBids.length > 0 ? allBids[0] : null; // First item is most recent (sorted DESC)
      return {
        ...v,
        last_bid: lastBid,
      };
    });

    // If user is authenticated, mark which vehicles are already in favorites
    const user = (request as any).user as { id: number } | undefined;
    if (user && Array.isArray(itemsWithBids) && itemsWithBids.length > 0) {
      const favoriteIds = await favoriteModel.getFavoritesForUserAndVehicles(user.id, vehicleIds);
      const favoriteSet = new Set(favoriteIds);
      itemsWithBids = itemsWithBids.map((v: any) => ({
        ...v,
        is_favorite: favoriteSet.has(v.id),
      }));
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    if (reply.sent || request.raw.aborted) {
      return;
    }
    return reply.send({ items: itemsWithBids, total, limit, page, totalPages });
  });

  // ---------------------------------------------------------------------------
  // GET /vehicles
  //
  // Fetch a paginated list of vehicles. Clients can optionally pass
  // `limit` and `offset` as query parameters to page through results.
  // Only core summary fields are returned (id, make, model, year, yard_name, source).
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: limit and offset are validated by schema
    const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };

    const vehicles = await vehicleModel.findAll(limit, offset);
    return reply.send(vehicles);
  });

  // ---------------------------------------------------------------------------
  // GET /vehicles/:id
  //
  // Fetch a single vehicle by its numeric ID. Returns basic vehicle info
  // used for quote calculations and UI display. If the vehicle does not
  // exist, a 404 Not Found error is thrown.
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles/:id', {
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    if (reply.sent || request.raw.aborted) {
      return;
    }

    const vehicle = await vehicleModel.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Fetch all bids for this vehicle
    const bidsMap = await vehicleModel.getBidsForVehicles([id]);
    const bids = bidsMap.get(id) || [];

    if (reply.sent || request.raw.aborted) {
      return;
    }
    return reply.send({ ...vehicle, bids });
  });

  // ---------------------------------------------------------------------------
  // GET /vehicles/:id/similar
  //
  // Fetch a list of vehicles similar to the given vehicle ID. Similarity is
  // based on brand_name/model_name, vehicle_type, engine_fuel, transmission,
  // year range and price band around calc_price. This endpoint is intended
  // for "You may also like" style UI blocks and can be tuned in the
  // VehicleModel.findSimilarById implementation.
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles/:id/similar', {
    schema: {
      params: idParamsSchema,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          year_range: { type: 'integer', minimum: 1, maximum: 20, default: 2 },
          price_radius: { type: 'number', minimum: 0.01, maximum: 1, default: 0.2 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };
    const { limit = 10, offset = 0, year_range = 2, price_radius = 0.2 } = request.query as {
      limit?: number;
      offset?: number;
      year_range?: number;
      price_radius?: number;
    };

    const exists = await vehicleModel.existsById(id);
    if (!exists) {
      throw new NotFoundError('Vehicle');
    }

    const { items, total } = await vehicleModel.findSimilarById(id, {
      limit,
      offset,
      yearRange: year_range,
      priceRadius: price_radius,
    });

    return reply.send({
      vehicleId: id,
      items,
      offset,
      limit,
      total,
      yearRange: year_range,
      priceRadius: price_radius,
    });
  });

  // ---------------------------------------------------------------------------
  // GET /vehicles/:id/photos
  //
  // Fetch all photos for a given vehicle from the `vehicle_photos` table.
  // This is useful when the UI needs to render the full gallery for a
  // selected vehicle without bloating the main vehicles list response.
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles/:id/photos', {
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    const photos = await vehicleModel.getPhotosByVehicleId(id);
    return reply.send(photos);
  });

  // ---------------------------------------------------------------------------
  // GET /vehicles/:id/full
  //
  // Convenience endpoint that returns a combined payload with both the
  // vehicle core fields and its photos in a single response object.
  // This is useful for client UIs that want to render a detailed view
  // without making multiple separate HTTP calls.
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles/:id/full', {
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    const vehicle = await vehicleModel.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    const photos = await vehicleModel.getPhotosByVehicleId(id);

    return reply.send({
      vehicle,
      photos,
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /vehicles/:id
  //
  // Permanently delete a vehicle by ID. This is generally intended for
  // admin / maintenance use cases. If the vehicle does not exist, a
  // 404 Not Found error is thrown. On success, an empty 204 response
  // is returned.
  //
  // Auth: Cookie-based (HttpOnly access token)
  // CSRF: Required (X-CSRF-Token header)
  // Authorization: Admin only (via requireAdmin middleware)
  // ---------------------------------------------------------------------------
  fastify.delete('/vehicles/:id', {
    preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    const deleted = await vehicleModel.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Vehicle');
    }

    // Bump cache version so all vehicle caches are invalidated
    await incrementCacheVersion(fastify, 'vehicles');

    return reply.code(204).send();
  });
};

export { vehicleRoutes };
