import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Redis-backed Rate Limiting Utility
 * 
 * Provides consistent rate limiting across PM2 cluster workers using Redis.
 * Falls back to allowing requests if Redis is unavailable (fail-open for non-critical,
 * fail-closed for critical endpoints).
 * 
 * Uses fixed-window algorithm with Redis INCR + EXPIRE for simplicity and performance.
 */

export interface RateLimitConfig {
  /** Maximum requests allowed in the time window */
  max: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key prefix for this rate limit (e.g., 'rl:avatar') */
  keyPrefix: string;
  /** If true, block requests when Redis is down (fail-closed). Default: false (fail-open) */
  failClosed?: boolean;
  /** Custom key generator. Default: uses IP address */
  keyGenerator?: (request: FastifyRequest) => string;
  /** Custom error message */
  errorMessage?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  total: number;
}

/**
 * Check rate limit for a request
 * Returns whether the request is allowed and rate limit info
 */
export async function checkRateLimit(
  fastify: FastifyInstance,
  request: FastifyRequest,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const {
    max,
    windowSeconds,
    keyPrefix,
    failClosed = false,
    keyGenerator,
  } = config;

  // Generate key based on IP or custom generator
  const identifier = keyGenerator
    ? keyGenerator(request)
    : request.ip || 'unknown';
  
  const key = `${keyPrefix}:${identifier}`;

  // If Redis is not available, decide based on failClosed setting
  if (!fastify.redis) {
    if (failClosed) {
      fastify.log.warn({ key }, 'Rate limit check failed (Redis unavailable, fail-closed)');
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + windowSeconds * 1000,
        total: max,
      };
    }
    // Fail-open: allow the request
    return {
      allowed: true,
      remaining: max,
      resetAt: Date.now() + windowSeconds * 1000,
      total: max,
    };
  }

  try {
    // Use MULTI to atomically increment and set expiry
    const pipeline = fastify.redis.multi();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results) {
      // Pipeline failed, fail-open or fail-closed based on config
      if (failClosed) {
        return { allowed: false, remaining: 0, resetAt: Date.now() + windowSeconds * 1000, total: max };
      }
      return { allowed: true, remaining: max, resetAt: Date.now() + windowSeconds * 1000, total: max };
    }

    const [incrResult, ttlResult] = results;
    const count = (incrResult?.[1] as number) || 1;
    let ttl = (ttlResult?.[1] as number) || -1;

    // If this is the first request (count === 1) or key has no TTL, set expiry
    if (count === 1 || ttl === -1) {
      await fastify.redis.expire(key, windowSeconds);
      ttl = windowSeconds;
    }

    const allowed = count <= max;
    const remaining = Math.max(0, max - count);
    const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000);

    if (!allowed) {
      fastify.log.debug({ key, count, max }, 'Rate limit exceeded');
    }

    return {
      allowed,
      remaining,
      resetAt,
      total: max,
    };
  } catch (err) {
    fastify.log.warn({ err, key }, 'Rate limit check error');
    
    // On error, decide based on failClosed setting
    if (failClosed) {
      return { allowed: false, remaining: 0, resetAt: Date.now() + windowSeconds * 1000, total: max };
    }
    return { allowed: true, remaining: max, resetAt: Date.now() + windowSeconds * 1000, total: max };
  }
}

/**
 * Create a rate limit preHandler for Fastify routes
 * 
 * Usage:
 * fastify.post('/endpoint', {
 *   preHandler: createRateLimitHandler(fastify, {
 *     max: 10,
 *     windowSeconds: 60,
 *     keyPrefix: 'rl:endpoint',
 *   }),
 * }, handler);
 */
export function createRateLimitHandler(
  fastify: FastifyInstance,
  config: RateLimitConfig,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await checkRateLimit(fastify, request, config);

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', result.total);
    reply.header('X-RateLimit-Remaining', result.remaining);
    reply.header('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      reply.header('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
      
      return reply.code(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: config.errorMessage || 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
    }
  };
}

/**
 * Rate limit configurations for common endpoints
 */
export const RATE_LIMITS = {
  // File uploads (avatar, logo)
  fileUpload: {
    max: 10,
    windowSeconds: 60,
    keyPrefix: 'rl:upload',
    errorMessage: 'Too many upload attempts. Please wait before trying again.',
  },
  
  // Inquiry creation
  inquiryCreate: {
    max: 20,
    windowSeconds: 60,
    keyPrefix: 'rl:inquiry:create',
    errorMessage: 'Too many inquiry requests. Please wait before creating another.',
  },
  
  // Message sending
  messageSend: {
    max: 60,
    windowSeconds: 60,
    keyPrefix: 'rl:message:send',
    errorMessage: 'Too many messages. Please slow down.',
  },
  
  // Quote calculations
  quoteCalculate: {
    max: 30,
    windowSeconds: 60,
    keyPrefix: 'rl:quote:calc',
    errorMessage: 'Too many quote requests. Please wait before trying again.',
  },
  
  // VIN decode (external API)
  vinDecode: {
    max: 10,
    windowSeconds: 60,
    keyPrefix: 'rl:vin:decode',
    failClosed: false, // Allow if Redis down, external API has its own limits
    errorMessage: 'Too many VIN decode requests. Please wait before trying again.',
  },
  
  // Calculator (external API)
  calculator: {
    max: 30,
    windowSeconds: 60,
    keyPrefix: 'rl:calculator',
    errorMessage: 'Too many calculator requests. Please wait before trying again.',
  },
  
  // Shipping calculation
  shippingCalculate: {
    max: 30,
    windowSeconds: 60,
    keyPrefix: 'rl:shipping:calc',
    errorMessage: 'Too many shipping calculation requests. Please wait.',
  },
} as const;

/**
 * User-scoped rate limit key generator
 * Uses user ID if authenticated, falls back to IP
 */
export function userScopedKeyGenerator(request: FastifyRequest): string {
  const user = (request as any).user as { id: number } | undefined;
  if (user?.id) {
    return `user:${user.id}`;
  }
  return `ip:${request.ip || 'unknown'}`;
}
