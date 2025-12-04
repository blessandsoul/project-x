import { FastifyInstance } from 'fastify';
import axios, { AxiosError } from 'axios';

interface CalculateRequest {
  buyprice: number;
  auction: string;
  vehicletype: string;
  usacity?: string;
  coparturl?: string;
  destinationport?: string;
  vehiclecategory?: string;
}

interface CalculateResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * CalculatorService
 *
 * Handles shipping cost calculations by proxying requests to the external calculator API.
 */
export class CalculatorService {
  private fastify: FastifyInstance;
  private readonly apiUrl = 'https://automarketlgc.com/wp-json/calculator/v1/calculate';

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Calculate shipping costs using the external API
   */
  async calculate(params: CalculateRequest): Promise<CalculateResponse> {
    try {
      this.fastify.log.info({ params }, 'Calling external calculator API');

      const response = await axios.post(this.apiUrl, params, {
        timeout: 30000, // 30 second timeout for calculation
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.fastify.log.info('Calculator API response received');

      return {
        success: true,
        data: response.data,
      };
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
          'Error while calling calculator API',
        );

        return {
          success: false,
          error: (axiosError.response?.data as any)?.message || axiosError.message || 'Calculator API error',
        };
      } else {
        this.fastify.log.error({ error }, 'Unexpected error while calling calculator API');

        return {
          success: false,
          error: 'An unexpected error occurred',
        };
      }
    }
  }
}
