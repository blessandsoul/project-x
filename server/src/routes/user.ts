import { FastifyPluginAsync } from 'fastify';
import { UserController } from '../controllers/userController.js';
import { UserCreate, UserUpdate, UserLogin } from '../types/user.js';

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
    try {
      const userData: UserCreate = request.body as UserCreate;
      const result = await userController.register(userData);

      reply.code(201).send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      fastify.log.error(error);
      reply.code(400).send({ error: message });
    }
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
    try {
      const credentials: UserLogin = request.body as UserLogin;
      const result = await userController.login(credentials);

      reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      fastify.log.error(error);
      reply.code(401).send({ error: message });
    }
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
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const user = await userController.getProfile(request.user.id);
      reply.send(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get profile';
      fastify.log.error(error);
      reply.code(404).send({ error: message });
    }
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
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const updates: UserUpdate = request.body as UserUpdate;
      const updatedUser = await userController.updateProfile(request.user.id, updates);

      reply.send(updatedUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      fastify.log.error(error);
      reply.code(400).send({ error: message });
    }
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
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      await userController.deleteUser(request.user.id);
      reply.send({ message: 'Account deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      fastify.log.error(error);
      reply.code(404).send({ error: message });
    }
  });
};

export { userRoutes };
