import { FastifyPluginAsync } from 'fastify';
import { UserController } from '../controllers/userController.js';
import { UserCompanyActivityModel } from '../models/UserCompanyActivityModel.js';
import { UserCreate, UserUpdate, UserLogin } from '../types/user.js';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError, AuthorizationError } from '../types/errors.js';
import {
  uploadUserAvatar,
  deleteUserAvatar,
  getUserAvatarUrls,
  validateImageMime,
} from '../services/ImageUploadService.js';
import {
  idParamsSchema,
  companyIdParamsSchema,
  positiveIntegerSchema,
  paginationLimitSchema,
} from '../schemas/commonSchemas.js';

const loginRateLimitMax = process.env.RATE_LIMIT_USER_LOGIN_MAX
  ? parseInt(process.env.RATE_LIMIT_USER_LOGIN_MAX, 10)
  : 5;

const loginRateLimitWindow = process.env.RATE_LIMIT_USER_LOGIN_WINDOW || '5 minutes';

// Registration rate limit - prevent spam account creation
const registerRateLimitMax = process.env.RATE_LIMIT_USER_REGISTER_MAX
  ? parseInt(process.env.RATE_LIMIT_USER_REGISTER_MAX, 10)
  : 3;

const registerRateLimitWindow = process.env.RATE_LIMIT_USER_REGISTER_WINDOW || '1 hour';

/**
 * User Routes
 *
 * Defines all user-related API endpoints including authentication,
 * registration, profile management, and account operations.
 *
 * Endpoints:
 * - POST /register - User registration
 * - POST /login - User authentication
 * - GET /profile - Get user profile (authenticated)
 * - PUT /profile - Update user profile (authenticated)
 * - DELETE /profile - Delete user account (authenticated)
 */
const userRoutes: FastifyPluginAsync = async (fastify) => {
  const userController = new UserController(fastify);
  const userCompanyActivityModel = new UserCompanyActivityModel(fastify);

  // TODO: Add rate limiting using @fastify/rate-limit plugin for better Fastify integration

  /**
   * POST /register
   *
   * Register a new user account with email, username, and password.
   * Validates uniqueness constraints and returns authentication token.
   *
   * Request Body: { email: string, username: string, password: string }
   * Response: { token: string, user: { id: number, email: string, username: string } }
   * Status: 201 (Created) on success, 400 (Bad Request) on validation error
   */
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['user', 'company'], description: 'Optional. Defaults to "user".' },
          name: { type: 'string', minLength: 1, maxLength: 255, description: 'Company name. Required when role = "company".' },
          companyName: { type: 'string', minLength: 1, maxLength: 255, description: 'DEPRECATED: use `name` instead. Kept for backward compatibility.' },
          companyPhone: { type: 'string', minLength: 3, maxLength: 255, description: 'Optional contact phone for the company.' },
          basePrice: { type: 'number', minimum: 0, description: 'Optional base price that can be set later in dashboard.' },
          pricePerMile: { type: 'number', minimum: 0, description: 'Optional price per mile that can be set later in dashboard.' },
          customsFee: { type: 'number', minimum: 0, description: 'Optional customs fee that can be set later in dashboard.' },
          serviceFee: { type: 'number', minimum: 0, description: 'Optional service fee that can be set later in dashboard.' },
          brokerFee: { type: 'number', minimum: 0, description: 'Optional broker fee that can be set later in dashboard.' },
        },
        additionalProperties: false,
      },
    },
    config: {
      rateLimit: {
        max: registerRateLimitMax,
        timeWindow: registerRateLimitWindow,
      },
    },
  }, async (request, reply) => {
    const result = await userController.register(request.body as any);

    reply.code(201).send(result);
  });

  /**
   * POST /login
   *
   * Authenticate user with email/username and password.
   * Returns JWT token for subsequent authenticated requests.
   *
   * Request Body: { identifier: string, password: string }
   * Response: { token: string, user: { id: number, email: string, username: string } }
   * Status: 200 (OK) on success, 401 (Unauthorized) on invalid credentials
   */
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: { type: 'string', minLength: 1, maxLength: 255, description: 'Email or username' },
          password: { type: 'string', minLength: 1, maxLength: 255 },
        },
        additionalProperties: false,
      },
    },
    config: {
      rateLimit: {
        max: loginRateLimitMax,
        timeWindow: loginRateLimitWindow,
      },
    },
  }, async (request, reply) => {
    const credentials: UserLogin = request.body as UserLogin;
    const result = await userController.login(credentials);

    reply.send(result);
  });

  /**
   * GET /profile
   *
   * Retrieve authenticated user's profile information.
   * Requires valid JWT token in Authorization header.
   *
   * Headers: Authorization: Bearer <token>
   * Response: User profile object
   * Status: 200 (OK) on success, 401 (Unauthorized) if not authenticated, 404 (Not Found) if user deleted
   */
  fastify.get('/profile', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const user = await userController.getProfile(request.user.id);
    reply.send(user);
  });

  /**
   * PUT /profile
   *
   * Update authenticated user's profile information.
   * Allows partial updates to email, username, and password.
   *
   * Headers: Authorization: Bearer <token>
   * Request Body: { email?: string, username?: string, password?: string }
   * Response: Updated user profile object
   * Status: 200 (OK) on success, 400 (Bad Request) on validation error, 401 (Unauthorized) if not authenticated
   */
  fastify.put('/profile', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const updates: UserUpdate = request.body as UserUpdate;
    const updatedUser = await userController.updateProfile(request.user.id, updates);

    reply.send(updatedUser);
  });

  // ---------------------------------------------------------------------------
  // User avatar upload & management (/user/avatar)
  // Uses ImageUploadService for consistent image handling
  // ---------------------------------------------------------------------------

  const handleAvatarUpload = async (request: any, reply: any) => {
    if (!request.user || typeof request.user.id !== 'number') {
      throw new AuthenticationError('Unauthorized');
    }

    const file = await request.file();
    if (!file) {
      throw new ValidationError('Avatar file is required');
    }

    const mime = file.mimetype as string | undefined;
    try {
      validateImageMime(mime);
    } catch {
      throw new ValidationError('Avatar must be an image file');
    }

    // Load full user to get stable username and role
    const profile = await userController.getProfile(request.user.id);

    // Company-role users must use their company logo as avatar
    if (profile.role === 'company') {
      throw new AuthorizationError('Company users must use company logo as avatar');
    }

    const buffer = await file.toBuffer();
    const result = await uploadUserAvatar(buffer, mime!, profile.username);

    return reply.code(201).send({
      avatarUrl: result.url,
      originalAvatarUrl: result.originalUrl,
    });
  };

  /**
   * POST /user/avatar
   *
   * Upload or replace the authenticated user's avatar.
   */
  fastify.post('/user/avatar', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    return handleAvatarUpload(request, reply);
  });

  /**
   * PUT /user/avatar
   *
   * Alias for POST /user/avatar to support idempotent update semantics.
   */
  fastify.put('/user/avatar', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    return handleAvatarUpload(request, reply);
  });

  /**
   * GET /user/avatar
   *
   * Returns URLs for the authenticated user's avatar if it exists.
   */
  fastify.get('/user/avatar', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user || typeof request.user.id !== 'number') {
      throw new AuthenticationError('Unauthorized');
    }

    const profile = await userController.getProfile(request.user.id);
    const urls = await getUserAvatarUrls(profile.username);

    return reply.send({
      avatarUrl: urls.url,
      originalAvatarUrl: urls.originalUrl,
    });
  });

  /**
   * DELETE /user/avatar
   *
   * Deletes the authenticated user's avatar files from disk.
   */
  fastify.delete('/user/avatar', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user || typeof request.user.id !== 'number') {
      throw new AuthenticationError('Unauthorized');
    }

    const profile = await userController.getProfile(request.user.id);
    await deleteUserAvatar(profile.username);

    return reply.code(204).send();
  });

  // ---------------------------------------------------------------------------
  // User favorites (companies) and recently viewed companies
  // ---------------------------------------------------------------------------

  fastify.get('/user/favorites', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const items = await userCompanyActivityModel.listFavoriteCompanies(request.user.id);
    return reply.send({ items });
  });

  fastify.post('/user/favorites/:companyId', {
    preHandler: fastify.authenticate,
    schema: {
      params: companyIdParamsSchema,
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };

    const newlyAdded = await userCompanyActivityModel.addFavoriteCompany(request.user.id, companyId);

    if (newlyAdded) {
      return reply.code(201).send({ success: true, status: 'created' });
    }

    return reply.code(200).send({ success: true, status: 'already_exists' });
  });

  fastify.delete('/user/favorites/:companyId', {
    preHandler: fastify.authenticate,
    schema: {
      params: companyIdParamsSchema,
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };

    await userCompanyActivityModel.removeFavoriteCompany(request.user.id, companyId);
    return reply.code(204).send();
  });

  fastify.get('/user/recent-companies', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: limit is validated by schema
    const { limit = 20 } = request.query as { limit?: number };

    const items = await userCompanyActivityModel.listRecentCompanies(request.user.id, limit);
    return reply.send({ items });
  });

  fastify.post('/user/recent-companies', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['company_id'],
        properties: {
          company_id: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: company_id is validated by schema
    const { company_id } = request.body as { company_id: number };

    await userCompanyActivityModel.addRecentCompany(request.user.id, company_id);
    return reply.code(201).send({ success: true });
  });

	  // ---------------------------------------------------------------------------
	  // Admin User Management (/admin/...)
	  // ---------------------------------------------------------------------------

	  /**
	   * GET /admin/users
	   *
	   * Admin: Retrieve paginated list of users with optional filters.
	   */
	  fastify.get('/admin/users', {
	    preHandler: fastify.authenticate,
	    schema: {
	      querystring: {
	        type: 'object',
	        properties: {
	          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	          offset: { type: 'integer', minimum: 0, default: 0 },
	          email: { type: 'string', minLength: 1, maxLength: 255 },
	          username: { type: 'string', minLength: 1, maxLength: 255 },
	          role: { type: 'string', enum: ['user', 'dealer', 'company', 'admin'] },
	          is_blocked: { type: 'boolean' },
	          company_id: { type: 'integer', minimum: 1 },
	        },
	        additionalProperties: false,
	      },
	    },
	  }, async (request, reply) => {
	    if (!request.user || request.user.role !== 'admin') {
	      throw new AuthorizationError('Admin role required to access this resource');
	    }
	    const { limit = 10, offset = 0, email, username, role, is_blocked, company_id } = request.query as {
	      limit?: number;
	      offset?: number;
	      email?: string;
	      username?: string;
	      role?: string;
	      is_blocked?: boolean;
	      company_id?: number;
	    };

	    // ========================================================================
	    // SQL Injection Prevention: Explicit server-side validation
	    // Even though Fastify schema validation should catch these, we add
	    // defense-in-depth validation to prevent any bypass attempts.
	    // ========================================================================

	    // Whitelist validation for role parameter
	    const ALLOWED_ROLES = ['user', 'dealer', 'company', 'admin'] as const;
	    type AllowedRole = typeof ALLOWED_ROLES[number];
	    let validatedRole: AllowedRole | undefined;
	    if (role !== undefined && role !== null && role !== '') {
	      if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
	        throw new ValidationError(`Invalid role value. Allowed: ${ALLOWED_ROLES.join(', ')}`);
	      }
	      validatedRole = role as AllowedRole;
	    }

	    // Validate and clamp limit
	    let safeLimit = typeof limit === 'number' ? limit : parseInt(String(limit), 10);
	    if (!Number.isFinite(safeLimit) || safeLimit <= 0) safeLimit = 10;
	    if (safeLimit > 100) safeLimit = 100;

	    // Validate and clamp offset
	    let safeOffset = typeof offset === 'number' ? offset : parseInt(String(offset), 10);
	    if (!Number.isFinite(safeOffset) || safeOffset < 0) safeOffset = 0;

	    // Validate company_id is a positive integer
	    let safeCompanyId: number | undefined;
	    if (company_id !== undefined && company_id !== null) {
	      const companyIdNum = typeof company_id === 'number' ? company_id : parseInt(String(company_id), 10);
	      if (!Number.isFinite(companyIdNum) || companyIdNum <= 0) {
	        throw new ValidationError('Invalid company_id: must be a positive integer');
	      }
	      safeCompanyId = companyIdNum;
	    }

	    // Build filters object with validated values only
	    const filters: {
	      email?: string;
	      username?: string;
	      role?: 'user' | 'dealer' | 'company' | 'admin';
	      is_blocked?: boolean;
	      company_id?: number;
	    } = {};

	    // String filters - trim and validate length
	    if (email && typeof email === 'string' && email.trim().length > 0) {
	      filters.email = email.trim().slice(0, 255);
	    }
	    if (username && typeof username === 'string' && username.trim().length > 0) {
	      filters.username = username.trim().slice(0, 255);
	    }
	    if (validatedRole) {
	      filters.role = validatedRole;
	    }
	    if (typeof is_blocked === 'boolean') {
	      filters.is_blocked = is_blocked;
	    }
	    if (safeCompanyId !== undefined) {
	      filters.company_id = safeCompanyId;
	    }

	    const items = await userController.getAllUsers(safeLimit, safeOffset, filters);
	    const total = await userController.getUserCountWithFilters(filters);
	    reply.send({
	      items,
	      meta: {
	        limit: safeLimit,
	        offset: safeOffset,
	        count: items.length,
	        total,
	      },
	    });
	  });

	  /**
	   * GET /admin/users/:id
	   *
	   * Admin: Get full information about a specific user.
	   */
	  fastify.get('/admin/users/:id', {
	    preHandler: fastify.authenticate,
	    schema: {
	      params: idParamsSchema,
	    },
	  }, async (request, reply) => {
	    if (!request.user || request.user.role !== 'admin') {
	      throw new AuthorizationError('Admin role required to access this resource');
	    }
	    // SECURITY: id is already validated as positive integer by schema
	    const { id } = request.params as { id: number };
	    const user = await userController.getUserByIdAdmin(id);
	    reply.send(user);
	  });

	  /**
	   * PATCH /admin/users/:id
	   *
	   * Admin: Update selected fields on a user (role, dealer/company links, onboarding, block state).
	   */
	  fastify.patch('/admin/users/:id', {
	    preHandler: fastify.authenticate,
	    schema: {
	      params: idParamsSchema,
	      body: {
	        type: 'object',
	        properties: {
	          role: { type: 'string', enum: ['user', 'dealer', 'company', 'admin'] },
	          dealer_slug: { type: ['string', 'null'] },
	          company_id: { type: ['integer', 'null'], minimum: 1 },
	          onboarding_ends_at: { type: ['string', 'null'], format: 'date-time' },
	          is_blocked: { type: 'boolean' },
	        },
	        additionalProperties: false,
	      },
	    },
	  }, async (request, reply) => {
	    if (!request.user || request.user.role !== 'admin') {
	      throw new AuthorizationError('Admin role required to update users');
	    }
	    // SECURITY: id is already validated as positive integer by schema
	    const { id } = request.params as { id: number };
	    const body = request.body as Partial<UserUpdate> & { is_blocked?: boolean };

	    // ========================================================================
	    // SQL Injection Prevention: Explicit server-side validation
	    // ========================================================================

	    // Whitelist validation for role parameter
	    const ALLOWED_ROLES = ['user', 'dealer', 'company', 'admin'] as const;
	    type AllowedRole = typeof ALLOWED_ROLES[number];

	    const updates: UserUpdate = {};

	    if (body.role !== undefined && body.role !== null) {
	      if (!ALLOWED_ROLES.includes(body.role as AllowedRole)) {
	        throw new ValidationError(`Invalid role value. Allowed: ${ALLOWED_ROLES.join(', ')}`);
	      }
	      updates.role = body.role as AllowedRole;
	    }

	    // Validate dealer_slug is a string or null
	    if ('dealer_slug' in body) {
	      if (body.dealer_slug !== null && typeof body.dealer_slug !== 'string') {
	        throw new ValidationError('dealer_slug must be a string or null');
	      }
	      updates.dealer_slug = body.dealer_slug ?? null;
	    }

	    // Validate company_id is a positive integer or null
	    if ('company_id' in body) {
	      if (body.company_id !== null) {
	        const companyIdNum = typeof body.company_id === 'number' ? body.company_id : parseInt(String(body.company_id), 10);
	        if (!Number.isFinite(companyIdNum) || companyIdNum <= 0) {
	          throw new ValidationError('company_id must be a positive integer or null');
	        }
	        updates.company_id = companyIdNum;
	      } else {
	        updates.company_id = null;
	      }
	    }

	    if ('onboarding_ends_at' in body) {
	      updates.onboarding_ends_at = body.onboarding_ends_at ? new Date(body.onboarding_ends_at as any) : null;
	    }
	    if (typeof body.is_blocked === 'boolean') updates.is_blocked = body.is_blocked;

	    const updated = await userController.updateUserAdmin(id, updates as any);
	    reply.send(updated);
	  });

	  /**
	   * DELETE /admin/users/:id
	   *
	   * Admin: Permanently delete a user account by ID.
	   */
	  fastify.delete('/admin/users/:id', {
	    preHandler: fastify.authenticate,
	    schema: {
	      params: idParamsSchema,
	    },
	  }, async (request, reply) => {
	    if (!request.user || request.user.role !== 'admin') {
	      throw new AuthorizationError('Admin role required to delete users');
	    }
	    // SECURITY: id is already validated as positive integer by schema
	    const { id } = request.params as { id: number };
	    await userController.deleteUser(id);
	    reply.code(204).send();
	  });

  /**
   * DELETE /profile
   *
   * Permanently delete authenticated user's account.
   * This action cannot be undone and removes all user data.
   *
   * Headers: Authorization: Bearer <token>
   * Response: { message: string }
   * Status: 200 (OK) on success, 401 (Unauthorized) if not authenticated, 404 (Not Found) if user not found
   */
  fastify.delete('/profile', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    await userController.deleteUser(request.user.id);
    reply.send({ message: 'Account deleted successfully' });
  });
};

export { userRoutes };
