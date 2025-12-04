import { FastifyPluginAsync } from 'fastify';
import { PortsController } from '../controllers/portsController.js';

const portsRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new PortsController(fastify);

  // GET /api/ports
  // Returns all ports from the database
  fastify.get('/api/ports', async (request, reply) => {
    const ports = await controller.getPorts();
    return reply.send({ success: true, count: ports.length, data: ports });
  });
};

export { portsRoutes };
