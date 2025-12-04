import { FastifyInstance } from 'fastify';
import { Pool, RowDataPacket } from 'mysql2/promise';

interface AuctionRow extends RowDataPacket {
  id: number;
  auction: string;
}

export class AuctionsController {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  private get db(): Pool {
    return this.fastify.mysql;
  }

  /**
   * Get all auctions from the database
   * Returns auctions sorted alphabetically
   */
  async getAuctions(): Promise<string[]> {
    const [rows] = await this.db.execute<AuctionRow[]>(
      'SELECT auction FROM auctions ORDER BY auction ASC',
    );

    return rows.map(row => row.auction);
  }
}
