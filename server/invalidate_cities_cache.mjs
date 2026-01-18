/**
 * Invalidate Cities Cache
 * 
 * This script connects to Redis and increments the cities cache version,
 * forcing the API to fetch fresh data from the database.
 */

import Redis from 'ioredis';
import 'dotenv/config';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function invalidateCitiesCache() {
    const redis = new Redis(REDIS_URL);

    try {
        console.log('🔄 Connecting to Redis...');

        // Increment the version key for cities
        const newVersion = await redis.incr('v:cities');

        console.log('✅ Cities cache invalidated successfully!');
        console.log(`📊 New cache version: ${newVersion}`);
        console.log('\n🎯 Next request to /api/v1/cities will fetch fresh data from the database.');

    } catch (error) {
        console.error('❌ Failed to invalidate cache:', error.message);
        process.exit(1);
    } finally {
        await redis.quit();
    }
}

invalidateCitiesCache();
