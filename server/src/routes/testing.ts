/**
 * Mock Calculator Routes for Testing Adapter Pattern
 *
 * These endpoints simulate different company calculator APIs with various:
 * - Request/response formats
 * - Field naming conventions
 * - Nesting levels
 * - Authentication requirements
 *
 * Used to test the ConfigurableAdapter with different API configurations.
 * These routes should only be used in development/testing environments.
 *
 * @module routes/testing
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a random variation to simulate real API price differences
 */
function randomVariation(base: number, range: number): number {
    return base + (Math.random() * range * 2 - range);
}

/**
 * Add artificial delay to simulate network latency
 */
async function simulateLatency(minMs: number = 200, maxMs: number = 400): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Round to 2 decimal places
 */
function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

export async function mockCalculatorRoutes(fastify: FastifyInstance): Promise<void> {
    const prefix = '/testing/calculator';

    // ===========================================================================
    // MOCK API 1: Simple Format
    // ===========================================================================
    // Tests: Basic field mapping where names are similar to standard
    // Response: Flat structure with standard field names
    fastify.post(`${prefix}/simple`, async (request: FastifyRequest, reply: FastifyReply) => {
        await simulateLatency();

        const body = request.body as {
            city?: string;
            vehicleType?: string;
            port?: string;
            auction?: string;
            buyPrice?: number;
        };

        fastify.log.info(
            { endpoint: 'simple', body },
            '[MockCalculator] Simple endpoint called'
        );

        // Validate required fields
        if (!body.city) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'city is required',
            });
        }

        // Calculate price
        const base = 1000;
        const distanceFactor = 400;
        const buyPriceFactor = (body.buyPrice || 5000) * 0.09;
        const totalPrice = round2(randomVariation(base + distanceFactor + buyPriceFactor, 50));

        const response = {
            totalPrice,
            distanceMiles: 2100,
            currency: 'USD',
        };

        fastify.log.info(
            { endpoint: 'simple', response },
            '[MockCalculator] Simple endpoint response'
        );

        return reply.send(response);
    });

    // ===========================================================================
    // MOCK API 2: Nested Response Format
    // ===========================================================================
    // Tests: Deep nesting in response, dot-notation path extraction
    // Response: Deeply nested object structure
    fastify.post(`${prefix}/nested`, async (request: FastifyRequest, reply: FastifyReply) => {
        await simulateLatency();

        const body = request.body as {
            origin?: string;
            vehicle?: string;
            destination?: string;
            auctionHouse?: string;
            purchasePrice?: number;
        };

        fastify.log.info(
            { endpoint: 'nested', body },
            '[MockCalculator] Nested endpoint called'
        );

        // Validate required fields
        if (!body.origin) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'origin is required',
            });
        }

        // Calculate price
        const shipping = 1200;
        const customs = round2((body.purchasePrice || 5000) * 0.064);
        const insurance = 100;
        const total = round2(randomVariation(shipping + customs + insurance, 75));

        const response = {
            status: 'success',
            data: {
                quote: {
                    pricing: {
                        total_usd: total,
                        breakdown: {
                            shipping,
                            customs,
                            insurance,
                        },
                    },
                    route: {
                        distance: {
                            miles: 2200,
                            km: 3540,
                        },
                    },
                },
                currency: 'USD',
            },
            timestamp: new Date().toISOString(),
        };

        fastify.log.info(
            { endpoint: 'nested', totalPrice: total },
            '[MockCalculator] Nested endpoint response'
        );

        return reply.send(response);
    });

    // ===========================================================================
    // MOCK API 3: Different Field Names + Static Fields
    // ===========================================================================
    // Tests: Completely different naming, static field requirements
    // Response: Different field names, requires specific static values
    fastify.post(`${prefix}/different-fields`, async (request: FastifyRequest, reply: FastifyReply) => {
        await simulateLatency();

        const body = request.body as {
            from_city?: string;
            car_type?: string;
            to_port?: string;
            sale_location?: string;
            cost?: number;
            customer_id?: string;
            request_type?: string;
        };

        fastify.log.info(
            { endpoint: 'different-fields', body },
            '[MockCalculator] Different-fields endpoint called'
        );

        // Validate required fields
        if (!body.from_city) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'from_city is required',
            });
        }

        // Validate static fields
        if (!body.customer_id) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'customer_id is required (static field)',
            });
        }

        if (body.request_type !== 'instant_quote') {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'request_type must be "instant_quote"',
            });
        }

        // Calculate price
        const base = 900;
        const costFactor = (body.cost || 5000) * 0.11;
        const distanceFactor = 350;
        const total = round2(randomVariation(base + costFactor + distanceFactor, 60));

        const response = {
            quote_id: `Q-${Date.now()}-ABC`,
            total,
            miles: 1950,
            curr: 'USD',
            valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        fastify.log.info(
            { endpoint: 'different-fields', response },
            '[MockCalculator] Different-fields endpoint response'
        );

        return reply.send(response);
    });

    // ===========================================================================
    // MOCK API 4: API Key Authentication Required
    // ===========================================================================
    // Tests: Header-based authentication, custom headers configuration
    // Response: Requires specific headers to work
    fastify.post(`${prefix}/with-auth`, async (request: FastifyRequest, reply: FastifyReply) => {
        await simulateLatency();

        const apiKey = request.headers['x-api-key'];
        const customerId = request.headers['x-customer-id'];

        fastify.log.info(
            {
                endpoint: 'with-auth',
                hasApiKey: !!apiKey,
                hasCustomerId: !!customerId,
                body: request.body,
            },
            '[MockCalculator] With-auth endpoint called'
        );

        // Validate authentication
        if (!apiKey || apiKey !== 'test-secret-key-12345') {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Missing or invalid X-API-Key header. Expected: test-secret-key-12345',
            });
        }

        if (!customerId) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Missing X-Customer-ID header',
            });
        }

        const body = request.body as {
            pickup?: string;
            delivery?: string;
            vehicle_category?: string;
            seller?: string;
            value?: number;
        };

        // Validate required fields
        if (!body.pickup) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'pickup is required',
            });
        }

        // Calculate price
        const base = 1300;
        const valueFactor = (body.value || 5000) * 0.15;
        const distanceFactor = 450;
        const total = round2(randomVariation(base + valueFactor + distanceFactor, 80));

        const response = {
            authenticated: true,
            estimate: {
                amount: total,
                distance_mi: 2300,
                currency_code: 'USD',
            },
            api_version: '1.0',
        };

        fastify.log.info(
            { endpoint: 'with-auth', authenticated: true, totalPrice: total },
            '[MockCalculator] With-auth endpoint response (authenticated)'
        );

        return reply.send(response);
    });

    // ===========================================================================
    // MOCK API 5: Minimal Response
    // ===========================================================================
    // Tests: Handling of minimal/sparse responses, missing optional fields
    // Response: Only essential price, no distance or currency
    fastify.post(`${prefix}/minimal`, async (request: FastifyRequest, reply: FastifyReply) => {
        await simulateLatency();

        const body = request.body as {
            src?: string;
            dst?: string;
            type?: string;
        };

        fastify.log.info(
            { endpoint: 'minimal', body },
            '[MockCalculator] Minimal endpoint called'
        );

        // Validate required fields
        if (!body.src) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'src is required',
            });
        }

        // Calculate price (simple)
        const base = 1500;
        const price = round2(randomVariation(base, 100));

        const response = {
            price,
        };

        fastify.log.info(
            { endpoint: 'minimal', response },
            '[MockCalculator] Minimal endpoint response'
        );

        return reply.send(response);
    });

    // ===========================================================================
    // List all endpoints (GET for discovery)
    // ===========================================================================
    fastify.get(`${prefix}`, async (_request: FastifyRequest, reply: FastifyReply) => {
        return reply.send({
            description: 'Mock Calculator API Endpoints for Testing Adapter Pattern',
            endpoints: [
                {
                    path: `${prefix}/simple`,
                    method: 'POST',
                    description: 'Simple format - flat structure, standard field names',
                },
                {
                    path: `${prefix}/nested`,
                    method: 'POST',
                    description: 'Nested response - deeply nested, tests dot-notation extraction',
                },
                {
                    path: `${prefix}/different-fields`,
                    method: 'POST',
                    description: 'Different field names - requires static fields',
                },
                {
                    path: `${prefix}/with-auth`,
                    method: 'POST',
                    description: 'Authentication required - tests header configuration',
                },
                {
                    path: `${prefix}/minimal`,
                    method: 'POST',
                    description: 'Minimal response - only returns price',
                },
            ],
            usage: 'See server/docs/MOCK_CALCULATOR_TESTING.md for configuration SQL',
        });
    });

    fastify.log.info('[MockCalculator] Mock calculator routes registered at /testing/calculator/*');
}
