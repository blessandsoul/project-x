import { FastifyPluginAsync } from 'fastify';
import { VehicleMakesController } from '../controllers/vehicleMakesController.js';
import { withVersionedCache, CACHE_TTL } from '../utils/cache.js';

/**
 * Vehicle Makes Routes
 *
 * GET /api/vehicle-makes
 *
 * Returns all valid vehicle makes.
 * Cached for 1 hour (rarely changes).
 */
const vehicleMakesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new VehicleMakesController(fastify);

  /**
   * GET /api/vehicle-makes
   *
   * Response example:
   * {
   *   "success": true,
   *   "count": 82,
   *   "data": [
   *     { "id": 1, "name": "Acura" },
   *     { "id": 2, "name": "Alfa Romeo" },
   *     ...
   *   ]
   * }
   */
  fastify.get('/vehicle-makes', async (request, reply) => {
    const result = await withVersionedCache(
      fastify,
      'makes',
      ['all'],
      CACHE_TTL.LONG,
      async () => {
        const makes = await controller.getAllMakes();
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
