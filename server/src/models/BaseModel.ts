import mysql from 'mysql2/promise';
import { FastifyInstance } from 'fastify';

/**
 * Whitelist of allowed table names to prevent SQL injection.
 * Add new tables here as they are created.
 */
const ALLOWED_TABLES = new Set([
  'users',
  'companies',
  'company_quotes',
  'company_social_links',
  'company_reviews',
  'vehicles',
  'vehicle_makes',
  'vehicle_models',
  'vehicle_photos',
  'vehicle_lot_bids',
  'favorites',
  'user_favorite_vehicles',
  'user_favorite_companies',
  'user_recent_companies',
  'leads',
  'lead_companies',
  'lead_offers',
  'exchange_rates',
  'idempotency_keys',
  'user_company_activity',
  'yards',
  'auction_branch_distances',
]);

/**
 * Whitelist of allowed column names to prevent SQL injection.
 * Add new columns here as they are created.
 */
const ALLOWED_COLUMNS = new Set([
  'id',
  'email',
  'username',
  'slug',
  'name',
  'company_id',
  'user_id',
  'vehicle_id',
  'vin',
]);

/**
 * Validate that a table name is in the whitelist
 */
function validateTableName(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
}

/**
 * Validate that a column name is in the whitelist
 */
function validateColumnName(column: string): void {
  if (!ALLOWED_COLUMNS.has(column)) {
    throw new Error(`Invalid column name: ${column}`);
  }
}

export abstract class BaseModel {
  protected db: mysql.Pool;

  constructor(fastify: FastifyInstance) {
    this.db = fastify.mysql;
  }

  /**
   * Execute a raw SQL query
   * @param query SQL query string
   * @param params Query parameters
   * @returns Query result
   */
  protected async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const [rows] = await this.db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE query
   * @param query SQL query string
   * @param params Query parameters
   * @returns Result object with affectedRows, insertId, etc.
   */
  protected async executeCommand(query: string, params: any[] = []): Promise<any> {
    try {
      const [result] = await this.db.execute(query, params);
      return result;
    } catch (error) {
      console.error('Database command error:', error);
      throw error;
    }
  }

  /**
   * Check if a record exists
   * @param table Table name (must be in ALLOWED_TABLES whitelist)
   * @param conditions WHERE conditions object (keys must be in ALLOWED_COLUMNS whitelist)
   * @param excludeId Optional ID to exclude from check
   * @returns true if record exists
   */
  protected async recordExists(table: string, conditions: Record<string, any>, excludeId?: number): Promise<boolean> {
    // Validate table name against whitelist
    validateTableName(table);

    const keys = Object.keys(conditions);

    // Validate all column names against whitelist
    for (const key of keys) {
      validateColumnName(key);
    }

    const whereClause = keys.map(key => `\`${key}\` = ?`).join(' AND ');
    const params: any[] = keys.map(key => conditions[key]);

    let query = `SELECT COUNT(*) as count FROM \`${table}\` WHERE ${whereClause}`;
    if (excludeId !== undefined && excludeId !== null) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const rows = await this.executeQuery(query, params);
    return rows[0].count > 0;
  }
}
