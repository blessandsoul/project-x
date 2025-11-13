import { FastifyInstance } from 'fastify';
import { VinDecoderService } from '../services/VinDecoderService.js';
import { VINDecoderResponse } from '../types/vin.js';

/**
 * VIN Controller
 *
 * Handles VIN decoding requests and responses.
 * Acts as an intermediary between VIN routes and the VinDecoderService.
 */
export class VinController {
  private fastify: FastifyInstance;
  private vinDecoderService: VinDecoderService;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.vinDecoderService = new VinDecoderService(fastify);
  }

  /**
   * Decode a VIN and return vehicle information
   *
   * @param vin - Vehicle Identification Number to decode
   * @returns Promise resolving to VIN decoder response
   */
  async decodeVIN(vin: string): Promise<VINDecoderResponse> {
    try {
      this.fastify.log.info({ vin: vin.substring(0, 8) + '...' }, 'VIN decode request');

      const result = await this.vinDecoderService.decodeVIN(vin);

      if (result.success) {
        this.fastify.log.info({
          vin: vin.substring(0, 8) + '...',
          make: result.data?.make,
          model: result.data?.model,
          year: result.data?.year
        }, 'VIN decode successful');
      } else {
        this.fastify.log.warn({
          vin: vin.substring(0, 8) + '...',
          error: result.error
        }, 'VIN decode failed');
      }

      return result;

    } catch (error) {
      this.fastify.log.error({ error, vin: vin.substring(0, 8) + '...' }, 'VIN controller error');

      return {
        success: false,
        error: 'Internal server error during VIN decoding',
        source: 'NHTSA_VPIC',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get VIN decoder service health status
   *
   * @returns Promise resolving to health check result
   */
  async getServiceHealth(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
    try {
      return await this.vinDecoderService.getHealthStatus();
    } catch (error) {
      this.fastify.log.error({ error }, 'VIN service health check error');

      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown health check error'
      };
    }
  }
}
