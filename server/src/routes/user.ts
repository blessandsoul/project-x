import { FastifyPluginAsync } from 'fastify';
import { UserController } from '../controllers/userController.js';
import { UserCompanyActivityModel } from '../models/UserCompanyActivityModel.js';
import { UserUpdate } from '../types/user.js';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError, AuthorizationError } from '../types/errors.js';
import {
  uploadUserAvatarSecure,
  deleteUserAvatar,
  getUserAvatarUrls,
  MAX_AVATAR_SIZE_BYTES,
} from '../services/ImageUploadService.js';
import {
  idParamsSchema,
  companyIdParamsSchema,
  positiveIntegerSchema,
  paginationLimitSchema,
} from '../schemas/commonSchemas.js';


/**
 * User Routes
 *
 * Defines user-related API endpoints for account operations.
 * Authentication is handled by /auth/* routes (see routes/auth.ts).
 * Use GET /auth/me for "who am I" functionality.
 *
 * Endpoints:
 * - POST/PUT/GET/DELETE /user/avatar - Avatar management
 * - GET/POST/DELETE /user/favorites/companies/:companyId - Company favorites
 * - Admin: /admin/users/* - User management
 */
const userRoutes: FastifyPluginAsync = async (fastify) => {
  const userController = new UserController(fastify);
  const userCompanyActivityModel = new UserCompanyActivityModel(fastify);


  // ---------------------------------------------------------------------------
  // User avatar upload & management (/user/avatar)
  // Uses cookie-based auth + CSRF protection
  // Security: magic byte validation, size limits, image sanitization via sharp
  // ---------------------------------------------------------------------------

  /**
   * Handle avatar upload with full security validation
   * - Cookie auth (not header JWT)
   * - CSRF protection on caller
   * - Magic byte validation
   * - Size limit (2 MB)
   * - Image sanitization via sharp
   */
  const handleAvatarUpload = async (request: any, reply: any) => {
    // Auth is handled by preHandler (authenticateCookie)
    if (!request.user || typeof request.user.id !== 'number') {
      throw new AuthenticationError('Unauthorized');
    }

    const file = await request.file();
    if (!file) {
      throw new ValidationError('Avatar file is required');
    }

    // Company-role users must use their company logo as avatar
    // Check early before reading file buffer
    if (request.user.role === 'company') {
      throw new AuthorizationError('Company users must use company logo as avatar');
    }

    // Read file buffer
    const buffer = await file.toBuffer();

    // Check size limit early (before expensive validation)
    if (buffer.length > MAX_AVATAR_SIZE_BYTES) {
      throw new ValidationError(`File too large. Maximum size is ${MAX_AVATAR_SIZE_BYTES / 1024 / 1024} MB`);
    }

    // Use secure upload with full validation pipeline:
    // - Magic byte detection
    // - MIME allowlist (JPEG, PNG, WEBP only)
    // - Re-encode via sharp (strips metadata, ensures valid image)
    const declaredMime = file.mimetype as string | undefined;

    try {
      const result = await uploadUserAvatarSecure(buffer, declaredMime, request.user.username);

      return reply.code(201).send({
        avatarUrl: result.url,
        originalAvatarUrl: result.url, // Both point to sanitized version for security
      });
    } catch (err) {
      // Convert validation errors to user-friendly messages
      const message = err instanceof Error ? err.message : 'Invalid image file';
      throw new ValidationError(message);
    }
  };

  /**
   * POST /user/avatar
   *
   * Upload or replace the authenticated user's avatar.
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   * Limits: 2 MB max, JPEG/PNG/WEBP only
   */
  fastify.post('/user/avatar', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
  }, async (request, reply) => {
    return handleAvatarUpload(request, reply);
  });

  /**
   * PUT /user/avatar
   *
   * Alias for POST /user/avatar to support idempotent update semantics.
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.put('/user/avatar', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
  }, async (request, reply) => {
    return handleAvatarUpload(request, reply);
  });

  /**
   * GET /user/avatar
   *
   * Returns URLs for the authenticated user's avatar if it exists.
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Not required (safe GET method)
   */
  fastify.get('/user/avatar', {
    preHandler: fastify.authenticateCookie,
  }, async (request, reply) => {
    if (!request.user || typeof request.user.id !== 'number') {
      throw new AuthenticationError('Unauthorized');
    }

    const urls = await getUserAvatarUrls(request.user.username);

    return reply.send({
      avatarUrl: urls.url,
      originalAvatarUrl: urls.url, // Both point to same sanitized version
    });
  });

  /**
   * DELETE /user/avatar
   *
   * Deletes the authenticated user's avatar files from disk.
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.delete('/user/avatar', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
  }, async (request, reply) => {
    if (!request.user || typeof request.user.id !== 'number') {
      throw new AuthenticationError('Unauthorized');
    }

    await deleteUserAvatar(request.user.username);

    return reply.code(204).send();
  });

  // ---------------------------------------------------------------------------
  // User favorites (companies)
  // Auth: Cookie-based (HttpOnly access token)
  // CSRF: Required for unsafe methods (POST, DELETE)
  // ---------------------------------------------------------------------------

  /**
   * GET /user/favorites/companies
   *
   * List current user's favorite companies.
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Not required (safe GET method)
   */
  fastify.get('/user/favorites/companies', {
    preHandler: fastify.authenticateCookie,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const items = await userCompanyActivityModel.listFavoriteCompanies(request.user.id);
    return reply.send({ items });
  });

  /**
   * POST /user/favorites/companies/:companyId
   *
   * Add a company to favorites.
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.post('/user/favorites/companies/:companyId', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: companyIdParamsSchema,
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };

    const newlyAdded = await userCompanyActivityModel.addFavoriteCompany(request.user.id, companyId);

    if (newlyAdded) {
      return reply.code(201).send({ success: true, status: 'created' });
    }

    return reply.code(200).send({ success: true, status: 'already_exists' });
  });

  /**
   * DELETE /user/favorites/companies/:companyId
   *
   * Remove a company from favorites.
   * Auth: Cookie-based (HttpOnly access token)
   * CSRF: Required (X-CSRF-Token header)
   */
  fastify.delete('/user/favorites/companies/:companyId', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: companyIdParamsSchema,
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    // SECURITY: companyId is already validated as positive integer by schema
    const { companyId } = request.params as { companyId: number };

    await userCompanyActivityModel.removeFavoriteCompany(request.user.id, companyId);
    return reply.code(204).send();
  });

	  // ---------------------------------------------------------------------------
	  // Admin User Management (/admin/...)
	  // ---------------------------------------------------------------------------

	  /**
	   * GET /admin/users
	   *
	   * Admin: Retrieve paginated list of users with optional filters.
	   *
	   * Auth: Cookie-based (HttpOnly access token)
	   * Authorization: Admin only (via requireAdmin middleware)
	   */
	  fastify.get('/admin/users', {
	    preHandler: [fastify.authenticateCookie, fastify.requireAdmin],
	    schema: {
	      querystring: {
	        type: 'object',
	        properties: {
	          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	          offset: { type: 'integer', minimum: 0, default: 0 },
	          email: { type: 'string', minLength: 1, maxLength: 255 },
	          username: { type: 'string', minLength: 1, maxLength: 255 },
	          role: { type: 'string', enum: ['user', 'dealer', 'company', 'admin'] },
	          is_blocked: { type: 'boolean' },
	          company_id: { type: 'integer', minimum: 1 },
	        },
	        additionalProperties: false,
	      },
	    },
	  }, async (request, reply) => {
	    // Admin check handled by requireAdmin middleware
	    const { limit = 10, offset = 0, email, username, role, is_blocked, company_id } = request.query as {
	      limit?: number;
	      offset?: number;
	      email?: string;
	      username?: string;
	      role?: string;
	      is_blocked?: boolean;
	      company_id?: number;
	    };

	    // ========================================================================
	    // SQL Injection Prevention: Explicit server-side validation
	    // Even though Fastify schema validation should catch these, we add
	    // defense-in-depth validation to prevent any bypass attempts.
	    // ========================================================================

	    // Whitelist validation for role parameter
	    const ALLOWED_ROLES = ['user', 'dealer', 'company', 'admin'] as const;
	    type AllowedRole = typeof ALLOWED_ROLES[number];
	    let validatedRole: AllowedRole | undefined;
	    if (role !== undefined && role !== null && role !== '') {
	      if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
	        throw new ValidationError(`Invalid role value. Allowed: ${ALLOWED_ROLES.join(', ')}`);
	      }
	      validatedRole = role as AllowedRole;
	    }

	    // Validate and clamp limit
	    let safeLimit = typeof limit === 'number' ? limit : parseInt(String(limit), 10);
	    if (!Number.isFinite(safeLimit) || safeLimit <= 0) safeLimit = 10;
	    if (safeLimit > 100) safeLimit = 100;

	    // Validate and clamp offset
	    let safeOffset = typeof offset === 'number' ? offset : parseInt(String(offset), 10);
	    if (!Number.isFinite(safeOffset) || safeOffset < 0) safeOffset = 0;

	    // Validate company_id is a positive integer
	    let safeCompanyId: number | undefined;
	    if (company_id !== undefined && company_id !== null) {
	      const companyIdNum = typeof company_id === 'number' ? company_id : parseInt(String(company_id), 10);
	      if (!Number.isFinite(companyIdNum) || companyIdNum <= 0) {
	        throw new ValidationError('Invalid company_id: must be a positive integer');
	      }
	      safeCompanyId = companyIdNum;
	    }

	    // Build filters object with validated values only
	    const filters: {
	      email?: string;
	      username?: string;
	      role?: 'user' | 'dealer' | 'company' | 'admin';
	      is_blocked?: boolean;
	      company_id?: number;
	    } = {};

	    // String filters - trim and validate length
	    if (email && typeof email === 'string' && email.trim().length > 0) {
	      filters.email = email.trim().slice(0, 255);
	    }
	    if (username && typeof username === 'string' && username.trim().length > 0) {
	      filters.username = username.trim().slice(0, 255);
	    }
	    if (validatedRole) {
	      filters.role = validatedRole;
	    }
	    if (typeof is_blocked === 'boolean') {
	      filters.is_blocked = is_blocked;
	    }
	    if (safeCompanyId !== undefined) {
	      filters.company_id = safeCompanyId;
	    }

	    const items = await userController.getAllUsers(safeLimit, safeOffset, filters);
	    const total = await userController.getUserCountWithFilters(filters);
	    reply.send({
	      items,
	      meta: {
	        limit: safeLimit,
	        offset: safeOffset,
	        count: items.length,
	        total,
	      },
	    });
	  });

	  /**
	   * GET /admin/users/:id
	   *
	   * Admin: Get full information about a specific user.
	   *
	   * Auth: Cookie-based (HttpOnly access token)
	   * Authorization: Admin only (via requireAdmin middleware)
	   */
	  fastify.get('/admin/users/:id', {
	    preHandler: [fastify.authenticateCookie, fastify.requireAdmin],
	    schema: {
	      params: idParamsSchema,
	    },
	  }, async (request, reply) => {
	    // Admin check handled by requireAdmin middleware
	    // SECURITY: id is already validated as positive integer by schema
	    const { id } = request.params as { id: number };
	    const user = await userController.getUserByIdAdmin(id);
	    reply.send(user);
	  });

	  /**
	   * PATCH /admin/users/:id
	   *
	   * Admin: Update selected fields on a user (role, dealer/company links, onboarding, block state).
	   *
	   * Auth: Cookie-based (HttpOnly access token)
	   * CSRF: Required (X-CSRF-Token header)
	   * Authorization: Admin only (via requireAdmin middleware)
	   */
	  fastify.patch('/admin/users/:id', {
	    preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
	    schema: {
	      params: idParamsSchema,
	      body: {
	        type: 'object',
	        properties: {
	          role: { type: 'string', enum: ['user', 'dealer', 'company', 'admin'] },
	          dealer_slug: { type: ['string', 'null'] },
	          company_id: { type: ['integer', 'null'], minimum: 1 },
	          onboarding_ends_at: { type: ['string', 'null'], format: 'date-time' },
	          is_blocked: { type: 'boolean' },
	        },
	        additionalProperties: false,
	      },
	    },
	  }, async (request, reply) => {
	    // Admin check handled by requireAdmin middleware
	    // SECURITY: id is already validated as positive integer by schema
	    const { id } = request.params as { id: number };
	    const body = request.body as Partial<UserUpdate> & { is_blocked?: boolean };

	    // ========================================================================
	    // SQL Injection Prevention: Explicit server-side validation
	    // ========================================================================

	    // Whitelist validation for role parameter
	    const ALLOWED_ROLES = ['user', 'dealer', 'company', 'admin'] as const;
	    type AllowedRole = typeof ALLOWED_ROLES[number];

	    const updates: UserUpdate = {};

	    if (body.role !== undefined && body.role !== null) {
	      if (!ALLOWED_ROLES.includes(body.role as AllowedRole)) {
	        throw new ValidationError(`Invalid role value. Allowed: ${ALLOWED_ROLES.join(', ')}`);
	      }
	      updates.role = body.role as AllowedRole;
	    }

	    // Validate dealer_slug is a string or null
	    if ('dealer_slug' in body) {
	      if (body.dealer_slug !== null && typeof body.dealer_slug !== 'string') {
	        throw new ValidationError('dealer_slug must be a string or null');
	      }
	      updates.dealer_slug = body.dealer_slug ?? null;
	    }

	    // Validate company_id is a positive integer or null
	    if ('company_id' in body) {
	      if (body.company_id !== null) {
	        const companyIdNum = typeof body.company_id === 'number' ? body.company_id : parseInt(String(body.company_id), 10);
	        if (!Number.isFinite(companyIdNum) || companyIdNum <= 0) {
	          throw new ValidationError('company_id must be a positive integer or null');
	        }
	        updates.company_id = companyIdNum;
	      } else {
	        updates.company_id = null;
	      }
	    }

	    if ('onboarding_ends_at' in body) {
	      updates.onboarding_ends_at = body.onboarding_ends_at ? new Date(body.onboarding_ends_at as any) : null;
	    }
	    if (typeof body.is_blocked === 'boolean') updates.is_blocked = body.is_blocked;

	    const updated = await userController.updateUserAdmin(id, updates as any);
	    reply.send(updated);
	  });

	  /**
	   * DELETE /admin/users/:id
	   *
	   * Admin: Permanently delete a user account by ID.
	   *
	   * Auth: Cookie-based (HttpOnly access token)
	   * CSRF: Required (X-CSRF-Token header)
	   * Authorization: Admin only (via requireAdmin middleware)
	   */
	  fastify.delete('/admin/users/:id', {
	    preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
	    schema: {
	      params: idParamsSchema,
	    },
	  }, async (request, reply) => {
	    // Admin check handled by requireAdmin middleware
	    // SECURITY: id is already validated as positive integer by schema
	    const { id } = request.params as { id: number };
	    await userController.deleteUser(id);
	    reply.code(204).send();
	  });

};

export { userRoutes };
