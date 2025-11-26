import mysql from 'mysql2/promise';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    mysql: mysql.Pool;
  }
}

const databasePlugin = fp(async (fastify: FastifyInstance) => {
  // Validate required environment variables
  const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Configure a robust MySQL connection pool. The mysql2/promise import
  // already returns a promise-based pool, so there is no need to call
  // .promise() here.
  const connectionLimit = process.env.MYSQL_CONNECTION_LIMIT
    ? parseInt(process.env.MYSQL_CONNECTION_LIMIT, 10)
    : 20; // Increased default for better concurrency

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST!,
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    connectTimeout: 60000,
    // Prevent stale connections from causing first-request failures
    maxIdle: connectionLimit, // Maximum idle connections (same as connectionLimit)
    idleTimeout: 60000, // Close idle connections after 60 seconds
    // Test connections/keep them alive to avoid stale connection errors
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // Send keepalive packets every 10 seconds
    // Performance optimizations
    namedPlaceholders: false, // Slightly faster than named placeholders
    decimalNumbers: true, // Return decimals as numbers, not strings
  });

  // Test the connection
  try {
    const connection = await pool.getConnection();
    fastify.log.info('Database connected successfully');
    connection.release();
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown database error');
    fastify.log.error({ err: error }, 'Database connection failed');
    throw error;
  }

  fastify.decorate('mysql', pool);

  fastify.addHook('onClose', async () => {
    await pool.end();
    fastify.log.info('Database connection pool closed');
  });
});

export { databasePlugin };
