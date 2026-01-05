import { FastifyInstance } from 'fastify';
import { RowDataPacket } from 'mysql2/promise';
import { BaseModel } from './BaseModel.js';

/**
 * Interface for services table row
 */
export interface Service extends RowDataPacket {
    id: number;
    name: string;
    is_active: number; // TINYINT(1): 0 or 1
    sort_order: number;
}

/**
 * ServicesModel
 *
 * Manages services data from the services table.
 * Services are logistics offerings that companies can select during onboarding.
 */
export class ServicesModel extends BaseModel {
    private fastify: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        super(fastify);
        this.fastify = fastify;
    }

    /**
     * Get all active services ordered by sort_order, then name
     * @returns Array of services with id and name
     */
    async getActiveServices(): Promise<Array<{ id: number; name: string }>> {
        const query = `
      SELECT id, name
      FROM services
      WHERE is_active = 1
      ORDER BY sort_order ASC, name ASC
    `;

        const rows = await this.executeQuery(query);

        return rows.map((row: Service) => ({
            id: row.id,
            name: row.name,
        }));
    }
}
