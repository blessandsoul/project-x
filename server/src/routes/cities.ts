import { FastifyPluginAsync } from 'fastify';
import { CitiesController } from '../controllers/citiesController.js';

const citiesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new CitiesController(fastify);

  // GET /api/cities
  // Returns all cities from the database
  fastify.get('/api/cities', async (request, reply) => {
    const cities = await controller.getCities();
    return reply.send({ success: true, count: cities.length, data: cities });
  });
};

export { citiesRoutes };
