import { FastifyPluginAsync } from 'fastify';
import { ServicesController } from '../controllers/servicesController.js';
import { withVersionedCache, CACHE_TTL } from '../utils/cache.js';

/**
 * Services Routes
 *
 * GET /api/services
 *
 * Returns active services for company onboarding.
 * Cached for 1 hour (rarely changes).
 */
const servicesRoutes: FastifyPluginAsync = async (fastify) => {
    const controller = new ServicesController(fastify);

    /**
     * GET /api/services
     *
     * Returns all active services ordered by sort_order, then name.
     * No authentication required - services list is public.
     *
     * Response example:
     * {
     *   "success": true,
     *   "count": 5,
     *   "data": [
     *     { "id": 1, "name": "Ocean Freight" },
     *     { "id": 2, "name": "Inland Trucking" },
     *     ...
     *   ]
     * }
     */
    fastify.get('/api/services', async (request, reply) => {
        const result = await withVersionedCache(
            fastify,
            'services',
            ['all'],
            CACHE_TTL.LONG,
            async () => {
                const services = await controller.getActiveServices();
                return { success: true, count: services.length, data: services };
            },
        );
        return reply.send(result);
    });
};

export { servicesRoutes };
