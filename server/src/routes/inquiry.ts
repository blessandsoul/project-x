import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InquiryController } from '../controllers/InquiryController.js';
import { withIdempotency } from '../utils/idempotency.js';
import { ValidationError, AuthorizationError } from '../types/errors.js';
import { createRateLimitHandler, RATE_LIMITS, userScopedKeyGenerator } from '../utils/rateLimit.js';

/**
 * User Inquiry Routes
 *
 * Endpoints for users to create and manage inquiries with companies.
 * All endpoints require cookie-based authentication.
 */

// JSON Schema definitions
const createInquirySchema = {
  type: 'object',
  required: ['company_id', 'vehicle_id', 'message'],
  properties: {
    company_id: { type: 'integer', minimum: 1 },
    vehicle_id: { type: 'integer', minimum: 1 },
    quote_id: { type: ['integer', 'null'], minimum: 1 },
    subject: { type: ['string', 'null'], minLength: 1, maxLength: 255 },
    message: { type: 'string', minLength: 1, maxLength: 5000 },
    quoted_total_price: { type: ['number', 'null'], minimum: 0 },
    quoted_currency: { type: 'string', minLength: 3, maxLength: 3, pattern: '^[A-Z]{3}$' },
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

const updateInquiryUserSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['accepted', 'cancelled'] },
  },
  additionalProperties: false,
};

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

export const inquiryRoutes = async (fastify: FastifyInstance) => {
  const controller = new InquiryController(fastify);

  // ===========================================================================
  // POST /inquiries - Create a new inquiry
  // Rate limited: 20 requests per minute per user
  // ===========================================================================
  fastify.post('/inquiries', {
    preHandler: [
      fastify.authenticateCookie,
      fastify.csrfProtection,
      createRateLimitHandler(fastify, {
        ...RATE_LIMITS.inquiryCreate,
        keyGenerator: userScopedKeyGenerator,
      }),
    ],
    schema: {
      body: createInquirySchema,
      querystring: listQuerySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    // Company users cannot create inquiries - only regular users can
    if (user.role === 'company') {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Companies cannot initiate inquiries.',
        code: 'COMPANY_CANNOT_CREATE_INQUIRY',
      });
    }

    const body = request.body as {
      company_id: number;
      vehicle_id: number;
      quote_id?: number | null;
      subject?: string | null;
      message: string;
      quoted_total_price?: number | null;
      quoted_currency?: string;
    };

    // Note: Idempotency is handled by the service layer via findOpenInquiry()
    // which returns existing open inquiry or creates new one.
    // We don't use the idempotency_keys table here because:
    // 1. Cancelled inquiries should allow new inquiry creation
    // 2. The service already handles "find or create" atomically
    const inquiry = await controller.createInquiry(user.id, body);
    return reply.code(201).send(inquiry);
  });

  // ===========================================================================
  // GET /inquiries - List user's inquiries (includes company inbox if user has company)
  // ===========================================================================
  fastify.get('/inquiries', {
    preHandler: [fastify.authenticateCookie],
    schema: {
      querystring: listQuerySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    const query = request.query as {
      limit?: number;
      offset?: number;
      status?: string | string[];
    };

    // Get user's own inquiries (where they are the customer)
    const userResult = await controller.getUserInquiries(user.id, query);
    
    // If user has a company, also get inquiries sent TO their company
    if (user.company_id) {
      const companyResult = await controller.getCompanyInquiries(user.company_id, user.id, query);
      
      // Merge and deduplicate (in case user messaged their own company)
      const allItems = [...userResult.items];
      const existingIds = new Set(allItems.map(i => i.id));
      
      for (const item of companyResult.items) {
        if (!existingIds.has(item.id)) {
          allItems.push(item);
        }
      }
      
      // Sort by last_message_at DESC
      allItems.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
      
      return reply.send({
        items: allItems,
        total: userResult.total + companyResult.total,
        limit: userResult.limit,
        offset: userResult.offset,
        hasMore: allItems.length < (userResult.total + companyResult.total),
      });
    }

    return reply.send(userResult);
  });

  // ===========================================================================
  // GET /inquiries/:id - Get single inquiry
  // ===========================================================================
  fastify.get('/inquiries/:id', {
    preHandler: [fastify.authenticateCookie],
    schema: {
      params: idParamsSchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    const { id } = request.params as { id: number };
    
    // Check if user can access (either as customer or as company)
    const { canAccess, role } = await controller.canAccessInquiry(id, user.id, user.company_id);
    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }
    
    // Get inquiry with appropriate method
    const inquiry = role === 'company' && user.company_id
      ? await controller.getCompanyInquiry(id, user.company_id, user.id)
      : await controller.getUserInquiry(id, user.id);
    return reply.send(inquiry);
  });

  // ===========================================================================
  // PATCH /inquiries/:id - Update inquiry (accept/cancel)
  // ===========================================================================
  fastify.patch('/inquiries/:id', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
      body: updateInquiryUserSchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    const { id } = request.params as { id: number };
    const { status } = request.body as { status: 'accepted' | 'cancelled' };

    const inquiry = await controller.updateInquiryByUser(id, user.id, status);
    return reply.send(inquiry);
  });

  // ===========================================================================
  // GET /inquiries/:id/messages - Get messages for an inquiry
  // ===========================================================================
  fastify.get('/inquiries/:id/messages', {
    preHandler: [fastify.authenticateCookie],
    schema: {
      params: idParamsSchema,
      querystring: messagesQuerySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    const { id } = request.params as { id: number };
    const query = request.query as { limit?: number; cursor?: number };

    // Verify user has access
    const { canAccess } = await controller.canAccessInquiry(id, user.id, user.company_id);
    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    const [result, participants] = await Promise.all([
      controller.getMessages(id, user.id, query),
      controller.getReadWatermarks(id, user.id),
    ]);
    
    return reply.send({ ...result, participants });
  });

  // ===========================================================================
  // POST /inquiries/:id/messages - Send a message
  // Rate limited: 60 messages per minute per user
  // Idempotency: via client_message_id DB constraint
  // ===========================================================================
  fastify.post('/inquiries/:id/messages', {
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
    const user = request.user;
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    const { id } = request.params as { id: number };
    const body = request.body as {
      message: string;
      message_type?: 'text' | 'offer';
      attachments?: Array<{ url: string; name: string; type: string; size: number }> | null;
    };

    // Verify user has access and determine role
    const { canAccess, role } = await controller.canAccessInquiry(id, user.id, user.company_id);
    if (!canAccess || !role) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    const message = await controller.sendMessage(id, user.id, role, body);
    return reply.code(201).send(message);
  });

  // ===========================================================================
  // GET /inquiries/:id/unread-count - Get unread message count
  // ===========================================================================
  fastify.get('/inquiries/:id/unread-count', {
    preHandler: [fastify.authenticateCookie],
    schema: {
      params: idParamsSchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    const { id } = request.params as { id: number };

    // Verify user has access
    const { canAccess } = await controller.canAccessInquiry(id, user.id, user.company_id);
    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    const result = await controller.getUnreadCount(id, user.id);
    return reply.send(result);
  });

  // ===========================================================================
  // POST /inquiries/:id/mark-read - Mark all messages as read
  // ===========================================================================
  fastify.post('/inquiries/:id/mark-read', {
    preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
    schema: {
      params: idParamsSchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    const { id } = request.params as { id: number };

    // Verify user has access
    const { canAccess, role } = await controller.canAccessInquiry(id, user.id, user.company_id);
    if (!canAccess || !role) {
      throw new AuthorizationError('You do not have access to this inquiry');
    }

    const result = await controller.markAsRead(id, user.id, role);
    return reply.send(result);
  });
};
