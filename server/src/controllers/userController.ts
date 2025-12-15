import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { User, UserCreate, UserUpdate, AuthUser } from '../types/user.js';
import { UserModel } from '../models/UserModel.js';
import { CompanyModel } from '../models/CompanyModel.js';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError } from '../types/errors.js';
import { invalidateUserCache } from '../utils/cache.js';
import { getUserAvatarUrls, getCompanyLogoUrls } from '../services/ImageUploadService.js';

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
  private companyModel: CompanyModel;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.userModel = new UserModel(fastify);
    this.companyModel = new CompanyModel(fastify);
  }

  /**
   * Get company logo URLs using ImageUploadService
   */
  private async computeCompanyLogoUrls(companyId: number | null): Promise<{ company_logo_url: string | null; original_company_logo_url: string | null }> {
    if (!companyId) {
      return { company_logo_url: null, original_company_logo_url: null };
    }

    const company = await this.companyModel.findById(companyId);
    if (!company) {
      return { company_logo_url: null, original_company_logo_url: null };
    }

    const slugOrName = company.slug || company.name;
    const urls = await getCompanyLogoUrls(slugOrName);

    return {
      company_logo_url: urls.url,
      original_company_logo_url: urls.originalUrl,
    };
  }

  /**
   * Get user avatar URLs using ImageUploadService
   */
  private async computeUserAvatarUrls(username: string | null | undefined): Promise<{ avatar_url: string | null; original_avatar_url: string | null }> {
    const urls = await getUserAvatarUrls(username);

    return {
      avatar_url: urls.url,
      original_avatar_url: urls.originalUrl,
    };
  }

  /**
   * Register a new user account (Option B: 2-step onboarding)
   *
   * Creates a user with role='user' only. Company creation happens
   * later via POST /companies/onboard.
   *
   * @param userData - User registration data (email, username, password only)
   * @returns User info (no token - user must login via /auth/login)
   * @throws Error if email or username already exists
   */
  async register(
    userData: Pick<UserCreate, 'email' | 'username' | 'password'>,
  ): Promise<{ user: AuthUser }> {
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

    // Create user with role='user' (company creation via /companies/onboard)
    const user = await this.userModel.create({
      email,
      username,
      password: passwordHash,
      role: 'user',
      company_id: null,
    });

    // No token generation - user must login via /auth/login to get HttpOnly cookies
    const avatarMeta = await this.computeUserAvatarUrls(user.username);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        company_id: user.company_id,
        company_logo_url: null,
        original_company_logo_url: null,
        avatar_url: avatarMeta.avatar_url,
        original_avatar_url: avatarMeta.original_avatar_url,
      },
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

    const logoMeta = await this.computeCompanyLogoUrls(user.company_id ?? null);
    const avatarMeta = await this.computeUserAvatarUrls(user.username);

    return {
      ...user,
      company_logo_url: logoMeta.company_logo_url,
      original_company_logo_url: logoMeta.original_company_logo_url,
      avatar_url: avatarMeta.avatar_url,
      original_avatar_url: avatarMeta.original_avatar_url,
    };
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

	    // Invalidate auth cache - especially important when blocking users
	    await invalidateUserCache(this.fastify, userId);

	    return updated;
	  }

	  /**
	   * Admin: block or unblock a user account.
	   */
	  async setUserBlocked(userId: number, isBlocked: boolean): Promise<User> {
	    return this.updateUserAdmin(userId, { is_blocked: isBlocked });
	  }
}
