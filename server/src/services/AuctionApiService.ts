import { FastifyInstance } from 'fastify';
import axios from 'axios';
import FormData from 'form-data';
import { VehicleModel } from '../models/VehicleModel.js';

interface ActiveLotsResponse {
  // Shape is unknown at this stage; keep as any for now
  [key: string]: any;
}

/**
 * Auction API Service
 *
 * Wraps calls to auction-api.app using a pre-obtained API token stored
 * in the environment (API_TOKEN). This avoids re-authenticating on
 * every server restart.
 */
export class AuctionApiService {
  private fastify: FastifyInstance;
  private readonly baseUrl = 'https://auction-api.app/api/v1';

  private static latestActiveLots:
    | { time: string; fetchedAt: string; data: ActiveLotsResponse }
    | null = null;

  static getLatestActiveLots() {
    return this.latestActiveLots;
  }

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  private getApiToken(): string {
    const token = process.env.API_TOKEN;
    if (!token) {
      throw new Error('API_TOKEN is not set in environment');
    }
    return token;
  }

  /**
   * Build time string for the auction API in format DD.MM.YYYY HH:mm
   *
   * Example: 18.06.2025 16:00
   */
  buildCurrentTimeString(date: Date = new Date()): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  /**
   * Build time string pinned to the start of the hour (minutes = 00).
   *
   * The auction API example uses times like "16:00"; using HH:00 avoids
   * requesting snapshots for partial minutes where data may not exist.
   */
  buildHourStartTimeString(date: Date = new Date()): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = '00';
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  /**
   * Fetch active lots for the given time string.
   *
   * @param time - Time string in format DD.MM.YYYY HH:mm
   */
  async getActiveLotsHourly(time: string): Promise<ActiveLotsResponse> {
    try {
      const token = this.getApiToken();

      const form = new FormData();
      form.append('time', time);

      const url = `${this.baseUrl}/get-active-lots-hourly`;

      this.fastify.log.info({ url, time }, 'Calling auction get-active-lots-hourly');

      const response = await axios.post<ActiveLotsResponse>(url, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
        timeout: 30000,
      });

      const raw = response.data;

      // Some APIs return plain arrays, others wrap data in an object, and in this
      // case the API returns a JSON URL in raw.data that must be fetched to get
      // the actual lots array.
      let lots: any[] | null = null;

      if (Array.isArray(raw)) {
        lots = raw;
      } else if (raw && Array.isArray((raw as any).data)) {
        lots = (raw as any).data;
      } else if (raw && typeof (raw as any).data === 'string') {
        const lotsUrl = (raw as any).data as string;

        try {
          this.fastify.log.info({ time, lotsUrl }, 'Fetching auction lots from JSON URL');
          const lotsResponse = await axios.get(lotsUrl, {
            headers: { Accept: 'application/json' },
            timeout: 60000,
          });

          const nested = lotsResponse.data;
          if (Array.isArray(nested)) {
            lots = nested;
          } else if (nested && Array.isArray((nested as any).data)) {
            lots = (nested as any).data;
          }

          this.fastify.log.info(
            {
              time,
              lotsUrl,
              lotsCount: lots ? lots.length : 0,
            },
            'Fetched auction lots from JSON URL',
          );
        } catch (err) {
          this.fastify.log.error({ time, lotsUrl, err }, 'Failed to fetch auction lots JSON URL');
        }
      }

      // Log a small preview of the response for debugging without spamming logs.
      this.fastify.log.info(
        {
          time,
          lotsCount: lots ? lots.length : 0,
          sampleLot: lots && lots.length ? { id: lots[0].id, vin: lots[0].vin, source: lots[0].source } : null,
        },
        'Auction active lots API response',
      );

      AuctionApiService.latestActiveLots = {
        time,
        fetchedAt: new Date().toISOString(),
        data: raw,
      };

      // Persist lots into local database so downstream APIs can read from
      // our own tables instead of calling the external auction API.
      if (lots && lots.length) {
        this.fastify.log.info(
          { time, count: lots.length },
          'Starting auction active lots DB ingestion',
        );

        try {
          const vehicleModel = new VehicleModel(this.fastify);
          await vehicleModel.upsertFromAuctionLots(lots);
          this.fastify.log.info(
            { time, count: lots.length },
            'Auction active lots DB ingestion finished',
          );
        } catch (err) {
          this.fastify.log.error(
            { err, time },
            'Failed to persist auction active lots into database',
          );
        }
      } else {
        // Log full raw response once when we can't detect a lots array,
        // so we can inspect the structure and adjust parsing if needed.
        this.fastify.log.warn(
          { time, type: typeof raw, raw },
          'Auction API active lots response did not contain a lots array; skipping DB ingest',
        );
      }

      return raw;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.fastify.log.error(
          {
            time,
            url: `${this.baseUrl}/get-active-lots-hourly`,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
          },
          'AuctionApiService.getActiveLotsHourly request failed',
        );
      } else {
        this.fastify.log.error({ time, error }, 'AuctionApiService.getActiveLotsHourly error');
      }

      throw error;
    }
  }
}
