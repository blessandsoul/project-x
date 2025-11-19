import { FastifyInstance } from 'fastify';
import { LeadModel } from '../models/LeadModel.js';
import { VehicleModel } from '../models/VehicleModel.js';
import { CompanyModel } from '../models/CompanyModel.js';
import { UserModel } from '../models/UserModel.js';
import { LeadOfferModel } from '../models/LeadOfferModel.js';
import { LeadCreateFromQuotesInput, UserLeadSummary, UserLeadOfferView } from '../types/lead.js';
import { ValidationError, NotFoundError, AuthenticationError, AuthorizationError } from '../types/errors.js';

export class LeadController {
  private leadModel: LeadModel;
  private vehicleModel: VehicleModel;
  private companyModel: CompanyModel;
  private userModel: UserModel;
  private leadOfferModel: LeadOfferModel;

  constructor(fastify: FastifyInstance) {
    this.leadModel = new LeadModel(fastify);
    this.vehicleModel = new VehicleModel(fastify);
    this.companyModel = new CompanyModel(fastify);
    this.userModel = new UserModel(fastify);
    this.leadOfferModel = new LeadOfferModel(fastify);
  }

  async createLeadFromQuotes(input: LeadCreateFromQuotesInput): Promise<{
    leadId: number;
    invitedCompanyIds: number[];
    estimatedResponseTimeHours: number;
  }> {
    const {
      vehicleId,
      selectedCompanyIds,
      name,
      contact,
      message,
      priority,
      budgetUsdMin = null,
      budgetUsdMax = null,
      desiredDurationDays = null,
      maxAcceptableDurationDays = null,
      damageTolerance = null,
      serviceExtras = null,
      preferredContactChannel = null,
      userId = null,
    } = input;

    if (!selectedCompanyIds || selectedCompanyIds.length === 0) {
      throw new ValidationError('At least one company must be selected');
    }

    const vehicle = await this.vehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    const uniqueCompanyIds = Array.from(new Set(selectedCompanyIds));

    // Basic validation that companies exist
    const companies = await this.companyModel.findAll(1000, 0);
    const existingCompanyIds = new Set(companies.map((c) => c.id));
    const invalidIds = uniqueCompanyIds.filter((id) => !existingCompanyIds.has(id));
    if (invalidIds.length > 0) {
      throw new ValidationError(`Invalid company ids: ${invalidIds.join(', ')}`);
    }

    // Derive some lead fields from the vehicle context
    const budgetUsdMinValue: number | null = budgetUsdMin;
    const budgetUsdMaxValue: number | null = budgetUsdMax;
    const carType: string | null = (vehicle as any).category ?? null;
    const auctionSources: string[] | null = (vehicle as any).source ? [(vehicle as any).source] : null;
    const brand: string | null = vehicle.make ?? null;
    const model: string | null = vehicle.model ?? null;
    const yearFrom: number | null = vehicle.year ?? null;
    const color: string | null = (vehicle as any).color ?? null;

    const priorityValue = priority ?? null;

    const lead = await this.leadModel.createLead({
      userId,
      name,
      contact,
      budgetUsdMin,
      budgetUsdMax,
      carType,
      auctionSources,
      brand,
      model,
      yearFrom,
      color,
      message: message ?? null,
      priority: priorityValue,
      desiredDurationDays,
      maxAcceptableDurationDays,
      damageTolerance,
      serviceExtras,
      preferredContactChannel,
      vehicleId,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.leadModel.createLeadCompanies(lead.id, uniqueCompanyIds, expiresAt);

    return {
      leadId: lead.id,
      invitedCompanyIds: uniqueCompanyIds,
      estimatedResponseTimeHours: 24,
    };
  }

  async createGeneralLead(input: {
    userId: number;
    name: string;
    phone: string;
    desiredBudgetText?: string | null;
    desiredVehicleType?: string | null;
    auctionText?: string | null;
    comment?: string | null;
    priority?: 'price' | 'speed' | 'premium_service' | null;
  }): Promise<{
    leadId: number;
    invitedCompanyIds: number[];
    estimatedResponseTimeHours: number;
  }> {
    const {
      userId,
      name,
      phone,
      desiredBudgetText = null,
      desiredVehicleType = null,
      auctionText = null,
      comment = null,
      priority = null,
    } = input;

    const generalLeadCompanyIds = await this.companyModel.findGeneralLeadCompanyIds();

    if (!generalLeadCompanyIds.length) {
      throw new ValidationError('No companies are configured to receive general leads');
    }

    const lead = await this.leadModel.createLead({
      userId,
      name,
      contact: phone,
      budgetUsdMin: null,
      budgetUsdMax: null,
      carType: desiredVehicleType ?? null,
      auctionSources: null,
      brand: null,
      model: null,
      yearFrom: null,
      color: null,
      message: comment ?? null,
      priority: priority ?? null,
      desiredBudgetText,
      desiredVehicleType,
      auctionText,
      termsAccepted: true,
      source: 'general_form',
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.leadModel.createLeadCompanies(lead.id, generalLeadCompanyIds, expiresAt);

    return {
      leadId: lead.id,
      invitedCompanyIds: generalLeadCompanyIds,
      estimatedResponseTimeHours: 24,
    };
  }

  async getUserLeads(userId: number): Promise<UserLeadSummary[]> {
    const rows = await this.leadModel.getUserLeads(userId);

    return rows.map((row) => ({
      id: row.id,
      status: row.status as UserLeadSummary['status'],
      createdAt: row.created_at.toISOString(),
      summary: {
        budgetUsdMin: row.budget_usd_min,
        budgetUsdMax: row.budget_usd_max,
        carType: row.car_type,
        priority: (row.priority as any) ?? null,
      },
      offersCount: Number(row.offers_count ?? 0),
    }));
  }

  async getUserLeadOffers(userId: number, leadId: number): Promise<UserLeadOfferView[]> {
    const lead = await this.leadModel.getLeadForUser(userId, leadId);
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const offers = await this.leadOfferModel.getOffersByLeadId(leadId);
    if (!offers.length) {
      return [];
    }

    // Load company information in bulk
    const companyIds = Array.from(new Set(offers.map((o) => o.company_id)));
    const companies = await this.companyModel.findAll(1000, 0);
    const companyMap = new Map<number, { name: string; rating: number | null }>();
    for (const c of companies) {
      if (companyIds.includes(c.id)) {
        // rating column exists on companies table
        companyMap.set(c.id, { name: c.name, rating: (c as any).rating ?? null });
      }
    }

    return offers.map((o) => {
      const company = companyMap.get(o.company_id);
      return {
        offerId: o.id,
        companyId: o.company_id,
        companyName: company?.name ?? 'Unknown company',
        companyRating: company?.rating ?? null,
        companyCompletedDeals: null,
        estimatedTotalUsd: o.estimated_total_usd,
        estimatedTotalUsdMax: o.estimated_total_usd_max,
        serviceFeeUsd: o.service_fee_usd,
        estimatedDurationDays: o.estimated_duration_days,
        comment: o.comment,
        status: o.status,
      };
    });
  }

  async selectOfferForUser(userId: number, leadId: number, offerId: number): Promise<{
    leadId: number;
    selectedOfferId: number;
  }> {
    const lead = await this.leadModel.getLeadForUser(userId, leadId);
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const offers = await this.leadOfferModel.getOffersByLeadId(leadId);
    const found = offers.find((o) => o.id === offerId);
    if (!found) {
      throw new NotFoundError('Offer');
    }

    await this.leadOfferModel.markSelectedAndOthersRejected(leadId, offerId);
    await this.leadModel.markLeadClosed(leadId);

    // Update company invitation statuses: winner vs losers
    const winningLeadCompanyId = found.lead_company_id;
    await this.leadModel.markLeadCompanyWon(winningLeadCompanyId);
    await this.leadModel.markOtherLeadCompaniesLost(leadId, winningLeadCompanyId);

    return {
      leadId,
      selectedOfferId: offerId,
    };
  }

  async getCompanyLeadsForUser(userId: number): Promise<
    Array<{
      leadCompanyId: number;
      leadId: number;
      status: string;
      invitedAt: string;
      expiresAt: string | null;
      leadSummary: {
        budgetUsdMin: number | null;
        budgetUsdMax: number | null;
        carType: string | null;
        auctionSources: string[] | null;
        priority: string | null;
        source: 'quotes' | 'general_form';
        desiredBudgetText?: string | null;
        desiredVehicleTypeText?: string | null;
        auctionText?: string | null;
        comment?: string | null;
      };
      vehicle: {
        id: number | null;
        title: string | null;
        year: number | null;
        mainImageUrl: string | null;
        auctionLotUrl: string | null;
      } | null;
    }>
  > {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    if (user.role !== 'company' || user.company_id == null) {
      throw new AuthorizationError('Company role with company_id is required');
    }

    const rows = await this.leadModel.getCompanyLeads(user.company_id);

    return rows.map((row) => {
      let auctionSources: string[] | null = null;
      if (row.auction_sources) {
        try {
          auctionSources = JSON.parse(row.auction_sources as any);
        } catch {
          auctionSources = null;
        }
      }

      const hasVehicle = row.vehicle_id != null;

      return {
        leadCompanyId: row.lead_company_id,
        leadId: row.lead_id,
        status: row.status,
        invitedAt: row.invited_at.toISOString(),
        expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
        leadSummary: {
          budgetUsdMin: row.budget_usd_min,
          budgetUsdMax: row.budget_usd_max,
          carType: row.car_type,
          auctionSources,
          priority: row.priority,
          source: row.source,
          desiredBudgetText: row.desired_budget_text ?? null,
          desiredVehicleTypeText: row.desired_vehicle_type ?? null,
          auctionText: row.auction_text ?? null,
          comment: row.message ?? null,
        },
        vehicle: hasVehicle
          ? {
              id: row.vehicle_id,
              title: row.vehicle_title ?? null,
              year: row.vehicle_year ?? null,
              mainImageUrl: row.vehicle_main_image_url ?? null,
              auctionLotUrl: row.vehicle_auction_lot_url ?? null,
            }
          : null,
      };
    });
  }

  async getCompanyLeadDetailForUser(userId: number, leadCompanyId: number): Promise<{
    leadCompanyId: number;
    leadId: number;
    status: string;
    invitedAt: string;
    expiresAt: string | null;
    lead: {
      budgetUsdMin: number | null;
      budgetUsdMax: number | null;
      carType: string | null;
      auctionSources: string[] | null;
      message: string | null;
      priority: string | null;
    };
    vehicle: {
      id: number | null;
      title: string | null;
      year: number | null;
      mainImageUrl: string | null;
      auctionLotUrl: string | null;
    } | null;
  }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    if (user.role !== 'company' || user.company_id == null) {
      throw new AuthorizationError('Company role with company_id is required');
    }

    const row = await this.leadModel.getLeadCompanyForCompany(user.company_id, leadCompanyId);
    if (!row) {
      throw new NotFoundError('LeadCompany');
    }

    // Mark as viewed when company opens the lead details
    await this.leadModel.markLeadCompanyViewed(user.company_id, leadCompanyId);

    let auctionSources: string[] | null = null;
    if (row.auction_sources) {
      try {
        auctionSources = JSON.parse(row.auction_sources as any);
      } catch {
        auctionSources = null;
      }
    }

    const hasVehicle = row.vehicle_id != null;

    return {
      leadCompanyId: row.lead_company_id,
      leadId: row.lead_id,
      status: row.status,
      invitedAt: row.invited_at.toISOString(),
      expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
      lead: {
        budgetUsdMin: row.budget_usd_min,
        budgetUsdMax: row.budget_usd_max,
        carType: row.car_type,
        auctionSources,
        message: row.message,
        priority: row.priority,
      },
      vehicle: hasVehicle
        ? {
            id: row.vehicle_id,
            title: row.vehicle_title ?? null,
            year: row.vehicle_year ?? null,
            mainImageUrl: row.vehicle_main_image_url ?? null,
            auctionLotUrl: row.vehicle_auction_lot_url ?? null,
          }
        : null,
    };
  }

  async submitOfferForCompanyLead(
    userId: number,
    leadCompanyId: number,
    data: {
      estimatedTotalUsd: number;
      estimatedTotalUsdMax?: number | null;
      serviceFeeUsd?: number | null;
      estimatedDurationDays?: number | null;
      comment?: string | null;
    },
  ): Promise<{
    offerId: number;
    leadId: number;
    companyId: number;
    status: string;
    createdAt: string;
  }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    if (user.role !== 'company' || user.company_id == null) {
      throw new AuthorizationError('Company role with company_id is required');
    }

    const row = await this.leadModel.getLeadCompanyForCompany(user.company_id, leadCompanyId);
    if (!row) {
      throw new NotFoundError('LeadCompany');
    }

    const offer = await this.leadOfferModel.createOffer({
      leadId: row.lead_id,
      companyId: user.company_id,
      leadCompanyId,
      estimatedTotalUsd: data.estimatedTotalUsd,
      estimatedTotalUsdMax: data.estimatedTotalUsdMax ?? null,
      serviceFeeUsd: data.serviceFeeUsd ?? null,
      estimatedDurationDays: data.estimatedDurationDays ?? null,
      comment: data.comment ?? null,
    });

    // Mark responded_at when first offer is submitted for this leadCompany
    await this.leadModel.markLeadCompanyResponded(user.company_id, leadCompanyId);
    await this.leadModel.markLeadCompanyOfferSent(user.company_id, leadCompanyId);

    return {
      offerId: offer.id,
      leadId: offer.lead_id,
      companyId: offer.company_id,
      status: offer.status,
      createdAt: offer.created_at.toISOString(),
    };
  }
}
