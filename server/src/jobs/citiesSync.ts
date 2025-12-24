/**
 * Cities Sync Job
 *
 * Synchronizes cities data from external API.
 * Updates the cities database table with fresh data from the auction API.
 *
 * Schedule: Daily at 00:00 AM (midnight)
 * Service: CitiesService
 */

import { FastifyInstance } from 'fastify';
import { CitiesService } from '../services/CitiesService.js';
import { CronJob } from './types.js';

/**
 * Create the cities sync job
 * @param fastify - Fastify instance for logging and database access
 */
export function createCitiesSyncJob(fastify: FastifyInstance): CronJob {
    const citiesService = new CitiesService(fastify);

    return {
        name: 'Cities Sync',
        schedule: '0 0 * * *', // Daily at midnight
        handler: async () => {
            try {
                fastify.log.info('Running daily cities sync job');
                await citiesService.syncCities();
                fastify.log.info('Daily cities sync job completed');
            } catch (error) {
                fastify.log.error({ error }, 'Daily cities sync job failed');
            }
        },
    };
}
