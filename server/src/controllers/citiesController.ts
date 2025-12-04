import { FastifyInstance } from 'fastify';
import { Pool, RowDataPacket } from 'mysql2/promise';

interface CityRow extends RowDataPacket {
  id: number;
  city: string;
}

export class CitiesController {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  private get db(): Pool {
    return this.fastify.mysql;
  }

  /**
   * Get all cities from the database
   * Returns cities sorted alphabetically
   */
  async getCities(): Promise<string[]> {
    const [rows] = await this.db.execute<CityRow[]>(
      'SELECT city FROM cities ORDER BY city ASC',
    );

    return rows.map(row => row.city);
  }
}
