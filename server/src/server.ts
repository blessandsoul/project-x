import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyCookie from '@fastify/cookie';
import fastifySensible from '@fastify/sensible';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
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
import { favoritesRoutes } from './routes/favorites.js';
import { catalogRoutes } from './routes/catalog.js';
import { AuctionApiService } from './services/AuctionApiService.js';
import { FxRateService } from './services/FxRateService.js';
import { CatalogModel } from './models/CatalogModel.js';

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
const isProd = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

const fastify = Fastify({
  logger: isProd
    ? {
        level: logLevel,
      }
    : {
        level: logLevel,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            singleLine: false,
          },
        },
      },
  // Protect against excessively large request bodies (basic DoS mitigation)
  bodyLimit: 1024 * 1024, // 1 MiB
}).withTypeProvider<ZodTypeProvider>();

// ---------------------------------------------------------------------------
// Security-related configuration derived from environment variables
// ---------------------------------------------------------------------------

const rawCorsOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
const allowedOrigins = rawCorsOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const allowCorsCredentials = process.env.CORS_ALLOW_CREDENTIALS === 'true';

const globalRateLimitMax = process.env.RATE_LIMIT_MAX
  ? parseInt(process.env.RATE_LIMIT_MAX, 10)
  : 100;

const globalRateLimitWindow = process.env.RATE_LIMIT_TIME_WINDOW || '1 minute';

// Register plugins
await fastify.register(helmet);

await fastify.register(cors, {
  // Allow only explicitly configured origins in production; allow all in development
  origin: (origin, cb) => {
    // Allow non-browser clients (no Origin header)
    if (!origin) {
      cb(null, true);
      return;
    }

    if (allowedOrigins.length === 0) {
      // Fallback: allow any origin only when explicit origins are not configured
      cb(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }

    cb(new Error('Origin not allowed by CORS'), false);
  },
  credentials: allowCorsCredentials,
});

await fastify.register(fastifyCookie);
await fastify.register(fastifySensible);

await fastify.register(rateLimit, {
  max: globalRateLimitMax,
  timeWindow: globalRateLimitWindow,
  allowList: [],
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
await fastify.register(favoritesRoutes);
await fastify.register(catalogRoutes);

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
const fxRateService = new FxRateService(fastify);
const catalogModel = new CatalogModel(fastify);

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

// Refresh USD->GEL FX rate once per day. The FxRateService checks the
// exchange_rates table first and only calls the external API if there is
// no row for the current UTC date, so this will not spam the free plan.
cron.schedule('5 0 * * *', async () => {
  try {
    fastify.log.info('Running daily FX rate refresh job');
    await fxRateService.ensureTodayUsdGelRate();
    fastify.log.info('Daily FX rate refresh job completed');
  } catch (error) {
    fastify.log.error({ error }, 'Daily FX rate refresh job failed');
  }
});

// Sync vehicle makes/models catalog from VPIC once per month. This keeps the
// local vehicle_makes and vehicle_models tables reasonably fresh without
// hitting the external API on every request.
cron.schedule('0 3 1 * *', async () => {
  try {
    fastify.log.info('Running monthly catalog sync for vehicle makes/models');
    await catalogModel.syncVehicleType('car');
    await catalogModel.syncVehicleType('motorcycle');
    fastify.log.info('Monthly catalog sync completed');
  } catch (error) {
    fastify.log.error({ error }, 'Monthly catalog sync failed');
  }
});

// Run an initial fetch on startup so the cache is warm before the first cron tick.
(async () => {
  try {
    fastify.log.info('Running initial FX rate fetch on startup');
    await fxRateService.ensureTodayUsdGelRate();
    fastify.log.info('Initial FX rate fetch completed');
  } catch (error) {
    fastify.log.error({ error }, 'Initial FX rate fetch failed');
  }
})();
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

    // Ensure there is a USD->GEL rate for today before starting the
    // server. If a rate already exists for the current UTC date, this
    // is a no-op and does not call the external API.
    await fxRateService.ensureTodayUsdGelRate();

    await fastify.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
