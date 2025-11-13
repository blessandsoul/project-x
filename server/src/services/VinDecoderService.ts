import { FastifyInstance } from 'fastify';
import axios from 'axios';
import {
  NHTSAResponse,
  VINData,
  VINInfo,
  VINDecoderResponse
} from '../types/vin.js';
import { DatabaseError } from '../types/errors.js';

/**
 * VIN Decoder Service
 *
 * Service for decoding Vehicle Identification Numbers using the NHTSA VPIC API.
 * Provides vehicle information lookup by VIN with comprehensive error handling.
 */
export class VinDecoderService {
  private fastify: FastifyInstance;
  private readonly nhtsaApiUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues';

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Decode a VIN using NHTSA VPIC API
   *
   * @param vin - Vehicle Identification Number (17 characters)
   * @returns Promise resolving to VIN decoder response
   */
  async decodeVIN(vin: string): Promise<VINDecoderResponse> {
    try {
      // Validate VIN format
      if (!this.isValidVIN(vin)) {
        return {
          success: false,
          error: 'Invalid VIN format. VIN must be 17 characters long.',
          source: 'NHTSA_VPIC',
          timestamp: new Date().toISOString()
        };
      }

      // Call NHTSA API
      const apiResponse = await this.callNHTSAApi(vin);

      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.error || 'Unknown API error',
          source: 'NHTSA_VPIC',
          timestamp: new Date().toISOString()
        };
      }

      // Transform and return data
      if (!apiResponse.data) {
        return {
          success: false,
          error: 'No VIN data received from API',
          source: 'NHTSA_VPIC',
          timestamp: new Date().toISOString()
        };
      }

      const vinInfo = this.transformVINData(apiResponse.data);

      return {
        success: true,
        data: vinInfo,
        source: 'NHTSA_VPIC',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.fastify.log.error({ error, vin }, 'VIN decoder service error');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        source: 'NHTSA_VPIC',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate VIN format
   *
   * Basic validation - checks length and allowed characters
   *
   * @param vin - VIN to validate
   * @returns boolean indicating if VIN format is valid
   */
  private isValidVIN(vin: string): boolean {
    if (!vin || typeof vin !== 'string') {
      return false;
    }

    // VIN must be exactly 17 characters
    if (vin.length !== 17) {
      return false;
    }

    // VIN can contain letters (A-H, J-N, P, R-Z), numbers, and should not contain I, O, Q
    const vinRegex = /^[A-HJ-NPR-Z0-9]+$/;
    return vinRegex.test(vin.toUpperCase());
  }

  /**
   * Call NHTSA VPIC API
   *
   * @param vin - Vehicle Identification Number
   * @returns Promise resolving to raw VIN data or error info
   */
  private async callNHTSAApi(vin: string): Promise<{ success: boolean; data?: VINData; error?: string }> {
    const url = `${this.nhtsaApiUrl}/${vin}?format=json`;

    try {
      this.fastify.log.info({ url }, 'Calling NHTSA API');

      // Use axios for HTTP requests
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VIN-Decoder-Service/1.0'
        },
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500 // Accept all 4xx and 2xx, reject 5xx
      });

      const data = response.data;

      // Check for API-level errors
      if (data.Count === 0 || !data.Results || data.Results.length === 0) {
        return {
          success: false,
          error: 'VIN not found in NHTSA database'
        };
      }

      const vinData = data.Results[0];

      // Check for decode errors in the result
      if (vinData.ErrorCode && vinData.ErrorCode !== '0') {
        return {
          success: false,
          error: vinData.ErrorText || vinData.AdditionalErrorText || 'VIN decode failed'
        };
      }

      return {
        success: true,
        data: vinData
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return {
            success: false,
            error: 'NHTSA API request timeout'
          };
        }
        return {
          success: false,
          error: `NHTSA API error: ${error.response?.status} ${error.response?.statusText || error.message}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error calling NHTSA API'
      };
    }
  }

  /**
   * Transform raw NHTSA data into clean VIN info structure
   *
   * @param vinData - Raw VIN data from NHTSA API
   * @returns Cleaned and typed VIN information
   */
  private transformVINData(vinData: VINData): VINInfo {
    return {
      vin: vinData.VIN,
      year: vinData.ModelYear ? parseInt(vinData.ModelYear, 10) : null,
      make: vinData.Make || 'Unknown',
      model: vinData.Model || 'Unknown',
      trim: vinData.Trim || '',
      bodyClass: vinData.BodyClass || 'Unknown',
      vehicleType: vinData.VehicleType || 'Unknown',
      doors: vinData.Doors ? parseInt(vinData.Doors, 10) : null,
      driveType: vinData.DriveType || 'Unknown',
      fuelType: vinData.FuelTypePrimary || 'Unknown',
      engine: {
        configuration: vinData.EngineConfiguration || 'Unknown',
        cylinders: vinData.EngineCylinders ? parseInt(vinData.EngineCylinders, 10) : null,
        displacementL: vinData.DisplacementL ? parseFloat(vinData.DisplacementL) : null
      },
      manufacturer: {
        plantCountry: vinData.PlantCountry || 'Unknown',
        plantState: vinData.PlantState || 'Unknown',
        companyName: vinData.PlantCompanyName || 'Unknown'
      },
      safety: {
        abs: this.parseBooleanField(vinData.ABS),
        esc: this.parseBooleanField(vinData.ESC),
        airbags: vinData.AirBagLocFront || 'Unknown',
        seatbelts: vinData.SeatBeltsAll || 'Unknown'
      }
    };
  }

  /**
   * Parse boolean fields from NHTSA API responses
   *
   * @param value - String value to parse as boolean
   * @returns boolean value
   */
  private parseBooleanField(value: string): boolean {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    return lowerValue === 'standard' || lowerValue === 'yes' || lowerValue === 'true';
  }

  /**
   * Get service health status
   *
   * Tests connectivity to NHTSA API
   *
   * @returns Promise resolving to health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
    const startTime = Date.now();

    try {
      // Test with a known valid VIN format (this may not exist but tests connectivity)
      const testVin = '1HGCM82633A123456'; // Sample Honda VIN format

      await axios.get(`${this.nhtsaApiUrl}/${testVin}?format=json`, {
        timeout: 5000, // 5 second timeout for health check
        validateStatus: () => true // Accept any status for connectivity test
      });

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        healthy: false,
        responseTime,
        error: axios.isAxiosError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }
}
