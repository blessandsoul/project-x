import { FastifyPluginAsync } from 'fastify';
import { VehicleMakesController } from '../controllers/vehicleMakesController.js';

/**
 * Vehicle Makes Routes
 *
 * GET /api/vehicle-makes?type=car
 * GET /api/vehicle-makes?type=motorcycle
 *
 * Returns makes filtered by vehicle type.
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
  fastify.get('/api/vehicle-makes', async (request, reply) => {
    const { type } = request.query as { type?: string };

    // Validate type parameter
    if (!type) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required query parameter: type',
        message: 'The "type" parameter is required and must be either "car" or "motorcycle"',
      });
    }

    const normalizedType = type.toLowerCase();

    if (normalizedType !== 'car' && normalizedType !== 'motorcycle') {
      return reply.status(400).send({
        success: false,
        error: 'Invalid type parameter',
        message: 'The "type" parameter must be either "car" or "motorcycle"',
      });
    }

    try {
      const makes = await controller.getMakesByType(normalizedType as 'car' | 'motorcycle');
      
      return reply.send({
        success: true,
        count: makes.length,
        data: makes,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error fetching vehicle makes');
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch vehicle makes',
      });
    }
  });
};

export { vehicleMakesRoutes };
