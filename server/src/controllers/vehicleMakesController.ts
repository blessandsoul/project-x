import { FastifyInstance } from 'fastify';
import { VehicleMakeModel } from '../models/VehicleMakeModel.js';

/**
 * VehicleMakesController
 *
 * Handles vehicle makes API requests.
 * Provides endpoints to retrieve makes filtered by vehicle type (car or motorcycle).
 */
export class VehicleMakesController {
  private fastify: FastifyInstance;
  private model: VehicleMakeModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.model = new VehicleMakeModel(fastify);
  }

  /**
   * Get makes by type
   * @param type - 'car' or 'motorcycle'
   * @returns Array of makes with id, makeId, and name
   */
  async getMakesByType(type: 'car' | 'motorcycle'): Promise<Array<{ id: number; makeId: number; name: string }>> {
    return await this.model.getMakesByType(type);
  }
}
