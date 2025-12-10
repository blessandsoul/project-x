import { FastifyPluginAsync } from 'fastify';
import { FavoriteModel } from '../models/FavoriteModel.js';
import { ValidationError, AuthenticationError } from '../types/errors.js';
import { vehicleIdParamsSchema } from '../schemas/commonSchemas.js';

const favoritesRoutes: FastifyPluginAsync = async (fastify) => {
  const favoriteModel = new FavoriteModel(fastify);

  // List current user's favorite vehicles
  fastify.get('/favorites/vehicles', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: page and limit are validated by schema
    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    const offset = (page - 1) * limit;

    const total = await favoriteModel.countFavorites(request.user.id);
    if (total === 0) {
      return reply.send({ items: [], total: 0, limit, page: 1, totalPages: 1 });
    }

    const items = await favoriteModel.listFavorites(request.user.id, limit, offset);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return reply.send({ items, total, limit, page, totalPages });
  });

  // Add a vehicle to favorites
  fastify.post('/favorites/vehicles/:vehicleId', {
    preHandler: fastify.authenticate,
    schema: {
      params: vehicleIdParamsSchema,
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: vehicleId is already validated as positive integer by schema
    const { vehicleId } = request.params as { vehicleId: number };

    const newlyAdded = await favoriteModel.addFavorite(request.user.id, vehicleId);

    if (newlyAdded) {
      return reply.code(201).send({ success: true, status: 'created' });
    }

    return reply.code(200).send({ success: true, status: 'already_exists' });
  });

  // Remove a vehicle from favorites
  fastify.delete('/favorites/vehicles/:vehicleId', {
    preHandler: fastify.authenticate,
    schema: {
      params: vehicleIdParamsSchema,
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: vehicleId is already validated as positive integer by schema
    const { vehicleId } = request.params as { vehicleId: number };

    await favoriteModel.removeFavorite(request.user.id, vehicleId);
    return reply.code(204).send();
  });
};

export { favoritesRoutes };
