import { FastifyPluginAsync } from 'fastify';
import { CalculatorController } from '../controllers/calculatorController.js';

const calculatorRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new CalculatorController(fastify);

  // POST /api/calculator
  // Calculate shipping costs using external calculator API
  fastify.post('/api/calculator', {
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
};

export { calculatorRoutes };
