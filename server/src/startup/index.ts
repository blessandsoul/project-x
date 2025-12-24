/**
 * Server Startup
 *
 * Handles server initialization, data synchronization, and startup sequence.
 * Ensures all required data is available before accepting requests.
 *
 * @module startup
 */

import { FastifyInstance } from 'fastify';
import { FxRateService } from '../services/FxRateService.js';
import { CitiesService } from '../services/CitiesService.js';
import { PortsService } from '../services/PortsService.js';
import { AuctionsService } from '../services/AuctionsService.js';
import { initializeSocketIO } from '../realtime/index.js';

/**
 * Start the server
 *
 * This function:
 * 1. Syncs required data (FX rates, cities, ports, auctions)
 * 2. Starts the HTTP server
 * 3. Initializes Socket.IO for real-time features
 * 4. Signals PM2 readiness (if running under PM2)
 *
 * @param fastify - Fastify instance to start
 */
export async function startServer(fastify: FastifyInstance): Promise<void> {
    try {
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        const host = process.env.HOST || '127.0.0.1';

        // -------------------------------------------------------------------------
        // Pre-startup data synchronization
        // -------------------------------------------------------------------------
        // Initialize services for startup sync
        const fxRateService = new FxRateService(fastify);
        const citiesService = new CitiesService(fastify);
        const portsService = new PortsService(fastify);
        const auctionsService = new AuctionsService(fastify);

        // Ensure there is a USD->GEL rate for today before starting the server.
        // If a rate already exists for the current UTC date, this is a no-op.
        await fxRateService.ensureTodayUsdGelRate();

        // Sync reference data on server startup
        await citiesService.syncCities();
        await portsService.syncPorts();
        await auctionsService.syncAuctions();

        // -------------------------------------------------------------------------
        // Start HTTP server
        // -------------------------------------------------------------------------
        await fastify.listen({ port, host });
        fastify.log.info(`Server listening on http://${host}:${port}`);
        fastify.log.info(`API documentation available at http://${host}:${port}/docs`);

        // -------------------------------------------------------------------------
        // Initialize real-time features
        // -------------------------------------------------------------------------
        await initializeSocketIO(fastify, fastify.server);
        fastify.log.info('Socket.IO real-time server ready');

        // -------------------------------------------------------------------------
        // PM2 cluster mode support
        // -------------------------------------------------------------------------
        if (process.send) {
            process.send('ready');
            fastify.log.info('Sent ready signal to PM2');
        }
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
