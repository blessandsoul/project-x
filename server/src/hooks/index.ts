/**
 * Request Hooks
 *
 * This module contains Fastify hooks for request/response lifecycle management.
 * Includes request ID tracking and slow request detection.
 *
 * @module hooks
 */

import { FastifyInstance } from 'fastify';

/** Threshold in milliseconds for logging slow requests */
const SLOW_REQUEST_THRESHOLD_MS = 1000;

/**
 * Register all request lifecycle hooks
 *
 * Hooks registered:
 * - onRequest: Attaches request ID to response headers and tracks start time
 * - onResponse: Logs slow requests that exceed the threshold
 *
 * @param fastify - Fastify instance to register hooks on
 */
export function registerHooks(fastify: FastifyInstance): void {
    // ---------------------------------------------------------------------------
    // Request ID tracking - add request ID to all responses for debugging
    // ---------------------------------------------------------------------------
    fastify.addHook('onRequest', async (request, reply) => {
        // Attach request ID to reply headers for client-side correlation
        reply.header('X-Request-Id', request.id);
        // Track request start time for performance monitoring
        (request as any).startTime = Date.now();
    });

    // ---------------------------------------------------------------------------
    // Slow request logging - log requests that exceed the threshold
    // ---------------------------------------------------------------------------
    fastify.addHook('onResponse', async (request, reply) => {
        const startTime = (request as any).startTime;
        if (startTime) {
            const duration = Date.now() - startTime;
            if (duration > SLOW_REQUEST_THRESHOLD_MS) {
                fastify.log.warn({
                    method: request.method,
                    url: request.url,
                    statusCode: reply.statusCode,
                    duration: `${duration}ms`,
                }, 'Slow request detected');
            }
        }
    });

    fastify.log.debug('Request lifecycle hooks registered');
}
