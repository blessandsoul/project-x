import { FastifyPluginAsync } from 'fastify';
import { VinController } from '../controllers/vinController.js';

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
    try {
      const { vin } = request.body as { vin: string };

      const result = await vinController.decodeVIN(vin);

      if (result.success) {
        return reply.send(result);
      } else {
        // Return 400 for client errors
        return reply.code(400).send({
          error: {
            code: 'VIN_DECODE_ERROR',
            message: result.error || 'Unknown VIN decode error',
            timestamp: result.timestamp
          }
        });
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'VIN decode failed';
      fastify.log.error(error);
      return reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: message,
          timestamp: new Date().toISOString()
        }
      });
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
    try {
      const healthStatus = await vinController.getServiceHealth();

      return reply.send({
        service: 'VIN Decoder',
        healthy: healthStatus.healthy,
        responseTime: healthStatus.responseTime || null,
        timestamp: new Date().toISOString(),
        error: healthStatus.error || null
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Health check failed';
      fastify.log.error(error);
      return reply.code(500).send({
        service: 'VIN Decoder',
        healthy: false,
        responseTime: null,
        timestamp: new Date().toISOString(),
        error: message
      });
    }
  });
};

export { vinRoutes };
