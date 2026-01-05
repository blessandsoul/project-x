import { FastifyPluginAsync } from 'fastify';
import { AuctionsController } from '../controllers/auctionsController.js';
import { withVersionedCache, CACHE_TTL } from '../utils/cache.js';

const auctionsRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AuctionsController(fastify);

  // GET /api/auctions
  // Returns all auctions from the database
  // Cached for 1 hour (rarely changes, synced every 10 days)
  fastify.get('/auctions', async (request, reply) => {
    const result = await withVersionedCache(
      fastify,
      'auctions',
      ['all'],
      CACHE_TTL.LONG,
      async () => {
        const auctions = await controller.getAuctions();
        return { success: true, count: auctions.length, data: auctions };
      },
    );
    return reply.send(result);
  });
};

export { auctionsRoutes };
