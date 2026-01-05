/**
 * Account Cleanup Job
 *
 * Handles permanent deletion (anonymization) of deactivated accounts
 * after the 30-day grace period has expired.
 *
 * This job:
 * 1. Finds accounts where deletion_scheduled_at has passed
 * 2. Deletes user avatar files
 * 3. Anonymizes personal data (email, username, password)
 * 4. Marks account as deletion_completed
 *
 * Schedule: Daily at 2:00 AM
 * Service: AccountCleanupService
 */

import { FastifyInstance } from 'fastify';
import { AccountCleanupService } from '../services/AccountCleanupService.js';
import { CronJob } from './types.js';

/**
 * Create the account cleanup job
 * @param fastify - Fastify instance for logging and database access
 */
export function createAccountCleanupJob(fastify: FastifyInstance): CronJob {
    const accountCleanupService = new AccountCleanupService(fastify);

    return {
        name: 'Account Cleanup',
        schedule: '0 2 * * *', // Daily at 2:00 AM
        handler: async () => {
            try {
                fastify.log.info('Running deactivated accounts cleanup job');
                const result = await accountCleanupService.processExpiredAccounts();
                fastify.log.info({
                    processed: result.processed,
                    errors: result.errors,
                }, 'Deactivated accounts cleanup job completed');
            } catch (error) {
                fastify.log.error({ error }, 'Deactivated accounts cleanup job failed');
            }
        },
    };
}
