import mysql from 'mysql2/promise';
import { FastifyInstance } from 'fastify';

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
   * @param table Table name
   * @param conditions WHERE conditions object
   * @param excludeId Optional ID to exclude from check
   * @returns true if record exists
   */
  protected async recordExists(table: string, conditions: Record<string, any>, excludeId?: number): Promise<boolean> {
    const keys = Object.keys(conditions);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const params = keys.map(key => conditions[key]);

    let query = `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`;
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId.toString());
    }

    const rows = await this.executeQuery(query, params);
    return rows[0].count > 0;
  }
}
