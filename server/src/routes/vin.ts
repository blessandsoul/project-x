import { FastifyPluginAsync } from 'fastify';
import { VinController } from '../controllers/vinController.js';
import { ValidationError } from '../types/errors.js';

/**
 * VIN Routes
 *
 * Defines API endpoints for Vehicle Identification Number decoding
 * and related vehicle information services.
 *
 * Endpoints:
 * - POST /api/vin/decode - Decode a VIN and get vehicle information
 * - GET /api/vin/health - Check VIN decoder service health
 */
const vinRoutes: FastifyPluginAsync = async (fastify) => {
  const vinController = new VinController(fastify);

  /**
   * POST /api/vin/decode
   *
   * Decode a Vehicle Identification Number to retrieve vehicle information.
   * Uses the NHTSA VPIC API to get detailed vehicle specifications.
   *
   * Request Body: { vin: string }
   * Response: VIN decoder response with vehicle information
   * Status: 200 (OK) on success, 400 (Bad Request) for invalid VIN format
   */
  fastify.post('/api/vin/decode', {
    schema: {
      body: {
        type: 'object',
        required: ['vin'],
        properties: {
          vin: {
            type: 'string',
            minLength: 17,
            maxLength: 17,
            description: '17-character Vehicle Identification Number'
          }
        }
      }
    }
  }, async (request, reply) => {
    const { vin } = request.body as { vin: string };

    const result = await vinController.decodeVIN(vin);

    if (result.success) {
      return reply.send(result);
    } else {
      // Throw error to be handled by global errorHandler
      throw new ValidationError(result.error || 'VIN decode failed');
    }
  });

  /**
   * GET /api/vin/health
   *
   * Check the health status of the VIN decoder service.
   * Tests connectivity to the NHTSA VPIC API.
   *
   * Response: Service health status
   * Status: 200 (OK) with health information
   */
  fastify.get('/api/vin/health', async (request, reply) => {
    const healthStatus = await vinController.getServiceHealth();

    return reply.send({
      service: 'VIN Decoder',
      healthy: healthStatus.healthy,
      responseTime: healthStatus.responseTime || null,
      timestamp: new Date().toISOString(),
      error: healthStatus.error || null
    });
  });
};

export { vinRoutes };
