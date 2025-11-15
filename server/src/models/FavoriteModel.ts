import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import { Vehicle } from '../types/vehicle.js';

export class FavoriteModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async addFavorite(userId: number, vehicleId: number): Promise<void> {
    await this.executeCommand(
      'INSERT IGNORE INTO user_favorite_vehicles (user_id, vehicle_id, created_at) VALUES (?, ?, NOW())',
      [userId, vehicleId],
    );
  }

  async removeFavorite(userId: number, vehicleId: number): Promise<void> {
    await this.executeCommand(
      'DELETE FROM user_favorite_vehicles WHERE user_id = ? AND vehicle_id = ?',
      [userId, vehicleId],
    );
  }

  async listFavorites(userId: number, limit: number = 20, offset: number = 0): Promise<Vehicle[]> {
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 250 ? limit : 20;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    const query = `
      SELECT
        v.id,
        v.brand_name,
        v.model_name,
        v.brand_name AS make,
        v.model_name AS model,
        v.year,
        v.mileage,
        v.yard_name,
        v.source,
        v.retail_value,
        v.calc_price,
        v.engine_fuel AS fuel_type,
        v.vehicle_type AS category,
        v.drive,
        (
          SELECT vp.url
          FROM vehicle_photos vp
          WHERE vp.vehicle_id = v.id
          ORDER BY vp.id ASC
          LIMIT 1
        ) AS primary_photo_url,
        (
          SELECT vp.thumb_url_min
          FROM vehicle_photos vp
          WHERE vp.vehicle_id = v.id
          ORDER BY vp.id ASC
          LIMIT 1
        ) AS primary_thumb_url
      FROM user_favorite_vehicles uf
      JOIN vehicles v ON v.id = uf.vehicle_id
      WHERE uf.user_id = ?
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await this.executeQuery(query, [userId, safeLimit, safeOffset]);
    return Array.isArray(rows) ? (rows as Vehicle[]) : [];
  }

  async countFavorites(userId: number): Promise<number> {
    const rows = await this.executeQuery(
      'SELECT COUNT(*) AS count FROM user_favorite_vehicles WHERE user_id = ?',
      [userId],
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return 0;
    }
    const row = rows[0] as { count: number | string };
    const value = typeof row.count === 'number' ? row.count : Number(row.count);
    return Number.isFinite(value) ? value : 0;
  }

  async getFavoritesForUserAndVehicles(userId: number, vehicleIds: number[]): Promise<number[]> {
    if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return [];
    }

    const placeholders = vehicleIds.map(() => '?').join(', ');
    const query = `
      SELECT vehicle_id
      FROM user_favorite_vehicles
      WHERE user_id = ?
        AND vehicle_id IN (${placeholders})
    `;

    const rows = await this.executeQuery(query, [userId, ...vehicleIds]);
    if (!Array.isArray(rows)) {
      return [];
    }

    return (rows as { vehicle_id: number }[]).map((r) => r.vehicle_id);
  }
}
