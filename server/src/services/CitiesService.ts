import { FastifyInstance } from 'fastify';
import { Pool, RowDataPacket } from 'mysql2/promise';
import axios, { AxiosError } from 'axios';
import { invalidateReferenceDataCache } from '../utils/cache.js';

interface CitiesApiResponse {
  success: boolean;
  count: number;
  data: {
    grouped_by_state: Record<string, string[]>;
    all_cities: string[];
  };
}

interface CityRow extends RowDataPacket {
  id: number;
  city: string;
}

/**
 * CitiesService
 *
 * Manages city data synchronization from external API.
 * Fetches cities from automarketlgc.com API and stores them in the database.
 */
export class CitiesService {
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
   * Fetch cities from the external API
   */
  private async fetchCitiesFromApi(): Promise<string[] | null> {
    const url = 'https://automarketlgc.com/wp-json/calculator/v1/cities';

    try {
      const response = await axios.get<CitiesApiResponse>(url, {
        timeout: 15000,
      });

      const data = response.data;
      if (!data.success) {
        this.fastify.log.error('Cities API returned non-success result');
        return null;
      }

      if (!Array.isArray(data.data?.all_cities)) {
        this.fastify.log.error('Cities API response missing all_cities array');
        return null;
      }

      return data.data.all_cities;
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
          'Error while fetching cities from API',
        );
      } else {
        this.fastify.log.error({ error }, 'Error while fetching cities from API');
      }
      return null;
    }
  }

  /**
   * Get all existing cities from the database
   */
  private async getExistingCities(): Promise<Set<string>> {
    const [rows] = await this.db.execute<CityRow[]>(
      'SELECT city FROM cities',
    );

    return new Set(rows.map(row => row.city));
  }

  /**
   * Insert new cities into the database
   */
  private async insertCities(cities: string[]): Promise<number> {
    if (cities.length === 0) {
      return 0;
    }

    // Build bulk insert query
    const values = cities.map(() => '(?)').join(', ');
    const query = `INSERT INTO cities (city) VALUES ${values}`;

    const [result] = await this.db.execute(query, cities);
    return (result as any).affectedRows || 0;
  }

  /**
   * Synchronize cities from API to database
   * Only inserts new cities, does not delete existing ones
   */
  async syncCities(): Promise<void> {
    this.fastify.log.info('Starting cities synchronization');

    try {
      // Fetch cities from API
      const apiCities = await this.fetchCitiesFromApi();
      if (!apiCities) {
        this.fastify.log.error('Failed to fetch cities from API');
        return;
      }

      this.fastify.log.info(`Fetched ${apiCities.length} cities from API`);

      // Get existing cities from database
      const existingCities = await this.getExistingCities();
      this.fastify.log.info(`Found ${existingCities.size} existing cities in database`);

      // Filter out cities that already exist
      const newCities = apiCities.filter(city => !existingCities.has(city));

      if (newCities.length === 0) {
        this.fastify.log.info('No new cities to insert');
        return;
      }

      // Insert new cities
      const insertedCount = await this.insertCities(newCities);
      this.fastify.log.info(`Successfully inserted ${insertedCount} new cities`);

      // Invalidate cache so next request gets fresh data
      await invalidateReferenceDataCache(this.fastify, 'cities');
    } catch (error) {
      this.fastify.log.error({ error }, 'Cities synchronization failed');
      throw error;
    }
  }
}
