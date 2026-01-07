import { FastifyInstance } from 'fastify';
import { Pool, RowDataPacket } from 'mysql2/promise';

interface PortRow extends RowDataPacket {
  id: number;
  name: string;
}

export class PortsController {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  private get db(): Pool {
    return this.fastify.mysql;
  }

  /**
   * Get all ports from the database
   * Returns ports sorted alphabetically
   */
  async getPorts(): Promise<string[]> {
    const [rows] = await this.db.execute<PortRow[]>(
      'SELECT name FROM ports ORDER BY name ASC',
    );

    return rows.map(row => row.name);
  }
}
