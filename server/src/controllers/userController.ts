import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { User, UserCreate, UserUpdate, UserLogin, AuthResponse } from '../types/user.js';
import { UserModel } from '../models/UserModel.js';

export class UserController {
  private fastify: FastifyInstance;
  private userModel: UserModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.userModel = new UserModel(fastify);
  }

  async register(userData: UserCreate): Promise<AuthResponse> {
    const { email, username, password } = userData;

    // Check if user already exists
    const emailExists = await this.userModel.emailExists(email);
    const usernameExists = await this.userModel.usernameExists(username);

    if (emailExists) {
      throw new Error('User with this email already exists');
    }

    if (usernameExists) {
      throw new Error('User with this username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.userModel.create({
      email,
      username,
      password: passwordHash,
    });

    // Generate token
    const token = this.fastify.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      token,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async login(credentials: UserLogin): Promise<AuthResponse> {
    const { identifier, password } = credentials;

    // Find user by identifier (email or username)
    const user = await this.userModel.findByIdentifier(identifier);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.fastify.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      token,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateProfile(userId: number, updates: UserUpdate): Promise<User> {
    const { email, username, password } = updates;

    // Check if email/username are already taken by other users
    if (email) {
      const emailExists = await this.userModel.emailExists(email, userId);
      if (emailExists) {
        throw new Error('Email already taken');
      }
    }

    if (username) {
      const usernameExists = await this.userModel.usernameExists(username, userId);
      if (usernameExists) {
        throw new Error('Username already taken');
      }
    }

    // Hash password if provided
    let passwordHash = password;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    const updateData: UserUpdate = {};
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (passwordHash) updateData.password = passwordHash;

    const updatedUser = await this.userModel.update(userId, updateData);
    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  }

  async deleteUser(userId: number): Promise<void> {
    const deleted = await this.userModel.delete(userId);
    if (!deleted) {
      throw new Error('User not found');
    }
  }

  // Additional methods for admin or future use
  async getAllUsers(limit: number = 10, offset: number = 0): Promise<User[]> {
    return this.userModel.findAll(limit, offset);
  }

  async getUserCount(): Promise<number> {
    return this.userModel.count();
  }
}
