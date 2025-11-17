import { FastifyPluginAsync } from 'fastify';
import { CatalogModel, VehicleType } from '../models/CatalogModel.js';

const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  const catalogModel = new CatalogModel(fastify);

  // GET /catalog/makes
  // Optional query params:
  // - type: 'car' | 'motorcycle' (default: 'car')
  // - q: search term to filter by make name (case-insensitive substring)
  fastify.get('/catalog/makes', async (request, reply) => {
    try {
      const { type, q } = request.query as { type?: string; q?: string };
      const vehicleType = (type ?? 'car').toLowerCase();
      if (vehicleType !== 'car' && vehicleType !== 'motorcycle') {
        reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: "type must be 'car' or 'motorcycle'",
          },
        });
        return;
      }

      const search = q?.trim();

      // Read from local catalog first. If empty, trigger a sync for this
      // vehicle type so subsequent calls use the DB.
      let makes = await catalogModel.getMakes(vehicleType as VehicleType, search);

      if (!makes.length) {
        await catalogModel.syncVehicleType(vehicleType as VehicleType);
        makes = await catalogModel.getMakes(vehicleType as VehicleType, search);
      }

      const items = makes.map((make) => ({
        makeId: make.external_make_id,
        name: make.name,
      }));

      reply.send({ items });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to load catalog makes');
      reply.code(502).send({
        error: {
          code: 'CATALOG_MAKES_ERROR',
          message: 'Failed to load makes from catalog',
        },
      });
    }
  });

  // GET /catalog/makes/:makeId/models
  // :makeId is the numeric external MakeId returned from /catalog/makes
  // Optional query param: type ('car' | 'motorcycle', default 'car')
  fastify.get('/catalog/makes/:makeId/models', async (request, reply) => {
    try {
      const { makeId } = request.params as { makeId: string };
      const { type } = request.query as { type?: string };

      const parsedMakeId = Number.parseInt(makeId, 10);
      if (!Number.isFinite(parsedMakeId) || parsedMakeId <= 0) {
        reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'makeId must be a positive integer' },
        });
        return;
      }

      const vehicleType = (type ?? 'car').toLowerCase();
      if (vehicleType !== 'car' && vehicleType !== 'motorcycle') {
        reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: "type must be 'car' or 'motorcycle'",
          },
        });
        return;
      }

      // Resolve make from local catalog; if not found, return 404. We rely on
      // the scheduled monthly sync (and manual admin syncs) to keep the
      // catalog tables up to date instead of performing heavy syncs on
      // request.
      const make = await catalogModel.getMakeByExternalId(
        vehicleType as VehicleType,
        parsedMakeId,
      );
      if (!make) {
        reply.code(404).send({
          error: {
            code: 'MAKE_NOT_FOUND',
            message: 'Make not found for given makeId and vehicle type',
          },
        });
        return;
      }

      const models = await catalogModel.getModelsByExternalMakeId(vehicleType as VehicleType, parsedMakeId);

      const items = models.map((model) => ({
        makeId: parsedMakeId,
        makeName: make.name,
        modelId: model.external_model_id,
        name: model.name,
      }));

      reply.send({
        make: {
          makeId: parsedMakeId,
          name: make.name,
          type: vehicleType,
        },
        items,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to load catalog models');
      reply.code(502).send({
        error: {
          code: 'CATALOG_MODELS_ERROR',
          message: 'Failed to load models for the given make from catalog',
        },
      });
    }
  });
};

export { catalogRoutes };
