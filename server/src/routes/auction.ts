import { FastifyPluginAsync } from 'fastify';
import { AuctionController } from '../controllers/auctionController.js';

const auctionRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AuctionController(fastify);

  // GET /api/auction/active-lots
  // Returns the latest cached active lots fetched by the hourly job.
  fastify.get('/api/auction/active-lots', async (request, reply) => {
    const result = await controller.getActiveLots();
    return reply.send(result);
  });

  // POST /auction/calculate-shipping
  // Calculate shipping quotes for all companies based on auction branch address
  fastify.post('/auction/calculate-shipping', {
    schema: {
      body: {
        type: 'object',
        required: ['address', 'source'],
        properties: {
          address: { type: 'string', minLength: 1, maxLength: 500 },
          source: { type: 'string', enum: ['copart', 'iaai'] },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const body = request.body as { address: string; source: 'copart' | 'iaai' };
    const result = await controller.calculateShipping(body);
    return reply.send(result);
  });
};

export { auctionRoutes };
