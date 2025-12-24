/**
 * Cron Jobs Registry
 *
 * Central registry for all scheduled background jobs.
 * This module exports a function to register all cron jobs with node-cron.
 *
 * Jobs included:
 * - FX Rate Sync: Daily at 00:05 - refreshes USD->GEL exchange rate
 * - Cities Sync: Daily at 00:00 - syncs cities from external API
 * - Ports Sync: Every 10 days - syncs ports from external API
 * - Auctions Sync: Every 10 days - syncs auctions from external API
 * - Account Cleanup: Daily at 02:00 - anonymizes expired deactivated accounts
 */

import { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { createFxRateSyncJob } from './fxRateSync.js';
import { createCitiesSyncJob } from './citiesSync.js';
import { createPortsSyncJob } from './portsSync.js';
import { createAuctionsSyncJob } from './auctionsSync.js';
import { createAccountCleanupJob } from './accountCleanup.js';
import { CronJob } from './types.js';

// Re-export CronJob type for convenience
export type { CronJob } from './types.js';

/**
 * Register all cron jobs with node-cron
 *
 * This function creates all job instances and schedules them.
 * Should be called once after the server is initialized.
 *
 * @param fastify - Fastify instance for logging and service access
 */
export function registerCronJobs(fastify: FastifyInstance): void {
    // Create all job instances
    const jobs: CronJob[] = [
        createFxRateSyncJob(fastify),
        createCitiesSyncJob(fastify),
        createPortsSyncJob(fastify),
        createAuctionsSyncJob(fastify),
        createAccountCleanupJob(fastify),
    ];

    // Register each job with node-cron
    for (const job of jobs) {
        cron.schedule(job.schedule, job.handler);
        fastify.log.debug({
            jobName: job.name,
            schedule: job.schedule,
        }, 'Registered cron job');
    }

    fastify.log.info(`Registered ${jobs.length} cron jobs`);
}

/**
 * Get job summaries for health checks or admin endpoints
 */
export function getJobSummaries(): Array<{ name: string; schedule: string }> {
    return [
        { name: 'FX Rate Sync', schedule: '5 0 * * * (Daily 00:05)' },
        { name: 'Cities Sync', schedule: '0 0 * * * (Daily 00:00)' },
        { name: 'Ports Sync', schedule: '0 0 1,11,21 * * (Every 10 days)' },
        { name: 'Auctions Sync', schedule: '0 0 1,11,21 * * (Every 10 days)' },
        { name: 'Account Cleanup', schedule: '0 2 * * * (Daily 02:00)' },
    ];
}
