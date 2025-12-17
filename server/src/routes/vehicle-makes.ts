import { FastifyPluginAsync } from 'fastify';
import { VehicleMakesController } from '../controllers/vehicleMakesController.js';
import { withVersionedCache, CACHE_TTL } from '../utils/cache.js';

/**
 * Vehicle Makes Routes
 *
 * GET /api/vehicle-makes?type=car
 * GET /api/vehicle-makes?type=motorcycle
 *
 * Returns makes filtered by vehicle type.
 * Cached for 1 hour (rarely changes).
 */
const vehicleMakesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new VehicleMakesController(fastify);

  /**
   * GET /api/vehicle-makes
   *
   * Query parameters:
   * - type (required): 'car' or 'motorcycle'
   *
   * Response example:
   * {
   *   "success": true,
   *   "count": 2,
   *   "data": [
   *     { "id": 123, "makeId": 452, "name": "BMW" },
   *     { "id": 124, "makeId": 845, "name": "APRILIA" }
   *   ]
   * }
   */
  fastify.get('/api/vehicle-makes', {
    schema: {
      querystring: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['car', 'motorcycle', 'CAR', 'MOTORCYCLE', 'Car', 'Motorcycle'] },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: type is already validated by schema
    const { type } = request.query as { type: string };
    const normalizedType = type.toLowerCase() as 'car' | 'motorcycle';

    const result = await withVersionedCache(
      fastify,
      'makes',
      [normalizedType],
      CACHE_TTL.LONG,
      async () => {
        const makes = await controller.getMakesByType(normalizedType);
        return {
          success: true,
          count: makes.length,
          data: makes,
        };
      },
    );
    
    return reply.send(result);
  });
};

export { vehicleMakesRoutes };
