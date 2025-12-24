/**
 * FX Rate Sync Job
 *
 * Refreshes USD->GEL exchange rate once per day.
 * The FxRateService checks the exchange_rates table first and only calls
 * the external API if there is no row for the current UTC date.
 *
 * Schedule: Daily at 00:05 AM
 * Service: FxRateService
 */

import { FastifyInstance } from 'fastify';
import { FxRateService } from '../services/FxRateService.js';
import { CronJob } from './types.js';

/**
 * Create the FX rate sync job
 * @param fastify - Fastify instance for logging and database access
 */
export function createFxRateSyncJob(fastify: FastifyInstance): CronJob {
    const fxRateService = new FxRateService(fastify);

    return {
        name: 'FX Rate Sync',
        schedule: '5 0 * * *', // Daily at 00:05 AM
        handler: async () => {
            try {
                fastify.log.info('Running daily FX rate refresh job');
                await fxRateService.ensureTodayUsdGelRate();
                fastify.log.info('Daily FX rate refresh job completed');
            } catch (error) {
                fastify.log.error({ error }, 'Daily FX rate refresh job failed');
            }
        },
    };
}
