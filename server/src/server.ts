import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyCookie from '@fastify/cookie';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import cron from 'node-cron';
import { databasePlugin } from './config/database.js';
import { redisPlugin } from './config/redis.js';
import { authPlugin } from './middleware/auth.js';
import { errorHandlerPlugin } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';
import { userRoutes } from './routes/user.js';
import { vinRoutes } from './routes/vin.js';
import { companyRoutes } from './routes/company.js';
import { auctionRoutes } from './routes/auction.js';
import { vehicleRoutes } from './routes/vehicle.js';
import { favoritesRoutes } from './routes/favorites.js';
import { leadRoutes } from './routes/lead.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { citiesRoutes } from './routes/cities.js';
import { portsRoutes } from './routes/ports.js';
import { auctionsRoutes } from './routes/auctions.js';
import { calculatorRoutes } from './routes/calculator.js';
import { vehicleMakesRoutes } from './routes/vehicle-makes.js';
import { vehicleModelsRoutes } from './routes/vehicle-models.js';
import { AuctionApiService } from './services/AuctionApiService.js';
import { FxRateService } from './services/FxRateService.js';
import { CitiesService } from './services/CitiesService.js';
import { PortsService } from './services/PortsService.js';
import { AuctionsService } from './services/AuctionsService.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  bodyLimit: 5 * 1024 * 1024, // 5 MiB
  // Generate unique request IDs for tracing
  genReqId: () => uuidv4(),
}).withTypeProvider<ZodTypeProvider>();

// ---------------------------------------------------------------------------
// Request ID tracking - add request ID to all responses for debugging
// ---------------------------------------------------------------------------
fastify.addHook('onRequest', async (request, reply) => {
  // Attach request ID to reply headers for client-side correlation
  reply.header('X-Request-Id', request.id);
  // Track request start time for performance monitoring
  (request as any).startTime = Date.now();
});

// Log slow requests (> 1 second) for performance monitoring
const SLOW_REQUEST_THRESHOLD_MS = 1000;
fastify.addHook('onResponse', async (request, reply) => {
  const startTime = (request as any).startTime;
  if (startTime) {
    const duration = Date.now() - startTime;
    if (duration > SLOW_REQUEST_THRESHOLD_MS) {
      fastify.log.warn({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
      }, 'Slow request detected');
    }
  }
});

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

// ---------------------------------------------------------------------------
// Register plugins
// ---------------------------------------------------------------------------

// Response compression for better performance
await fastify.register(fastifyCompress, {
  global: true,
  encodings: ['gzip', 'deflate'],
});

// OpenAPI/Swagger documentation - only in development
if (!isProd) {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Project-X API',
        description: 'API documentation for Project-X server',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3000}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Users', description: 'User authentication and profile management' },
        { name: 'Companies', description: 'Company management and search' },
        { name: 'Vehicles', description: 'Vehicle catalog and VIN decoding' },
        { name: 'Leads', description: 'Lead management for quotes' },
        { name: 'Favorites', description: 'User favorites management' },
        { name: 'Dashboard', description: 'Dashboard statistics' },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}

// Allow static assets (e.g., company logos) to be embedded from other origins
// such as the SPA dev server (localhost:5173) by relaxing the
// Cross-Origin-Resource-Policy header. Without this, browsers may block
// images with ERR_BLOCKED_BY_RESPONSE.NotSameOrigin even on 200 responses.
await fastify.register(helmet, {
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
});

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
  // Explicitly allow all HTTP methods we use from the SPA, including DELETE and PUT
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await fastify.register(fastifyCookie);
await fastify.register(fastifySensible);

await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MiB max per file
    files: 1,
  },
});

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/uploads/',
});

await fastify.register(rateLimit, {
  max: globalRateLimitMax,
  timeWindow: globalRateLimitWindow,
  allowList: [],
});
await fastify.register(databasePlugin);
await fastify.register(redisPlugin);
await fastify.register(authPlugin);
await fastify.register(errorHandlerPlugin);

// Register routes
await fastify.register(healthRoutes);
await fastify.register(userRoutes);
await fastify.register(vinRoutes);
await fastify.register(companyRoutes);
await fastify.register(auctionRoutes);
await fastify.register(vehicleRoutes);
await fastify.register(favoritesRoutes);
await fastify.register(leadRoutes);
await fastify.register(dashboardRoutes);
await fastify.register(citiesRoutes);
await fastify.register(portsRoutes);
await fastify.register(auctionsRoutes);
await fastify.register(calculatorRoutes);
await fastify.register(vehicleMakesRoutes);
await fastify.register(vehicleModelsRoutes);

// ---------------------------------------------------------------------------
// Background jobs
// ---------------------------------------------------------------------------

const auctionApiService = new AuctionApiService(fastify);
const fxRateService = new FxRateService(fastify);
const citiesService = new CitiesService(fastify);
const portsService = new PortsService(fastify);
const auctionsService = new AuctionsService(fastify);

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

// Sync cities from external API every 24 hours
cron.schedule('0 0 * * *', async () => {
  try {
    fastify.log.info('Running daily cities sync job');
    await citiesService.syncCities();
    fastify.log.info('Daily cities sync job completed');
  } catch (error) {
    fastify.log.error({ error }, 'Daily cities sync job failed');
  }
});

// Sync ports from external API every 10 days
// Runs at 00:00 on day-of-month 1, 11, and 21
cron.schedule('0 0 1,11,21 * *', async () => {
  try {
    fastify.log.info('Running ports sync job (every 10 days)');
    await portsService.syncPorts();
    fastify.log.info('Ports sync job completed');
  } catch (error) {
    fastify.log.error({ error }, 'Ports sync job failed');
  }
});

// Sync auctions from external API every 10 days
// Runs at 00:00 on day-of-month 1, 11, and 21
cron.schedule('0 0 1,11,21 * *', async () => {
  try {
    fastify.log.info('Running auctions sync job (every 10 days)');
    await auctionsService.syncAuctions();
    fastify.log.info('Auctions sync job completed');
  } catch (error) {
    fastify.log.error({ error }, 'Auctions sync job failed');
  }
});

// Note: FX rate is fetched in start() before server listens.
// This ensures the rate is available before accepting requests.
// Cities, ports, and auctions are also synced on startup (see start() function).

// ---------------------------------------------------------------------------
// Graceful shutdown handlers
// ---------------------------------------------------------------------------
const gracefulShutdown = async (signal: string) => {
  fastify.log.info({ signal }, 'Received shutdown signal, closing server gracefully...');

  try {
    // Close Fastify server (stops accepting new connections)
    await fastify.close();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    fastify.log.error({ err }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '127.0.0.1';

    // Ensure there is a USD->GEL rate for today before starting the
    // server. If a rate already exists for the current UTC date, this
    // is a no-op and does not call the external API.
    await fxRateService.ensureTodayUsdGelRate();

    // Sync cities on server startup
    await citiesService.syncCities();

    // Sync ports on server startup
    await portsService.syncPorts();

    // Sync auctions on server startup
    await auctionsService.syncAuctions();

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
    fastify.log.info(`API documentation available at http://${host}:${port}/docs`);

    // Signal PM2 that the app is ready (for cluster mode with wait_ready: true)
    if (process.send) {
      process.send('ready');
      fastify.log.info('Sent ready signal to PM2');
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
