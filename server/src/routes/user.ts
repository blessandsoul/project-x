import { FastifyPluginAsync } from 'fastify';
import { UserController } from '../controllers/userController.js';
import { UserCreate, UserUpdate, UserLogin } from '../types/user.js';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError } from '../types/errors.js';

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
        },
      },
    },
  }, async (request, reply) => {
    const userData: UserCreate = request.body as UserCreate;
    const result = await userController.register(userData);

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

  /**
   * GET /users
   *
   * Retrieve a list of all users.
   * Requires valid JWT token in Authorization header.
   *
   * Headers: Authorization: Bearer <token>
   * Query Parameters: limit (integer, default: 10), offset (integer, default: 0)
   * Response: Array of user objects
   * Status: 200 (OK) on success, 401 (Unauthorized) if not authenticated
   */
  fastify.get('/users', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const { limit = 10, offset = 0 } = request.query as { limit?: number; offset?: number };
    const users = await userController.getAllUsers(limit, offset);
    reply.send(users);
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
