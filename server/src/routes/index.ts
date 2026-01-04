/**
 * Route Registration
 *
 * Registers all API routes for the application.
 * Routes are organized by domain and registered in a logical order.
 *
 * @module routes
 */

import { FastifyInstance } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Testing routes (development only)
import { mockCalculatorRoutes } from './testing.js';

// Admin routes
import { adminCalculatorRoutes } from './adminCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // ---------------------------------------------------------------------------
    // Testing Routes (development only)
    // ---------------------------------------------------------------------------
    // Mock calculator endpoints for testing the adapter pattern
    await fastify.register(mockCalculatorRoutes);

    // ---------------------------------------------------------------------------
    // Admin Routes
    // ---------------------------------------------------------------------------
    // Admin-only endpoints for platform management
    await fastify.register(adminCalculatorRoutes);

    fastify.log.debug('All routes registered');
}

/**
 * Register SPA fallback route (MUST be called AFTER all other routes)
 * This enables React Router to work correctly on page refresh
 */
export async function registerSpaFallback(fastify: FastifyInstance): Promise<void> {
    const publicPath = path.join(__dirname, '..', '..', 'public');

    // Wildcard route to catch all GET requests that didn't match any route
    // Serves index.html for client-side routing (React Router)
    fastify.get('/*', async (request, reply) => {
        // Serve index.html for SPA routing
        return reply.sendFile('index.html', publicPath);
    });

    fastify.log.debug('SPA fallback route registered');
}
