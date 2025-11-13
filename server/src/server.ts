import 'dotenv/config';
import Fastify from 'fastify';
import { databasePlugin } from './config/database.js';
import { authPlugin } from './middleware/auth.js';
import { errorHandlerPlugin } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';
import { userRoutes } from './routes/user.js';
import { vinRoutes } from './routes/vin.js';

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
await fastify.register(databasePlugin);
await fastify.register(authPlugin);
await fastify.register(errorHandlerPlugin);

// Register routes
await fastify.register(healthRoutes);
await fastify.register(userRoutes);
await fastify.register(vinRoutes);

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
