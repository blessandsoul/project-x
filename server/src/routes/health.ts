import { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Database health check
  fastify.get('/health/db', async (request, reply) => {
    try {
      const [rows] = await fastify.mysql.execute('SELECT 1 as test');
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown database error');
      fastify.log.error({ err: error }, 'Database health check failed');
      return reply.code(500).send({
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });
};

export { healthRoutes };
