import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InquiryController } from '../controllers/InquiryController.js';
import { AuthorizationError } from '../types/errors.js';
import { createRateLimitHandler, RATE_LIMITS, userScopedKeyGenerator } from '../utils/rateLimit.js';
import { withVersionedCache, CACHE_TTL } from '../utils/cache.js';

/**
 * Company Inquiry Routes
 *
 * Endpoints for companies to manage inquiries from users.
 * All endpoints require cookie-based authentication and company role.
 */

// JSON Schema definitions
const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'integer', minimum: 1 },
  },
};

const listQuerySchema = {
  type: 'object',
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
    offset: { type: 'integer', minimum: 0, default: 0 },
    status: {
      oneOf: [
        { type: 'string', enum: ['pending', 'active', 'accepted', 'declined', 'expired', 'cancelled'] },
        {
          type: 'array',
          items: { type: 'string', enum: ['pending', 'active', 'accepted', 'declined', 'expired', 'cancelled'] },
        },
      ],
    },
  },
  additionalProperties: false,
};

const messagesQuerySchema = {
  type: 'object',
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    cursor: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
};

const sendMessageSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string', minLength: 1, maxLength: 5000 },
    message_type: { type: 'string', enum: ['text', 'offer'] },
    client_message_id: { type: ['string', 'null'], minLength: 36, maxLength: 36 },
    attachments: {
      type: ['array', 'null'],
      items: {
        type: 'object',
        required: ['url', 'name', 'type', 'size'],
        properties: {
          url: { type: 'string', minLength: 1, maxLength: 2048 },
          name: { type: 'string', minLength: 1, maxLength: 255 },
          type: { type: 'string', minLength: 1, maxLength: 100 },
          size: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
      maxItems: 10,
    },
  },
  additionalProperties: false,
};

const updateInquiryCompanySchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['active', 'declined'] },
    final_price: { type: ['number', 'null'], minimum: 0 },
    final_currency: { type: ['string', 'null'], minLength: 3, maxLength: 3, pattern: '^[A-Z]{3}$' },
  },
  additionalProperties: false,
};

/**
 * Helper to verify company role and get company_id
 */
function requireCompanyRole(request: FastifyRequest): { userId: number; companyId: number } {
  const user = request.user;
  if (!user) {
    throw new AuthorizationError('Authentication required');
  }

  if (user.role !== 'company' && user.role !== 'admin') {
    throw new AuthorizationError('Company role required');
  }

  if (!user.company_id && user.role !== 'admin') {
    throw new AuthorizationError('User is not associated with a company');
  }

  return {
    userId: user.id,
    companyId: user.company_id!,
  };
}

export const companyInquiryRoutes = async (fastify: FastifyInstance) => {
  const controller = new InquiryController(fastify);

  // ===========================================================================
  // GET /company/inquiries - List company's inquiries
  // ===========================================================================
  fastify.get('/company/inquiries', {
    preHandler: [fastify.authenticateCookie],
    schema: {
      querystring: listQuerySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, companyId } = requireCompanyRole(request);

    const query = request.query as {
      limit?: number;
      offset?: number;
      status?: string | string[];
    };

    const result = await controller.getCompanyInquiries(companyId, userId, query);
    return reply.send(result);
  });

  // ===========================================================================
  // GET /company/inquiries/stats - Get inquiry statistics
  // Cached for 30 seconds (near-real-time, user-scoped)
  // ===========================================================================
  fastify.get('/company/inquiries/stats', {
    preHandler: [fastify.authenticateCookie],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, companyId } = requireCompanyRole(request);

    // Cache stats per company for 30 seconds
    const stats = await withVersionedCache(
      fastify,
      'inquiry-stats',
      ['company', companyId],
      CACHE_TTL.REALTIME,
      () => controller.getCompanyStats(companyId, userId),
    );
    return reply.send(stats);
  });

  // ===========================================================================
  // GET /company/inquiries/:id - Get single inquiry
  // ===========================================================================
  fastify.get('/company/inquiries/:id', {
    preHandler: [fastify.authenticateCookie],
    schema: {
      params: idParamsSchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, companyId } = requireCompanyRole(request);
    const { id } = request.params as { id: number };

    const inquiry = await controller.getCompanyInquiry(id, companyId, userId);
    return reply.send(inquiry);
  });

  // ===========================================================================
  // PATCH /company/inquiries/:id - Update inquiry (status, final price)
  // ===========================================================================
  fastify.patch('/company/inquiries/:id', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
      body: updateInquiryCompanySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = requireCompanyRole(request);
    const { id } = request.params as { id: number };
    const body = request.body as {
      status?: 'active' | 'declined';
      final_price?: number | null;
      final_currency?: string | null;
    };

    const inquiry = await controller.updateInquiryByCompany(id, companyId, body);
    return reply.send(inquiry);
  });

  // ===========================================================================
  // GET /company/inquiries/:id/messages - Get messages for an inquiry
  // ===========================================================================
  fastify.get('/company/inquiries/:id/messages', {
    preHandler: [fastify.authenticateCookie],
    schema: {
      params: idParamsSchema,
      querystring: messagesQuerySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, companyId } = requireCompanyRole(request);
    const { id } = request.params as { id: number };
    const query = request.query as { limit?: number; cursor?: number };

    // Verify company has access
    const { canAccess } = await controller.canAccessInquiry(id, userId, companyId);
    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    const [result, participants] = await Promise.all([
      controller.getMessages(id, userId, query),
      controller.getReadWatermarks(id, userId),
    ]);
    
    return reply.send({ ...result, participants });
  });

  // ===========================================================================
  // POST /company/inquiries/:id/messages - Send a message
  // Rate limited: 60 messages per minute per user
  // Idempotency: via client_message_id DB constraint
  // ===========================================================================
  fastify.post('/company/inquiries/:id/messages', {
    preHandler: [
      fastify.authenticateCookie,
      fastify.csrfProtection,
      createRateLimitHandler(fastify, {
        ...RATE_LIMITS.messageSend,
        keyGenerator: userScopedKeyGenerator,
      }),
    ],
    schema: {
      params: idParamsSchema,
      body: sendMessageSchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, companyId } = requireCompanyRole(request);
    const { id } = request.params as { id: number };
    const body = request.body as {
      message: string;
      message_type?: 'text' | 'offer';
      attachments?: Array<{ url: string; name: string; type: string; size: number }> | null;
    };

    // Verify company has access
    const { canAccess } = await controller.canAccessInquiry(id, userId, companyId);
    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    const message = await controller.sendMessage(id, userId, 'company', body);
    return reply.code(201).send(message);
  });

  // ===========================================================================
  // POST /company/inquiries/:id/mark-read - Mark all messages as read
  // ===========================================================================
  fastify.post('/company/inquiries/:id/mark-read', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, companyId } = requireCompanyRole(request);
    const { id } = request.params as { id: number };

    // Verify company has access
    const { canAccess } = await controller.canAccessInquiry(id, userId, companyId);
    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    const result = await controller.markAsRead(id, userId, 'company');
    return reply.send(result);
  });
};
