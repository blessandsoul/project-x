import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import { UserPreferences, UserPreferencesCreate, UserPreferencesUpdate } from '../types/user.js';

export class UserPreferenceModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async findByUserId(userId: number): Promise<UserPreferences | null> {
    const rows = await this.executeQuery(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (!rows.length) return null;

    const row = rows[0];
    // Parse JSON fields
    ['body_types', 'fuel_types', 'target_regions'].forEach(field => {
      if (row[field]) {
        try {
          row[field] = JSON.parse(row[field]);
        } catch (e) {
          row[field] = [];
        }
      }
    });

    return row as UserPreferences;
  }

  async upsert(userId: number, data: UserPreferencesUpdate): Promise<UserPreferences> {
    const existing = await this.findByUserId(userId);
    
    if (existing) {
        // Update
        const fields: string[] = [];
        const values: any[] = [];

        if (data.budget_min !== undefined) { fields.push('budget_min = ?'); values.push(data.budget_min); }
        if (data.budget_max !== undefined) { fields.push('budget_max = ?'); values.push(data.budget_max); }
        if (data.body_types !== undefined) { fields.push('body_types = ?'); values.push(JSON.stringify(data.body_types)); }
        if (data.fuel_types !== undefined) { fields.push('fuel_types = ?'); values.push(JSON.stringify(data.fuel_types)); }
        if (data.usage_goal !== undefined) { fields.push('usage_goal = ?'); values.push(data.usage_goal); }
        if (data.target_regions !== undefined) { fields.push('target_regions = ?'); values.push(JSON.stringify(data.target_regions)); }
        if (data.purchase_timeframe !== undefined) { fields.push('purchase_timeframe = ?'); values.push(data.purchase_timeframe); }

        if (fields.length > 0) {
            fields.push('updated_at = NOW()');
            values.push(userId);
            await this.executeCommand(
                `UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`,
                values
            );
        }
    } else {
        // Insert
        await this.executeCommand(
            `INSERT INTO user_preferences (
                user_id, budget_min, budget_max, body_types, fuel_types, 
                usage_goal, target_regions, purchase_timeframe, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                userId,
                data.budget_min ?? null,
                data.budget_max ?? null,
                data.body_types ? JSON.stringify(data.body_types) : null,
                data.fuel_types ? JSON.stringify(data.fuel_types) : null,
                data.usage_goal ?? null,
                data.target_regions ? JSON.stringify(data.target_regions) : null,
                data.purchase_timeframe ?? null
            ]
        );
    }

    const updated = await this.findByUserId(userId);
    if (!updated) throw new Error('Failed to retrieve updated preferences');
    return updated;
  }
}

