import { FastifyInstance } from 'fastify';
import axios from 'axios';
import { BaseModel } from './BaseModel.js';

const VPIC_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

export type VehicleType = 'car' | 'motorcycle';

interface VpicMakeByType {
  MakeId: number;
  MakeName: string;
}

interface VpicModel {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

export class CatalogModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async getMakes(vehicleType: VehicleType, search?: string): Promise<{ id: number; vehicle_type: VehicleType; external_make_id: number; name: string }[]> {
    const params: any[] = [vehicleType];
    let where = 'vehicle_type = ?';
    if (search && search.trim()) {
      where += ' AND name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    const rows = await this.executeQuery(
      `SELECT id, vehicle_type, external_make_id, name
       FROM vehicle_makes
       WHERE ${where}
       ORDER BY name ASC`,
      params,
    );

    return rows as any;
  }

  async getMakeByExternalId(
    vehicleType: VehicleType,
    externalMakeId: number,
  ): Promise<{ id: number; vehicle_type: VehicleType; external_make_id: number; name: string } | null> {
    const rows = await this.executeQuery(
      'SELECT id, vehicle_type, external_make_id, name FROM vehicle_makes WHERE vehicle_type = ? AND external_make_id = ? LIMIT 1',
      [vehicleType, externalMakeId],
    );

    if (!rows.length) {
      return null;
    }

    return rows[0] as any;
  }

  async getModelsByExternalMakeId(
    vehicleType: VehicleType,
    externalMakeId: number,
  ): Promise<{ id: number; make_id: number; external_model_id: number; name: string }[]> {
    // Resolve local make.id for this type + external_make_id
    const makeRows = await this.executeQuery(
      'SELECT id FROM vehicle_makes WHERE vehicle_type = ? AND external_make_id = ? LIMIT 1',
      [vehicleType, externalMakeId],
    );
    if (!makeRows.length) {
      return [];
    }

    const makeId = (makeRows[0] as { id: number }).id;
    const rows = await this.executeQuery(
      `SELECT id, make_id, external_model_id, name
       FROM vehicle_models
       WHERE make_id = ?
       ORDER BY name ASC`,
      [makeId],
    );

    return rows as any;
  }

  async syncVehicleType(vehicleType: VehicleType): Promise<void> {
    const url = `${VPIC_BASE_URL}/GetMakesForVehicleType/${encodeURIComponent(vehicleType)}?format=json`;
    const response = await axios.get<{ Results: VpicMakeByType[] }>(url);

    const makes = response.data.Results ?? [];

    // First, upsert all makes so the catalog is complete even if model
    // fetching fails for some of them.
    for (const make of makes) {
      const { MakeId, MakeName } = make;
      await this.executeCommand(
        `INSERT INTO vehicle_makes (vehicle_type, external_make_id, name, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           updated_at = NOW()`,
        [vehicleType, MakeId, MakeName],
      );
    }

    // Second, ensure models for each make are present. Errors for one make
    // should not abort the entire sync.
    for (const make of makes) {
      const { MakeId, MakeName } = make;
      try {
        const modelsUrl = `${VPIC_BASE_URL}/GetModelsForMake/${encodeURIComponent(
          MakeName,
        )}?format=json`;
        const modelsResponse = await axios.get<{ Results: VpicModel[] }>(modelsUrl);
        const models = modelsResponse.data.Results ?? [];

        const makeIdRows = await this.executeQuery(
          'SELECT id FROM vehicle_makes WHERE vehicle_type = ? AND external_make_id = ? LIMIT 1',
          [vehicleType, MakeId],
        );
        if (!makeIdRows.length) {
          continue;
        }
        const localMakeId = (makeIdRows[0] as { id: number }).id;

        for (const model of models) {
          await this.executeCommand(
            `INSERT INTO vehicle_models (make_id, external_model_id, name, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
               name = VALUES(name),
               updated_at = NOW()`,
            [localMakeId, model.Model_ID, model.Model_Name],
          );
        }
      } catch {
        // Ignore failures for individual makes so the rest of the catalog
        // can still be synchronized.
        continue;
      }
    }
  }
}
