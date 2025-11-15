import { FastifyPluginAsync } from 'fastify';
import { VehicleModel } from '../models/VehicleModel.js';
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
