import { FastifyPluginAsync } from 'fastify';
import { PortsController } from '../controllers/portsController.js';
import { withVersionedCache, CACHE_TTL } from '../utils/cache.js';

const portsRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new PortsController(fastify);

  // GET /api/ports
  // Returns all ports from the database
  // Cached for 1 hour (rarely changes, synced every 10 days)
  fastify.get('/ports', async (request, reply) => {
    const result = await withVersionedCache(
      fastify,
      'ports',
      ['all'],
      CACHE_TTL.LONG,
      async () => {
        const ports = await controller.getPorts();
        return { success: true, count: ports.length, data: ports };
      },
    );
    return reply.send(result);
  });
};

export { portsRoutes };
