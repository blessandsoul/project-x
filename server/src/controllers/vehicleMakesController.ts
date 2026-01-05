import { FastifyInstance } from 'fastify';
import { VehicleMakeModel } from '../models/VehicleMakeModel.js';

/**
 * VehicleMakesController
 *
 * Handles vehicle makes API requests.
 * Provides endpoints to retrieve all valid makes.
 */
export class VehicleMakesController {
  private fastify: FastifyInstance;
  private model: VehicleMakeModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.model = new VehicleMakeModel(fastify);
  }

  /**
   * Get all valid makes
   * @returns Array of makes with id and name
   */
  async getAllMakes(): Promise<Array<{ id: number; name: string }>> {
    return await this.model.getAllMakes();
  }

  /**
   * Get make by id
   * @param id - Make ID
   * @returns Make object or null
   */
  async getMakeById(id: number): Promise<{ id: number; name: string } | null> {
    return await this.model.getById(id);
  }
}
