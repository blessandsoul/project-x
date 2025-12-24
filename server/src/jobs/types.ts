/**
 * Cron Job Types
 *
 * Shared type definitions for cron jobs to avoid circular imports.
 */

/**
 * Cron job definition interface
 */
export interface CronJob {
    /** Human-readable name for logging */
    name: string;
    /** Cron schedule expression */
    schedule: string;
    /** Async handler function */
    handler: () => Promise<void>;
}
