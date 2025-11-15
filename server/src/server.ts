import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cron from 'node-cron';
import { databasePlugin } from './config/database.js';
import { auctionApiPlugin } from './config/auctionApi.js';
import { authPlugin } from './middleware/auth.js';
import { errorHandlerPlugin } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';
import { userRoutes } from './routes/user.js';
import { vinRoutes } from './routes/vin.js';
import { companyRoutes } from './routes/company.js';
import { auctionRoutes } from './routes/auction.js';
import { vehicleRoutes } from './routes/vehicle.js';
import { AuctionApiService } from './services/AuctionApiService.js';

/**
 * Fastify Server Application
 *
 * Main server file that initializes and configures the Fastify application.
 * Registers plugins for database connectivity, authentication, and API routes.
 * Sets up health check endpoints, user management APIs, and VIN decoding services.
 *
 * Environment Variables:
 * - PORT: Server port (default: 3000)
 * - HOST: Server host (default: 127.0.0.1)
 * - JWT_SECRET: Required for authentication
 * - DATABASE_URL: Required for database connection
 */
const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true,
});
await fastify.register(databasePlugin);
await fastify.register(authPlugin);
await fastify.register(errorHandlerPlugin);
// to auth in auction-api.app
// await fastify.register(auctionApiPlugin);

// Register routes
await fastify.register(healthRoutes);
await fastify.register(userRoutes);
await fastify.register(vinRoutes);
await fastify.register(companyRoutes);
await fastify.register(auctionRoutes);
await fastify.register(vehicleRoutes);

// fastify.get('/heavy', async (request, reply) => {
//   // Simulate some CPU work
//   let total = 0;
//   const iterations = 5_000_000;
//   for (let i = 0; i < iterations; i++) {
//     total += i % 10;
//   }

//   // Simulate an async operation (e.g. external API / DB call)
//   await new Promise((resolve) => setTimeout(resolve, 50));

//   reply.send({
//     total,
//     iterations,
//     timestamp: new Date().toISOString(),
//   });
// });

// ---------------------------------------------------------------------------
// Background jobs
// ---------------------------------------------------------------------------

// Use pre-obtained API_TOKEN from env and refresh active lots every hour.
const auctionApiService = new AuctionApiService(fastify);

// cron.schedule('0 * * * *', async () => {
//   const now = new Date();
//   const time = auctionApiService.buildHourStartTimeString(now);

//   try {
//     fastify.log.info({ time }, 'Running hourly auction active lots refresh job');
//     await auctionApiService.getActiveLotsHourly(time);
//     fastify.log.info({ time }, 'Auction active lots refresh job completed');
//   } catch (error) {
//     fastify.log.error({ error, time }, 'Auction active lots refresh job failed');
//   }
// });

// Run an initial fetch on startup so the cache is warm before the first cron tick.
// (async () => {
//   const now = new Date();
//   // const time = auctionApiService.buildHourStartTimeString(now);
//   const time = '13.11.2025 20:00';

//   try {
//     fastify.log.info({ time }, 'Running initial auction active lots fetch on startup');
//     await auctionApiService.getActiveLotsHourly(time);
//     fastify.log.info({ time }, 'Initial auction active lots fetch completed');
//   } catch (error) {
//     fastify.log.error({ error, time }, 'Initial auction active lots fetch failed');
//   }
// })();

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '127.0.0.1';

    await fastify.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
