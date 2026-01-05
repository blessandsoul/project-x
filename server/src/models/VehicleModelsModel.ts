import { FastifyInstance } from 'fastify';
import { RowDataPacket } from 'mysql2/promise';
import { BaseModel } from './BaseModel.js';

/**
 * Interface for vehicle_models table row
 */
export interface VehicleModelRow extends RowDataPacket {
  id: number;
  make_id: number;
  name: string;
  vehicle_type: string | null; // e.g., 'Automobile', 'Motorcycle', 'ATV', etc.
  is_valid: number; // TINYINT(1): 0 or 1
}

/**
 * VehicleModelsModel
 *
 * Manages vehicle models data from the vehicle_models table.
 */
export class VehicleModelsModel extends BaseModel {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    super(fastify);
    this.fastify = fastify;
  }

  /**
   * Get all valid models for a specific make
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
    const query = `
      SELECT id, name, vehicle_type
      FROM vehicle_models
      WHERE make_id = ? AND is_valid = 1
      ORDER BY name ASC
    `;

    const rows = await this.executeQuery(query, [makeId]);

    return rows.map((row: VehicleModelRow) => ({
      id: row.id,
      name: row.name,
      vehicleType: row.vehicle_type,
    }));
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
    let query: string;
    let params: (number | string)[];

    if (vehicleType) {
      query = `
        SELECT id, name, vehicle_type
        FROM vehicle_models
        WHERE make_id = ? AND vehicle_type = ? AND is_valid = 1
        ORDER BY name ASC
      `;
      params = [makeId, vehicleType];
    } else {
      query = `
        SELECT id, name, vehicle_type
        FROM vehicle_models
        WHERE make_id = ? AND is_valid = 1
        ORDER BY name ASC
      `;
      params = [makeId];
    }

    const rows = await this.executeQuery(query, params);

    return rows.map((row: VehicleModelRow) => ({
      id: row.id,
      name: row.name,
      vehicleType: row.vehicle_type,
    }));
  }

  /**
   * Check if a model exists by id
   */
  async existsById(id: number): Promise<boolean> {
    const rows = await this.executeQuery(
      'SELECT id FROM vehicle_models WHERE id = ? LIMIT 1',
      [id]
    );
    return Array.isArray(rows) && rows.length > 0;
  }
}
