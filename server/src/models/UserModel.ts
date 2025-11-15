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
      'SELECT id, email, username, role, dealer_slug, company_id, onboarding_ends_at, password_hash, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? rows[0] as User : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, role, dealer_slug, company_id, onboarding_ends_at, password_hash, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );

    return rows.length > 0 ? rows[0] as User & { password_hash: string } : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, role, dealer_slug, company_id, onboarding_ends_at, password_hash, created_at, updated_at FROM users WHERE username = ?',
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

  async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, role, dealer_slug, company_id, onboarding_ends_at, password_hash, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

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
    const { email, username, password, role, dealer_slug, company_id, onboarding_ends_at } = updates;
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
}
