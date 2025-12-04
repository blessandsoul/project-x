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
  fastify.get('/api/vehicle-models', async (request, reply) => {
    const { type, makeId } = request.query as { type?: string; makeId?: string };

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

    // Validate makeId parameter
    if (!makeId) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required query parameter: makeId',
        message: 'The "makeId" parameter is required and must be a numeric value',
      });
    }

    const parsedMakeId = parseInt(makeId, 10);

    if (isNaN(parsedMakeId) || parsedMakeId <= 0) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid makeId parameter',
        message: 'The "makeId" parameter must be a positive numeric value',
      });
    }

    try {
      const models = await controller.getModelsByTypeAndMake(
        normalizedType as 'car' | 'motorcycle',
        parsedMakeId
      );

      return reply.send({
        success: true,
        count: models.length,
        data: models,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error fetching vehicle models');
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch vehicle models',
      });
    }
  });
};

export { vehicleModelsRoutes };
