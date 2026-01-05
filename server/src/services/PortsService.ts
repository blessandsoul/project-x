import { FastifyInstance } from 'fastify';
import { Pool, RowDataPacket } from 'mysql2/promise';
import axios, { AxiosError } from 'axios';
import { invalidateReferenceDataCache } from '../utils/cache.js';

interface PortsApiResponse {
  success: boolean;
  count: number;
  data: string[];
}

interface PortRow extends RowDataPacket {
  id: number;
  port: string;
}

/**
 * PortsService
 *
 * Manages port data synchronization from external API.
 * Fetches ports from automarketlgc.com API and stores them in the database.
 */
export class PortsService {
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
   * Fetch ports from the external API
   */
  private async fetchPortsFromApi(): Promise<string[] | null> {
    const url = 'https://automarketlgc.com/wp-json/calculator/v1/ports';

    try {
      const response = await axios.get<PortsApiResponse>(url, {
        timeout: 15000,
      });

      const data = response.data;
      if (!data.success) {
        this.fastify.log.error('Ports API returned non-success result');
        return null;
      }

      if (!Array.isArray(data.data)) {
        this.fastify.log.error('Ports API response missing data array');
        return null;
      }

      return data.data;
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
          'Error while fetching ports from API',
        );
      } else {
        this.fastify.log.error({ error }, 'Error while fetching ports from API');
      }
      return null;
    }
  }

  /**
   * Get all existing ports from the database
   */
  private async getExistingPorts(): Promise<Set<string>> {
    const [rows] = await this.db.execute<PortRow[]>(
      'SELECT port FROM ports',
    );

    return new Set(rows.map(row => row.port));
  }

  /**
   * Insert new ports into the database
   */
  private async insertPorts(ports: string[]): Promise<number> {
    if (ports.length === 0) {
      return 0;
    }

    // Build bulk insert query
    const values = ports.map(() => '(?)').join(', ');
    const query = `INSERT INTO ports (port) VALUES ${values}`;

    const [result] = await this.db.execute(query, ports);
    return (result as any).affectedRows || 0;
  }

  /**
   * Synchronize ports from API to database
   * Only inserts new ports, does not delete existing ones
   */
  async syncPorts(): Promise<void> {
    this.fastify.log.info('Starting ports synchronization');

    try {
      // Fetch ports from API
      const apiPorts = await this.fetchPortsFromApi();
      if (!apiPorts) {
        this.fastify.log.error('Failed to fetch ports from API');
        return;
      }

      this.fastify.log.info(`Fetched ${apiPorts.length} ports from API`);

      // Get existing ports from database
      const existingPorts = await this.getExistingPorts();
      this.fastify.log.info(`Found ${existingPorts.size} existing ports in database`);

      // Filter out ports that already exist
      const newPorts = apiPorts.filter(port => !existingPorts.has(port));

      if (newPorts.length === 0) {
        this.fastify.log.info('No new ports to insert');
        return;
      }

      // Insert new ports
      const insertedCount = await this.insertPorts(newPorts);
      this.fastify.log.info(`Successfully inserted ${insertedCount} new ports`);

      // Invalidate cache so next request gets fresh data
      await invalidateReferenceDataCache(this.fastify, 'ports');
    } catch (error) {
      this.fastify.log.error({ error }, 'Ports synchronization failed');
      throw error;
    }
  }
}
