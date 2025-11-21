import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { UserPreferenceModel } from '../models/UserPreferenceModel.js';
import { DealerProfileModel } from '../models/DealerProfileModel.js';
import { CompanyModel } from '../models/CompanyModel.js';
import { UserModel } from '../models/UserModel.js';
import { authenticate } from '../middleware/auth.js';

export async function onboardingRoutes(fastify: FastifyInstance) {
  const userPreferenceModel = new UserPreferenceModel(fastify);
  const dealerProfileModel = new DealerProfileModel(fastify);
  const companyModel = new CompanyModel(fastify);
  const userModel = new UserModel(fastify);

  // User Onboarding
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/user',
    {
      preHandler: [authenticate],
      schema: {
        body: z.object({
          budget_min: z.number().optional(),
          budget_max: z.number().optional(),
          body_types: z.array(z.string()).optional(),
          fuel_types: z.array(z.string()).optional(),
          usage_goal: z.enum(['family', 'commute', 'resale', 'fun', 'other']).optional(),
          target_regions: z.array(z.string()).optional(),
          purchase_timeframe: z.enum(['immediate', '1-3_months', '3-6_months', 'planning']).optional(),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.user!.id;
      const preferences = await userPreferenceModel.upsert(userId, request.body);
      
      return preferences;
    }
  );

  // Dealer Onboarding
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/dealer',
    {
      preHandler: [authenticate],
      schema: {
        body: z.object({
          business_name: z.string(),
          tax_id: z.string().optional(),
          license_number: z.string().optional(),
          address: z.any().optional(),
          inventory_size: z.enum(['0-10', '10-50', '50+']).optional(),
          specialty_brands: z.array(z.string()).optional(),
          feed_url: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
        const userId = request.user!.id;
        // The upsert expects data without user_id, as user_id is passed as first arg
        // The body contains business_name etc.
        const profile = await dealerProfileModel.upsert(userId, request.body);
        
        // Update user role to dealer
        await userModel.update(userId, { role: 'dealer' });
        
        return profile;
    }
  );

  // Company Onboarding
  fastify.withTypeProvider<ZodTypeProvider>().post(
      '/company',
      {
          preHandler: [authenticate],
          schema: {
              body: z.object({
                  name: z.string().optional(),
                  services: z.array(z.string()).optional(),
                  base_price: z.number().optional(),
                  price_per_mile: z.number().optional(),
                  country: z.string().optional(),
                  city: z.string().optional(),
                  description: z.string().optional(),
                  website: z.string().optional(),
                  phone_number: z.string().optional(),
              })
          }
      },
      async (request, reply) => {
          const userId = request.user!.id;
          const user = await userModel.findById(userId);
          
          if (!user) {
              return reply.status(404).send({ message: 'User not found' });
          }

          let companyId = user.company_id;
          let company;

          if (companyId) {
              // Update existing
              company = await companyModel.update(companyId, request.body);
          } else {
              // Create new
              if (!request.body.name) {
                  return reply.status(400).send({ message: 'Company name is required for new company' });
              }
              
              // We need to cast body to match CompanyCreate because of optional fields in zod schema vs required in type
              // But CompanyCreate actually allows most things to be optional except name?
              // Let's check CompanyCreate.
              // CompanyCreate: name is required.
              
               company = await companyModel.create({
                   name: request.body.name,
                   ...request.body
               });
               
               // Link user to company
               await userModel.update(userId, { company_id: company.id, role: 'company' });
          }

          return company;
      }
  );
}

