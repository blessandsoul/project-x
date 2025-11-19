import { FastifyPluginAsync } from 'fastify';
import { DashboardModel } from '../models/DashboardModel.js';
import { AuthenticationError } from '../types/errors.js';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  const dashboardModel = new DashboardModel(fastify);

  fastify.get('/dashboard/summary', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const userId = request.user.id as number;
    const role = (request.user.role as any) ?? 'user';

    const summary = await dashboardModel.getSummaryForUser(userId, role);
    return reply.send(summary);
  });
};

export { dashboardRoutes };
