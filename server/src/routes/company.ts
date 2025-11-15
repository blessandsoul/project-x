import { FastifyPluginAsync } from 'fastify';
import { CompanyController } from '../controllers/companyController.js';
import {
  CompanyCreate,
  CompanyUpdate,
  CompanySocialLinkUpdate,
  CompanyQuoteCreate,
  CompanyQuoteUpdate,
} from '../types/company.js';
import { ValidationError } from '../types/errors.js';

/**
 * Company, Social Links, and Quotes Routes
 *
 * This route module covers three related tables:
 * - companies: core, independent shipping companies
 * - company_social_links: optional social URLs attached to a company
 * - company_quotes: calculated shipping quotes per company & vehicle
 *
 * Important concepts:
 * - Companies must be created first; they are referenced by both
 *   social links and quotes using company_id.
 * - Social links are optional; they are only created when a company
 *   actually has social URLs and are never auto-created.
 * - Quotes are usually created automatically by the backend when a
 *   vehicle is selected or a quote calculation is requested. In
 *   normal user flows, clients do not provide company_id; the backend
 *   iterates over all companies and creates one quote per company.
 */
const companyRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new CompanyController(fastify);

  // ---------------------------------------------------------------------------
  // Companies: CRUD for core company entities
  // ---------------------------------------------------------------------------

  /**
   * GET /companies
   *
   * Fetch all companies. Companies are the primary, independent entities
   * in this domain and must exist before any social links or quotes
   * can be created.
   */
  fastify.get('/companies', async (request, reply) => {
    const companies = await controller.getCompanies();
    return reply.send(companies);
  });

  /**
   * GET /companies/:id
   *
   * Fetch a single company by ID, including its related social links
   * and quotes. This makes it easy for clients to see all data that
   * hangs off a company in one call.
   */
  fastify.get('/companies/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const companyId = parseInt(id, 10);
    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new ValidationError('Invalid company id');
    }

    const company = await controller.getCompanyById(companyId);
    return reply.send(company);
  });

  /**
   * POST /companies
   *
   * Create a new company. Companies are independent and must exist
   * before you can attach social links or quotes to them.
   *
   * Body requires pricing fields so that quotes can be calculated
   * later using backend logic.
   */
  fastify.post('/companies', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'base_price', 'price_per_mile', 'customs_fee', 'service_fee', 'broker_fee'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          logo: { type: 'string', nullable: true },
          base_price: { type: 'number' },
          price_per_mile: { type: 'number' },
          customs_fee: { type: 'number' },
          service_fee: { type: 'number' },
          broker_fee: { type: 'number' },
          final_formula: { type: ['object', 'null'] },
          description: { type: ['string', 'null'] },
          phone_number: { type: ['string', 'null'] },
        },
      },
    },
  }, async (request, reply) => {
    const payload = request.body as CompanyCreate;
    const created = await controller.createCompany(payload);
    return reply.code(201).send(created);
  });

  /**
   * PUT /companies/:id
   *
   * Update an existing company. Only the provided fields are updated.
   * If the company does not exist, a 404 Not Found is returned.
   */
  fastify.put('/companies/:id', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          logo: { type: 'string', nullable: true },
          base_price: { type: 'number' },
          price_per_mile: { type: 'number' },
          customs_fee: { type: 'number' },
          service_fee: { type: 'number' },
          broker_fee: { type: 'number' },
          final_formula: { type: ['object', 'null'] },
          description: { type: ['string', 'null'] },
          phone_number: { type: ['string', 'null'] },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const companyId = parseInt(id, 10);
    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new ValidationError('Invalid company id');
    }

    const updates = request.body as CompanyUpdate;
    const updated = await controller.updateCompany(companyId, updates);
    return reply.send(updated);
  });

  /**
   * DELETE /companies/:id
   *
   * Delete a company. The underlying CompanyModel is responsible for
   * cascading deletes to company_social_links and company_quotes so
   * that no orphaned records remain.
   */
  fastify.delete('/companies/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const companyId = parseInt(id, 10);
    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new ValidationError('Invalid company id');
    }

    await controller.deleteCompany(companyId);
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------------------
  // Company Social Links: optional, dependent on company_id
  // ---------------------------------------------------------------------------

  /**
   * GET /companies/:companyId/social-links
   *
   * Fetch all social links for a company. Social links are optional and
   * only exist if a company has related social profiles. The company_id
   * must be valid; otherwise a 404 Not Found is returned.
   */
  fastify.get('/companies/:companyId/social-links', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const id = parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    const links = await controller.getSocialLinks(id);
    return reply.send(links);
  });

  /**
   * POST /companies/:companyId/social-links
   *
   * Create a new social link for a company. Social links are never
   * auto-created when a company is created; they must be explicitly
   * added when needed.
   */
  fastify.post('/companies/:companyId/social-links', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', minLength: 1, maxLength: 500 },
        },
      },
    },
  }, async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const id = parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    const body = request.body as { url: string };
    const created = await controller.createSocialLink(id, body.url);
    return reply.code(201).send(created);
  });

  /**
   * PUT /social-links/:id
   *
   * Update an existing social link. This route is independent of the
   * company path and operates directly on the social link id.
   */
  fastify.put('/social-links/:id', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          url: { type: 'string', minLength: 1, maxLength: 500 },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const linkId = parseInt(id, 10);
    if (!Number.isFinite(linkId) || linkId <= 0) {
      throw new ValidationError('Invalid social link id');
    }

    const updates = request.body as CompanySocialLinkUpdate;
    const updated = await controller.updateSocialLink(linkId, updates);
    return reply.send(updated);
  });

  /**
   * DELETE /social-links/:id
   *
   * Delete a social link. This does not affect the parent company.
   */
  fastify.delete('/social-links/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const linkId = parseInt(id, 10);
    if (!Number.isFinite(linkId) || linkId <= 0) {
      throw new ValidationError('Invalid social link id');
    }

    await controller.deleteSocialLink(linkId);
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------------------
  // Company Quotes: auto-calculated based on vehicle & company pricing
  // ---------------------------------------------------------------------------

  /**
   * POST /vehicles/:vehicleId/calculate-quotes
   *
   * Calculate quotes for ALL companies for a given vehicle. The client
   * only provides vehicleId in the URL and never sends distance or
   * company_id. The backend:
   * - Loads the vehicle (including yard_name and source)
   * - Derives distance_miles from yard_name -> Poti, Georgia
   * - Loads all companies and creates one company_quotes row per company
   * - Returns a vehicle + quotes object to the frontend.
   */
  fastify.post('/vehicles/:vehicleId/calculate-quotes', async (request, reply) => {
    const { vehicleId } = request.params as { vehicleId: string };
    const { currency } = request.query as { currency?: string };
    const id = parseInt(vehicleId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    const result = await controller.calculateQuotesForVehicle(id, currency);

    return reply.code(201).send(result);
  });

  /**
   * GET /vehicles/:vehicleId/cheapest-quotes
   *
   * Compute and return the cheapest quotes for a single vehicle across
   * all companies without persisting them to the database. Intended for
   * vehicle details pages where only the best offers are needed.
   */
  fastify.get('/vehicles/:vehicleId/cheapest-quotes', async (request, reply) => {
    const { vehicleId } = request.params as { vehicleId: string };
    const { limit, currency } = request.query as { limit?: string; currency?: string };
    const id = parseInt(vehicleId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 3;
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 3;

    const fullResult = await controller.calculateQuotesForVehicle(id, currency);
    const quotes = fullResult.quotes.slice(0, safeLimit);
    return reply.send({ ...fullResult, quotes });
  });

  /**
   * POST /vehicles/search-quotes
   *
   * Calculate quotes for a filtered, paginated list of vehicles
   * WITHOUT persisting results to company_quotes. This endpoint is
   * intended for search/list screens where the client wants to see
   * multiple vehicle + quote options in a single call based on
   * make/model/year filters.
   *
   * Request body example:
   * {
   *   "make": "Ford",        // optional, partial match
   *   "model": "Escape",     // optional, partial match
   *   "year": 2015,          // optional
   *   "limit": 10,           // optional, default 20, max 50
   *   "offset": 0            // optional, default 0
   * }
   */
  fastify.post('/vehicles/search-quotes', async (request, reply) => {
    const body = request.body as {
      make?: string;
      model?: string;
      year?: number;
      year_from?: number;
      year_to?: number;
      price_from?: number;
      price_to?: number;
      mileage_from?: number;
      mileage_to?: number;
      fuel_type?: string;
      category?: string;
      drive?: string;
      limit?: number;
      offset?: number;
      currency?: string;
    };

    const filters: {
      make?: string;
      model?: string;
      year?: number;
      yearFrom?: number;
      yearTo?: number;
      priceFrom?: number;
      priceTo?: number;
      mileageFrom?: number;
      mileageTo?: number;
      fuelType?: string;
      category?: string;
      drive?: string;
    } = {};
    if (typeof body.make === 'string' && body.make.trim().length > 0) {
      filters.make = body.make;
    }
    if (typeof body.model === 'string' && body.model.trim().length > 0) {
      filters.model = body.model;
    }
    if (typeof body.year === 'number') {
      filters.year = body.year;
    }
    if (typeof body.year_from === 'number') {
      filters.yearFrom = body.year_from;
    }
    if (typeof body.year_to === 'number') {
      filters.yearTo = body.year_to;
    }
    if (typeof body.price_from === 'number') {
      filters.priceFrom = body.price_from;
    }
    if (typeof body.price_to === 'number') {
      filters.priceTo = body.price_to;
    }
    if (typeof body.mileage_from === 'number') {
      filters.mileageFrom = body.mileage_from;
    }
    if (typeof body.mileage_to === 'number') {
      filters.mileageTo = body.mileage_to;
    }
    if (typeof body.fuel_type === 'string' && body.fuel_type.trim().length > 0) {
      filters.fuelType = body.fuel_type;
    }
    if (typeof body.category === 'string' && body.category.trim().length > 0) {
      filters.category = body.category;
    }
    if (typeof body.drive === 'string' && body.drive.trim().length > 0) {
      filters.drive = body.drive;
    }

    const limit = typeof body.limit === 'number' ? body.limit : 20;
    const offset = typeof body.offset === 'number' ? body.offset : 0;

    const result = await controller.searchQuotesForVehicles(filters, limit, offset, body.currency);
    return reply.send(result);
  });

  /**
   * POST /vehicles/compare
   *
   * Compare quotes for a fixed list of vehicles. The client provides a
   * small array of vehicle IDs (e.g. from favorites or a search
   * result), and the backend computes quotes for each and returns a
   * comparison-friendly structure in a single response.
   */
  fastify.post('/vehicles/compare', async (request, reply) => {
    const body = request.body as {
      vehicle_ids?: number[];
      quotes_per_vehicle?: number;
      currency?: string;
    };

    const vehicleIds = Array.isArray(body.vehicle_ids) ? body.vehicle_ids : [];
    if (!vehicleIds.length) {
      throw new ValidationError('vehicle_ids array is required and must not be empty');
    }

    const quotesPerVehicle = typeof body.quotes_per_vehicle === 'number'
      ? body.quotes_per_vehicle
      : 3;

    const result = await controller.compareVehicles(vehicleIds, quotesPerVehicle, body.currency);
    return reply.send(result);
  });

  /**
   * GET /vehicles/:vehicleId/quotes
   *
   * Fetch all quotes for a given vehicle across all companies. This
   * endpoint is typically used by the frontend to show the list of
   * available offers for a selected vehicle.
   */
  fastify.get('/vehicles/:vehicleId/quotes', async (request, reply) => {
    const { vehicleId } = request.params as { vehicleId: string };
    const { currency } = request.query as { currency?: string };
    const id = parseInt(vehicleId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    const quotes = await controller.getQuotesByVehicle(id, currency);
    return reply.send(quotes);
  });

  /**
   * GET /companies/:companyId/quotes
   *
   * Fetch all quotes for a specific company across all vehicles.
   * Useful for admin or reporting views filtered by company.
   */
  fastify.get('/companies/:companyId/quotes', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const { currency } = request.query as { currency?: string };
    const id = parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    const quotes = await controller.getQuotesByCompany(id, currency);
    return reply.send(quotes);
  });

  /**
   * POST /quotes (Admin-only)
   *
   * Optional admin endpoint to create a quote manually. In this flow,
   * the client provides both company_id and vehicle_id (typically via
   * dropdowns in an admin panel). This should not be used in general
   * user-facing flows where IDs are not visible.
   */
  fastify.post('/quotes', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['company_id', 'vehicle_id', 'total_price'],
        properties: {
          company_id: { type: 'integer', minimum: 1 },
          vehicle_id: { type: 'integer', minimum: 1 },
          total_price: { type: 'number' },
          breakdown: { type: ['object', 'null'] },
          delivery_time_days: { type: ['integer', 'null'], minimum: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const payload = request.body as CompanyQuoteCreate;
    const created = await controller.createQuoteAdmin(payload);
    return reply.code(201).send(created);
  });

  /**
   * PUT /quotes/:id
   *
   * Update an existing quote. This is primarily intended for admin
   * use (e.g. correcting a quote). Normal user flows should not
   * directly manipulate quote records.
   */
  fastify.put('/quotes/:id', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          total_price: { type: 'number' },
          breakdown: { type: ['object', 'null'] },
          delivery_time_days: { type: ['integer', 'null'], minimum: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const quoteId = parseInt(id, 10);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      throw new ValidationError('Invalid quote id');
    }

    const updates = request.body as CompanyQuoteUpdate;
    const updated = await controller.updateQuote(quoteId, updates);
    return reply.send(updated);
  });

  /**
   * DELETE /quotes/:id
   *
   * Delete a quote. This is another admin-focused operation and should
   * not generally be exposed in public user interfaces.
   */
  fastify.delete('/quotes/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const quoteId = parseInt(id, 10);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      throw new ValidationError('Invalid quote id');
    }

    await controller.deleteQuote(quoteId);
    return reply.code(204).send();
  });
};

export { companyRoutes };
