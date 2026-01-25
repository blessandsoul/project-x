/**
 * Fastify Server Application
 *
 * Main server file that initializes and configures the Fastify application.
 * This file serves as a clean orchestrator, delegating all functionality
 * to specialized modules.
 *
 * Modules:
 * - config/security.ts - Security configuration
 * - hooks/index.ts - Request lifecycle hooks
 * - security/sqlInjectionGuard.ts - SQL injection prevention
 * - plugins/index.ts - Plugin registration
 * - routes/index.ts - Route registration
 * - jobs/index.ts - Cron job registration
 * - shutdown/index.ts - Graceful shutdown handlers
 * - startup/index.ts - Server startup logic
 *
 * Environment Variables:
 * - PORT: Server port (default: 3000)
 * - HOST: Server host (default: 127.0.0.1)
 * - JWT_SECRET: Required for authentication
 * - DATABASE_URL: Required for database connection
 * - NODE_ENV: 'production' or 'development'
 * - LOG_LEVEL: Logging level (default: 'info' in prod, 'debug' in dev)
 */
// 

import 'dotenv/config';
import Fastify from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

// Configuration
import { isProd, logLevel, trustProxy, warnIfInsecureCorsConfig } from './config/security.js';

// Core functionality
import { registerHooks } from './hooks/index.js';
import { registerSqlInjectionGuard } from './security/sqlInjectionGuard.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { registerCronJobs } from './jobs/index.js';
import { registerShutdownHandlers } from './shutdown/index.js';
import { startServer } from './startup/index.js';

// ---------------------------------------------------------------------------
// Create Fastify instance
// ---------------------------------------------------------------------------
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
// Register hooks (request ID tracking, slow request logging)
// ---------------------------------------------------------------------------
registerHooks(fastify);

// ---------------------------------------------------------------------------
// Register security guards (SQL injection prevention)
// ---------------------------------------------------------------------------
registerSqlInjectionGuard(fastify);

// Check for insecure CORS configuration in production
warnIfInsecureCorsConfig();

// ---------------------------------------------------------------------------
// Register plugins (compression, security, database, auth, etc.)
// ---------------------------------------------------------------------------
await registerPlugins(fastify);

// ---------------------------------------------------------------------------
// Register routes
// ---------------------------------------------------------------------------
await fastify.register(registerRoutes, { prefix: '/api/v1' });

// ---------------------------------------------------------------------------
// SPA Fallback - Serve index.html for all non-API routes
// ---------------------------------------------------------------------------
// Import and register SPA fallback (MUST be after API routes)
const { registerSpaFallback } = await import('./routes/index.js');
await registerSpaFallback(fastify);

// ---------------------------------------------------------------------------
// Register cron jobs (FX rates, cities sync, etc.)
// ---------------------------------------------------------------------------
registerCronJobs(fastify);

// ---------------------------------------------------------------------------
// Register shutdown handlers
// ---------------------------------------------------------------------------
registerShutdownHandlers(fastify);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
await startServer(fastify);

// Export fastify instance for testing
export { fastify };
