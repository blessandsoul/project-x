import { FastifyPluginAsync } from 'fastify';
import { UserController } from '../controllers/userController.js';
import { UserCreate, UserUpdate, UserLogin } from '../types/user.js';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  const userController = new UserController(fastify);

  // TODO: Add rate limiting using @fastify/rate-limit plugin for better Fastify integration

  // Register user
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

  // Login user
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

  // Get user profile (protected route)
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

  // Update user profile (protected route)
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

  // Delete user account (protected route)
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
