import { FastifyInstance } from 'fastify';
import axios from 'axios';
import type { Company } from '../../types/company.js';
import type {
    ICalculatorAdapter,
    StandardCalculatorRequest,
    StandardCalculatorResponse,
    CalculatorConfig,
    RequestFieldMapping,
    ResponseFieldMapping,
} from './ICalculatorAdapter.js';

/**
 * Configurable Calculator Adapter
 * 
 * Uses the calculator_config JSON field from the company to communicate
 * with custom calculator APIs. Supports field mapping for both requests
 * and responses.
 * 
 * Used when company.calculator_type === 'custom_api'.
 */
export class ConfigurableAdapter implements ICalculatorAdapter {
    private readonly fastify: FastifyInstance;
    private readonly CACHE_TTL_SECONDS = 86400; // 24 hours

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
    }

    /**
     * Calculate shipping quote using a company's custom calculator API.
     */
    async calculate(
        request: StandardCalculatorRequest,
        company: Company
    ): Promise<StandardCalculatorResponse> {
        // Validate configuration
        const apiUrl = (company as any).calculator_api_url;
        const config = (company as any).calculator_config as CalculatorConfig | null | undefined;

        if (!apiUrl) {
            this.fastify.log.error(
                { companyId: company.id, companyName: company.name },
                '[ConfigurableAdapter] Company has calculator_type=custom_api but no calculator_api_url'
            );
            return {
                success: false,
                totalPrice: 0,
                distanceMiles: 0,
                currency: 'USD',
                error: `Company ${company.name} is not properly configured for custom calculator`,
            };
        }

        if (!config || !config.field_mapping) {
            this.fastify.log.error(
                { companyId: company.id, companyName: company.name },
                '[ConfigurableAdapter] Company has calculator_type=custom_api but no calculator_config'
            );
            return {
                success: false,
                totalPrice: 0,
                distanceMiles: 0,
                currency: 'USD',
                error: `Company ${company.name} is missing calculator configuration`,
            };
        }

        // Build cache key including company ID
        const cacheKey = this.buildCacheKey(request, company.id);

        // Check Redis cache if available
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        // Build request body using field mapping
        const requestBody = this.mapRequest(request, config.field_mapping.request);

        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...config.headers,
        };

        this.fastify.log.info(
            {
                companyId: company.id,
                companyName: company.name,
                apiUrl,
                requestBody,
                originalRequest: request,
            },
            '[ConfigurableAdapter] Calling custom calculator API'
        );

        try {
            const response = await axios.post(apiUrl, requestBody, {
                timeout: config.timeout || 30000,
                headers,
            });

            this.fastify.log.info(
                { companyId: company.id, status: response.status },
                '[ConfigurableAdapter] Custom calculator API response received'
            );

            // Map response to standard format
            const result = this.mapResponse(response.data, config.field_mapping.response, company.id);

            // Cache the result
            await this.cacheResult(cacheKey, result);

            return result;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.fastify.log.error(
                    {
                        companyId: company.id,
                        apiUrl,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        message: error.message,
                    },
                    '[ConfigurableAdapter] Error calling custom calculator API'
                );

                const errorMessage =
                    (error.response?.data as any)?.message ||
                    (error.response?.data as any)?.error ||
                    error.message ||
                    'Custom calculator API error';

                return {
                    success: false,
                    totalPrice: 0,
                    distanceMiles: 0,
                    currency: 'USD',
                    error: `Custom calculator error for ${company.name}: ${errorMessage}`,
                };
            }

            this.fastify.log.error(
                { companyId: company.id, error },
                '[ConfigurableAdapter] Unexpected error calling custom calculator API'
            );

            return {
                success: false,
                totalPrice: 0,
                distanceMiles: 0,
                currency: 'USD',
                error: `Unexpected error for ${company.name}`,
            };
        }
    }

    /**
     * Map StandardCalculatorRequest to external API request body.
     */
    private mapRequest(
        request: StandardCalculatorRequest,
        mapping: RequestFieldMapping
    ): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        // Map each field if a mapping is defined (and not null)
        if (mapping.buyprice !== null) {
            const fieldName = mapping.buyprice || 'buyprice';
            result[fieldName] = request.buyprice;
        }

        if (mapping.auction !== null) {
            const fieldName = mapping.auction || 'auction';
            result[fieldName] = request.auction;
        }

        if (mapping.vehicletype !== null) {
            const fieldName = mapping.vehicletype || 'vehicletype';
            result[fieldName] = request.vehicletype;
        }

        if (mapping.usacity !== null && request.usacity) {
            const fieldName = mapping.usacity || 'usacity';
            result[fieldName] = request.usacity;
        }

        if (mapping.destinationport !== null) {
            const fieldName = mapping.destinationport || 'destinationport';
            result[fieldName] = request.destinationport;
        }

        if (mapping.vehiclecategory !== null) {
            const fieldName = mapping.vehiclecategory || 'vehiclecategory';
            result[fieldName] = request.vehiclecategory;
        }

        // Add static fields
        if (mapping.static) {
            Object.assign(result, mapping.static);
        }

        return result;
    }

    /**
     * Map external API response to StandardCalculatorResponse.
     */
    private mapResponse(
        apiResponse: unknown,
        mapping: ResponseFieldMapping,
        companyId: number
    ): StandardCalculatorResponse {
        const totalPrice = this.extractValueByPath(apiResponse, mapping.totalPrice);
        const distanceMiles = mapping.distanceMiles
            ? this.extractValueByPath(apiResponse, mapping.distanceMiles)
            : 0;
        const currency = mapping.currency
            ? this.extractValueByPath(apiResponse, mapping.currency)
            : 'USD';

        const totalPriceNum = this.toNumber(totalPrice);

        if (totalPriceNum <= 0) {
            this.fastify.log.warn(
                { companyId, mapping, apiResponse },
                '[ConfigurableAdapter] Extracted totalPrice is zero or invalid'
            );
        }

        return {
            success: totalPriceNum > 0,
            totalPrice: totalPriceNum,
            distanceMiles: this.toNumber(distanceMiles),
            currency: typeof currency === 'string' ? currency : 'USD',
            breakdown: {
                formula_source: 'custom_api',
                raw_response: apiResponse,
            },
        };
    }

    /**
     * Extract a value from an object using dot-notation path.
     * 
     * @example
     * extractValueByPath({ data: { quote: { total: 100 } } }, 'data.quote.total') // 100
     */
    private extractValueByPath(obj: unknown, path: string): unknown {
        if (!path || typeof obj !== 'object' || obj === null) {
            return undefined;
        }

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

    /**
     * Safely convert a value to a number.
     */
    private toNumber(value: unknown): number {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
        return 0;
    }

    /**
     * Build cache key for Redis.
     */
    private buildCacheKey(request: StandardCalculatorRequest, companyId: number): string {
        return `calculator:company:${companyId}:${JSON.stringify({
            buyprice: request.buyprice,
            auction: request.auction,
            vehicletype: request.vehicletype,
            usacity: request.usacity,
            destinationport: request.destinationport,
            vehiclecategory: request.vehiclecategory,
        })}`;
    }

    /**
     * Get cached result from Redis.
     */
    private async getCachedResult(cacheKey: string): Promise<StandardCalculatorResponse | null> {
        const redis = (this.fastify as any).redis;
        if (!redis || typeof redis.get !== 'function') {
            return null;
        }

        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                this.fastify.log.info({ cacheKey }, '[ConfigurableAdapter] Using cached calculator response');
                return JSON.parse(cached);
            }
        } catch (error) {
            this.fastify.log.warn({ error }, '[ConfigurableAdapter] Failed to read from Redis cache');
        }

        return null;
    }

    /**
     * Cache result in Redis.
     */
    private async cacheResult(cacheKey: string, result: StandardCalculatorResponse): Promise<void> {
        const redis = (this.fastify as any).redis;
        if (!redis || typeof redis.set !== 'function') {
            return;
        }

        try {
            await redis.set(cacheKey, JSON.stringify(result), 'EX', this.CACHE_TTL_SECONDS);
            this.fastify.log.info({ cacheKey }, '[ConfigurableAdapter] Cached calculator response');
        } catch (error) {
            this.fastify.log.warn({ error }, '[ConfigurableAdapter] Failed to cache calculator response');
        }
    }
}
