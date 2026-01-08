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
import { DefaultAdapter } from './DefaultAdapter.js';

/**
 * Configurable Calculator Adapter
 * 
 * Uses the calculator_config JSON field from the company to communicate
 * with custom calculator APIs. Supports field mapping for both requests
 * and responses.
 * 
 * Used when company.calculator_type === 'custom_api'.
 * 
 * FALLBACK BEHAVIOR: If a company has calculator_type='custom_api' but
 * hasn't configured their calculator_api_url or calculator_config yet,
 * this adapter falls back to the DefaultAdapter so the company still
 * appears in listings with default pricing.
 */
export class ConfigurableAdapter implements ICalculatorAdapter {
    private readonly fastify: FastifyInstance;
    private readonly CACHE_TTL_SECONDS = 86400; // 24 hours
    private defaultAdapter: DefaultAdapter | null = null;

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
    }

    /**
     * Get or create a DefaultAdapter instance for fallback.
     */
    private getDefaultAdapter(): DefaultAdapter {
        if (!this.defaultAdapter) {
            this.defaultAdapter = new DefaultAdapter(this.fastify);
        }
        return this.defaultAdapter;
    }

    /**
     * Calculate shipping quote using a company's custom calculator API.
     * Falls back to DefaultAdapter if the company hasn't configured their API yet.
     */
    async calculate(
        request: StandardCalculatorRequest,
        company: Company
    ): Promise<StandardCalculatorResponse> {
        // Check configuration - fall back to default if not configured
        const apiUrl = (company as any).calculator_api_url;
        const config = (company as any).calculator_config as CalculatorConfig | null | undefined;

        if (!apiUrl || !config || !config.field_mapping) {
            // Company has custom_api type but hasn't configured their calculator yet
            // Fall back to default calculator so they still appear in listings
            this.fastify.log.warn(
                {
                    companyId: company.id,
                    companyName: company.name,
                    calculatorType: (company as any).calculator_type,
                    hasApiUrl: !!apiUrl,
                    hasConfig: !!config,
                    hasFieldMapping: !!(config && config.field_mapping),
                },
                '[ConfigurableAdapter] Company custom_api not configured, falling back to default calculator'
            );
            const fallbackResult = await this.getDefaultAdapter().calculate(request, company);
            this.fastify.log.warn(
                {
                    companyId: company.id,
                    fallbackSuccess: fallbackResult.success,
                    fallbackPrice: fallbackResult.totalPrice,
                },
                '[ConfigurableAdapter] Fallback result'
            );
            return fallbackResult;
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
            this.fastify.log.error(
                {
                    companyId: company.id,
                    apiUrl,
                    error: axios.isAxiosError(error) ? error.message : error,
                },
                '[ConfigurableAdapter] Error calling custom calculator API, falling back to default'
            );

            // Fallback to default calculator on any error
            try {
                return await this.getDefaultAdapter().calculate(request, company);
            } catch (fallbackError) {
                this.fastify.log.error(
                    { companyId: company.id, fallbackError },
                    '[ConfigurableAdapter] Fallback also failed'
                );

                return {
                    success: false,
                    totalPrice: 0,
                    distanceMiles: 0,
                    currency: 'USD',
                    error: `Both custom and default calculators failed for ${company.name}`,
                };
            }
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
