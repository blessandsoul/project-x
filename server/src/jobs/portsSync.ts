/**
 * Ports Sync Job
 *
 * Synchronizes ports data from external API.
 * Updates the ports database table with fresh data from the auction API.
 *
 * Schedule: Every 10 days (day-of-month 1, 11, and 21 at 00:00)
 * Service: PortsService
 */

import { FastifyInstance } from 'fastify';
import { PortsService } from '../services/PortsService.js';
import { CronJob } from './types.js';

/**
 * Create the ports sync job
 * @param fastify - Fastify instance for logging and database access
 */
export function createPortsSyncJob(fastify: FastifyInstance): CronJob {
    const portsService = new PortsService(fastify);

    return {
        name: 'Ports Sync',
        schedule: '0 0 1,11,21 * *', // Every 10 days at midnight
        handler: async () => {
            try {
                fastify.log.info('Running ports sync job (every 10 days)');
                await portsService.syncPorts();
                fastify.log.info('Ports sync job completed');
            } catch (error) {
                fastify.log.error({ error }, 'Ports sync job failed');
            }
        },
    };
}
