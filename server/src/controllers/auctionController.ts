import { FastifyInstance } from 'fastify';
import { AuctionApiService } from '../services/AuctionApiService.js';
import { NotFoundError } from '../types/errors.js';

export class AuctionController {
  private fastify: FastifyInstance;
  private auctionApiService: AuctionApiService;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.auctionApiService = new AuctionApiService(fastify);
  }

  async getActiveLots(): Promise<{ time: string; fetched_at: string; data: any }> {
    const cached = AuctionApiService.getLatestActiveLots();

    if (!cached || !cached.data) {
      throw new NotFoundError('Active lots');
    }

    return {
      time: cached.time,
      fetched_at: cached.fetchedAt,
      data: cached.data,
    };
  }
}
