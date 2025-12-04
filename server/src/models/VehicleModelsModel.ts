import { FastifyInstance } from 'fastify';
import { RowDataPacket } from 'mysql2/promise';
import { BaseModel } from './BaseModel.js';

/**
 * Interface for vehicle_models table row
 */
export interface VehicleModelRow extends RowDataPacket {
  id: number;
  make_id: number;
  make_name: string;
  model_name: string;
  vehicle_types: string; // e.g., 'car', 'multipurpose', 'truck', 'motorcycle', or comma-separated combos
  first_year: number | null;
  last_year: number | null;
}

/**
 * VehicleModelsModel
 *
 * Manages vehicle models data from the vehicle_models table.
 * This is the source of truth for make/model combinations.
 */
export class VehicleModelsModel extends BaseModel {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    super(fastify);
    this.fastify = fastify;
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
    let query: string;

    if (type === 'car') {
      // Car side: vehicle_types contains 'car', 'multipurpose', or 'truck'
      query = `
        SELECT id, model_name
        FROM vehicle_models
        WHERE make_id = ?
          AND (
            vehicle_types LIKE '%car%'
            OR vehicle_types LIKE '%multipurpose%'
            OR vehicle_types LIKE '%truck%'
          )
        ORDER BY model_name ASC
      `;
    } else {
      // Motorcycle side: vehicle_types contains 'motorcycle' as a set element
      query = `
        SELECT id, model_name
        FROM vehicle_models
        WHERE make_id = ?
          AND FIND_IN_SET('motorcycle', vehicle_types) > 0
        ORDER BY model_name ASC
      `;
    }

    const rows = await this.executeQuery(query, [makeId]);

    return rows.map((row: VehicleModelRow) => ({
      id: row.id,
      modelName: row.model_name,
    }));
  }
}
