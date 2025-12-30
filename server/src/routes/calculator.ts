import { FastifyPluginAsync } from 'fastify';
import { CalculatorController } from '../controllers/calculatorController.js';
import { createRateLimitHandler, RATE_LIMITS } from '../utils/rateLimit.js';
import { CompanyModel } from '../models/CompanyModel.js';
import { ShippingQuoteService } from '../services/ShippingQuoteService.js';
import { CalculatorRequestBuilder } from '../services/CalculatorRequestBuilder.js';

const calculatorRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new CalculatorController(fastify);
  const companyModel = new CompanyModel(fastify);
  const shippingQuoteService = new ShippingQuoteService(fastify);
  const calculatorRequestBuilder = new CalculatorRequestBuilder(fastify);

  // POST /api/calculator
  // Calculate shipping costs using external calculator API
  // Rate limited: 30 requests per minute
  fastify.post('/api/calculator', {
    preHandler: createRateLimitHandler(fastify, RATE_LIMITS.calculator),
    schema: {
      body: {
        type: 'object',
        required: ['buyprice', 'auction', 'vehicletype'],
        properties: {
          buyprice: { type: 'number', minimum: 0 },
          auction: { type: 'string', minLength: 1, maxLength: 100 },
          vehicletype: { type: 'string', minLength: 1, maxLength: 100 },
          usacity: { type: 'string', minLength: 1, maxLength: 200 },
          coparturl: { type: 'string', minLength: 1, maxLength: 500 },
          destinationport: { type: 'string', minLength: 1, maxLength: 100 },
          vehiclecategory: { type: 'string', minLength: 1, maxLength: 100 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const body = request.body as {
      buyprice: number;
      auction: string;
      vehicletype: string;
      usacity?: string;
      coparturl?: string;
      destinationport?: string;
      vehiclecategory?: string;
    };
    const result = await controller.calculate(body);
    return reply.send(result);
  });

  /**
   * POST /api/calculator/quotes
   *
   * Calculate shipping quotes for ALL companies using the adapter pattern.
   * Each company with a custom calculator API will receive its own calculated price.
   *
   * This endpoint is used by the /catalog page to display per-company prices.
   *
   * REQUEST BODY:
   * - usacity (string, required): US city name
   * - destinationport (string, optional): Default "POTI"
   * - vehiclecategory (string, optional): Default "Sedan"
   * - vehicletype (string, optional): Default "standard"
   * - auction (string, optional): Default "Copart"
   *
   * RESPONSE:
   * {
   *   success: boolean,
   *   quotes: Array<{
   *     companyId: number,
   *     companyName: string,
   *     totalPrice: number,
   *     deliveryTimeDays: number | null,
   *     calculatorType: 'default' | 'custom_api' | 'formula'
   *   }>,
   *   distanceMiles: number,
   *   defaultPrice: number // Price from default calculator for display
   * }
   */
  fastify.post('/api/calculator/quotes', {
    preHandler: createRateLimitHandler(fastify, RATE_LIMITS.calculator),
    schema: {
      body: {
        type: 'object',
        required: ['usacity'],
        properties: {
          usacity: { type: 'string', minLength: 1, maxLength: 200 },
          destinationport: { type: 'string', minLength: 1, maxLength: 100 },
          vehiclecategory: { type: 'string', minLength: 1, maxLength: 100 },
          vehicletype: { type: 'string', minLength: 1, maxLength: 100 },
          auction: { type: 'string', minLength: 1, maxLength: 100 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const body = request.body as {
      usacity: string;
      destinationport?: string;
      vehiclecategory?: string;
      vehicletype?: string;
      auction?: string;
    };

    request.log.info(
      { body },
      '[Calculator] Calculating quotes for all companies'
    );

    // Build normalized calculator request using smart matching
    const buildResult = await calculatorRequestBuilder.buildCalculatorRequest({
      auction: body.auction || 'Copart',
      usacity: body.usacity,
    }, {
      destinationport: body.destinationport || 'POTI',
      vehiclecategory: body.vehiclecategory || 'Sedan',
      vehicletype: body.vehicletype || 'standard',
    });

    // If city couldn't be matched, return with default price only
    if (!buildResult.success || !buildResult.request) {
      request.log.warn(
        { usacity: body.usacity, error: buildResult.error },
        '[Calculator] Could not build calculator request'
      );

      // Still try to get a default price for display
      const defaultResult = await controller.calculate({
        buyprice: 1,
        auction: body.auction || 'Copart',
        vehicletype: body.vehicletype || 'standard',
        usacity: body.usacity,
        destinationport: body.destinationport || 'POTI',
        vehiclecategory: body.vehiclecategory || 'Sedan',
      });

      const defaultPrice = defaultResult.data?.transportation_total
        ?? defaultResult.transportation_total
        ?? 0;

      return reply.send({
        success: false,
        message: buildResult.error || 'Price calculation is not available for this location.',
        unmatched_city: buildResult.unmatchedCity,
        quotes: [],
        distanceMiles: 0,
        defaultPrice,
      });
    }

    const calculatorInput = buildResult.request;

    // Get all active companies
    const companies = await companyModel.findAllActive(1000, 0);

    if (!companies.length) {
      return reply.send({
        success: false,
        message: 'No companies available',
        quotes: [],
        distanceMiles: 0,
        defaultPrice: 0,
      });
    }

    // Compute quotes for all companies using adapter pattern
    const { distanceMiles, quotes } = await shippingQuoteService.computeQuotesWithCalculatorInput(
      calculatorInput,
      companies
    );

    // Get the default price (from default calculator) for comparison
    const defaultQuote = quotes.find(q => {
      const company = companies.find(c => c.id === q.companyId);
      return company && (!company.calculator_type || company.calculator_type === 'default');
    });
    const defaultPrice = defaultQuote?.totalPrice ?? quotes[0]?.totalPrice ?? 0;

    // Map quotes to include calculator type
    const quotesWithType = quotes.map(quote => {
      const company = companies.find(c => c.id === quote.companyId);
      return {
        companyId: quote.companyId,
        companyName: quote.companyName,
        totalPrice: quote.totalPrice,
        deliveryTimeDays: quote.deliveryTimeDays,
        calculatorType: company?.calculator_type || 'default',
      };
    });

    request.log.info(
      {
        quoteCount: quotesWithType.length,
        distanceMiles,
        defaultPrice,
      },
      '[Calculator] Computed quotes for all companies'
    );

    return reply.send({
      success: true,
      quotes: quotesWithType,
      distanceMiles,
      defaultPrice,
    });
  });
};

export { calculatorRoutes };

