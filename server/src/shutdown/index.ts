/**
 * Graceful Shutdown Handlers
 *
 * Handles graceful server shutdown when receiving termination signals.
 * Ensures all connections are properly closed before exiting.
 *
 * @module shutdown
 */

import { FastifyInstance } from 'fastify';
import { cleanupSocketIO } from '../realtime/index.js';

/**
 * Register graceful shutdown handlers
 *
 * This function sets up handlers for SIGTERM and SIGINT signals to ensure
 * the server shuts down gracefully, closing all connections properly.
 *
 * Shutdown sequence:
 * 1. Close Socket.IO connections
 * 2. Close Fastify server (stops accepting new connections)
 * 3. Exit process
 *
 * @param fastify - Fastify instance to register shutdown handlers for
 */
export function registerShutdownHandlers(fastify: FastifyInstance): void {
    /**
     * Graceful shutdown handler
     * @param signal - The signal that triggered shutdown
     */
    const gracefulShutdown = async (signal: string) => {
        fastify.log.info({ signal }, 'Received shutdown signal, closing server gracefully...');

        try {
            // Cleanup Socket.IO first
            await cleanupSocketIO();
            fastify.log.info('Socket.IO closed');

            // Close Fastify server (stops accepting new connections)
            await fastify.close();
            fastify.log.info('Server closed successfully');
            process.exit(0);
        } catch (err) {
            fastify.log.error({ err }, 'Error during graceful shutdown');
            process.exit(1);
        }
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    fastify.log.debug('Shutdown handlers registered');
}
