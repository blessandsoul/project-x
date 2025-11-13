import mysql from 'mysql2/promise';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  connectionLimit: number;
}

declare module 'fastify' {
  interface FastifyInstance {
    mysql: mysql.Pool;
  }
}

const databasePlugin = fp(async (fastify: FastifyInstance) => {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'myapp',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
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
