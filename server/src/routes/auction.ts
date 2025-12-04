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
  fastify.post<{
    Body: { address: string; source: 'copart' | 'iaai' };
  }>('/auction/calculate-shipping', async (request, reply) => {
    const result = await controller.calculateShipping(request.body);
    return reply.send(result);
  });
};

export { auctionRoutes };
