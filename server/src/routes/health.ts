import { FastifyPluginAsync } from 'fastify';
import { VinController } from '../controllers/vinController.js';

/**
 * Health Check Routes
 *
 * Provides endpoints for monitoring application and database health.
 * Used by load balancers, monitoring systems, and deployment pipelines.
 *
 * Endpoints:
 * - GET /health - Comprehensive application health check (includes DB and VIN services)
 * - GET /health/db - Database connectivity health check
 */
const healthRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /health
   *
   * Comprehensive health check endpoint that verifies application status,
   * database connectivity, and external service dependencies (VIN decoder).
   *
   * Response: { status: string, timestamp: string, uptime: number, services: object }
   * Status: 200 (OK) if all services healthy, 503 (Service Unavailable) if any critical service fails
   */
  fastify.get('/health', async (request, reply) => {
    const vinController = new VinController(fastify);
    const healthChecks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {} as any
    };

    let overallHealthy = true;

    // Database health check
    try {
      const [rows] = await fastify.mysql.execute('SELECT 1 as test');
      healthChecks.services.database = {
        status: 'healthy',
        responseTime: Date.now() // Could track timing if needed
      };
    } catch (error) {
      healthChecks.services.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed'
      };
      overallHealthy = false;
    }

    // VIN service health check
    try {
      const vinHealth = await vinController.getServiceHealth();
      healthChecks.services.vinDecoder = {
        status: vinHealth.healthy ? 'healthy' : 'unhealthy',
        responseTime: vinHealth.responseTime,
        error: vinHealth.error
      };
      if (!vinHealth.healthy) {
        overallHealthy = false;
      }
    } catch (error) {
      healthChecks.services.vinDecoder = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'VIN service check failed'
      };
      overallHealthy = false;
    }

    // Set overall status
    healthChecks.status = overallHealthy ? 'ok' : 'degraded';

    const statusCode = overallHealthy ? 200 : 503;
    return reply.code(statusCode).send(healthChecks);
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
