import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis?: Redis;
  }
}

const redisPlugin = fp(async (fastify: FastifyInstance) => {
  const url =
    process.env.REDIS_URL ??
    `redis://${process.env.REDIS_HOST ?? '127.0.0.1'}:${process.env.REDIS_PORT ?? '6379'}`;

  try {
    const client = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 2000,
    });

    client.on('error', (err) => {
      fastify.log.error({ err }, 'Redis client error');
    });

    // Try a light ping but do not block startup if it fails
    try {
      await client.ping();
      fastify.log.info({ url }, 'Connected to Redis');
    } catch (err) {
      fastify.log.warn({ err, url }, 'Redis not reachable at startup, will connect on first use');
    }

    fastify.decorate('redis', client);

    fastify.addHook('onClose', async () => {
      try {
        await client.quit();
      } catch (err) {
        fastify.log.error({ err }, 'Error while closing Redis client');
      }
    });
  } catch (err) {
    fastify.log.error({ err, url }, 'Failed to initialize Redis client, continuing without Redis');
  }
});

export { redisPlugin };
