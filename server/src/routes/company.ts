import { FastifyPluginAsync } from 'fastify';
import { CompanyController } from '../controllers/companyController.js';
import {
  CompanyCreate,
  CompanyUpdate,
  CompanySocialLinkUpdate,
  CompanyQuoteCreate,
  CompanyQuoteUpdate,
} from '../types/company.js';
import { ValidationError, AuthorizationError } from '../types/errors.js';
import { parsePagination, buildPaginatedResult } from '../utils/pagination.js';
import { withIdempotency } from '../utils/idempotency.js';
import {
  withCache,
  buildCacheKey,
  buildCacheKeyFromObject,
  invalidateCachePattern,
  CACHE_TTL,
} from '../utils/cache.js';
import {
  uploadCompanyLogo,
  validateImageMime,
} from '../services/ImageUploadService.js';
import { CalculatorRequestBuilder } from '../services/CalculatorRequestBuilder.js';

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
    const cacheKey = 'companies:all';
    const companies = await withCache(
      fastify,
      cacheKey,
      CACHE_TTL.MEDIUM, // 10 minutes
      () => controller.getCompanies(),
    );
    return reply.send(companies);
  });

  /**
   * GET /companies/search
   *
   * Search companies with filters and sorting (cheapest, top-rated, etc.).
   */
  fastify.get('/companies/search', async (request, reply) => {
    const {
      limit,
      offset,
      min_rating,
      min_base_price,
      max_base_price,
      max_total_fee,
      country,
      city,
      is_vip,
      onboarding_free,
      search,
      name,
      order_by,
      order_direction,
    } = request.query as {
      limit?: string;
      offset?: string;
      min_rating?: string;
      min_base_price?: string;
      max_base_price?: string;
      max_total_fee?: string;
      country?: string;
      city?: string;
      is_vip?: string;
      onboarding_free?: string;
      search?: string;
      name?: string;
      order_by?: string;
      order_direction?: string;
    };

    const effectiveSearch = typeof search === 'string' && search.trim().length > 0
      ? search
      : typeof name === 'string' && name.trim().length > 0
        ? name
        : undefined;

    if (typeof effectiveSearch === 'string') {
      const trimmed = effectiveSearch.trim();
      if (trimmed.length > 0 && trimmed.length < 3) {
        return reply.status(400).send({
          error: 'SEARCH_TOO_SHORT',
          message: 'search parameter must be at least 3 characters long when provided',
        });
      }
    }

    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : NaN;
    const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : NaN;

    let typedOrderBy: 'rating' | 'cheapest' | 'name' | 'newest' | undefined;
    if (order_by === 'rating' || order_by === 'cheapest' || order_by === 'name' || order_by === 'newest') {
      typedOrderBy = order_by;
    } else {
      typedOrderBy = undefined;
    }

    let typedOrderDirection: 'asc' | 'desc' | undefined;
    if (order_direction === 'asc' || order_direction === 'desc') {
      typedOrderDirection = order_direction;
    } else {
      typedOrderDirection = undefined;
    }

    const { limit: safeLimit, offset: safeOffset } = parsePagination(
      {
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
      },
      { limit: 10, maxLimit: 100 },
    );

    const params = {
      limit: safeLimit,
      offset: safeOffset,
      minRating: typeof min_rating === 'string' ? Number(min_rating) : undefined,
      minBasePrice: typeof min_base_price === 'string' ? Number(min_base_price) : undefined,
      maxBasePrice: typeof max_base_price === 'string' ? Number(max_base_price) : undefined,
      maxTotalFee: typeof max_total_fee === 'string' ? Number(max_total_fee) : undefined,
      country: country && country.trim().length > 0 ? country : undefined,
      city: city && city.trim().length > 0 ? city : undefined,
      isVip: typeof is_vip === 'string' ? is_vip === 'true' : undefined,
      isOnboardingFree: typeof onboarding_free === 'string' ? onboarding_free === 'true' : undefined,
      search: effectiveSearch && effectiveSearch.trim().length > 0 ? effectiveSearch.trim() : undefined,
      orderBy: typedOrderBy,
      orderDirection: typedOrderDirection,
    };

    // Cache company search results
    const cacheKey = buildCacheKeyFromObject('companies:search', params);
    const result = await withCache(
      fastify,
      cacheKey,
      CACHE_TTL.SHORT, // 5 minutes
      () => controller.searchCompanies(params),
    );

    const { items, total, limit: effectiveLimit, offset: effectiveOffset } = result;
    return reply.send(buildPaginatedResult(items, total, effectiveLimit, effectiveOffset));
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
          base_price: { type: 'number', minimum: 0 },
          price_per_mile: { type: 'number', minimum: 0 },
          customs_fee: { type: 'number', minimum: 0 },
          service_fee: { type: 'number', minimum: 0 },
          broker_fee: { type: 'number', minimum: 0 },
          final_formula: { type: ['object', 'null'] },
          description: { type: ['string', 'null'], maxLength: 2000 },
          phone_number: {
            type: ['string', 'null'],
            maxLength: 20,
            pattern: '^\\+?[0-9\\- ()]{7,20}$',
          },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.user || request.user.role !== 'admin') {
      throw new AuthorizationError('Admin role required to create quotes');
    }
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
          base_price: { type: 'number', minimum: 0 },
          price_per_mile: { type: 'number', minimum: 0 },
          customs_fee: { type: 'number', minimum: 0 },
          service_fee: { type: 'number', minimum: 0 },
          broker_fee: { type: 'number', minimum: 0 },
          final_formula: { type: ['object', 'null'] },
          description: { type: ['string', 'null'], maxLength: 2000 },
          phone_number: {
            type: ['string', 'null'],
            maxLength: 20,
            pattern: '^\\+?[0-9\\- ()]{7,20}$',
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const companyId = parseInt(id, 10);
    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new ValidationError('Invalid company id');
    }

    if (!request.user) {
      throw new AuthorizationError('Authentication required to update company');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === companyId;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to update this company');
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

    if (!request.user) {
      throw new AuthorizationError('Authentication required to delete company');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === companyId;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to delete this company');
    }

    await controller.deleteCompany(companyId);
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------------------
  // Company Social Links: optional, dependent on company_id
  // ---------------------------------------------------------------------------

  /**
   * POST /companies/:id/logo
   *
   * Upload or replace a company logo. Uses ImageUploadService for
   * consistent image processing across the application.
   */
  fastify.post('/companies/:id/logo', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const companyId = parseInt(id, 10);
    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new ValidationError('Invalid company id');
    }

    if (!request.user) {
      throw new AuthorizationError('Authentication required to upload company logos');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === companyId;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to upload logo for this company');
    }

    const file = await (request as any).file();
    if (!file) {
      throw new ValidationError('Logo file is required');
    }

    const mime = file.mimetype as string | undefined;
    try {
      validateImageMime(mime);
    } catch {
      throw new ValidationError('Logo must be an image file');
    }

    const company = await controller.getCompanyById(companyId);
    const slugOrName = (company.slug && company.slug.trim().length > 0)
      ? company.slug
      : company.name;

    const buffer = await file.toBuffer();
    const result = await uploadCompanyLogo(buffer, mime!, slugOrName);

    return reply.code(201).send({
      logoUrl: result.url,
      originalLogoUrl: result.originalUrl,
    });
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
          url: {
            type: 'string',
            minLength: 5,
            maxLength: 500,
            format: 'uri',
            pattern: '^https?://',
          },
        },
      },
    },
  }, async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const id = parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    if (!request.user) {
      throw new AuthorizationError('Authentication required to modify company social links');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === id;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to modify social links for this company');
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
          url: {
            type: 'string',
            minLength: 5,
            maxLength: 500,
            format: 'uri',
            pattern: '^https?://',
          },
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
  // Company Reviews: user-generated reviews tied to company_id
  // ---------------------------------------------------------------------------

  /**
   * GET /companies/:companyId/reviews
   *
   * Fetch all reviews for a company. Public endpoint.
   */
  fastify.get('/companies/:companyId/reviews', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const { limit, offset } = request.query as { limit?: string; offset?: string };

    const id = parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : NaN;
    const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : NaN;

    const { limit: safeLimit, offset: safeOffset } = parsePagination(
      {
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
      },
      { limit: 10, maxLimit: 50 },
    );

    const { items, total, limit: effectiveLimit, offset: effectiveOffset } =
      await controller.getCompanyReviewsPaginated(id, safeLimit, safeOffset);

    return reply.send(buildPaginatedResult(items, total, effectiveLimit, effectiveOffset));
  });

  /**
   * POST /companies/:companyId/reviews
   *
   * Create a new review for a company. Requires authentication. The
   * review is always associated with the authenticated user.
   */
  fastify.post('/companies/:companyId/reviews', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: ['string', 'null'], minLength: 10, maxLength: 2000 },
        },
      },
    },
  }, async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const id = parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    const currentUser = request.user as { id: number; role?: string } | undefined;

    if (!currentUser || typeof currentUser.id !== 'number') {
      throw new ValidationError('Authenticated user is required to create reviews');
    }

    const body = request.body as { rating: number; comment?: string | null };
    const keyHeader = request.headers['idempotency-key'];

    if (!keyHeader || typeof keyHeader !== 'string') {
      const created = await controller.createCompanyReview(id, currentUser.id, body);
      return reply.code(201).send(created);
    }

    const { statusCode, body: responseBody } = await withIdempotency(
      fastify,
      {
        key: keyHeader,
        userId: currentUser.id,
        route: 'POST /companies/:companyId/reviews',
      },
      request.body,
      async () => {
        const created = await controller.createCompanyReview(id, currentUser.id, body);
        return { statusCode: 201, body: created };
      },
    );

    return reply.code(statusCode).send(responseBody);
  });

  /**
   * PUT /companies/:companyId/reviews/:reviewId
   *
   * Update an existing review. Only the owner of the review can update
   * it. Requires authentication.
   */
  fastify.put('/companies/:companyId/reviews/:reviewId', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: ['string', 'null'], minLength: 10, maxLength: 2000 },
        },
      },
    },
  }, async (request, reply) => {
    const { companyId, reviewId } = request.params as { companyId: string; reviewId: string };
    const company = parseInt(companyId, 10);
    const review = parseInt(reviewId, 10);

    if (!Number.isFinite(company) || company <= 0) {
      throw new ValidationError('Invalid company id');
    }
    if (!Number.isFinite(review) || review <= 0) {
      throw new ValidationError('Invalid review id');
    }

    if (!request.user || typeof request.user.id !== 'number') {
      throw new ValidationError('Authenticated user is required to update reviews');
    }

    const updates = request.body as { rating?: number; comment?: string | null };
    const updated = await controller.updateCompanyReview(company, review, request.user.id, updates);
    return reply.send(updated);
  });

  /**
   * DELETE /companies/:companyId/reviews/:reviewId
   *
   * Delete an existing review. Only the owner of the review can delete
   * it. Requires authentication.
   */
  fastify.delete('/companies/:companyId/reviews/:reviewId', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { companyId, reviewId } = request.params as { companyId: string; reviewId: string };
    const company = parseInt(companyId, 10);
    const review = parseInt(reviewId, 10);

    if (!Number.isFinite(company) || company <= 0) {
      throw new ValidationError('Invalid company id');
    }
    if (!Number.isFinite(review) || review <= 0) {
      throw new ValidationError('Invalid review id');
    }

    if (!request.user || typeof request.user.id !== 'number') {
      throw new ValidationError('Authenticated user is required to delete reviews');
    }

    await controller.deleteCompanyReview(company, review, request.user.id);
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------------------
  // Company Quotes: auto-calculated based on vehicle & company pricing
  // ---------------------------------------------------------------------------

  /**
   * POST /vehicles/:vehicleId/calculate-quotes
   *
   * Calculate shipping quotes for ALL companies for a given vehicle.
   * 
   * CLIENT INPUT (JSON body):
   * - auction (string, required): Auction source, e.g., "copart" or "iaai"
   * - usacity (string, required): US city name (can be noisy, will be smart-matched)
   * 
   * SERVER BEHAVIOR:
   * - Normalizes auction to canonical value (e.g., "copart" -> "Copart")
   * - Smart-matches usacity to canonical city from /api/cities
   * - Builds calculator request with strict defaults:
   *   - buyprice: 1 (always)
   *   - vehicletype: "standard" (default)
   *   - vehiclecategory: "Sedan" (default)
   *   - destinationport: "POTI" (default)
   * - Calls POST /api/calculator with normalized values
   * - Returns quotes from all companies
   */
  fastify.post('/vehicles/:vehicleId/calculate-quotes', {
    schema: {
      params: {
        type: 'object',
        required: ['vehicleId'],
        properties: {
          vehicleId: { type: 'integer', minimum: 1 },
        },
      },
      body: {
        type: 'object',
        required: ['auction', 'usacity'],
        properties: {
          auction: { type: 'string', minLength: 1, maxLength: 50 },
          usacity: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50 },
          offset: { type: 'integer', minimum: 0 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
          minRating: { type: 'number', minimum: 0, maximum: 5 },
        },
      },
    },
  }, async (request, reply) => {
    const { vehicleId } = request.params as { vehicleId: string };
    const { auction, usacity } = request.body as { auction: string; usacity: string };
    const { limit, offset, currency, minRating } = request.query as { 
      limit?: number; 
      offset?: number; 
      currency?: string; 
      minRating?: number;
    };
    
    const id = parseInt(vehicleId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    request.log.info(
      { vehicleId: id, auction, usacity, currency },
      'Calculating quotes for vehicle'
    );

    // Build normalized calculator request using smart matching
    const calculatorRequestBuilder = new CalculatorRequestBuilder(fastify);
    const buildResult = await calculatorRequestBuilder.buildCalculatorRequest({
      auction,
      usacity,
    });

    // If city/auction couldn't be matched, return a response indicating price unavailable
    if (!buildResult.success || !buildResult.request) {
      request.log.warn(
        { vehicleId: id, auction, usacity, error: buildResult.error },
        'Could not build calculator request - price calculation unavailable'
      );
      
      // Return a response indicating price couldn't be calculated (not an error)
      return reply.code(200).send({
        vehicle_id: id,
        price_available: false,
        message: buildResult.error || 'Price calculation is not available for this location.',
        unmatched_city: buildResult.unmatchedCity,
        quotes: [],
        total: 0,
        limit: 5,
        offset: 0,
        totalPages: 0,
      });
    }

    const calculatorInput = buildResult.request;

    request.log.info(
      { calculatorInput },
      'Built normalized calculator request'
    );

    // Parse pagination for companies/quotes
    const parsedLimit = typeof limit === 'number' ? limit : NaN;
    const parsedOffset = typeof offset === 'number' ? offset : NaN;

    const { limit: safeLimit, offset: safeOffset } = parsePagination(
      {
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
      },
      { limit: 5, maxLimit: 50 },
    );

    // Cache quote calculations - same vehicle + calculator input + currency + pagination = same result
    const safeMinRating = typeof minRating === 'number' && minRating >= 0 && minRating <= 5 ? minRating : undefined;
    const cacheKey = buildCacheKey(
      'quotes:calculate', 
      id, 
      calculatorInput.auction,
      calculatorInput.usacity || 'none',
      currency || 'USD', 
      safeLimit, 
      safeOffset, 
      safeMinRating ?? 'none'
    );
    
    const fullResult = await withCache(
      fastify,
      cacheKey,
      CACHE_TTL.CALCULATION, // 10 minutes
      () => controller.calculateQuotesForVehicleWithInput(id, calculatorInput, currency, {
        limit: safeLimit,
        offset: safeOffset,
        ...(safeMinRating !== undefined && { minRating: safeMinRating }),
      }),
    );

    const total = typeof fullResult.totalCompanies === 'number'
      ? fullResult.totalCompanies
      : Array.isArray(fullResult.quotes)
        ? fullResult.quotes.length
        : 0;

    const totalPages = total > 0 ? Math.max(1, Math.ceil(total / safeLimit)) : 1;

    // Do not slice quotes here; controller already paginates companies/quotes
    const { totalCompanies, ...rest } = fullResult as any;

    return reply.code(200).send({
      ...rest,
      price_available: true,
      total,
      limit: safeLimit,
      offset: safeOffset,
      totalPages,
    });
  });

  /**
   * GET /vehicles/:vehicleId/cheapest-quotes
   *
   * Calculate quotes for the given vehicle across
   * all companies without persisting them to the database.
   * Intended for vehicle details pages where only the best offers are needed.
   */
  fastify.get('/vehicles/:vehicleId/cheapest-quotes', {
    schema: {
      params: {
        type: 'object',
        required: ['vehicleId'],
        properties: {
          vehicleId: { type: 'integer', minimum: 1 },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 20 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
        },
      },
    },
  }, async (request, reply) => {
    const { vehicleId } = request.params as { vehicleId: string };
    const { limit, currency } = request.query as { limit?: string; currency?: string };
    const id = parseInt(vehicleId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid vehicle id');
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 3;
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 3;

    // Cache cheapest quotes - same vehicle + currency = same result
    const cacheKey = buildCacheKey('quotes:cheapest', id, currency || 'USD', safeLimit);
    const fullResult = await withCache(
      fastify,
      cacheKey,
      CACHE_TTL.CALCULATION, // 10 minutes
      () => controller.calculateQuotesForVehicle(id, currency),
    );

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
  fastify.post('/vehicles/search-quotes', {
    schema: {
      body: {
        type: 'object',
        properties: {
          make: { type: 'string', minLength: 2, maxLength: 100 },
          model: { type: 'string', minLength: 2, maxLength: 100 },
          year: { type: 'integer', minimum: 1950, maximum: 2100 },
          year_from: { type: 'integer', minimum: 1950, maximum: 2100 },
          year_to: { type: 'integer', minimum: 1950, maximum: 2100 },
          price_from: { type: 'number', minimum: 0 },
          price_to: { type: 'number', minimum: 0 },
          mileage_from: { type: 'number', minimum: 0 },
          mileage_to: { type: 'number', minimum: 0 },
          fuel_type: { type: 'string', minLength: 1, maxLength: 50 },
          category: { type: 'string', minLength: 1, maxLength: 50 },
          drive: { type: 'string', minLength: 1, maxLength: 50 },
          limit: { type: 'integer', minimum: 1, maximum: 50 },
          offset: { type: 'integer', minimum: 0 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
        },
      },
    },
  }, async (request, reply) => {
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

    const hasSearchFilter =
      (typeof body.make === 'string' && body.make.trim().length > 0) ||
      (typeof body.model === 'string' && body.model.trim().length > 0) ||
      typeof body.year === 'number' ||
      typeof body.year_from === 'number' ||
      typeof body.year_to === 'number' ||
      typeof body.price_from === 'number' ||
      typeof body.price_to === 'number' ||
      typeof body.mileage_from === 'number' ||
      typeof body.mileage_to === 'number' ||
      (typeof body.fuel_type === 'string' && body.fuel_type.trim().length > 0) ||
      (typeof body.category === 'string' && body.category.trim().length > 0) ||
      (typeof body.drive === 'string' && body.drive.trim().length > 0);

    if (!hasSearchFilter) {
      throw new ValidationError('At least one search filter (make, model, year, price, mileage, fuel_type, category, drive) must be provided');
    }

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
  fastify.post('/vehicles/compare', {
    schema: {
      body: {
        type: 'object',
        required: ['vehicle_ids'],
        properties: {
          vehicle_ids: {
            type: 'array',
            minItems: 1,
            maxItems: 50,
            items: { type: 'integer', minimum: 1 },
          },
          quotes_per_vehicle: { type: 'integer', minimum: 1, maximum: 20 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
        },
      },
    },
  }, async (request, reply) => {
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
  fastify.get('/vehicles/:vehicleId/quotes', {
    schema: {
      params: {
        type: 'object',
        required: ['vehicleId'],
        properties: {
          vehicleId: { type: 'integer', minimum: 1 },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          currency: { type: 'string', minLength: 3, maxLength: 3 },
        },
      },
    },
  }, async (request, reply) => {
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
    const { currency, limit, offset } = request.query as { currency?: string; limit?: string; offset?: string };
    const id = parseInt(companyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid company id');
    }

    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : NaN;
    const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : NaN;

    const { limit: safeLimit, offset: safeOffset } = parsePagination(
      {
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
      },
      { limit: 20, maxLimit: 100 },
    );

    const { items, total, limit: effectiveLimit, offset: effectiveOffset } =
      await controller.getCompanyQuotesPaginated(id, safeLimit, safeOffset, currency);

    return reply.send(buildPaginatedResult(items, total, effectiveLimit, effectiveOffset));
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
        required: ['company_id', 'vehicle_id'],
        properties: {
          company_id: { type: 'integer', minimum: 1 },
          vehicle_id: { type: 'integer', minimum: 1 },
          // All monetary fields (base_price, price_per_mile, fees, total_price)
          // are derived by backend pricing logic; admin does not provide them here.
        },
      },
    },
  }, async (request, reply) => {
    if (!request.user || request.user.role !== 'admin') {
      throw new AuthorizationError('Admin role required to create quotes');
    }

    const payload = request.body as Pick<CompanyQuoteCreate, 'company_id' | 'vehicle_id'>;
    const keyHeader = request.headers['idempotency-key'];

    if (!keyHeader || typeof keyHeader !== 'string') {
      const created = await controller.createQuoteAdmin(payload);
      return reply.code(201).send(created);
    }

    const { statusCode, body } = await withIdempotency(
      fastify,
      {
        key: keyHeader,
        userId: request.user.id,
        route: 'POST /quotes',
      },
      request.body,
      async () => {
        const created = await controller.createQuoteAdmin(payload);
        return { statusCode: 201, body: created };
      },
    );

    return reply.code(statusCode).send(body);
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
          delivery_time_days: { type: ['integer', 'null'], minimum: 0 },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.user || request.user.role !== 'admin') {
      throw new AuthorizationError('Admin role required to update quotes');
    }

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
    if (!request.user || request.user.role !== 'admin') {
      throw new AuthorizationError('Admin role required to delete quotes');
    }
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
