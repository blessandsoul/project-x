import mysql from 'mysql2/promise';
import { FastifyInstance } from 'fastify';
import { User, UserCreate, UserUpdate } from '../types/user.js';
import { BaseModel } from './BaseModel.js';
import { DatabaseError, ValidationError } from '../types/errors.js';

/**
 * User Model
 *
 * Handles all database operations related to user management including
 * CRUD operations, authentication queries, and data validation.
 * Extends BaseModel for common database functionality.
 */
export class UserModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  /**
   * Create a new user record in the database
   *
   * Inserts user data and automatically sets created_at and updated_at timestamps.
   * Returns the complete user object after creation.
   *
   * @param userData - User creation data (email, username, password hash)
   * @returns Complete user object with generated ID and timestamps
   */
  async create(userData: UserCreate): Promise<User> {
    const {
      email,
      username,
      password,
      role = 'user',
      dealer_slug = null,
      company_id = null,
      onboarding_ends_at = null,
    } = userData;

    const result = await this.executeCommand(
      'INSERT INTO users (email, username, role, dealer_slug, company_id, onboarding_ends_at, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        email,
        username,
        role,
        dealer_slug,
        company_id,
        onboarding_ends_at,
        password,
      ]
    );

    const userId = result.insertId;

    // Return the created user (we know it exists since we just created it)
    const user = await this.findById(userId);
    if (!user) {
      throw new DatabaseError('Failed to retrieve created user');
    }
    return user;
  }

  async findById(id: number): Promise<User | null> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, role, dealer_slug, company_id, onboarding_ends_at, is_blocked, deactivated_at, password_hash, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? rows[0] as User : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, role, dealer_slug, company_id, onboarding_ends_at, is_blocked, deactivated_at, password_hash, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );

    return rows.length > 0 ? rows[0] as User & { password_hash: string } : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, role, dealer_slug, company_id, onboarding_ends_at, is_blocked, deactivated_at, password_hash, created_at, updated_at FROM users WHERE username = ?',
      [username]
    );

    return rows.length > 0 ? rows[0] as User & { password_hash: string } : null;
  }

  /**
   * Find user by email or username for authentication
   *
   * Attempts to find user first by email, then by username if not found.
   * Used during login to locate user account by their identifier.
   *
   * @param identifier - Email address or username
   * @returns User object with password hash included, or null if not found
   */
  async findByIdentifier(identifier: string): Promise<User | null> {
    // First try to find by email
    let user = await this.findByEmail(identifier);
    if (user) {
      return user;
    }

    // If not found by email, try by username
    user = await this.findByUsername(identifier);
    return user;
  }

  /**
   * SQL Injection Prevention: Whitelist of allowed role values
   */
  private static readonly ALLOWED_ROLES = ['user', 'dealer', 'company', 'admin'] as const;

  async findAll(
    limit: number = 10,
    offset: number = 0,
    filters?: {
      email?: string;
      username?: string;
      role?: 'user' | 'dealer' | 'company' | 'admin';
      is_blocked?: boolean;
      company_id?: number;
    }
  ): Promise<User[]> {
    const where: string[] = [];
    const params: any[] = [];

    // Validate and clamp limit/offset to prevent abuse
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    if (filters) {
      // Email filter - sanitize and limit length
      if (filters.email && typeof filters.email === 'string' && filters.email.trim().length > 0) {
        where.push('email LIKE ?');
        params.push(`%${filters.email.trim().slice(0, 255)}%`);
      }

      // Username filter - sanitize and limit length
      if (filters.username && typeof filters.username === 'string' && filters.username.trim().length > 0) {
        where.push('username LIKE ?');
        params.push(`%${filters.username.trim().slice(0, 255)}%`);
      }

      // Role filter - WHITELIST VALIDATION (critical for SQL injection prevention)
      if (filters.role) {
        if (!UserModel.ALLOWED_ROLES.includes(filters.role)) {
          throw new ValidationError(`Invalid role value. Allowed: ${UserModel.ALLOWED_ROLES.join(', ')}`);
        }
        where.push('role = ?');
        params.push(filters.role);
      }

      // is_blocked filter - ensure boolean
      if (typeof filters.is_blocked === 'boolean') {
        where.push('is_blocked = ?');
        params.push(filters.is_blocked ? 1 : 0);
      }

      // company_id filter - ensure positive integer
      if (filters.company_id !== undefined && filters.company_id !== null) {
        const companyIdNum = typeof filters.company_id === 'number' ? filters.company_id : parseInt(String(filters.company_id), 10);
        if (!Number.isFinite(companyIdNum) || companyIdNum <= 0) {
          throw new ValidationError('Invalid company_id: must be a positive integer');
        }
        where.push('company_id = ?');
        params.push(companyIdNum);
      }
    }

    let sql =
      'SELECT id, email, username, role, dealer_slug, company_id, onboarding_ends_at, is_blocked, deactivated_at, password_hash, created_at, updated_at FROM users';

    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, safeOffset);

    const rows = await this.executeQuery(sql, params);

    return rows as User[];
  }

  /**
   * Update user profile information
   *
   * Dynamically builds UPDATE query based on provided fields.
   * Only updates fields that are present in the updates object.
   * Automatically updates the updated_at timestamp.
   *
   * @param id - User ID to update
   * @param updates - Partial user data to update
   * @returns Updated user object or null if user not found
   * @throws Error if no valid fields provided for update
   */
  async update(id: number, updates: UserUpdate): Promise<User | null> {
    const { email, username, password, role, dealer_slug, company_id, onboarding_ends_at, is_blocked } = updates;
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (password) {
      updateFields.push('password_hash = ?');
      updateValues.push(password);
    }

    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (dealer_slug !== undefined) {
      updateFields.push('dealer_slug = ?');
      updateValues.push(dealer_slug);
    }

    if (company_id !== undefined) {
      updateFields.push('company_id = ?');
      updateValues.push(company_id);
    }

    if (onboarding_ends_at !== undefined) {
      updateFields.push('onboarding_ends_at = ?');
      updateValues.push(onboarding_ends_at);
    }

	    if (is_blocked !== undefined) {
	      updateFields.push('is_blocked = ?');
	      updateValues.push(is_blocked ? 1 : 0);
	    }

    if (updates.deactivated_at !== undefined) {
      updateFields.push('deactivated_at = ?');
      updateValues.push(updates.deactivated_at);
    }

    if (updateFields.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await this.executeCommand(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.executeCommand(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    return this.recordExists('users', { email }, excludeId);
  }

  async usernameExists(username: string, excludeId?: number): Promise<boolean> {
    return this.recordExists('users', { username }, excludeId);
  }

  async count(): Promise<number> {
    const rows = await this.executeQuery(
      'SELECT COUNT(*) as count FROM users'
    );

    return rows[0].count;
  }

  async countWithFilters(filters?: {
    email?: string;
    username?: string;
    role?: 'user' | 'dealer' | 'company' | 'admin';
    is_blocked?: boolean;
    company_id?: number;
  }): Promise<number> {
    const where: string[] = [];
    const params: any[] = [];

    if (filters) {
      // Email filter - sanitize and limit length
      if (filters.email && typeof filters.email === 'string' && filters.email.trim().length > 0) {
        where.push('email LIKE ?');
        params.push(`%${filters.email.trim().slice(0, 255)}%`);
      }

      // Username filter - sanitize and limit length
      if (filters.username && typeof filters.username === 'string' && filters.username.trim().length > 0) {
        where.push('username LIKE ?');
        params.push(`%${filters.username.trim().slice(0, 255)}%`);
      }

      // Role filter - WHITELIST VALIDATION (critical for SQL injection prevention)
      if (filters.role) {
        if (!UserModel.ALLOWED_ROLES.includes(filters.role)) {
          throw new ValidationError(`Invalid role value. Allowed: ${UserModel.ALLOWED_ROLES.join(', ')}`);
        }
        where.push('role = ?');
        params.push(filters.role);
      }

      // is_blocked filter - ensure boolean
      if (typeof filters.is_blocked === 'boolean') {
        where.push('is_blocked = ?');
        params.push(filters.is_blocked ? 1 : 0);
      }

      // company_id filter - ensure positive integer
      if (filters.company_id !== undefined && filters.company_id !== null) {
        const companyIdNum = typeof filters.company_id === 'number' ? filters.company_id : parseInt(String(filters.company_id), 10);
        if (!Number.isFinite(companyIdNum) || companyIdNum <= 0) {
          throw new ValidationError('Invalid company_id: must be a positive integer');
        }
        where.push('company_id = ?');
        params.push(companyIdNum);
      }
    }

    let sql = 'SELECT COUNT(*) as count FROM users';

    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }

    const rows = await this.executeQuery(sql, params);
    return rows[0].count;
  }
}
