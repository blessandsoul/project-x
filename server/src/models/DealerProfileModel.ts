import { FastifyInstance } from 'fastify';
import { BaseModel } from './BaseModel.js';
import { DealerProfile, DealerProfileCreate, DealerProfileUpdate } from '../types/dealer.js';

export class DealerProfileModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async findByUserId(userId: number): Promise<DealerProfile | null> {
    const rows = await this.executeQuery(
      'SELECT * FROM dealer_profiles WHERE user_id = ?',
      [userId]
    );

    if (!rows.length) return null;

    const row = rows[0];
    // Parse JSON fields
    ['address', 'specialty_brands'].forEach(field => {
      if (row[field]) {
        try {
          row[field] = JSON.parse(row[field]);
        } catch (e) {
          row[field] = null;
        }
      }
    });

    return row as DealerProfile;
  }

  async upsert(userId: number, data: DealerProfileCreate): Promise<DealerProfile> {
    const existing = await this.findByUserId(userId);

    if (existing) {
        // Update
        const fields: string[] = [];
        const values: any[] = [];

        if (data.business_name !== undefined) { fields.push('business_name = ?'); values.push(data.business_name); }
        if (data.tax_id !== undefined) { fields.push('tax_id = ?'); values.push(data.tax_id); }
        if (data.license_number !== undefined) { fields.push('license_number = ?'); values.push(data.license_number); }
        if (data.address !== undefined) { fields.push('address = ?'); values.push(JSON.stringify(data.address)); }
        if (data.inventory_size !== undefined) { fields.push('inventory_size = ?'); values.push(data.inventory_size); }
        if (data.specialty_brands !== undefined) { fields.push('specialty_brands = ?'); values.push(JSON.stringify(data.specialty_brands)); }
        if (data.feed_url !== undefined) { fields.push('feed_url = ?'); values.push(data.feed_url); }

        if (fields.length > 0) {
            fields.push('updated_at = NOW()');
            values.push(userId);
            await this.executeCommand(
                `UPDATE dealer_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
                values
            );
        }
    } else {
        // Insert
        await this.executeCommand(
            `INSERT INTO dealer_profiles (
                user_id, business_name, tax_id, license_number, address, 
                inventory_size, specialty_brands, feed_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                userId,
                data.business_name,
                data.tax_id ?? null,
                data.license_number ?? null,
                data.address ? JSON.stringify(data.address) : null,
                data.inventory_size ?? null,
                data.specialty_brands ? JSON.stringify(data.specialty_brands) : null,
                data.feed_url ?? null
            ]
        );
    }

    const updated = await this.findByUserId(userId);
    if (!updated) throw new Error('Failed to retrieve updated dealer profile');
    return updated;
  }
}

