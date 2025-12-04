import { FastifyInstance } from 'fastify';
import { RowDataPacket } from 'mysql2/promise';
import { BaseModel } from './BaseModel.js';

/**
 * Interface for vehicle_makes table row
 */
export interface VehicleMake extends RowDataPacket {
  id: number;
  make_id: number;
  make_name: string;
  has_car: number; // TINYINT(1): 0 or 1
  has_motorcycle: number; // TINYINT(1): 0 or 1
}

/**
 * VehicleMakeModel
 *
 * Manages vehicle makes data from the vehicle_makes table.
 * This is a derived lookup table built from vehicle_models.
 */
export class VehicleMakeModel extends BaseModel {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    super(fastify);
    this.fastify = fastify;
  }

  /**
   * Get makes by type (car or motorcycle)
   * @param type - 'car' or 'motorcycle'
   * @returns Array of makes with id, makeId, and name
   */
  async getMakesByType(type: 'car' | 'motorcycle'): Promise<Array<{ id: number; makeId: number; name: string }>> {
    const column = type === 'car' ? 'has_car' : 'has_motorcycle';
    
    const query = `
      SELECT id, make_id, make_name
      FROM vehicle_makes
      WHERE ${column} = 1
      ORDER BY make_name ASC
    `;

    const rows = await this.executeQuery(query);

    return rows.map((row: VehicleMake) => ({
      id: row.id,
      makeId: row.make_id,
      name: row.make_name,
    }));
  }

  /**
   * Check if a make exists by make_id
   */
  async existsByMakeId(makeId: number): Promise<boolean> {
    const rows = await this.executeQuery(
      'SELECT id FROM vehicle_makes WHERE make_id = ? LIMIT 1',
      [makeId]
    );
    return Array.isArray(rows) && rows.length > 0;
  }
}
