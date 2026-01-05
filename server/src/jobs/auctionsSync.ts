/**
 * Auctions Sync Job
 *
 * Synchronizes auctions data from external API.
 * Updates the auctions database table with fresh data from the auction API.
 *
 * Schedule: Every 10 days (day-of-month 1, 11, and 21 at 00:00)
 * Service: AuctionsService
 */

import { FastifyInstance } from 'fastify';
import { AuctionsService } from '../services/AuctionsService.js';
import { CronJob } from './types.js';

/**
 * Create the auctions sync job
 * @param fastify - Fastify instance for logging and database access
 */
export function createAuctionsSyncJob(fastify: FastifyInstance): CronJob {
    const auctionsService = new AuctionsService(fastify);

    return {
        name: 'Auctions Sync',
        schedule: '0 0 1,11,21 * *', // Every 10 days at midnight
        handler: async () => {
            try {
                fastify.log.info('Running auctions sync job (every 10 days)');
                await auctionsService.syncAuctions();
                fastify.log.info('Auctions sync job completed');
            } catch (error) {
                fastify.log.error({ error }, 'Auctions sync job failed');
            }
        },
    };
}
