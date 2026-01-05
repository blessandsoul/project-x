import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';

/**
 * Cache utility for Redis-based caching with automatic fallback
 * when Redis is not available.
 * 
 * Key Format Standards:
 * - cache:<feature>:<scope>:<params_hash>
 * - Version keys: v:<feature> (incremented on writes to avoid KEYS scan)
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
  /** For data that rarely changes (cities, ports, auctions, makes, models) */
  LONG: 3600, // 1 hour
  /** For data that changes occasionally (companies) */
  MEDIUM: 600, // 10 minutes
  /** For frequently changing data (search results) */
  SHORT: 300, // 5 minutes
  /** For expensive calculations (quotes) */
  CALCULATION: 600, // 10 minutes
  /** For immutable data (VIN decode) */
  IMMUTABLE: 86400, // 24 hours
  /** For near-real-time stats */
  REALTIME: 30, // 30 seconds
  /** For active lots (updated hourly) */
  ACTIVE_LOTS: 300, // 5 minutes
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
 * @deprecated Use version-key based invalidation instead to avoid O(N) KEYS scan
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

// =============================================================================
// Version-Key Based Cache Invalidation
// =============================================================================
// Instead of using KEYS to find and delete cache entries (O(N) and blocks Redis),
// we use version keys. Cache keys include the version number, and on write we
// simply increment the version, making old cache keys orphaned (they expire via TTL).
//
// Example:
// - Version key: v:companies -> 5
// - Cache key: cache:companies:all:v=5
// - On company update: INCR v:companies -> 6
// - New cache key: cache:companies:all:v=6
// - Old key cache:companies:all:v=5 expires naturally
// =============================================================================

/**
 * Get current version for a feature (for building cache keys)
 */
export async function getCacheVersion(
  fastify: FastifyInstance,
  feature: string,
): Promise<number> {
  if (!fastify.redis) {
    return 0;
  }

  try {
    const version = await fastify.redis.get(`v:${feature}`);
    return version ? parseInt(version, 10) : 0;
  } catch (err) {
    fastify.log.warn({ err, feature }, 'Failed to get cache version');
    return 0;
  }
}

/**
 * Increment version for a feature (invalidates all related caches)
 */
export async function incrementCacheVersion(
  fastify: FastifyInstance,
  feature: string,
): Promise<number> {
  if (!fastify.redis) {
    return 0;
  }

  try {
    const newVersion = await fastify.redis.incr(`v:${feature}`);
    fastify.log.debug({ feature, newVersion }, 'Cache version incremented');
    return newVersion;
  } catch (err) {
    fastify.log.warn({ err, feature }, 'Failed to increment cache version');
    return 0;
  }
}

/**
 * Build a versioned cache key
 * Format: cache:<feature>:<scope>:v=<version>:<params>
 */
export async function buildVersionedCacheKey(
  fastify: FastifyInstance,
  feature: string,
  ...parts: (string | number | undefined)[]
): Promise<string> {
  const version = await getCacheVersion(fastify, feature);
  const sanitized = parts
    .filter((p) => p !== undefined && p !== null)
    .map((p) => String(p).replace(/[^a-zA-Z0-9_-]/g, '_'));
  return `cache:${feature}:v=${version}:${sanitized.join(':')}`;
}

/**
 * Build a versioned cache key from an object (for search params)
 */
export async function buildVersionedCacheKeyFromObject(
  fastify: FastifyInstance,
  feature: string,
  obj: Record<string, unknown>,
): Promise<string> {
  const version = await getCacheVersion(fastify, feature);
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
  const hash = crypto.createHash('sha256').update(json).digest('hex').slice(0, 32);
  return `cache:${feature}:v=${version}:${hash}`;
}

/**
 * Higher-order function for versioned caching
 * Automatically includes version in cache key
 */
export async function withVersionedCache<T>(
  fastify: FastifyInstance,
  feature: string,
  keyParts: (string | number | undefined)[],
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const key = await buildVersionedCacheKey(fastify, feature, ...keyParts);
  return withCache(fastify, key, ttlSeconds, fetchFn);
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
 * Invalidate company-related caches
 * Call after creating, updating, or deleting a company
 */
export async function invalidateCompanyCache(
  fastify: FastifyInstance,
): Promise<void> {
  await incrementCacheVersion(fastify, 'companies');
}

/**
 * Invalidate vehicle-related caches
 * Call after creating, updating, or deleting vehicles
 */
export async function invalidateVehicleCache(
  fastify: FastifyInstance,
): Promise<void> {
  await incrementCacheVersion(fastify, 'vehicles');
}

/**
 * Invalidate reference data caches (cities, ports, auctions)
 * Call after syncing reference data
 */
export async function invalidateReferenceDataCache(
  fastify: FastifyInstance,
  type: 'cities' | 'ports' | 'auctions' | 'makes' | 'models',
): Promise<void> {
  await incrementCacheVersion(fastify, type);
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
