import { FastifyPluginAsync } from 'fastify';
import { VehicleModelsController } from '../controllers/vehicleModelsController.js';

/**
 * Vehicle Models Routes
 *
 * GET /api/vehicle-models?type=car&makeId=452
 * GET /api/vehicle-models?type=motorcycle&makeId=845
 *
 * Returns models filtered by vehicle type and make.
 */
const vehicleModelsRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new VehicleModelsController(fastify);

  /**
   * GET /api/vehicle-models
   *
   * Query parameters:
   * - type (required): 'car' or 'motorcycle'
   * - makeId (required): numeric make ID
   *
   * Response example:
   * {
   *   "success": true,
   *   "count": 3,
   *   "data": [
   *     { "id": 1001, "modelName": "3 Series" },
   *     { "id": 1002, "modelName": "X5" },
   *     { "id": 1003, "modelName": "R 1250 GS Adventure" }
   *   ]
   * }
   */
  fastify.get('/api/vehicle-models', {
    schema: {
      querystring: {
        type: 'object',
        required: ['type', 'makeId'],
        properties: {
          type: { type: 'string', enum: ['car', 'motorcycle', 'CAR', 'MOTORCYCLE', 'Car', 'Motorcycle'] },
          makeId: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: type and makeId are already validated by schema
    const { type, makeId } = request.query as { type: string; makeId: number };
    const normalizedType = type.toLowerCase() as 'car' | 'motorcycle';

    const models = await controller.getModelsByTypeAndMake(normalizedType, makeId);

    return reply.send({
      success: true,
      count: models.length,
      data: models,
    });
  });
};

export { vehicleModelsRoutes };
