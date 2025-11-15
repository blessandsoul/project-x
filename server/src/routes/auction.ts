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
};

export { auctionRoutes };
