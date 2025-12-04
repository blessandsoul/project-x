import { FastifyPluginAsync } from 'fastify';
import { AuctionsController } from '../controllers/auctionsController.js';

const auctionsRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AuctionsController(fastify);

  // GET /api/auctions
  // Returns all auctions from the database
  fastify.get('/api/auctions', async (request, reply) => {
    const auctions = await controller.getAuctions();
    return reply.send({ success: true, count: auctions.length, data: auctions });
  });
};

export { auctionsRoutes };
