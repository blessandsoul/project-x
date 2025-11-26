import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import Redis, { type RedisOptions } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis?: Redis;
  }
}

/**
 * Redis Configuration from Environment Variables
 *
 * Supported ENV variables:
 * - REDIS_ENABLED: Set to 'false' to disable Redis entirely
 * - REDIS_URL: Full connection URL (e.g., redis://:password@127.0.0.1:6379/0)
 * - REDIS_HOST: Redis host (default: 127.0.0.1)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - REDIS_KEY_PREFIX: Prefix for all keys (default: 'app:')
 * - REDIS_CONNECT_TIMEOUT: Connection timeout in ms (default: 5000)
 * - REDIS_MAX_RETRIES: Max connection retries (default: 3)
 */
const getRedisConfig = (): RedisOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // Connection settings
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    db: parseInt(process.env.REDIS_DB ?? '0', 10),

    // Key prefix for namespacing
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'app:',

    // Connection behavior
    lazyConnect: true,
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT ?? '5000', 10),
    maxRetriesPerRequest: 3,

    // Retry strategy for production resilience
    retryStrategy: (times) => {
      const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES ?? '3', 10);

      if (times > maxRetries) {
        // Stop retrying after max attempts
        return null;
      }

      // Exponential backoff: 100ms, 200ms, 400ms, etc.
      const delay = Math.min(times * 100, 2000);
      return delay;
    },

    // Production-specific settings
    ...(isProduction && {
      // Enable keep-alive for long-running connections
      keepAlive: 30000,

      // Enable offline queue to buffer commands during reconnection
      enableOfflineQueue: true,

      // Read-only replica support (if using Redis Sentinel/Cluster later)
      enableReadyCheck: true,
    }),
  };
};

/**
 * Build Redis connection URL for logging (hides password)
 */
const getSafeConnectionInfo = (): string => {
  const host = process.env.REDIS_HOST ?? '127.0.0.1';
  const port = process.env.REDIS_PORT ?? '6379';
  const db = process.env.REDIS_DB ?? '0';
  const hasPassword = !!process.env.REDIS_PASSWORD || process.env.REDIS_URL?.includes(':');

  return `redis://${hasPassword ? '***@' : ''}${host}:${port}/${db}`;
};

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

  const isProduction = process.env.NODE_ENV === 'production';

  try {
    let client: Redis;

    // REDIS_URL takes priority (for platforms like Railway, Render, etc.)
    if (process.env.REDIS_URL) {
      client = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'app:',
        maxRetriesPerRequest: 3,
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT ?? '5000', 10),
        retryStrategy: (times) => {
          if (times > parseInt(process.env.REDIS_MAX_RETRIES ?? '3', 10)) return null;
          return Math.min(times * 100, 2000);
        },
      });
    } else {
      client = new Redis(getRedisConfig());
    }

    // Track connection state
    let isConnected = false;
    let reconnectAttempts = 0;

    client.on('error', (err) => {
      if (isConnected || isProduction) {
        fastify.log.error({ err }, 'Redis client error');
      }
    });

    client.on('connect', () => {
      isConnected = true;
      reconnectAttempts = 0;
      fastify.log.info('Redis connection established');
    });

    client.on('reconnecting', () => {
      reconnectAttempts++;
      fastify.log.warn({ attempt: reconnectAttempts }, 'Redis reconnecting...');
    });

    client.on('close', () => {
      if (isConnected) {
        fastify.log.warn('Redis connection closed');
        isConnected = false;
      }
    });

    // Attempt connection
    try {
      await client.connect();
      await client.ping();

      const connectionInfo = getSafeConnectionInfo();
      fastify.log.info({ connection: connectionInfo }, 'Connected to Redis');

      fastify.decorate('redis', client);

      // Graceful shutdown hook
      fastify.addHook('onClose', async () => {
        try {
          fastify.log.info('Closing Redis connection...');
          await client.quit();
          fastify.log.info('Redis connection closed gracefully');
        } catch (err) {
          fastify.log.error({ err }, 'Error while closing Redis client');
          // Force disconnect if quit fails
          client.disconnect();
        }
      });
    } catch (err) {
      const message = isProduction
        ? 'Redis connection failed - caching disabled'
        : 'Redis not available, continuing without caching';

      fastify.log.warn({ err }, message);

      // Clean up the failed client
      try {
        client.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
  } catch (err) {
    fastify.log.warn({ err }, 'Failed to initialize Redis client, continuing without Redis');
  }
});

export { redisPlugin };
