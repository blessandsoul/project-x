import { FastifyInstance } from 'fastify';
import { Pool, RowDataPacket } from 'mysql2/promise';

interface PortRow extends RowDataPacket {
  id: number;
  port: string;
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
      'SELECT port FROM ports ORDER BY port ASC',
    );

    return rows.map(row => row.port);
  }
}
