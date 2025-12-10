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

    const makes = await controller.getMakesByType(normalizedType);
    
    return reply.send({
      success: true,
      count: makes.length,
      data: makes,
    });
  });
};

export { vehicleMakesRoutes };
