import type { FastifyInstance } from 'fastify';
import type { PoolConnection } from 'mysql2/promise';

export async function withTransaction<T>(
  fastify: FastifyInstance,
  fn: (conn: PoolConnection) => Promise<T>,
): Promise<T> {
  const pool = fastify.mysql;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback errors
    }
    throw err;
  } finally {
    conn.release();
  }
}
