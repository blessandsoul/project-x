import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis?: Redis;
  }
}

/**
 * Redis Plugin
 *
 * Provides optional Redis connectivity. If Redis is not available,
 * the server will continue without it. Features that depend on Redis
 * should check if `fastify.redis` is defined before using it.
 */
const redisPlugin = fp(async (fastify: FastifyInstance) => {
  // Check if Redis is explicitly disabled
  if (process.env.REDIS_ENABLED === 'false') {
    fastify.log.info('Redis is disabled via REDIS_ENABLED=false');
    return;
  }

  const url =
    process.env.REDIS_URL ??
    `redis://${process.env.REDIS_HOST ?? '127.0.0.1'}:${process.env.REDIS_PORT ?? '6379'}`;

  try {
    const client = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        // Only retry once, then give up to avoid blocking startup
        if (times > 1) {
          return null;
        }
        return 100;
      },
    });

    // Track if we successfully connected
    let isConnected = false;

    client.on('error', (err) => {
      // Only log errors if we were previously connected or this is unexpected
      if (isConnected) {
        fastify.log.error({ err }, 'Redis client error');
      }
    });

    client.on('connect', () => {
      isConnected = true;
    });

    // Try a light ping but do not block startup if it fails
    try {
      await client.ping();
      fastify.log.info({ url }, 'Connected to Redis');
      fastify.decorate('redis', client);

      fastify.addHook('onClose', async () => {
        try {
          await client.quit();
        } catch (err) {
          fastify.log.error({ err }, 'Error while closing Redis client');
        }
      });
    } catch (err) {
      fastify.log.warn('Redis not available, continuing without caching');
      // Disconnect the client since we won't use it
      try {
        client.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
  } catch (err) {
    fastify.log.warn('Failed to initialize Redis client, continuing without Redis');
  }
});

export { redisPlugin };
