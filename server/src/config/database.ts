import mysql from 'mysql2/promise';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

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

  const config: DatabaseConfig = {
    host: process.env.MYSQL_HOST!,
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
  };

  const pool = mysql.createPool(config);

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
