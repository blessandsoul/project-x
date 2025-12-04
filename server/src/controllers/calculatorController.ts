import { FastifyInstance } from 'fastify';
import { CalculatorService } from '../services/CalculatorService.js';
import { ValidationError } from '../types/errors.js';

interface CalculateRequest {
  buyprice: number;
  auction: string;
  vehicletype: string;
  usacity?: string;
  coparturl?: string;
  destinationport?: string;
  vehiclecategory?: string;
}

export class CalculatorController {
  private fastify: FastifyInstance;
  private calculatorService: CalculatorService;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.calculatorService = new CalculatorService(fastify);
  }

  /**
   * Calculate shipping costs
   */
  async calculate(body: CalculateRequest): Promise<any> {
    // Validate required parameters
    if (!body.buyprice || typeof body.buyprice !== 'number' || body.buyprice <= 0) {
      throw new ValidationError('buyprice is required and must be a positive number');
    }

    if (!body.auction || typeof body.auction !== 'string') {
      throw new ValidationError('auction is required and must be a string');
    }

    const validAuctions = ['Copart', 'IAAI', 'Manheim', 'Adesa'];
    if (!validAuctions.includes(body.auction)) {
      throw new ValidationError(`auction must be one of: ${validAuctions.join(', ')}`);
    }

    if (!body.vehicletype || typeof body.vehicletype !== 'string') {
      throw new ValidationError('vehicletype is required and must be a string');
    }

    const validVehicleTypes = ['standard', 'heavy'];
    if (!validVehicleTypes.includes(body.vehicletype)) {
      throw new ValidationError(`vehicletype must be one of: ${validVehicleTypes.join(', ')}`);
    }

    // Optional parameter validation
    if (body.vehiclecategory) {
      const validCategories = ['Sedan', 'Bike', 'Small SUV', 'Big SUV', 'Pickup', 'Van', 'Big Van'];
      if (!validCategories.includes(body.vehiclecategory)) {
        throw new ValidationError(`vehiclecategory must be one of: ${validCategories.join(', ')}`);
      }
    }

    // Call the calculator service
    const result = await this.calculatorService.calculate(body);

    if (!result.success) {
      throw new ValidationError(result.error || 'Calculator API error');
    }

    return result.data;
  }
}
