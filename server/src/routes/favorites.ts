import { FastifyPluginAsync } from 'fastify';
import { FavoriteModel } from '../models/FavoriteModel.js';
import { ValidationError, AuthenticationError } from '../types/errors.js';

const favoritesRoutes: FastifyPluginAsync = async (fastify) => {
  const favoriteModel = new FavoriteModel(fastify);

  // List current user's favorite vehicles
  fastify.get('/favorites/vehicles', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { page, limit } = request.query as { page?: string; limit?: string };
    const rawLimit = limit ? Number.parseInt(limit, 10) : 20;
    const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20;

    const pageParam = page ? Number.parseInt(page, 10) : 1;
    const safePage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const offset = (safePage - 1) * safeLimit;

    const total = await favoriteModel.countFavorites(request.user.id);
    if (total === 0) {
      return reply.send({ items: [], total: 0, limit: safeLimit, page: 1, totalPages: 1 });
    }

    const items = await favoriteModel.listFavorites(request.user.id, safeLimit, offset);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return reply.send({ items, total, limit: safeLimit, page: safePage, totalPages });
  });

  // Add a vehicle to favorites
  fastify.post('/favorites/vehicles/:vehicleId', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { vehicleId } = request.params as { vehicleId: string };
    const id = Number.parseInt(vehicleId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    await favoriteModel.addFavorite(request.user.id, id);
    return reply.code(201).send({ success: true });
  });

  // Remove a vehicle from favorites
  fastify.delete('/favorites/vehicles/:vehicleId', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { vehicleId } = request.params as { vehicleId: string };
    const id = Number.parseInt(vehicleId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    await favoriteModel.removeFavorite(request.user.id, id);
    return reply.code(204).send();
  });
};

export { favoritesRoutes };
