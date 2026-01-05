import { FastifyInstance } from 'fastify';
import { RowDataPacket } from 'mysql2/promise';
import { BaseModel } from './BaseModel.js';

/**
 * Interface for vehicle_makes table row
 */
export interface VehicleMake extends RowDataPacket {
  id: number;
  name: string;
  is_valid: number; // TINYINT(1): 0 or 1
}

/**
 * VehicleMakeModel
 *
 * Manages vehicle makes data from the vehicle_makes table.
 */
export class VehicleMakeModel extends BaseModel {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    super(fastify);
    this.fastify = fastify;
  }

  /**
   * Get all valid makes
   * @returns Array of makes with id and name
   */
  async getAllMakes(): Promise<Array<{ id: number; name: string }>> {
    const query = `
      SELECT id, name
      FROM vehicle_makes
      WHERE is_valid = 1
      ORDER BY name ASC
    `;

    const rows = await this.executeQuery(query);

    return rows.map((row: VehicleMake) => ({
      id: row.id,
      name: row.name,
    }));
  }

  /**
   * Check if a make exists by id
   */
  async existsById(id: number): Promise<boolean> {
    const rows = await this.executeQuery(
      'SELECT id FROM vehicle_makes WHERE id = ? LIMIT 1',
      [id]
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  /**
   * Get make by id
   */
  async getById(id: number): Promise<{ id: number; name: string } | null> {
    const rows = await this.executeQuery(
      'SELECT id, name FROM vehicle_makes WHERE id = ? AND is_valid = 1 LIMIT 1',
      [id]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as VehicleMake;
      return { id: row.id, name: row.name };
    }
    return null;
  }
}
