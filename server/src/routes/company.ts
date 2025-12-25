import { FastifyPluginAsync } from 'fastify';
import { CompanyController } from '../controllers/companyController.js';
import {
  CompanyCreate,
  CompanyUpdate,
  CompanySocialLinkUpdate,
  CompanyQuoteCreate,
  CompanyQuoteUpdate,
} from '../types/company.js';
import { ValidationError, AuthorizationError, NotFoundError, ConflictError } from '../types/errors.js';
import { CompanyModel } from '../models/CompanyModel.js';
import { UserModel } from '../models/UserModel.js';
import { invalidateUserCache } from '../utils/cache.js';
import { validateAndNormalizeSocialUrl } from '../utils/sanitize.js';
import { requireCompanyMembership } from '../middleware/rbac.js';
import { parsePagination, buildPaginatedResult } from '../utils/pagination.js';
import { withIdempotency } from '../utils/idempotency.js';
import {
  withVersionedCache,
  incrementCacheVersion,
  CACHE_TTL,
} from '../utils/cache.js';
import { createRateLimitHandler, RATE_LIMITS, userScopedKeyGenerator } from '../utils/rateLimit.js';
import {
  uploadCompanyLogoSecure,
  deleteCompanyLogo,
  getCompanyLogoUrls,
} from '../services/ImageUploadService.js';
import { CalculatorRequestBuilder } from '../services/CalculatorRequestBuilder.js';
import {
  idParamsSchema,
  companyIdParamsSchema,
  vehicleIdParamsSchema,
  companyReviewParamsSchema,
  positiveIntegerSchema,
  paginationLimitSchema,
  paginationOffsetSchema,
} from '../schemas/commonSchemas.js';

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
  const companyModel = new CompanyModel(fastify);
  const userModel = new UserModel(fastify);

  // ---------------------------------------------------------------------------
  // Company Onboarding (Option B: 2-step registration)
  // ---------------------------------------------------------------------------

  /**
   * POST /companies/onboard
   *
   * Create a company for the authenticated user (2-step onboarding).
   * 
   * Prerequisites:
   * - User must be authenticated (cookie auth)
   * - User must NOT already have a company (company_id IS NULL)
   * 
   * After success:
   * - Creates company with owner_user_id = user.id
   * - Updates user.role = 'company'
   * - Updates user.company_id = company.id
   * 
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Rate limit: 3 requests per hour per user
   */
  fastify.post('/companies/onboard', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          // Required
          name: { type: 'string', minLength: 1, maxLength: 255 },
          // Contact info (optional)
          companyPhone: { type: 'string', minLength: 3, maxLength: 50 },
          contactEmail: { type: 'string', format: 'email', maxLength: 255 },
          website: { type: 'string', maxLength: 255 },
          // Location (optional)
          country: { type: 'string', maxLength: 100 },
          city: { type: 'string', maxLength: 100 },
          state: { type: 'string', maxLength: 100 },
          // Company details (optional) - Multi-language descriptions
          descriptionGeo: { type: 'string', maxLength: 5000 },
          descriptionEng: { type: 'string', maxLength: 5000 },
          descriptionRus: { type: 'string', maxLength: 5000 },
          establishedYear: { type: 'integer', minimum: 1900, maximum: 2100 },
          services: { type: 'array', items: { type: 'string', maxLength: 100 }, maxItems: 20 },
          // Pricing (optional, defaults to 0 or null)
          basePrice: { type: 'number', minimum: 0 },
          pricePerMile: { type: 'number', minimum: 0 },
          customsFee: { type: 'number', minimum: 0 },
          serviceFee: { type: 'number', minimum: 0 },
          brokerFee: { type: 'number', minimum: 0 },
        },
        additionalProperties: false,
      },
    },
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    const currentUser = request.user;

    if (!currentUser || typeof currentUser.id !== 'number') {
      throw new AuthorizationError('Authentication required');
    }

    // Fetch fresh user data to check is_blocked and current company_id
    const freshUser = await userModel.findById(currentUser.id);
    if (!freshUser) {
      throw new AuthorizationError('User not found');
    }

    // Check if user is blocked
    if (freshUser.is_blocked) {
      throw new AuthorizationError('Account is blocked');
    }

    // Check if user already has a company (belt)
    if (freshUser.company_id !== null && freshUser.company_id !== undefined) {
      throw new ConflictError('User already has a company');
    }

    // Double-check: verify no company exists with this owner_user_id (suspenders)
    const existingCompany = await companyModel.findByOwnerUserId(currentUser.id);
    if (existingCompany) {
      throw new ConflictError('User already owns a company');
    }

    const {
      name,
      companyPhone,
      contactEmail,
      website,
      country,
      city,
      state,
      descriptionGeo,
      descriptionEng,
      descriptionRus,
      establishedYear,
      services,
      basePrice,
      pricePerMile,
      customsFee,
      serviceFee,
      brokerFee,
    } = request.body as {
      name: string;
      companyPhone?: string;
      contactEmail?: string;
      website?: string;
      country?: string;
      city?: string;
      state?: string;
      descriptionGeo?: string;
      descriptionEng?: string;
      descriptionRus?: string;
      establishedYear?: number;
      services?: string[];
      basePrice?: number;
      pricePerMile?: number;
      customsFee?: number;
      serviceFee?: number;
      brokerFee?: number;
    };

    // Trim and validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new ValidationError('Company name cannot be empty');
    }

    // Use transaction for atomicity
    const connection = await (fastify as any).mysql.getConnection();

    try {
      await connection.beginTransaction();

      // Create company with owner_user_id
      const createdCompany = await companyModel.create({
        name: trimmedName,
        owner_user_id: currentUser.id,
        phone_number: companyPhone?.trim() ?? null,
        contact_email: contactEmail?.trim() ?? null,
        website: website?.trim() ?? null,
        country: country?.trim() ?? null,
        city: city?.trim() ?? null,
        state: state?.trim() ?? null,
        description_geo: descriptionGeo?.trim() ?? null,
        description_eng: descriptionEng?.trim() ?? null,
        description_rus: descriptionRus?.trim() ?? null,
        established_year: typeof establishedYear === 'number' ? establishedYear : null,
        services: Array.isArray(services) ? services : null,
        base_price: typeof basePrice === 'number' ? basePrice : 0,
        price_per_mile: typeof pricePerMile === 'number' ? pricePerMile : 0,
        customs_fee: typeof customsFee === 'number' ? customsFee : 0,
        service_fee: typeof serviceFee === 'number' ? serviceFee : 0,
        broker_fee: typeof brokerFee === 'number' ? brokerFee : 0,
      });

      // Update user: set role='company' and company_id
      await userModel.update(currentUser.id, {
        role: 'company',
        company_id: createdCompany.id,
      });

      await connection.commit();

      // Invalidate user cache so next /auth/me returns updated role
      await invalidateUserCache(fastify, currentUser.id);

      // Fetch updated user
      const updatedUser = await userModel.findById(currentUser.id);

      fastify.log.info({
        userId: currentUser.id,
        companyId: createdCompany.id,
      }, 'Company onboarded successfully');

      return reply.code(201).send({
        company: {
          id: createdCompany.id,
          name: createdCompany.name,
          slug: createdCompany.slug,
          phone_number: createdCompany.phone_number,
          contact_email: createdCompany.contact_email,
          website: createdCompany.website,
          country: createdCompany.country,
          city: createdCompany.city,
          state: createdCompany.state,
          description_geo: createdCompany.description_geo,
          description_eng: createdCompany.description_eng,
          description_rus: createdCompany.description_rus,
          established_year: createdCompany.established_year,
          base_price: createdCompany.base_price,
          price_per_mile: createdCompany.price_per_mile,
          customs_fee: createdCompany.customs_fee,
          service_fee: createdCompany.service_fee,
          broker_fee: createdCompany.broker_fee,
          rating: createdCompany.rating,
          is_vip: createdCompany.is_vip,
          created_at: createdCompany.created_at,
        },
        user: updatedUser ? {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          company_id: updatedUser.company_id,
        } : null,
      });
    } catch (error: any) {
      await connection.rollback();

      // Handle MySQL duplicate key error (race condition on UNIQUE owner_user_id)
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new ConflictError('User already owns a company');
      }

      throw error;
    } finally {
      connection.release();
    }
  });

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
    const companies = await withVersionedCache(
      fastify,
      'companies',
      ['all'],
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
  fastify.get('/companies/search', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          min_rating: { type: 'number', minimum: 0, maximum: 5 },
          min_base_price: { type: 'number', minimum: 0 },
          max_base_price: { type: 'number', minimum: 0 },
          max_total_fee: { type: 'number', minimum: 0 },
          country: { type: 'string', maxLength: 100 },
          city: { type: 'string', maxLength: 100 },
          is_vip: { type: 'boolean' },
          onboarding_free: { type: 'boolean' },
          search: { type: 'string', maxLength: 100 },
          name: { type: 'string', maxLength: 100 },
          order_by: { type: 'string', enum: ['rating', 'cheapest', 'name', 'newest'] },
          order_direction: { type: 'string', enum: ['asc', 'desc'] },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: All query params are validated by schema - types guaranteed
    const {
      limit = 10,
      offset = 0,
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
      limit?: number;
      offset?: number;
      min_rating?: number;
      min_base_price?: number;
      max_base_price?: number;
      max_total_fee?: number;
      country?: string;
      city?: string;
      is_vip?: boolean;
      onboarding_free?: boolean;
      search?: string;
      name?: string;
      order_by?: 'rating' | 'cheapest' | 'name' | 'newest';
      order_direction?: 'asc' | 'desc';
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

    const { limit: safeLimit, offset: safeOffset } = parsePagination(
      { limit, offset },
      { limit: 10, maxLimit: 100 },
    );

    const params = {
      limit: safeLimit,
      offset: safeOffset,
      minRating: min_rating,
      minBasePrice: min_base_price,
      maxBasePrice: max_base_price,
      maxTotalFee: max_total_fee,
      country: country && country.trim().length > 0 ? country : undefined,
      city: city && city.trim().length > 0 ? city : undefined,
      isVip: is_vip,
      isOnboardingFree: onboarding_free,
      search: effectiveSearch && effectiveSearch.trim().length > 0 ? effectiveSearch.trim() : undefined,
      orderBy: order_by,
      orderDirection: order_direction,
    };

    // Cache company search results (versioned)
    const result = await withVersionedCache(
      fastify,
      'companies',
      ['search', JSON.stringify(params)],
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
  fastify.get('/companies/:id', {
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };
    const company = await controller.getCompanyById(id);
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
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Authorization: Admin only (via requireAdmin middleware)
   */
  fastify.post('/companies', {
    preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
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
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // Admin check handled by requireAdmin middleware
    const payload = request.body as CompanyCreate;
    const created = await controller.createCompany(payload);

    // Bump cache version so all company caches are invalidated
    await incrementCacheVersion(fastify, 'companies');

    return reply.code(201).send(created);
  });

  /**
   * PUT /companies/:id
   *
   * Update an existing company. Only the provided fields are updated.
   * If the company does not exist, a 404 Not Found is returned.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.put('/companies/:id', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection, requireCompanyMembership()],
    schema: {
      params: idParamsSchema,
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          // Contact info
          phone_number: { type: ['string', 'null'], maxLength: 50 },
          contact_email: { type: ['string', 'null'], format: 'email', maxLength: 255 },
          website: { type: ['string', 'null'], maxLength: 255 },
          // Location
          country: { type: ['string', 'null'], maxLength: 100 },
          city: { type: ['string', 'null'], maxLength: 100 },
          state: { type: ['string', 'null'], maxLength: 100 },
          // Company details - Multi-language descriptions
          description_geo: { type: ['string', 'null'], maxLength: 5000 },
          description_eng: { type: ['string', 'null'], maxLength: 5000 },
          description_rus: { type: ['string', 'null'], maxLength: 5000 },
          established_year: { type: ['integer', 'null'], minimum: 1900, maximum: 2100 },
          services: { type: ['array', 'null'], items: { type: 'string', maxLength: 100 }, maxItems: 20 },
          // Pricing
          base_price: { type: 'number', minimum: 0 },
          price_per_mile: { type: 'number', minimum: 0 },
          customs_fee: { type: 'number', minimum: 0 },
          service_fee: { type: 'number', minimum: 0 },
          broker_fee: { type: 'number', minimum: 0 },
          final_formula: { type: ['object', 'null'] },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    if (!request.user) {
      throw new AuthorizationError('Authentication required to update company');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === id;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to update this company');
    }

    const updates = request.body as CompanyUpdate;
    const updated = await controller.updateCompany(id, updates);

    // Bump cache version so all company caches are invalidated
    await incrementCacheVersion(fastify, 'companies');

    return reply.send(updated);
  });

  /**
   * DELETE /companies/:id
   *
   * Delete a company. The underlying CompanyModel is responsible for
   * cascading deletes to company_social_links and company_quotes so
   * that no orphaned records remain.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.delete('/companies/:id', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    if (!request.user) {
      throw new AuthorizationError('Authentication required to delete company');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === id;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to delete this company');
    }

    await controller.deleteCompany(id);

    // Bump cache version so all company caches are invalidated
    await incrementCacheVersion(fastify, 'companies');

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
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   *
   * Security:
   * - Max file size: 2 MB
   * - Allowed types: JPEG, PNG, WEBP only
   * - Magic byte verification (prevents polyglots)
   * - Image sanitization via sharp (strips metadata, re-encodes)
   */
  fastify.post('/companies/:id/logo', {
    preHandler: [
      fastify.authenticateCookie,
      fastify.csrfProtection,
      createRateLimitHandler(fastify, {
        ...RATE_LIMITS.fileUpload,
        keyPrefix: 'rl:logo',
        keyGenerator: userScopedKeyGenerator,
      }),
    ],
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    if (!request.user) {
      throw new AuthorizationError('Authentication required to upload company logos');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === id;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to upload logo for this company');
    }

    // Get file from multipart request
    const file = await (request as any).file();
    if (!file) {
      throw new ValidationError('Logo file is required');
    }

    // Get company for slug/name (used in storage path)
    const company = await controller.getCompanyById(id);
    const slugOrName = (company.slug && company.slug.trim().length > 0)
      ? company.slug
      : company.name;

    // Read file buffer and declared MIME (not trusted)
    const buffer = await file.toBuffer();
    const declaredMime = file.mimetype as string | undefined;

    // SECURITY: Use secure upload with full validation pipeline
    // - Size limit check
    // - Magic byte verification
    // - Image sanitization via sharp
    // - Path traversal prevention
    let result;
    try {
      result = await uploadCompanyLogoSecure(buffer, declaredMime, slugOrName);
    } catch (err) {
      // Convert validation errors to ValidationError for consistent error response
      const message = err instanceof Error ? err.message : 'Invalid image file';
      throw new ValidationError(message);
    }

    return reply.code(201).send({
      logoUrl: result.url,
      originalLogoUrl: result.url, // Both point to sanitized version for security
    });
  });

  /**
   * PUT /companies/:id/logo
   *
   * Alias for POST /companies/:id/logo (idempotent update semantics).
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.put('/companies/:id/logo', {
    preHandler: [
      fastify.authenticateCookie,
      fastify.csrfProtection,
      createRateLimitHandler(fastify, {
        ...RATE_LIMITS.fileUpload,
        keyPrefix: 'rl:logo',
        keyGenerator: userScopedKeyGenerator,
      }),
    ],
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    if (!request.user) {
      throw new AuthorizationError('Authentication required to upload company logos');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === id;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to upload logo for this company');
    }

    const file = await (request as any).file();
    if (!file) {
      throw new ValidationError('Logo file is required');
    }

    const company = await controller.getCompanyById(id);
    const slugOrName = (company.slug && company.slug.trim().length > 0)
      ? company.slug
      : company.name;

    const buffer = await file.toBuffer();
    const declaredMime = file.mimetype as string | undefined;

    let result;
    try {
      result = await uploadCompanyLogoSecure(buffer, declaredMime, slugOrName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid image file';
      throw new ValidationError(message);
    }

    return reply.code(200).send({
      logoUrl: result.url,
      originalLogoUrl: result.url,
    });
  });

  /**
   * GET /companies/:id/logo
   *
   * Get URLs for the company's logo.
   *
   * Auth: Not required (public)
   */
  fastify.get('/companies/:id/logo', {
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    const company = await controller.getCompanyById(id);
    const slugOrName = (company.slug && company.slug.trim().length > 0)
      ? company.slug
      : company.name;

    const urls = await getCompanyLogoUrls(slugOrName);

    return reply.send({
      logoUrl: urls.url,
      originalLogoUrl: urls.url, // Both point to sanitized version
    });
  });

  /**
   * DELETE /companies/:id/logo
   *
   * Delete the company's logo files.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.delete('/companies/:id/logo', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    if (!request.user) {
      throw new AuthorizationError('Authentication required to delete company logos');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === id;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to delete logo for this company');
    }

    const company = await controller.getCompanyById(id);
    const slugOrName = (company.slug && company.slug.trim().length > 0)
      ? company.slug
      : company.name;

    await deleteCompanyLogo(slugOrName);

    return reply.code(204).send();
  });

  // ---------------------------------------------------------------------------
  // Company Social Links: optional, dependent on company_id
  // ---------------------------------------------------------------------------

  /**
   * GET /companies/:companyId/social-links
   *
   * Fetch structured social links for a company.
   * Returns: { website: {...} | null, social_links: [...] }
   * 
   * - website: The company's main website (1 max)
   * - social_links: Social media profiles (2 max, facebook/instagram only)
   */
  fastify.get('/companies/:companyId/social-links', {
    schema: {
      params: companyIdParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };
    const structuredLinks = await controller.getStructuredSocialLinks(companyId);
    return reply.send(structuredLinks);
  });

  /**
   * POST /companies/:companyId/social-links
   *
   * Create a new social link for a company.
   * 
   * Constraints:
   * - link_type='website': Only 1 allowed per company
   * - link_type='social': Max 2 allowed, platform required (facebook/instagram)
   * - No duplicate platforms allowed
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Authorization: Admin OR company owner
   */
  fastify.post('/companies/:companyId/social-links', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: companyIdParamsSchema,
      body: {
        type: 'object',
        required: ['link_type', 'url'],
        properties: {
          link_type: {
            type: 'string',
            enum: ['website', 'social'],
          },
          platform: {
            type: 'string',
            enum: ['facebook', 'instagram'],
          },
          url: {
            type: 'string',
            minLength: 5,
            maxLength: 500,
          },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };

    if (!request.user) {
      throw new AuthorizationError('Authentication required to modify company social links');
    }

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === companyId;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to modify social links for this company');
    }

    const body = request.body as {
      link_type: 'website' | 'social';
      platform?: 'facebook' | 'instagram';
      url: string;
    };

    // Validate platform is provided for social links
    if (body.link_type === 'social' && !body.platform) {
      throw new ValidationError('Platform is required for social links');
    }

    // SECURITY: Strict URL validation (protocol, no credentials, etc.)
    let validatedUrl: string;
    try {
      validatedUrl = validateAndNormalizeSocialUrl(body.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid URL';
      throw new ValidationError(message);
    }

    try {
      const created = await controller.createSocialLink(
        companyId,
        body.link_type,
        validatedUrl,
        body.platform ?? null
      );
      return reply.code(201).send(created);
    } catch (err) {
      // Convert model errors to proper HTTP errors
      if (err instanceof Error) {
        if (err.message.includes('already has a website') ||
          err.message.includes('maximum 2 social links') ||
          err.message.includes('already exists')) {
          throw new ConflictError(err.message);
        }
        if (err.message.includes('Unsupported') || err.message.includes('required')) {
          throw new ValidationError(err.message);
        }
      }
      throw err;
    }
  });

  /**
   * PUT /social-links/:id
   *
   * Update an existing social link. This route operates directly on
   * the social link id and requires admin or owner authorization.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Authorization: Admin OR owner of the company that owns this link
   */
  fastify.put('/social-links/:id', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
      body: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            minLength: 5,
            maxLength: 500,
          },
          platform: {
            type: 'string',
            enum: ['facebook', 'instagram'],
          },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    if (!request.user) {
      throw new AuthorizationError('Authentication required to modify social links');
    }

    // Load social link to check ownership
    const socialLink = await controller.getSocialLinkById(id);

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === socialLink.company_id;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to modify this social link');
    }

    const body = request.body as { url?: string; platform?: 'facebook' | 'instagram' };
    const updates: CompanySocialLinkUpdate = {};

    // SECURITY: Strict URL validation if URL is being updated
    if (body.url !== undefined) {
      try {
        updates.url = validateAndNormalizeSocialUrl(body.url);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid URL';
        throw new ValidationError(message);
      }
    }

    // Allow platform updates for social links
    if (body.platform !== undefined) {
      updates.platform = body.platform;
    }

    const updated = await controller.updateSocialLink(id, updates);
    return reply.send(updated);
  });

  /**
   * DELETE /social-links/:id
   *
   * Delete a social link. This does not affect the parent company.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Authorization: Admin OR owner of the company that owns this link
   */
  fastify.delete('/social-links/:id', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    if (!request.user) {
      throw new AuthorizationError('Authentication required to delete social links');
    }

    // Load social link to check ownership
    const socialLink = await controller.getSocialLinkById(id);

    const isAdmin = request.user.role === 'admin';
    const isCompanyOwner =
      request.user.role === 'company' &&
      typeof request.user.company_id === 'number' &&
      request.user.company_id === socialLink.company_id;

    if (!isAdmin && !isCompanyOwner) {
      throw new AuthorizationError('Not authorized to delete this social link');
    }

    await controller.deleteSocialLink(id);
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
  fastify.get('/companies/:companyId/reviews', {
    schema: {
      params: companyIdParamsSchema,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };
    const { limit = 10, offset = 0 } = request.query as { limit?: number; offset?: number };

    const { limit: safeLimit, offset: safeOffset } = parsePagination(
      { limit, offset },
      { limit: 10, maxLimit: 50 },
    );

    const { items, total, limit: effectiveLimit, offset: effectiveOffset } =
      await controller.getCompanyReviewsPaginated(companyId, safeLimit, safeOffset);

    return reply.send(buildPaginatedResult(items, total, effectiveLimit, effectiveOffset));
  });

  /**
   * POST /companies/:companyId/reviews
   *
   * Create a new review for a company. Requires authentication. The
   * review is always associated with the authenticated user.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.post('/companies/:companyId/reviews', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: companyIdParamsSchema,
      body: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: ['string', 'null'], minLength: 10, maxLength: 2000 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };

    const currentUser = request.user as { id: number; role?: string } | undefined;

    if (!currentUser || typeof currentUser.id !== 'number') {
      throw new ValidationError('Authenticated user is required to create reviews');
    }

    const body = request.body as { rating: number; comment?: string | null };
    const keyHeader = request.headers['idempotency-key'];

    if (!keyHeader || typeof keyHeader !== 'string') {
      const created = await controller.createCompanyReview(companyId, currentUser.id, body);
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
        const created = await controller.createCompanyReview(companyId, currentUser.id, body);
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
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.put('/companies/:companyId/reviews/:reviewId', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: companyReviewParamsSchema,
      body: {
        type: 'object',
        properties: {
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: ['string', 'null'], minLength: 10, maxLength: 2000 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: companyId and reviewId are already validated as positive integers by schema
    const { companyId, reviewId } = request.params as { companyId: number; reviewId: number };

    if (!request.user || typeof request.user.id !== 'number') {
      throw new ValidationError('Authenticated user is required to update reviews');
    }

    const updates = request.body as { rating?: number; comment?: string | null };
    const updated = await controller.updateCompanyReview(companyId, reviewId, request.user.id, updates);
    return reply.send(updated);
  });

  /**
   * DELETE /companies/:companyId/reviews/:reviewId
   *
   * Delete an existing review. Only the owner of the review can delete
   * it. Requires authentication.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.delete('/companies/:companyId/reviews/:reviewId', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: companyReviewParamsSchema,
    },
  }, async (request, reply) => {
    // SECURITY: companyId and reviewId are already validated as positive integers by schema
    const { companyId, reviewId } = request.params as { companyId: number; reviewId: number };

    if (!request.user || typeof request.user.id !== 'number') {
      throw new ValidationError('Authenticated user is required to delete reviews');
    }

    await controller.deleteCompanyReview(companyId, reviewId, request.user.id);
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
      params: vehicleIdParamsSchema,
      body: {
        type: 'object',
        required: ['auction', 'usacity'],
        properties: {
          auction: { type: 'string', minLength: 1, maxLength: 50 },
          usacity: { type: 'string', minLength: 1, maxLength: 100 },
          vehiclecategory: { type: 'string', enum: ['Sedan', 'Bike'] },
        },
        additionalProperties: false,
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 5 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
          minRating: { type: 'number', minimum: 0, maximum: 5 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: vehicleId is already validated as positive integer by schema
    const { vehicleId } = request.params as { vehicleId: number };
    const { auction, usacity, vehiclecategory } = request.body as {
      auction: string;
      usacity: string;
      vehiclecategory?: 'Sedan' | 'Bike';
    };
    const { limit = 5, offset = 0, currency, minRating } = request.query as {
      limit?: number;
      offset?: number;
      currency?: string;
      minRating?: number;
    };

    request.log.info(
      { vehicleId, auction, usacity, currency },
      'Calculating quotes for vehicle'
    );

    // Build normalized calculator request using smart matching
    const calculatorRequestBuilder = new CalculatorRequestBuilder(fastify);
    const buildResult = await calculatorRequestBuilder.buildCalculatorRequest({
      auction,
      usacity,
    }, {
      // Pass vehiclecategory from client if provided (otherwise server default applies)
      ...(vehiclecategory && { vehiclecategory }),
    });

    // If city/auction couldn't be matched, return a response indicating price unavailable
    if (!buildResult.success || !buildResult.request) {
      request.log.warn(
        { vehicleId, auction, usacity, error: buildResult.error },
        'Could not build calculator request - price calculation unavailable'
      );

      // Return a response indicating price couldn't be calculated (not an error)
      return reply.code(200).send({
        vehicle_id: vehicleId,
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
    const fullResult = await withVersionedCache(
      fastify,
      'companies',
      ['quotes:calculate', vehicleId, calculatorInput.auction, calculatorInput.usacity || 'none', currency || 'USD', safeLimit, safeOffset, safeMinRating ?? 'none'],
      CACHE_TTL.CALCULATION, // 10 minutes
      () => controller.calculateQuotesForVehicleWithInput(vehicleId, calculatorInput, currency, {
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
      params: vehicleIdParamsSchema,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 3 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: vehicleId is already validated as positive integer by schema
    const { vehicleId } = request.params as { vehicleId: number };
    const { limit = 3, currency } = request.query as { limit?: number; currency?: string };

    // Cache cheapest quotes - same vehicle + currency = same result (versioned)
    const fullResult = await withVersionedCache(
      fastify,
      'companies',
      ['quotes:cheapest', vehicleId, currency || 'USD', limit],
      CACHE_TTL.CALCULATION, // 10 minutes
      () => controller.calculateQuotesForVehicle(vehicleId, currency),
    );

    const quotes = fullResult.quotes.slice(0, limit);
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
        additionalProperties: false,
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
        additionalProperties: false,
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
      params: vehicleIdParamsSchema,
      querystring: {
        type: 'object',
        properties: {
          currency: { type: 'string', minLength: 3, maxLength: 3 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: vehicleId is already validated as positive integer by schema
    const { vehicleId } = request.params as { vehicleId: number };
    const { currency } = request.query as { currency?: string };

    const quotes = await controller.getQuotesByVehicle(vehicleId, currency);
    return reply.send(quotes);
  });

  /**
   * GET /companies/:companyId/quotes
   *
   * Fetch all quotes for a specific company across all vehicles.
   * Useful for admin or reporting views filtered by company.
   */
  fastify.get('/companies/:companyId/quotes', {
    schema: {
      params: companyIdParamsSchema,
      querystring: {
        type: 'object',
        properties: {
          currency: { type: 'string', minLength: 3, maxLength: 3 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };
    const { currency, limit = 20, offset = 0 } = request.query as { currency?: string; limit?: number; offset?: number };

    const { limit: safeLimit, offset: safeOffset } = parsePagination(
      { limit, offset },
      { limit: 20, maxLimit: 100 },
    );

    const { items, total, limit: effectiveLimit, offset: effectiveOffset } =
      await controller.getCompanyQuotesPaginated(companyId, safeLimit, safeOffset, currency);

    return reply.send(buildPaginatedResult(items, total, effectiveLimit, effectiveOffset));
  });

  /**
   * POST /quotes (Admin-only)
   *
   * Optional admin endpoint to create a quote manually. In this flow,
   * the client provides both company_id and vehicle_id (typically via
   * dropdowns in an admin panel). This should not be used in general
   * user-facing flows where IDs are not visible.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Authorization: Admin only (via requireAdmin middleware)
   */
  fastify.post('/quotes', {
    preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
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
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // Admin check handled by requireAdmin middleware
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
        userId: request.user!.id, // Safe: requireAdmin middleware guarantees request.user exists
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
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Authorization: Admin only (via requireAdmin middleware)
   */
  fastify.put('/quotes/:id', {
    preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
      body: {
        type: 'object',
        properties: {
          delivery_time_days: { type: ['integer', 'null'], minimum: 0 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    // Admin check handled by requireAdmin middleware
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    const updates = request.body as CompanyQuoteUpdate;
    const updated = await controller.updateQuote(id, updates);
    return reply.send(updated);
  });

  /**
   * DELETE /quotes/:id
   *
   * Delete a quote. This is another admin-focused operation and should
   * not generally be exposed in public user interfaces.
   *
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Authorization: Admin only (via requireAdmin middleware)
   */
  fastify.delete('/quotes/:id', {
    preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
    },
  }, async (request, reply) => {
    // Admin check handled by requireAdmin middleware
    // SECURITY: id is already validated as positive integer by schema
    const { id } = request.params as { id: number };

    await controller.deleteQuote(id);
    return reply.code(204).send();
  });
};

export { companyRoutes };
