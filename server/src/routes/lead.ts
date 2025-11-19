import { FastifyPluginAsync } from 'fastify';
import { LeadController } from '../controllers/leadController.js';
import { ValidationError, AuthenticationError } from '../types/errors.js';

const leadRoutes: FastifyPluginAsync = async (fastify) => {
  const leadController = new LeadController(fastify);

  fastify.post('/leads/from-quotes', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['vehicleId', 'selectedCompanyIds', 'name', 'contact'],
        properties: {
          vehicleId: { type: 'integer', minimum: 1 },
          selectedCompanyIds: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            minItems: 1,
          },
          name: { type: 'string', minLength: 1, maxLength: 255 },
          contact: { type: 'string', minLength: 3, maxLength: 255 },
          message: { type: 'string', minLength: 0, maxLength: 2000 },
          priority: {
            type: 'string',
            enum: ['price', 'speed', 'premium_service'],
          },
          budgetUsdMin: { type: 'number', nullable: true },
          budgetUsdMax: { type: 'number', nullable: true },
          desiredDurationDays: { type: 'integer', minimum: 1, nullable: true },
          maxAcceptableDurationDays: { type: 'integer', minimum: 1, nullable: true },
          damageTolerance: {
            type: 'string',
            enum: ['minimal', 'moderate', 'any'],
            nullable: true,
          },
          serviceExtras: {
            type: 'array',
            nullable: true,
            items: { type: 'string', minLength: 1, maxLength: 100 },
          },
          preferredContactChannel: {
            type: 'string',
            enum: ['whatsapp', 'telegram', 'phone', 'email'],
            nullable: true,
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as {
      vehicleId: number;
      selectedCompanyIds: number[];
      name: string;
      contact: string;
      message?: string;
      priority?: 'price' | 'speed' | 'premium_service';
      budgetUsdMin?: number | null;
      budgetUsdMax?: number | null;
      desiredDurationDays?: number | null;
      maxAcceptableDurationDays?: number | null;
      damageTolerance?: 'minimal' | 'moderate' | 'any' | null;
      serviceExtras?: string[] | null;
      preferredContactChannel?: 'whatsapp' | 'telegram' | 'phone' | 'email' | null;
    };

    const userId = request.user ? request.user.id : null;

    if (!Array.isArray(body.selectedCompanyIds) || body.selectedCompanyIds.length === 0) {
      throw new ValidationError('selectedCompanyIds must contain at least one company id');
    }

    const result = await leadController.createLeadFromQuotes({
      vehicleId: body.vehicleId,
      selectedCompanyIds: body.selectedCompanyIds,
      name: body.name,
      contact: body.contact,
      message: body.message,
      priority: body.priority,
      budgetUsdMin: body.budgetUsdMin ?? null,
      budgetUsdMax: body.budgetUsdMax ?? null,
      desiredDurationDays: body.desiredDurationDays ?? null,
      maxAcceptableDurationDays: body.maxAcceptableDurationDays ?? null,
      damageTolerance: body.damageTolerance ?? null,
      serviceExtras: body.serviceExtras ?? null,
      preferredContactChannel: body.preferredContactChannel ?? null,
      userId,
    });

    return reply.code(201).send(result);
  });

  fastify.post('/leads/general', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'phone', 'terms'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          phone: { type: 'string', minLength: 3, maxLength: 255 },
          desiredBudget: { type: 'string', minLength: 0, maxLength: 255 },
          desiredVehicleType: { type: 'string', minLength: 0, maxLength: 255 },
          auction: { type: 'string', minLength: 0, maxLength: 255 },
          comment: { type: 'string', minLength: 0, maxLength: 2000 },
          priority: {
            type: 'string',
            enum: ['price', 'speed', 'premium_service'],
          },
          terms: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const body = request.body as {
      name: string;
      phone: string;
      desiredBudget?: string | null;
      desiredVehicleType?: string | null;
      auction?: string | null;
      comment?: string | null;
      priority?: 'price' | 'speed' | 'premium_service' | null;
      terms: boolean;
    };

    if (!body.terms) {
      throw new ValidationError('Terms must be accepted');
    }

    const result = await leadController.createGeneralLead({
      userId: request.user.id,
      name: body.name,
      phone: body.phone,
      desiredBudgetText: body.desiredBudget ?? null,
      desiredVehicleType: body.desiredVehicleType ?? null,
      auctionText: body.auction ?? null,
      comment: body.comment ?? null,
      priority: body.priority ?? null,
    });

    return reply.code(201).send(result);
  });

  // ---------------------------------------------------------------------------
  // User-side lead APIs
  // ---------------------------------------------------------------------------

  fastify.get('/user/leads', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const result = await leadController.getUserLeads(request.user.id);
    return reply.send(result);
  });

  fastify.get('/user/leads/:leadId/offers', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { leadId } = request.params as { leadId: string };
    const id = parseInt(leadId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid lead id');
    }

    const result = await leadController.getUserLeadOffers(request.user.id, id);
    return reply.send(result);
  });

  fastify.post('/user/leads/:leadId/select-offer', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['offerId'],
        properties: {
          offerId: { type: 'integer', minimum: 1 },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { leadId } = request.params as { leadId: string };
    const id = parseInt(leadId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid lead id');
    }

    const { offerId } = request.body as { offerId: number };
    if (!Number.isFinite(offerId) || offerId <= 0) {
      throw new ValidationError('Invalid offer id');
    }

    const result = await leadController.selectOfferForUser(request.user.id, id, offerId);
    return reply.send({
      leadId: result.leadId,
      selectedOfferId: result.selectedOfferId,
    });
  });

  // ---------------------------------------------------------------------------
  // Company-side lead APIs
  // ---------------------------------------------------------------------------

  fastify.get('/company/leads', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const result = await leadController.getCompanyLeadsForUser(request.user.id);
    return reply.send(result);
  });

  fastify.get('/company/leads/:leadCompanyId', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { leadCompanyId } = request.params as { leadCompanyId: string };
    const id = parseInt(leadCompanyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid leadCompany id');
    }

    const result = await leadController.getCompanyLeadDetailForUser(request.user.id, id);
    return reply.send(result);
  });

  fastify.post('/company/leads/:leadCompanyId/offers', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['estimatedTotalUsd'],
        properties: {
          estimatedTotalUsd: { type: 'number', minimum: 0 },
          estimatedTotalUsdMax: { type: 'number', minimum: 0 },
          serviceFeeUsd: { type: 'number', minimum: 0 },
          estimatedDurationDays: { type: 'integer', minimum: 1 },
          comment: { type: 'string', minLength: 0, maxLength: 2000 },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationError('Unauthorized');
    }

    const { leadCompanyId } = request.params as { leadCompanyId: string };
    const id = parseInt(leadCompanyId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('Invalid leadCompany id');
    }

    const body = request.body as {
      estimatedTotalUsd: number;
      estimatedTotalUsdMax?: number;
      serviceFeeUsd?: number;
      estimatedDurationDays?: number;
      comment?: string;
    };

    const result = await leadController.submitOfferForCompanyLead(request.user.id, id, {
      estimatedTotalUsd: body.estimatedTotalUsd,
      estimatedTotalUsdMax: body.estimatedTotalUsdMax ?? null,
      serviceFeeUsd: body.serviceFeeUsd ?? null,
      estimatedDurationDays: body.estimatedDurationDays ?? null,
      comment: body.comment ?? null,
    });

    return reply.code(201).send(result);
  });
};

export { leadRoutes };
