import type { FastifyInstance } from 'fastify';
import type { Pool } from 'mysql2/promise';
import crypto from 'crypto';
import { ValidationError } from '../types/errors.js';

interface IdempotencyOptions {
  route: string;
  userId?: number | null;
  key: string;
}

interface StoredRow {
  status_code: number;
  response_body: string;
  request_hash: string;
}

export async function withIdempotency<T>(
  fastify: FastifyInstance,
  opts: IdempotencyOptions,
  requestBody: unknown,
  handler: () => Promise<{ statusCode?: number; body: T } | T>,
): Promise<{ statusCode: number; body: T }> {
  const pool: Pool = fastify.mysql;
  const requestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(requestBody ?? null))
    .digest('hex');

  const [rows] = await pool.execute(
    'SELECT status_code, response_body, request_hash FROM idempotency_keys WHERE key_value = ? AND route = ? AND (user_id <=> ?) LIMIT 1',
    [opts.key, opts.route, opts.userId ?? null],
  );

  const typedRows = (rows || []) as StoredRow[];

  if (typedRows.length > 0) {
    const firstRow = typedRows[0];

    if (!firstRow) {
      // Defensive guard for TypeScript narrowing; in practice this
      // branch should never execute because length > 0.
      throw new ValidationError('Idempotency lookup returned an invalid row');
    }

    if (firstRow.request_hash !== requestHash) {
      throw new ValidationError('Idempotency key already used with different request payload');
    }

    return {
      statusCode: firstRow.status_code,
      body: JSON.parse(firstRow.response_body) as T,
    };
  }

  const result = await handler();
  const statusCode = (result as any)?.statusCode ?? 200;
  const body = (result as any)?.body ?? result;

  await pool.execute(
    'INSERT INTO idempotency_keys (key_value, user_id, route, request_hash, status_code, response_body) VALUES (?, ?, ?, ?, ?, ?)',
    [opts.key, opts.userId ?? null, opts.route, requestHash, statusCode, JSON.stringify(body)],
  );

  return { statusCode, body };
}
