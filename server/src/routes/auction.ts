import { FastifyPluginAsync } from 'fastify';
import { AuctionController } from '../controllers/auctionController.js';
import { withCache, CACHE_TTL } from '../utils/cache.js';
import { createRateLimitHandler, RATE_LIMITS } from '../utils/rateLimit.js';

const auctionRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AuctionController(fastify);

  // GET /api/auction/active-lots
  // Returns the latest cached active lots fetched by the hourly job.
  // Cached for 5 minutes (updated hourly by cron)
  fastify.get('/api/auction/active-lots', async (request, reply) => {
    const result = await withCache(
      fastify,
      'cache:auction:active-lots',
      CACHE_TTL.ACTIVE_LOTS,
      () => controller.getActiveLots(),
    );
    return reply.send(result);
  });

  // POST /auction/calculate-shipping
  // Calculate shipping quotes for all companies based on auction branch address
  // Rate limited: 30 requests per minute
  fastify.post('/auction/calculate-shipping', {
    preHandler: createRateLimitHandler(fastify, RATE_LIMITS.shippingCalculate),
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
