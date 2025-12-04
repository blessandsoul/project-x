import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';

/**
 * Cache utility for Redis-based caching with automatic fallback
 * when Redis is not available.
 */

export interface CacheOptions {
  /** Time to live in seconds */
  ttl: number;
  /** Optional prefix for cache keys */
  prefix?: string;
}

/**
 * Default TTL values for different cache types (in seconds)
 */
export const CACHE_TTL = {
  /** For data that rarely changes (makes, models) */
  LONG: 3600, // 1 hour
  /** For data that changes occasionally (companies) */
  MEDIUM: 600, // 10 minutes
  /** For frequently changing data (search results) */
  SHORT: 300, // 5 minutes
  /** For expensive calculations */
  CALCULATION: 600, // 10 minutes
} as const;

/**
 * Generate a cache key from components
 */
export function buildCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
  const sanitized = parts
    .filter((p) => p !== undefined && p !== null)
    .map((p) => String(p).replace(/[^a-zA-Z0-9_-]/g, '_'));
  return `${prefix}:${sanitized.join(':')}`;
}

/**
 * Generate a cache key from an object (for search params)
 */
export function buildCacheKeyFromObject(prefix: string, obj: Record<string, unknown>): string {
  // Sort keys for consistent cache keys regardless of param order
  const sorted = Object.keys(obj)
    .sort()
    .reduce(
      (acc, key) => {
        const value = obj[key];
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );

  const json = JSON.stringify(sorted);
  // Use crypto hash for a fixed-length, collision-resistant key
  const hash = crypto.createHash('sha256').update(json).digest('hex').slice(0, 32);
  return `${prefix}:${hash}`;
}

/**
 * Get a value from cache
 */
export async function getFromCache<T>(
  fastify: FastifyInstance,
  key: string,
): Promise<T | null> {
  if (!fastify.redis) {
    return null;
  }

  try {
    const cached = await fastify.redis.get(key);
    if (cached) {
      fastify.log.debug({ key }, 'Cache hit');
      return JSON.parse(cached) as T;
    }
    fastify.log.debug({ key }, 'Cache miss');
    return null;
  } catch (err) {
    fastify.log.warn({ err, key }, 'Cache read error');
    return null;
  }
}

/**
 * Set a value in cache
 */
export async function setInCache(
  fastify: FastifyInstance,
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (!fastify.redis) {
    return;
  }

  try {
    await fastify.redis.setex(key, ttlSeconds, JSON.stringify(value));
    fastify.log.debug({ key, ttl: ttlSeconds }, 'Cache set');
  } catch (err) {
    fastify.log.warn({ err, key }, 'Cache write error');
  }
}

/**
 * Delete a specific cache key
 */
export async function deleteFromCache(
  fastify: FastifyInstance,
  key: string,
): Promise<void> {
  if (!fastify.redis) {
    return;
  }

  try {
    await fastify.redis.del(key);
    fastify.log.debug({ key }, 'Cache deleted');
  } catch (err) {
    fastify.log.warn({ err, key }, 'Cache delete error');
  }
}

/**
 * Delete all cache keys matching a pattern
 * Use sparingly - SCAN is O(N)
 */
export async function invalidateCachePattern(
  fastify: FastifyInstance,
  pattern: string,
): Promise<void> {
  if (!fastify.redis) {
    return;
  }

  try {
    const keys = await fastify.redis.keys(pattern);
    if (keys.length > 0) {
      await fastify.redis.del(...keys);
      fastify.log.debug({ pattern, count: keys.length }, 'Cache pattern invalidated');
    }
  } catch (err) {
    fastify.log.warn({ err, pattern }, 'Cache pattern invalidation error');
  }
}

/**
 * Invalidate user auth cache when user data changes
 * Call this after updating user role, blocking user, etc.
 */
export async function invalidateUserCache(
  fastify: FastifyInstance,
  userId: number,
): Promise<void> {
  await deleteFromCache(fastify, `user:auth:${userId}`);
}

/**
 * Higher-order function for caching async operations
 * Usage: const result = await withCache(fastify, 'key', 300, () => expensiveOperation());
 */
export async function withCache<T>(
  fastify: FastifyInstance,
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  // Try to get from cache first
  const cached = await getFromCache<T>(fastify, key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const result = await fetchFn();

  // Store in cache (don't await to avoid blocking response)
  setInCache(fastify, key, result, ttlSeconds).catch(() => {
    // Error already logged in setInCache
  });

  return result;
}
