import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { User, UserCreate, UserUpdate, UserLogin, AuthResponse } from '../types/user.js';
import { UserModel } from '../models/UserModel.js';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError } from '../types/errors.js';

/**
 * User Controller
 *
 * Handles all user-related business logic including authentication,
 * registration, profile management, and user administration.
 * Acts as an intermediary between routes and data models.
 */
const BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS
  ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
  : 12;

export class UserController {
  private fastify: FastifyInstance;
  private userModel: UserModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.userModel = new UserModel(fastify);
  }

  /**
   * Register a new user account
   *
   * Performs validation to ensure email and username uniqueness,
   * hashes the password, creates the user record, and returns
   * authentication credentials.
   *
   * @param userData - User registration data
   * @returns Authentication response with JWT token and user info
   * @throws Error if email or username already exists
   */
  async register(userData: UserCreate): Promise<AuthResponse> {
    const { email, username, password } = userData;

    // Check if user already exists
    const emailExists = await this.userModel.emailExists(email);
    const usernameExists = await this.userModel.usernameExists(username);

    if (emailExists) {
      throw new ConflictError('User with this email already exists');
    }

    if (usernameExists) {
      throw new ConflictError('User with this username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user
    const user = await this.userModel.create({
      email,
      username,
      password: passwordHash,
      // role, dealer_slug, company_id, onboarding_ends_at can be
      // extended here later if registration needs to support them.
    });

    // Generate token
    const token = this.fastify.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    };
  }

  /**
   * Authenticate user login
   *
   * Accepts either email or username as identifier, verifies credentials
   * against stored password hash, and returns authentication token
   * if successful.
   *
   * @param credentials - Login credentials (identifier and password)
   * @returns Authentication response with JWT token and user info
   * @throws Error if credentials are invalid
   */
  async login(credentials: UserLogin): Promise<AuthResponse> {
    const { identifier, password } = credentials;

    // Find user by identifier (email or username)
    const user = await this.userModel.findByIdentifier(identifier);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate token (include role for authorization checks)
    const token = this.fastify.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    };
  }

  /**
   * Retrieve user profile information
   *
   * Fetches complete user data for the authenticated user.
   *
   * @param userId - User ID to retrieve profile for
   * @returns Complete user profile data
   * @throws Error if user is not found
   */
  async getProfile(userId: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Update user profile information
   *
   * Allows users to modify their email, username, and password.
   * Validates uniqueness constraints and hashes new passwords.
   * Only updates fields that are provided in the updates object.
   *
   * @param userId - User ID to update
   * @param updates - Partial user data to update
   * @returns Updated user profile data
   * @throws Error if email/username conflicts or user not found
   */
  async updateProfile(userId: number, updates: UserUpdate): Promise<User> {
    const { email, username, password } = updates;

    // Check if email/username are already taken by other users
    if (email) {
      const emailExists = await this.userModel.emailExists(email, userId);
      if (emailExists) {
        throw new ConflictError('Email already taken');
      }
    }

    if (username) {
      const usernameExists = await this.userModel.usernameExists(username, userId);
      if (usernameExists) {
        throw new ConflictError('Username already taken');
      }
    }

    // Hash password if provided
    let passwordHash = password;
    if (password) {
      passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
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

  /**
   * Permanently delete a user account
   *
   * Removes the user record from the database. This action cannot be undone.
   *
   * @param userId - User ID to delete
   * @throws Error if user is not found
   */
  async deleteUser(userId: number): Promise<void> {
    const deleted = await this.userModel.delete(userId);
    if (!deleted) {
      throw new NotFoundError('User');
    }
  }

  /**
   * Retrieve paginated list of users with optional filters
   *
   * Admin utility method for listing users with pagination support and basic
   * search filters for admin panels.
   *
   * @param limit - Maximum number of users to return (default: 10)
   * @param offset - Number of users to skip for pagination (default: 0)
   * @param filters - Optional filters: email/username LIKE search, role, blocked flag, company_id
   * @returns Array of user objects without sensitive data
   */
  async getAllUsers(
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
    return this.userModel.findAll(limit, offset, filters);
  }

  /**
   * Get total count of registered users
   *
   * Admin utility method for retrieving user statistics.
   *
   * @returns Total number of users in the system
   */
  async getUserCount(): Promise<number> {
    return this.userModel.count();
  }

	  /**
	   * Get total count of users matching optional filters.
	   *
	   * Useful for paginated admin lists when combined with getAllUsers.
	   */
	  async getUserCountWithFilters(filters?: {
	    email?: string;
	    username?: string;
	    role?: 'user' | 'dealer' | 'company' | 'admin';
	    is_blocked?: boolean;
	    company_id?: number;
	  }): Promise<number> {
	    return this.userModel.countWithFilters(filters);
	  }

	  /**
	   * Admin: retrieve user by ID
	   */
	  async getUserByIdAdmin(userId: number): Promise<User> {
	    const user = await this.userModel.findById(userId);
	    if (!user) {
	      throw new NotFoundError('User');
	    }
	    return user;
	  }

	  /**
	   * Admin: update core user fields (role, dealer/company links, onboarding, blocked flag).
	   */
	  async updateUserAdmin(userId: number, updates: Pick<UserUpdate, 'role' | 'dealer_slug' | 'company_id' | 'onboarding_ends_at' | 'is_blocked'>): Promise<User> {
	    const updated = await this.userModel.update(userId, updates);
	    if (!updated) {
	      throw new NotFoundError('User');
	    }
	    return updated;
	  }

	  /**
	   * Admin: block or unblock a user account.
	   */
	  async setUserBlocked(userId: number, isBlocked: boolean): Promise<User> {
	    return this.updateUserAdmin(userId, { is_blocked: isBlocked });
	  }
}
