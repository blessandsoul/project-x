import { FastifyInstance } from 'fastify';
import { VehicleModelsModel } from '../models/VehicleModelsModel.js';

/**
 * VehicleModelsController
 *
 * Handles vehicle models API requests.
 * Provides endpoints to retrieve models filtered by make and optionally by type.
 */
export class VehicleModelsController {
  private fastify: FastifyInstance;
  private model: VehicleModelsModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.model = new VehicleModelsModel(fastify);
  }

  /**
   * Get all models for a specific make
   * @param makeId - The make_id to filter by
   * @returns Array of vehicle models with id, name, and vehicleType
   */
  async getModelsByMakeId(
    makeId: number
  ): Promise<Array<{
    id: number;
    name: string;
    vehicleType: string | null;
  }>> {
    return await this.model.getModelsByMakeId(makeId);
  }

  /**
   * Get models filtered by make and vehicle type
   * @param makeId - The make_id to filter by
   * @param vehicleType - Optional vehicle type filter (e.g., 'Automobile', 'Motorcycle')
   * @returns Array of vehicle models
   */
  async getModelsByMakeAndType(
    makeId: number,
    vehicleType?: string
  ): Promise<Array<{
    id: number;
    name: string;
    vehicleType: string | null;
  }>> {
    return await this.model.getModelsByMakeAndType(makeId, vehicleType);
  }
}
