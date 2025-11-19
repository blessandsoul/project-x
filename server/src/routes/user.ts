import { FastifyPluginAsync } from 'fastify';
import { UserController } from '../controllers/userController.js';
import { UserCompanyActivityModel } from '../models/UserCompanyActivityModel.js';
import { UserCreate, UserUpdate, UserLogin } from '../types/user.js';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError, AuthorizationError } from '../types/errors.js';

const loginRateLimitMax = process.env.RATE_LIMIT_USER_LOGIN_MAX
  ? parseInt(process.env.RATE_LIMIT_USER_LOGIN_MAX, 10)
  : 5;

const loginRateLimitWindow = process.env.RATE_LIMIT_USER_LOGIN_WINDOW || '5 minutes';

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
          companyName: { type: 'string', minLength: 1, maxLength: 255, description: 'Required when role = "company".' },
          companyPhone: { type: 'string', minLength: 3, maxLength: 255, description: 'Optional contact phone for the company.' },
          basePrice: { type: 'number', minimum: 0, description: 'Optional base price that can be set later in dashboard.' },
          pricePerMile: { type: 'number', minimum: 0, description: 'Optional price per mile that can be set later in dashboard.' },
          customsFee: { type: 'number', minimum: 0, description: 'Optional customs fee that can be set later in dashboard.' },
          serviceFee: { type: 'number', minimum: 0, description: 'Optional service fee that can be set later in dashboard.' },
          brokerFee: { type: 'number', minimum: 0, description: 'Optional broker fee that can be set later in dashboard.' },
        },
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
          identifier: { type: 'string', description: 'Email or username' },
          password: { type: 'string' },
        },
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
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { companyId } = request.params as { companyId: string };
    const id = Number.parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    await userCompanyActivityModel.addFavoriteCompany(request.user.id, id);
    return reply.code(201).send({ success: true });
  });

  fastify.delete('/user/favorites/:companyId', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { companyId } = request.params as { companyId: string };
    const id = Number.parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    await userCompanyActivityModel.removeFavoriteCompany(request.user.id, id);
    return reply.code(204).send();
  });

  fastify.get('/user/recent-companies', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { limit } = request.query as { limit?: string };
    const rawLimit = limit ? Number.parseInt(limit, 10) : 20;
    const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20;

    const items = await userCompanyActivityModel.listRecentCompanies(request.user.id, safeLimit);
    return reply.send({ items });
  });

  fastify.post('/user/recent-companies', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const body = request.body as { company_id?: number } | undefined;
    const companyId = body && typeof body.company_id === 'number' ? body.company_id : NaN;

    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new ValidationError('Invalid company_id');
    }

    await userCompanyActivityModel.addRecentCompany(request.user.id, companyId);
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
	      role?: 'user' | 'dealer' | 'company' | 'admin';
	      is_blocked?: boolean;
	      company_id?: number;
	    };
	    const filters: {
	      email?: string;
	      username?: string;
	      role?: 'user' | 'dealer' | 'company' | 'admin';
	      is_blocked?: boolean;
	      company_id?: number;
	    } = {};
	    if (email) filters.email = email;
	    if (username) filters.username = username;
	    if (role) filters.role = role;
	    if (typeof is_blocked === 'boolean') filters.is_blocked = is_blocked;
	    if (typeof company_id === 'number') filters.company_id = company_id;
	    const items = await userController.getAllUsers(limit, offset, filters);
	    const total = await userController.getUserCountWithFilters(filters);
	    reply.send({
	      items,
	      meta: {
	        limit,
	        offset,
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
	  }, async (request, reply) => {
	    if (!request.user || request.user.role !== 'admin') {
	      throw new AuthorizationError('Admin role required to access this resource');
	    }
	    const { id } = request.params as { id: string };
	    const userId = parseInt(id, 10);
	    if (!Number.isFinite(userId) || userId <= 0) {
	      throw new ValidationError('Invalid user id');
	    }
	    const user = await userController.getUserByIdAdmin(userId);
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
	      body: {
	        type: 'object',
	        properties: {
	          role: { type: 'string', enum: ['user', 'dealer', 'company', 'admin'] },
	          dealer_slug: { type: ['string', 'null'] },
	          company_id: { type: ['integer', 'null'], minimum: 1 },
	          onboarding_ends_at: { type: ['string', 'null'], format: 'date-time' },
	          is_blocked: { type: 'boolean' },
	        },
	      },
	    },
	  }, async (request, reply) => {
	    if (!request.user || request.user.role !== 'admin') {
	      throw new AuthorizationError('Admin role required to update users');
	    }
	    const { id } = request.params as { id: string };
	    const userId = parseInt(id, 10);
	    if (!Number.isFinite(userId) || userId <= 0) {
	      throw new ValidationError('Invalid user id');
	    }
	    const body = request.body as Partial<UserUpdate> & { is_blocked?: boolean };
	    const updates: UserUpdate = {};
	    if (body.role) updates.role = body.role;
	    if ('dealer_slug' in body) updates.dealer_slug = body.dealer_slug ?? null;
	    if ('company_id' in body) updates.company_id = body.company_id ?? null;
	    if ('onboarding_ends_at' in body) {
	      updates.onboarding_ends_at = body.onboarding_ends_at ? new Date(body.onboarding_ends_at as any) : null;
	    }
	    if (typeof body.is_blocked === 'boolean') updates.is_blocked = body.is_blocked;
	    const updated = await userController.updateUserAdmin(userId, updates as any);
	    reply.send(updated);
	  });

	  /**
	   * DELETE /admin/users/:id
	   *
	   * Admin: Permanently delete a user account by ID.
	   */
	  fastify.delete('/admin/users/:id', {
	    preHandler: fastify.authenticate,
	  }, async (request, reply) => {
	    if (!request.user || request.user.role !== 'admin') {
	      throw new AuthorizationError('Admin role required to delete users');
	    }
	    const { id } = request.params as { id: string };
	    const userId = parseInt(id, 10);
	    if (!Number.isFinite(userId) || userId <= 0) {
	      throw new ValidationError('Invalid user id');
	    }
	    await userController.deleteUser(userId);
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
