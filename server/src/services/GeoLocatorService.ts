import { FastifyInstance } from 'fastify';
import axios from 'axios';

export interface GeoLocationResult {
  lat: number;
  lon: number;
  formatted: string;
  raw: any;
}

/**
 * Geo Locator Service
 *
 * Uses Geoapify geocoding API to resolve human-readable locations into
 * coordinates and normalized address data.
 */
export class GeoLocatorService {
  private fastify: FastifyInstance;
  private readonly baseUrl = 'https://api.geoapify.com/v1/geocode/search';

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Search for a location using Geoapify
   *
   * @param text - Free-form location text, e.g. "Poti, Georgia"
   * @param limit - Maximum number of results to return (default: 5)
   */
  async searchLocation(text: string, limit: number = 5): Promise<GeoLocationResult[]> {
    const query = text?.trim();
    if (!query) {
      throw new Error('Location text is required');
    }

    const apiKey = process.env.GEOLOCATOR_API_KEY;
    if (!apiKey) {
      throw new Error('GEOLOCATOR_API_KEY is not set');
    }

    const url = this.baseUrl;

    try {
      this.fastify.log.info({ url, query, limit }, 'Calling Geoapify geocoding API');

      const response = await axios.get(url, {
        params: {
          text: query,
          apiKey,
          limit,
        },
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      const data = response.data as any;

      if (!data || !Array.isArray(data.features) || data.features.length === 0) {
        return [];
      }

      return data.features.map((feature: any) => {
        const geometry = feature.geometry || {};
        const properties = feature.properties || {};
        const coordinates = Array.isArray(geometry.coordinates)
          ? geometry.coordinates
          : [null, null];

        const lon = typeof coordinates[0] === 'number' ? coordinates[0] : null;
        const lat = typeof coordinates[1] === 'number' ? coordinates[1] : null;

        return {
          lat,
          lon,
          formatted: properties.formatted || properties.name || query,
          raw: feature,
        } as GeoLocationResult;
      });
    } catch (error) {
      this.fastify.log.error({ error, text: query }, 'GeoLocatorService error');
      throw error;
    }
  }
}
