/**
 * Admin Calculator Routes
 *
 * Admin-only endpoints for managing company calculator configurations.
 * These endpoints allow platform administrators to:
 * - View current calculator configuration for a company
 * - Update calculator type, API URL, and field mappings
 * - Test calculator configuration before saving
 *
 * All endpoints require admin authentication.
 *
 * @module routes/adminCalculator
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { CompanyModel } from '../models/CompanyModel.js';
import { NotFoundError, ValidationError } from '../types/errors.js';
import { CalculatorConfig, CalculatorType } from '../types/calculatorAdapterTypes.js';

// =============================================================================
// TYPES
// =============================================================================

interface CalculatorUpdatePayload {
    calculator_type: CalculatorType;
    calculator_api_url?: string | null;
    calculator_config?: CalculatorConfig | null;
}

interface CalculatorTestPayload {
    calculator_api_url: string;
    calculator_config: CalculatorConfig;
    test_request?: {
        usacity?: string;
        destinationport?: string;
        vehiclecategory?: string;
        auction?: string;
        buyprice?: number;
    };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate calculator_config JSON structure
 */
function validateCalculatorConfig(config: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
        return { valid: false, errors: ['calculator_config must be an object'] };
    }

    const cfg = config as Record<string, unknown>;

    // Check timeout
    if (cfg.timeout !== undefined && (typeof cfg.timeout !== 'number' || cfg.timeout < 1000 || cfg.timeout > 120000)) {
        errors.push('timeout must be a number between 1000 and 120000 (milliseconds)');
    }

    // Check headers
    if (cfg.headers !== undefined) {
        if (typeof cfg.headers !== 'object' || cfg.headers === null) {
            errors.push('headers must be an object');
        } else {
            const headers = cfg.headers as Record<string, unknown>;
            for (const [key, value] of Object.entries(headers)) {
                if (typeof value !== 'string') {
                    errors.push(`headers["${key}"] must be a string`);
                }
            }
        }
    }

    // Check field_mapping (required)
    if (!cfg.field_mapping) {
        errors.push('field_mapping is required');
    } else if (typeof cfg.field_mapping !== 'object') {
        errors.push('field_mapping must be an object');
    } else {
        const fm = cfg.field_mapping as Record<string, unknown>;

        // Check request mapping
        if (fm.request && typeof fm.request !== 'object') {
            errors.push('field_mapping.request must be an object');
        }

        // Check response mapping (required)
        if (!fm.response) {
            errors.push('field_mapping.response is required');
        } else if (typeof fm.response !== 'object') {
            errors.push('field_mapping.response must be an object');
        } else {
            const resp = fm.response as Record<string, unknown>;
            if (!resp.totalPrice || typeof resp.totalPrice !== 'string') {
                errors.push('field_mapping.response.totalPrice is required and must be a string (dot-notation path)');
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Build request body from standard request using field mapping
 */
function buildMappedRequest(
    standardRequest: Record<string, unknown>,
    requestMapping: Record<string, unknown>
): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};

    // Map each field
    for (const [ourField, theirField] of Object.entries(requestMapping)) {
        if (ourField === 'static') continue; // Handle separately
        if (theirField === null) continue; // Exclude this field
        if (typeof theirField === 'string' && standardRequest[ourField] !== undefined) {
            mapped[theirField] = standardRequest[ourField];
        }
    }

    // Add static fields
    const staticFields = requestMapping.static as Record<string, unknown> | undefined;
    if (staticFields && typeof staticFields === 'object') {
        Object.assign(mapped, staticFields);
    }

    return mapped;
}

/**
 * Extract value from nested object using dot-notation path
 */
function extractByPath(obj: unknown, path: string): unknown {
    if (!path || typeof obj !== 'object' || obj === null) return undefined;

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }

    return current;
}

// =============================================================================
// ROUTES
// =============================================================================

export async function adminCalculatorRoutes(fastify: FastifyInstance): Promise<void> {
    const companyModel = new CompanyModel(fastify);

    // ===========================================================================
    // GET /admin/companies/:id/calculator
    // ===========================================================================
    // Get current calculator configuration for a company
    fastify.get('/admin/companies/:id/calculator', {
        preHandler: [fastify.authenticateCookie, fastify.requireAdmin],
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^[0-9]+$' },
                },
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const companyId = parseInt(id, 10);

        const company = await companyModel.findById(companyId);
        if (!company) {
            throw new NotFoundError('Company');
        }

        return reply.send({
            company_id: company.id,
            company_name: company.name,
            calculator_type: company.calculator_type || 'default',
            calculator_api_url: company.calculator_api_url || null,
            calculator_config: company.calculator_config || null,
            is_custom_api: company.calculator_type === 'custom_api',
            has_valid_config: !!(company.calculator_api_url && company.calculator_config),
        });
    });

    // ===========================================================================
    // PATCH /admin/companies/:id/calculator
    // ===========================================================================
    // Update calculator configuration for a company
    fastify.patch('/admin/companies/:id/calculator', {
        preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^[0-9]+$' },
                },
            },
            body: {
                type: 'object',
                required: ['calculator_type'],
                properties: {
                    calculator_type: { type: 'string', enum: ['default', 'custom_api', 'formula'] },
                    calculator_api_url: { type: ['string', 'null'] },
                    calculator_config: { type: ['object', 'null'] },
                },
                additionalProperties: false,
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const companyId = parseInt(id, 10);
        const payload = request.body as CalculatorUpdatePayload;

        // Verify company exists
        const company = await companyModel.findById(companyId);
        if (!company) {
            throw new NotFoundError('Company');
        }

        // Validate based on calculator_type
        if (payload.calculator_type === 'custom_api') {
            // Require API URL for custom_api
            if (!payload.calculator_api_url) {
                throw new ValidationError('calculator_api_url is required when calculator_type is "custom_api"');
            }

            // Validate URL format
            try {
                new URL(payload.calculator_api_url);
            } catch {
                throw new ValidationError('calculator_api_url must be a valid URL');
            }

            // Validate calculator_config
            if (!payload.calculator_config) {
                throw new ValidationError('calculator_config is required when calculator_type is "custom_api"');
            }

            const validation = validateCalculatorConfig(payload.calculator_config);
            if (!validation.valid) {
                throw new ValidationError(`Invalid calculator_config: ${validation.errors.join('; ')}`);
            }
        }

        // If resetting to default, clear the config
        if (payload.calculator_type === 'default') {
            payload.calculator_api_url = null;
            payload.calculator_config = null;
        }

        // Update the company
        await companyModel.update(companyId, {
            calculator_type: payload.calculator_type,
            calculator_api_url: payload.calculator_api_url ?? null,
            calculator_config: payload.calculator_config ?? null,
        });

        fastify.log.info(
            { companyId, calculator_type: payload.calculator_type },
            '[AdminCalculator] Company calculator configuration updated'
        );

        return reply.send({
            success: true,
            message: `Calculator configuration updated for company ${company.name}`,
            company_id: companyId,
            calculator_type: payload.calculator_type,
            calculator_api_url: payload.calculator_api_url,
            calculator_config: payload.calculator_config,
        });
    });

    // ===========================================================================
    // POST /admin/companies/:id/calculator/test
    // ===========================================================================
    // Test calculator configuration without saving
    fastify.post('/admin/companies/:id/calculator/test', {
        preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^[0-9]+$' },
                },
            },
            body: {
                type: 'object',
                required: ['calculator_api_url', 'calculator_config'],
                properties: {
                    calculator_api_url: { type: 'string' },
                    calculator_config: { type: 'object' },
                    test_request: { type: 'object' },
                },
                additionalProperties: false,
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const companyId = parseInt(id, 10);
        const payload = request.body as CalculatorTestPayload;

        // Verify company exists
        const company = await companyModel.findById(companyId);
        if (!company) {
            throw new NotFoundError('Company');
        }

        // Validate URL
        try {
            new URL(payload.calculator_api_url);
        } catch {
            return reply.status(400).send({
                success: false,
                error: 'Invalid URL',
                message: 'calculator_api_url must be a valid URL',
            });
        }

        // Validate config
        const validation = validateCalculatorConfig(payload.calculator_config);
        if (!validation.valid) {
            return reply.status(400).send({
                success: false,
                error: 'Invalid Configuration',
                message: validation.errors.join('; '),
            });
        }

        // Build test request
        const standardRequest = {
            buyprice: payload.test_request?.buyprice ?? 5000,
            auction: payload.test_request?.auction ?? 'Copart',
            vehicletype: 'standard',
            usacity: payload.test_request?.usacity ?? 'Dallas (TX)',
            destinationport: payload.test_request?.destinationport ?? 'POTI',
            vehiclecategory: payload.test_request?.vehiclecategory ?? 'Sedan',
        };

        // Map request using field mapping
        const requestMapping = payload.calculator_config.field_mapping?.request || {};
        const mappedRequest = buildMappedRequest(standardRequest, requestMapping as Record<string, unknown>);

        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(payload.calculator_config.headers || {}),
        };

        const timeout = payload.calculator_config.timeout || 30000;

        fastify.log.info(
            {
                companyId,
                apiUrl: payload.calculator_api_url,
                mappedRequest,
                headers: Object.keys(headers),
            },
            '[AdminCalculator] Testing calculator configuration'
        );

        try {
            const response = await axios.post(
                payload.calculator_api_url,
                mappedRequest,
                {
                    headers,
                    timeout,
                    validateStatus: () => true, // Don't throw on non-2xx
                }
            );

            // Extract values using response mapping
            const responseMapping = payload.calculator_config.field_mapping?.response || {};
            const totalPrice = extractByPath(response.data, responseMapping.totalPrice);
            const distanceMiles = responseMapping.distanceMiles
                ? extractByPath(response.data, responseMapping.distanceMiles)
                : null;
            const currency = responseMapping.currency
                ? extractByPath(response.data, responseMapping.currency)
                : 'USD';

            const isSuccess = response.status >= 200 && response.status < 300;
            const priceExtracted = totalPrice !== undefined && totalPrice !== null && !isNaN(Number(totalPrice));

            return reply.send({
                success: isSuccess && priceExtracted,
                test_summary: {
                    http_status: response.status,
                    price_extracted: priceExtracted,
                    extracted_price: priceExtracted ? Number(totalPrice) : null,
                    extracted_distance: distanceMiles !== undefined ? Number(distanceMiles) : null,
                    extracted_currency: currency || 'USD',
                },
                request_sent: {
                    url: payload.calculator_api_url,
                    method: 'POST',
                    headers: Object.keys(headers),
                    body: mappedRequest,
                },
                response_received: {
                    status: response.status,
                    status_text: response.statusText,
                    body: response.data,
                },
                field_mapping_applied: {
                    request_mapping: requestMapping,
                    response_mapping: responseMapping,
                },
                recommendations: isSuccess && priceExtracted
                    ? ['Configuration looks good! Ready to save.']
                    : [
                        ...(isSuccess ? [] : [`API returned status ${response.status}. Check if the endpoint is correct.`]),
                        ...(!priceExtracted ? [`Could not extract price from path "${responseMapping.totalPrice}". Check the response structure.`] : []),
                    ],
            });
        } catch (error: any) {
            fastify.log.error(
                { companyId, error: error.message },
                '[AdminCalculator] Test request failed'
            );

            return reply.status(200).send({
                success: false,
                error: error.code || 'REQUEST_FAILED',
                message: error.message,
                request_sent: {
                    url: payload.calculator_api_url,
                    method: 'POST',
                    headers: Object.keys(headers),
                    body: mappedRequest,
                },
                recommendations: [
                    error.code === 'ECONNREFUSED' ? 'Connection refused. Is the API server running?' : null,
                    error.code === 'ETIMEDOUT' ? `Request timed out after ${timeout}ms. Increase timeout or check API performance.` : null,
                    error.code === 'ENOTFOUND' ? 'Domain not found. Check the URL.' : null,
                    'Verify the API URL is correct and accessible from this server.',
                ].filter(Boolean),
            });
        }
    });

    // ===========================================================================
    // DELETE /admin/companies/:id/calculator
    // ===========================================================================
    // Reset company to default calculator
    fastify.delete('/admin/companies/:id/calculator', {
        preHandler: [fastify.authenticateCookie, fastify.requireAdmin, fastify.csrfProtection],
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^[0-9]+$' },
                },
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const companyId = parseInt(id, 10);

        const company = await companyModel.findById(companyId);
        if (!company) {
            throw new NotFoundError('Company');
        }

        // Reset to default
        await companyModel.update(companyId, {
            calculator_type: 'default',
            calculator_api_url: null,
            calculator_config: null,
        });

        fastify.log.info(
            { companyId, companyName: company.name },
            '[AdminCalculator] Company calculator reset to default'
        );

        return reply.send({
            success: true,
            message: `Calculator configuration reset to default for company ${company.name}`,
            company_id: companyId,
            calculator_type: 'default',
        });
    });

    fastify.log.info('[AdminCalculator] Admin calculator routes registered at /admin/companies/:id/calculator');
}
