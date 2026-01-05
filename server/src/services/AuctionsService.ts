import { FastifyInstance } from 'fastify';
import { Pool, RowDataPacket } from 'mysql2/promise';
import axios, { AxiosError } from 'axios';
import { invalidateReferenceDataCache } from '../utils/cache.js';

interface AuctionItem {
  id: string;
  name: string;
  vehicle_types: string[];
}

interface AuctionsApiResponse {
  success: boolean;
  data: AuctionItem[];
}

interface AuctionRow extends RowDataPacket {
  id: number;
  auction: string;
}

/**
 * AuctionsService
 *
 * Manages auction data synchronization from external API.
 * Fetches auctions from automarketlgc.com API and stores them in the database.
 */
export class AuctionsService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Get the MySQL pool from the Fastify instance
   */
  private get db(): Pool {
    return this.fastify.mysql;
  }

  /**
   * Fetch auctions from the external API
   */
  private async fetchAuctionsFromApi(): Promise<string[] | null> {
    const url = 'https://automarketlgc.com/wp-json/calculator/v1/auctions';

    try {
      const response = await axios.get<AuctionsApiResponse>(url, {
        timeout: 15000,
      });

      const data = response.data;
      if (!data.success) {
        this.fastify.log.error('Auctions API returned non-success result');
        return null;
      }

      if (!Array.isArray(data.data)) {
        this.fastify.log.error('Auctions API response missing data array');
        return null;
      }

      // Extract only the names from the auction items
      return data.data.map(item => item.name);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        this.fastify.log.error(
          {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: axiosError.response?.data,
            message: axiosError.message,
          },
          'Error while fetching auctions from API',
        );
      } else {
        this.fastify.log.error({ error }, 'Error while fetching auctions from API');
      }
      return null;
    }
  }

  /**
   * Get all existing auctions from the database
   */
  private async getExistingAuctions(): Promise<Set<string>> {
    const [rows] = await this.db.execute<AuctionRow[]>(
      'SELECT auction FROM auctions',
    );

    return new Set(rows.map(row => row.auction));
  }

  /**
   * Insert new auctions into the database
   */
  private async insertAuctions(auctions: string[]): Promise<number> {
    if (auctions.length === 0) {
      return 0;
    }

    // Build bulk insert query
    const values = auctions.map(() => '(?)').join(', ');
    const query = `INSERT INTO auctions (auction) VALUES ${values}`;

    const [result] = await this.db.execute(query, auctions);
    return (result as any).affectedRows || 0;
  }

  /**
   * Synchronize auctions from API to database
   * Only inserts new auctions, does not delete existing ones
   */
  async syncAuctions(): Promise<void> {
    this.fastify.log.info('Starting auctions synchronization');

    try {
      // Fetch auctions from API
      const apiAuctions = await this.fetchAuctionsFromApi();
      if (!apiAuctions) {
        this.fastify.log.error('Failed to fetch auctions from API');
        return;
      }

      this.fastify.log.info(`Fetched ${apiAuctions.length} auctions from API`);

      // Get existing auctions from database
      const existingAuctions = await this.getExistingAuctions();
      this.fastify.log.info(`Found ${existingAuctions.size} existing auctions in database`);

      // Filter out auctions that already exist
      const newAuctions = apiAuctions.filter(auction => !existingAuctions.has(auction));

      if (newAuctions.length === 0) {
        this.fastify.log.info('No new auctions to insert');
        return;
      }

      // Insert new auctions
      const insertedCount = await this.insertAuctions(newAuctions);
      this.fastify.log.info(`Successfully inserted ${insertedCount} new auctions`);

      // Invalidate cache so next request gets fresh data
      await invalidateReferenceDataCache(this.fastify, 'auctions');
    } catch (error) {
      this.fastify.log.error({ error }, 'Auctions synchronization failed');
      throw error;
    }
  }
}
