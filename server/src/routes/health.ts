import { FastifyPluginAsync } from 'fastify';

/**
 * Health Check Routes
 *
 * Provides endpoints for monitoring application and database health.
 * Used by load balancers, monitoring systems, and deployment pipelines.
 *
 * Endpoints:
 * - GET /health - Basic application health check
 * - GET /health/db - Database connectivity health check
 */
const healthRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /health
   *
   * Basic health check endpoint that returns application status,
   * current timestamp, and server uptime.
   *
   * Response: { status: string, timestamp: string, uptime: number }
   * Status: Always 200 (OK)
   */
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  /**
   * GET /health/db
   *
   * Database connectivity health check. Performs a simple query
   * to verify database connection is working.
   *
   * Response: { status: string, database: string, timestamp: string }
   * Status: 200 (OK) if connected, 500 (Internal Server Error) if database unavailable
   */
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
