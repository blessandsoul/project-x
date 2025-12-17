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
import { authCookiePlugin } from './middleware/authCookie.js';
import { csrfPlugin } from './middleware/csrf.js';
import { requireAdminPlugin } from './middleware/requireAdmin.js';
import { errorHandlerPlugin } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';
import { userRoutes } from './routes/user.js';
import { vinRoutes } from './routes/vin.js';
import { companyRoutes } from './routes/company.js';
import { auctionRoutes } from './routes/auction.js';
import { vehicleRoutes } from './routes/vehicle.js';
import { favoritesRoutes } from './routes/favorites.js';
import { citiesRoutes } from './routes/cities.js';
import { portsRoutes } from './routes/ports.js';
import { auctionsRoutes } from './routes/auctions.js';
import { calculatorRoutes } from './routes/calculator.js';
import { vehicleMakesRoutes } from './routes/vehicle-makes.js';
import { vehicleModelsRoutes } from './routes/vehicle-models.js';
import { authRoutes } from './routes/auth.js';
import { accountRoutes } from './routes/account.js';
import { inquiryRoutes } from './routes/inquiry.js';
import { companyInquiryRoutes } from './routes/companyInquiry.js';
import { AuctionApiService } from './services/AuctionApiService.js';
import { FxRateService } from './services/FxRateService.js';
import { CitiesService } from './services/CitiesService.js';
import { PortsService } from './services/PortsService.js';
import { AuctionsService } from './services/AuctionsService.js';
import { initializeSocketIO, cleanupSocketIO } from './realtime/index.js';
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
const trustProxy = process.env.TRUST_PROXY === 'true' || isProd;

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
  // Trust proxy headers when behind Nginx/Cloudflare (required for correct IP detection)
  trustProxy,
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

// ---------------------------------------------------------------------------
// SECURITY: SQL Injection Prevention - Reject malicious input patterns
// ---------------------------------------------------------------------------
// This hook runs BEFORE schema validation to catch SQL injection attempts
// that might bypass type coercion (e.g., "10 AND 1=1 --" coerced to 10)
//
// Strategy:
// 1. For parameters that should be numeric (id, limit, offset, etc.),
//    reject any value that contains non-numeric characters after the number
// 2. For all parameters, reject obvious SQL injection patterns
// ---------------------------------------------------------------------------

// Parameters that should be strictly numeric (integers)
const NUMERIC_PARAMS = new Set([
  'id', 'companyId', 'vehicleId', 'reviewId',
  'company_id', 'vehicle_id', 'user_id',
  'limit', 'offset', 'page',
  'year', 'year_from', 'year_to',
  'odometer_from', 'odometer_to',
  'mileage_from', 'mileage_to',
]);

// Parameters that should be strictly numeric (floats allowed)
const NUMERIC_FLOAT_PARAMS = new Set([
  'min_rating', 'max_rating', 'minRating', 'maxRating',
  'min_base_price', 'max_base_price',
  'max_total_fee',
  'broker_fee', 'base_price', 'price_per_mile', 'customs_fee', 'service_fee',
  'price_from', 'price_to',
]);

// Parameters that should only contain specific allowed values (enums)
const ENUM_PARAMS: Record<string, Set<string>> = {
  order_by: new Set(['rating', 'cheapest', 'name', 'newest']),
  order_direction: new Set(['asc', 'desc']),
  sort: new Set(['price_asc', 'price_desc', 'year_desc', 'year_asc', 'mileage_asc', 'mileage_desc', 'sold_date_desc', 'sold_date_asc', 'best_value']),
  role: new Set(['user', 'dealer', 'company', 'admin']),
  source: new Set(['copart', 'iaai']),
};

// Parameters that should be boolean (true/false only)
const BOOLEAN_PARAMS = new Set([
  'is_vip', 'onboarding_free', 'is_blocked', 'buy_now',
]);

// String parameters that should be validated for SQL injection
// These are comma-separated enum values or free-text search fields
const STRING_PARAMS_TO_CHECK = new Set([
  'search', 'city', 'country', 'name', 'location',
  'make', 'model',
  'title_type', 'transmission', 'fuel', 'drive', 'cylinders', 'category',
  'email', 'username',
]);

// SQL injection patterns for string parameters
// These are more targeted to avoid false positives on legitimate data
const SQL_INJECTION_PATTERNS = [
  /'\s*(OR|AND)\s*'?\d*\s*=\s*'?\d*/i,  // ' OR '1'='1, ' AND 1=1
  /"\s*(OR|AND)\s*"?\d*\s*=\s*"?\d*/i,  // " OR "1"="1
  /\d+\s+(AND|OR)\s+\d+\s*=\s*\d+/i,    // 10 AND 1=1
  /\s+(AND|OR)\s+\d+\s*=\s*\d+/i,       // value AND 1=1, value OR 1=1
  /--\s*$/,                              // SQL comment at end
  /--\s+$/,                              // SQL comment with space at end
  /;\s*(DROP|DELETE|UPDATE|INSERT|SELECT|TRUNCATE|ALTER|CREATE|EXEC)/i, // Chained SQL
  /\bUNION\s+(ALL\s+)?SELECT\b/i,       // UNION SELECT
  /\bSLEEP\s*\(/i,                       // SLEEP()
  /\bBENCHMARK\s*\(/i,                   // BENCHMARK()
  /\bWAITFOR\s+DELAY\b/i,               // WAITFOR DELAY
  /\bINTO\s+(OUT|DUMP)FILE\b/i,         // INTO OUTFILE/DUMPFILE
  /\bLOAD_FILE\s*\(/i,                  // LOAD_FILE()
];

/**
 * Check if a value that should be numeric contains SQL injection
 * Rejects: "10 AND 1=1", "10--", "10;DROP", etc.
 * Accepts: "10", "-5", "3.14"
 */
function isInvalidNumericValue(value: string, allowFloat: boolean): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return true; // Empty is invalid for numeric
  
  // Check if it's a valid number
  if (allowFloat) {
    // Allow integers and floats: 10, -5, 3.14, -2.5
    return !/^-?\d+(\.\d+)?$/.test(trimmed);
  } else {
    // Allow only integers: 10, -5
    return !/^-?\d+$/.test(trimmed);
  }
}

/**
 * Check if a string value contains SQL injection patterns
 */
function containsSqlInjection(value: string): boolean {
  if (typeof value !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Validate UUID (v1-v5) string format.
 */
function isValidUuid(value: string): boolean {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

fastify.addHook('preValidation', async (request, reply) => {
  // Check query parameters
  const query = request.query as Record<string, unknown>;
  if (query && typeof query === 'object') {
    for (const [key, value] of Object.entries(query)) {
      if (typeof value !== 'string') continue;
      
      // Check numeric parameters for non-numeric content
      if (NUMERIC_PARAMS.has(key) && isInvalidNumericValue(value, false)) {
        fastify.log.warn({
          method: request.method,
          url: request.url,
          param: key,
          value: value.slice(0, 100),
        }, 'Invalid numeric value in query parameter');
        
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: `Invalid value for parameter: ${key}. Expected integer.`,
        });
      }
      
      // Check float parameters for non-numeric content
      if (NUMERIC_FLOAT_PARAMS.has(key) && isInvalidNumericValue(value, true)) {
        fastify.log.warn({
          method: request.method,
          url: request.url,
          param: key,
          value: value.slice(0, 100),
        }, 'Invalid numeric value in query parameter');
        
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: `Invalid value for parameter: ${key}. Expected number.`,
        });
      }
      
      // Check enum parameters for valid values
      if (ENUM_PARAMS[key]) {
        const allowedValues = ENUM_PARAMS[key];
        if (!allowedValues.has(value.toLowerCase())) {
          fastify.log.warn({
            method: request.method,
            url: request.url,
            param: key,
            value: value.slice(0, 100),
          }, 'Invalid enum value in query parameter');
          
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: `Invalid value for parameter: ${key}. Allowed values: ${Array.from(allowedValues).join(', ')}`,
          });
        }
      }
      
      // Check boolean parameters for valid values
      if (BOOLEAN_PARAMS.has(key)) {
        const lower = value.toLowerCase();
        if (lower !== 'true' && lower !== 'false') {
          fastify.log.warn({
            method: request.method,
            url: request.url,
            param: key,
            value: value.slice(0, 100),
          }, 'Invalid boolean value in query parameter');
          
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: `Invalid value for parameter: ${key}. Expected true or false.`,
          });
        }
      }
      
      // Check string parameters for SQL injection patterns
      if (STRING_PARAMS_TO_CHECK.has(key) && containsSqlInjection(value)) {
        fastify.log.warn({
          method: request.method,
          url: request.url,
          param: key,
          value: value.slice(0, 100),
        }, 'SQL injection attempt detected in query parameter');
        
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: `Invalid value for parameter: ${key}`,
        });
      }
      
      // For any other parameter, check for obvious SQL injection patterns
      if (containsSqlInjection(value)) {
        fastify.log.warn({
          method: request.method,
          url: request.url,
          param: key,
          value: value.slice(0, 100),
        }, 'SQL injection attempt detected in query parameter');
        
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: `Invalid value for parameter: ${key}`,
        });
      }
    }
  }

  // Check path parameters (these should always be numeric IDs)
  const params = request.params as Record<string, unknown>;
  if (params && typeof params === 'object') {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'string') continue;
      
      // Skip catch-all route parameters (e.g., '*' for 404 handlers)
      if (key === '*') continue;

      // Allow UUID-based params for specific routes
      if (key === 'sessionId') {
        if (!isValidUuid(value)) {
          fastify.log.warn({
            method: request.method,
            url: request.url,
            param: key,
            value: value.slice(0, 100),
          }, 'Invalid UUID value in path parameter');

          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: `Invalid value for parameter: ${key}. Expected UUID.`,
          });
        }

        continue;
      }
      
      // All path params in this app should be numeric IDs
      if (isInvalidNumericValue(value, false)) {
        fastify.log.warn({
          method: request.method,
          url: request.url,
          param: key,
          value: value.slice(0, 100),
        }, 'Invalid numeric value in path parameter');
        
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: `Invalid value for parameter: ${key}. Expected integer.`,
        });
      }
    }
  }
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

// SECURITY: Warn if production is running without explicit CORS origins
if (isProd && allowedOrigins.length === 0) {
  console.warn(
    '\n⚠️  SECURITY WARNING: CORS_ALLOWED_ORIGINS is not configured in production!\n' +
    '   Browser requests with Origin headers will be DENIED.\n' +
    '   Set CORS_ALLOWED_ORIGINS=https://yourdomain.com to allow your frontend.\n'
  );
}

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
  // Configure CSP to allow WebSocket connections for Socket.IO
  contentSecurityPolicy: isProd
    ? {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", 'wss:', 'ws:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      }
    : false, // Disable CSP in development for easier debugging
});

await fastify.register(cors, {
  // Allow only explicitly configured origins in production; allow all in development
  origin: (origin, cb) => {
    // Allow non-browser clients (no Origin header) - Postman/curl always work
    if (!origin) {
      cb(null, true);
      return;
    }

    // If explicit origins are configured, check against allowlist
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error('Origin not allowed by CORS'), false);
      return;
    }

    // No explicit origins configured
    if (isProd) {
      // PRODUCTION: Deny browser requests if CORS_ALLOWED_ORIGINS not set
      // This prevents accidental exposure if deployed without proper config
      fastify.log.warn({
        event: 'cors_denied_no_config',
        origin,
      }, 'CORS denied: CORS_ALLOWED_ORIGINS not configured in production');
      cb(new Error('Origin not allowed by CORS'), false);
      return;
    }

    // DEVELOPMENT: Allow any origin for developer convenience
    cb(null, true);
  },
  credentials: allowCorsCredentials,
  // Explicitly allow all HTTP methods we use from the SPA, including DELETE and PUT
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await fastify.register(fastifyCookie);
await fastify.register(fastifySensible);

await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MiB max per file (avatar limit)
    files: 1,
  },
});

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/uploads/',
  // Enable CORS and CORP headers for static assets (images, etc.)
  // This is needed because @fastify/static bypasses Helmet and CORS plugins
  setHeaders: (res, _path) => {
    // CRITICAL: Cross-Origin-Resource-Policy must be set for static assets
    // Without this, browsers block cross-origin image loads even with CORS headers
    // Helmet sets this globally but @fastify/static bypasses it
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // CORS: Allow cross-origin requests from any origin for public images
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Remove CSP for static assets - images don't need CSP protection
    // and Helmet's default CSP (img-src 'self') blocks cross-origin embedding
    (res as any).removeHeader('Content-Security-Policy');
    
    // Cache static assets for 1 day in production, no cache in dev
    if (isProd) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
});

await fastify.register(rateLimit, {
  max: globalRateLimitMax,
  timeWindow: globalRateLimitWindow,
  allowList: [],
});
await fastify.register(databasePlugin);
await fastify.register(redisPlugin);
await fastify.register(authPlugin);
await fastify.register(authCookiePlugin);
await fastify.register(csrfPlugin);
await fastify.register(requireAdminPlugin);
await fastify.register(errorHandlerPlugin);

// Register routes
await fastify.register(healthRoutes);
await fastify.register(authRoutes); // Secure cookie-based auth routes
await fastify.register(accountRoutes); // Account management (cookie auth + CSRF)
await fastify.register(userRoutes);
await fastify.register(vinRoutes);
await fastify.register(companyRoutes);
await fastify.register(auctionRoutes);
await fastify.register(vehicleRoutes);
await fastify.register(favoritesRoutes);
await fastify.register(citiesRoutes);
await fastify.register(portsRoutes);
await fastify.register(auctionsRoutes);
await fastify.register(calculatorRoutes);
await fastify.register(vehicleMakesRoutes);
await fastify.register(vehicleModelsRoutes);
await fastify.register(inquiryRoutes);
await fastify.register(companyInquiryRoutes);

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
    // Cleanup Socket.IO first
    await cleanupSocketIO();
    fastify.log.info('Socket.IO closed');

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

    // Start HTTP server first
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
    fastify.log.info(`API documentation available at http://${host}:${port}/docs`);

    // Initialize Socket.IO after server is listening
    await initializeSocketIO(fastify, fastify.server);
    fastify.log.info('Socket.IO real-time server ready');

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
