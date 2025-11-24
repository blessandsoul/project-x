import { FastifyPluginAsync } from 'fastify';
import { VehicleModel } from '../models/VehicleModel.js';
import { FavoriteModel } from '../models/FavoriteModel.js';
import { ValidationError, NotFoundError } from '../types/errors.js';

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
  // Supports make/model/year range, price range, mileage range and
  // several other fields. Returns paginated results with meta data.
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles/search', async (request, reply) => {
    const query = request.query as {
      make?: string;
      model?: string;
      year?: string;
      year_from?: string;
      year_to?: string;
      price_from?: string;
      price_to?: string;
      mileage_from?: string;
      mileage_to?: string;
      fuel_type?: string;
      category?: string;
      drive?: string;
      source?: string;
      search?: string;
      page?: string;
      limit?: string;
    };

    const filters: {
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
    } = {};

    // Optional combined search param: search="make model year".
    // This is parsed into make/model/year only when those are not
    // already provided explicitly.
    if (query.search && query.search.trim().length > 0) {
      const raw = query.search.trim();

      // Try to extract a reasonable model year (1950–2100) from the search
      // string and treat the remaining words as make/model.
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

    if (query.make && query.make.trim().length > 0) {
      filters.make = query.make.trim();
    }
    if (query.model && query.model.trim().length > 0) {
      filters.model = query.model.trim();
    }
    if (query.year) {
      const v = Number.parseInt(query.year, 10);
      if (Number.isFinite(v)) filters.year = v;
    }
    if (query.year_from) {
      const v = Number.parseInt(query.year_from, 10);
      if (Number.isFinite(v)) filters.yearFrom = v;
    }
    if (query.year_to) {
      const v = Number.parseInt(query.year_to, 10);
      if (Number.isFinite(v)) filters.yearTo = v;
    }
    if (query.price_from) {
      const v = Number.parseFloat(query.price_from);
      if (Number.isFinite(v)) filters.priceFrom = v;
    }
    if (query.price_to) {
      const v = Number.parseFloat(query.price_to);
      if (Number.isFinite(v)) filters.priceTo = v;
    }
    if (query.mileage_from) {
      const v = Number.parseInt(query.mileage_from, 10);
      if (Number.isFinite(v)) filters.mileageFrom = v;
    }
    if (query.mileage_to) {
      const v = Number.parseInt(query.mileage_to, 10);
      if (Number.isFinite(v)) filters.mileageTo = v;
    }
    if (query.fuel_type && query.fuel_type.trim().length > 0) {
      filters.fuelType = query.fuel_type.trim();
    }
    if (query.category && query.category.trim().length > 0) {
      filters.category = query.category.trim();
    }
    if (query.drive && query.drive.trim().length > 0) {
      filters.drive = query.drive.trim();
    }
    if (query.source && query.source.trim().length > 0) {
      filters.source = query.source.trim();
    }

    const rawLimit = query.limit ? Number.parseInt(query.limit, 10) : 20;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20;

    const pageParam = query.page ? Number.parseInt(query.page, 10) : 1;
    const pageFromClient = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const offset = (pageFromClient - 1) * limit;

    // If an Authorization header is present, attempt to authenticate so
    // we can optionally attach is_favorite flags. If authentication
    // fails, we treat the request as anonymous.
    const authHeader = (request.headers as any).authorization;
    if (authHeader) {
      try {
        await (fastify as any).authenticate(request, reply);
      } catch {
        if (reply.sent) {
          return;
        }
      }
    }

    const total = await vehicleModel.countByFilters(filters);
    if (total === 0) {
      return reply.send({ items: [], total: 0, limit, page: 1, totalPages: 1 });
    }

    const items = await vehicleModel.searchByFilters(filters, limit, offset);

    // If user is authenticated, mark which vehicles are already in favorites
    let itemsWithFavoriteFlag = items;
    const user = (request as any).user as { id: number } | undefined;
    if (user && Array.isArray(items) && items.length > 0) {
      const vehicleIds = items.map((v: any) => v.id as number);
      const favoriteIds = await favoriteModel.getFavoritesForUserAndVehicles(user.id, vehicleIds);
      const favoriteSet = new Set(favoriteIds);
      itemsWithFavoriteFlag = items.map((v: any) => ({
        ...v,
        is_favorite: favoriteSet.has(v.id),
      }));
    }

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return reply.send({ items: itemsWithFavoriteFlag, total, limit, page, totalPages });
  });

  // ---------------------------------------------------------------------------
  // GET /vehicles
  //
  // Fetch a paginated list of vehicles. Clients can optionally pass
  // `limit` and `offset` as query parameters to page through results.
  // Only core summary fields are returned (id, make, model, year, yard_name, source).
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles', async (request, reply) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string };

    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    const vehicles = await vehicleModel.findAll(parsedLimit, parsedOffset);
    return reply.send(vehicles);
  });

  // ---------------------------------------------------------------------------
  // GET /vehicles/:id
  //
  // Fetch a single vehicle by its numeric ID. Returns basic vehicle info
  // used for quote calculations and UI display. If the vehicle does not
  // exist, a 404 Not Found error is thrown.
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const vehicleId = parseInt(id, 10);

    if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    const vehicle = await vehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    return reply.send(vehicle);
  });

  // ---------------------------------------------------------------------------
  // GET /vehicles/:id/photos
  //
  // Fetch all photos for a given vehicle from the `vehicle_photos` table.
  // This is useful when the UI needs to render the full gallery for a
  // selected vehicle without bloating the main vehicles list response.
  // ---------------------------------------------------------------------------
  fastify.get('/vehicles/:id/photos', async (request, reply) => {
    const { id } = request.params as { id: string };
    const vehicleId = parseInt(id, 10);

    if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    const photos = await vehicleModel.getPhotosByVehicleId(vehicleId);
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
  fastify.get('/vehicles/:id/full', async (request, reply) => {
    const { id } = request.params as { id: string };
    const vehicleId = parseInt(id, 10);

    if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    const vehicle = await vehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    const photos = await vehicleModel.getPhotosByVehicleId(vehicleId);

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
  // ---------------------------------------------------------------------------
  fastify.delete('/vehicles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const vehicleId = parseInt(id, 10);

    if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    const deleted = await vehicleModel.deleteById(vehicleId);
    if (!deleted) {
      throw new NotFoundError('Vehicle');
    }

    return reply.code(204).send();
  });
};

export { vehicleRoutes };
