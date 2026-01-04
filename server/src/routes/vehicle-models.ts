import { FastifyPluginAsync } from 'fastify';
import { VehicleModelsController } from '../controllers/vehicleModelsController.js';
import { withVersionedCache, CACHE_TTL } from '../utils/cache.js';

/**
 * Vehicle Models Routes
 *
 * GET /api/vehicle-models?makeId=1
 * GET /api/vehicle-models?makeId=1&vehicleType=Automobile
 *
 * Returns models filtered by make (required) and optionally by vehicle type.
 * Cached for 1 hour (rarely changes).
 */
const vehicleModelsRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new VehicleModelsController(fastify);

  /**
   * GET /api/vehicle-models
   *
   * Query parameters:
   * - makeId (required): numeric make ID
   * - vehicleType (optional): filter by vehicle type (e.g., 'Automobile', 'Motorcycle', 'ATV')
   *
   * Response example:
   * {
   *   "success": true,
   *   "count": 18,
   *   "data": [
   *     { "id": 1001, "name": "MDX", "vehicleType": "Automobile" },
   *     { "id": 1002, "name": "RDX", "vehicleType": "Automobile" },
   *     ...
   *   ]
   * }
   */
  fastify.get('/vehicle-models', {
    schema: {
      querystring: {
        type: 'object',
        required: ['makeId'],
        properties: {
          makeId: { type: 'integer', minimum: 1 },
          vehicleType: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const { makeId, vehicleType } = request.query as { makeId: number; vehicleType?: string };

    const cacheKey = vehicleType ? [makeId, vehicleType] : [makeId, 'all'];

    const result = await withVersionedCache(
      fastify,
      'models',
      cacheKey,
      CACHE_TTL.LONG,
      async () => {
        const models = await controller.getModelsByMakeAndType(makeId, vehicleType);
        return {
          success: true,
          count: models.length,
          data: models,
        };
      },
    );

    return reply.send(result);
  });
};

export { vehicleModelsRoutes };
