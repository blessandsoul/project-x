import { FastifyInstance } from 'fastify';
import { VehicleModelsModel } from '../models/VehicleModelsModel.js';

/**
 * VehicleModelsController
 *
 * Handles vehicle models API requests.
 * Provides endpoints to retrieve models filtered by vehicle type and make.
 */
export class VehicleModelsController {
  private fastify: FastifyInstance;
  private model: VehicleModelsModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.model = new VehicleModelsModel(fastify);
  }

  /**
   * Get models by type and make_id
   * @param type - 'car' or 'motorcycle'
   * @param makeId - The make_id to filter by
   * @returns Array of vehicle models with id and modelName only
   */
  async getModelsByTypeAndMake(
    type: 'car' | 'motorcycle',
    makeId: number
  ): Promise<Array<{
    id: number;
    modelName: string;
  }>> {
    return await this.model.getModelsByTypeAndMake(type, makeId);
  }
}
