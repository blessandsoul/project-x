import { FastifyPluginAsync } from 'fastify';
import { CalculatorController } from '../controllers/calculatorController.js';

const calculatorRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new CalculatorController(fastify);

  // POST /api/calculator
  // Calculate shipping costs using external calculator API
  fastify.post<{
    Body: {
      buyprice: number;
      auction: string;
      vehicletype: string;
      usacity?: string;
      coparturl?: string;
      destinationport?: string;
      vehiclecategory?: string;
    };
  }>('/api/calculator', async (request, reply) => {
    const result = await controller.calculate(request.body);
    return reply.send(result);
  });
};

export { calculatorRoutes };
