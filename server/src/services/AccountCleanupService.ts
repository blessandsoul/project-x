/**
 * Account Cleanup Service
 *
 * Handles permanent deletion (anonymization) of deactivated accounts
 * after the 30-day grace period has expired.
 *
 * This service is called by a daily cron job to:
 * 1. Find accounts where deletion_scheduled_at has passed
 * 2. Delete user avatar files
 * 3. Anonymize personal data (email, username, password)
 * 4. Mark account as deletion_completed
 */

import { FastifyInstance } from 'fastify';
import { UserModel } from '../models/UserModel.js';
import { deleteUserAvatar } from './ImageUploadService.js';

export interface CleanupResult {
    processed: number;
    errors: number;
    details: Array<{
        userId: number;
        success: boolean;
        error?: string;
    }>;
}

export class AccountCleanupService {
    private userModel: UserModel;
    private fastify: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
        this.userModel = new UserModel(fastify);
    }

    /**
     * Process all accounts pending permanent deletion
     *
     * This method finds all accounts where:
     * - deletion_scheduled_at < NOW() (grace period expired)
     * - deletion_completed_at IS NULL (not yet processed)
     *
     * For each account:
     * 1. Delete avatar files from disk
     * 2. Anonymize user data in database
     * 3. Log the cleanup operation
     */
    async processExpiredAccounts(): Promise<CleanupResult> {
        const pendingUsers = await this.userModel.findPendingDeletion();
        const result: CleanupResult = {
            processed: 0,
            errors: 0,
            details: [],
        };

        if (pendingUsers.length === 0) {
            this.fastify.log.info('No accounts pending permanent deletion');
            return result;
        }

        this.fastify.log.info(
            { count: pendingUsers.length },
            'Starting permanent deletion of expired deactivated accounts'
        );

        for (const user of pendingUsers) {
            try {
                // Step 1: Delete avatar files
                try {
                    await deleteUserAvatar(user.username);
                    this.fastify.log.debug({ userId: user.id, username: user.username }, 'Avatar deleted');
                } catch (avatarError) {
                    // Avatar deletion is non-critical - log warning but continue
                    this.fastify.log.warn(
                        { userId: user.id, error: avatarError },
                        'Failed to delete user avatar (may not exist)'
                    );
                }

                // Step 2: Anonymize user data
                await this.userModel.anonymize(user.id);

                this.fastify.log.info(
                    { userId: user.id, originalUsername: user.username },
                    'Account permanently deleted (anonymized)'
                );

                result.processed++;
                result.details.push({ userId: user.id, success: true });
            } catch (error) {
                this.fastify.log.error(
                    { userId: user.id, error },
                    'Failed to cleanup account'
                );

                result.errors++;
                result.details.push({
                    userId: user.id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        this.fastify.log.info(
            { processed: result.processed, errors: result.errors },
            'Account cleanup job completed'
        );

        return result;
    }
}
