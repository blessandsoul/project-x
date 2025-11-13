import 'dotenv/config';
import Fastify from 'fastify';
import { databasePlugin } from './config/database.js';
import { healthRoutes } from './routes/health.js';

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(databasePlugin);

// Register routes
await fastify.register(healthRoutes);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
