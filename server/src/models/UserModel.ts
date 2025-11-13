import mysql from 'mysql2/promise';
import { FastifyInstance } from 'fastify';
import { User, UserCreate, UserUpdate } from '../types/user.js';
import { BaseModel } from './BaseModel.js';

export class UserModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async create(userData: UserCreate): Promise<User> {
    const { email, username, password } = userData;

    const result = await this.executeCommand(
      'INSERT INTO users (email, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [email, username, password]
    );

    const userId = result.insertId;

    // Return the created user (we know it exists since we just created it)
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('Failed to retrieve created user');
    }
    return user;
  }

  async findById(id: number): Promise<User | null> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? rows[0] as User : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, password_hash, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );

    return rows.length > 0 ? rows[0] as User & { password_hash: string } : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.executeQuery(
      'SELECT id, email, username, password_hash, created_at, updated_at FROM users WHERE username = ?',
      [username]
    );

    return rows.length > 0 ? rows[0] as User & { password_hash: string } : null;
  }

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
      'SELECT id, email, username, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return rows as User[];
  }

  async update(id: number, updates: UserUpdate): Promise<User | null> {
    const { email, username, password } = updates;
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

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
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
