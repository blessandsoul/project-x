import { FastifyPluginAsync } from 'fastify';
import { CitiesController } from '../controllers/citiesController.js';
import { withVersionedCache, CACHE_TTL } from '../utils/cache.js';

const citiesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new CitiesController(fastify);

  // GET /api/cities
  // Returns all cities from the database
  // Cached for 1 hour (rarely changes, synced daily)
  fastify.get('/api/cities', async (request, reply) => {
    const result = await withVersionedCache(
      fastify,
      'cities',
      ['all'],
      CACHE_TTL.LONG,
      async () => {
        const cities = await controller.getCities();
        return { success: true, count: cities.length, data: cities };
      },
    );
    return reply.send(result);
  });
};

export { citiesRoutes };
