/**
 * Route Registration
 *
 * Registers all API routes for the application.
 * Routes are organized by domain and registered in a logical order.
 *
 * @module routes
 */

import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { accountRoutes } from './account.js';
import { userRoutes } from './user.js';
import { vinRoutes } from './vin.js';
import { companyRoutes } from './company.js';
import { auctionRoutes } from './auction.js';
import { vehicleRoutes } from './vehicle.js';
import { favoritesRoutes } from './favorites.js';
import { citiesRoutes } from './cities.js';
import { portsRoutes } from './ports.js';
import { auctionsRoutes } from './auctions.js';
import { calculatorRoutes } from './calculator.js';
import { vehicleMakesRoutes } from './vehicle-makes.js';
import { vehicleModelsRoutes } from './vehicle-models.js';
import { servicesRoutes } from './services.js';
// import { inquiryRoutes } from './inquiry.js';
// import { companyInquiryRoutes } from './companyInquiry.js';

/**
 * Register all API routes
 *
 * Routes are organized by domain:
 * - Health: System health checks
 * - Auth: Authentication (login, register, logout)
 * - Account: User account management
 * - Users: User profile operations
 * - VIN: VIN decoding services
 * - Companies: Company management and search
 * - Auctions: Auction listings
 * - Vehicles: Vehicle catalog
 * - Favorites: User favorites
 * - Reference Data: Cities, Ports, Makes, Models
 * - Calculator: Shipping cost calculator
 * - Services: Available services
 *
 * @param fastify - Fastify instance to register routes on
 */
export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
    // ---------------------------------------------------------------------------
    // System Routes
    // ---------------------------------------------------------------------------
    await fastify.register(healthRoutes);

    // ---------------------------------------------------------------------------
    // Authentication & Account Routes
    // ---------------------------------------------------------------------------
    await fastify.register(authRoutes);      // Secure cookie-based auth routes
    await fastify.register(accountRoutes);   // Account management (cookie auth + CSRF)
    await fastify.register(userRoutes);      // User profile operations

    // ---------------------------------------------------------------------------
    // Core Business Routes
    // ---------------------------------------------------------------------------
    await fastify.register(vinRoutes);
    await fastify.register(companyRoutes);
    await fastify.register(auctionRoutes);
    await fastify.register(vehicleRoutes);
    await fastify.register(favoritesRoutes);

    // ---------------------------------------------------------------------------
    // Reference Data Routes
    // ---------------------------------------------------------------------------
    await fastify.register(citiesRoutes);
    await fastify.register(portsRoutes);
    await fastify.register(auctionsRoutes);
    await fastify.register(vehicleMakesRoutes);
    await fastify.register(vehicleModelsRoutes);

    // ---------------------------------------------------------------------------
    // Utility Routes
    // ---------------------------------------------------------------------------
    await fastify.register(calculatorRoutes);
    await fastify.register(servicesRoutes);

    // ---------------------------------------------------------------------------
    // Messaging Routes (disabled for initial release)
    // ---------------------------------------------------------------------------
    // These routes enable chat between companies and users.
    // Will be enabled when inquiries feature is ready.
    // await fastify.register(inquiryRoutes);
    // await fastify.register(companyInquiryRoutes);

    fastify.log.debug('All routes registered');
}
