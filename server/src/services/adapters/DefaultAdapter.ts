import { FastifyInstance } from 'fastify';
import axios from 'axios';
import type { Company } from '../../types/company.js';
import type {
    ICalculatorAdapter,
    StandardCalculatorRequest,
    StandardCalculatorResponse,
} from './ICalculatorAdapter.js';
import { CalculatorApiError } from '../../types/errors.js';

/**
 * Default Calculator Adapter
 * 
 * Wraps the existing Auto Market Logistic calculator API.
 * This adapter maintains 100% backward compatibility with the current implementation.
 * 
 * Used when company.calculator_type === 'default' or is undefined.
 * 
 * @see https://automarketlgc.com/wp-json/calculator/v1/calculate
 */
export class DefaultAdapter implements ICalculatorAdapter {
    private readonly fastify: FastifyInstance;
    private readonly apiUrl = 'https://automarketlgc.com/wp-json/calculator/v1/calculate';
    private readonly CACHE_TTL_SECONDS = 86400; // 24 hours (matches existing)

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
    }

    /**
     * Calculate shipping quote using Auto Market Logistic API.
     * 
     * This method replicates the exact behavior of the existing
     * ShippingQuoteService.callCalculator() method with Redis caching.
     */
    async calculate(
        request: StandardCalculatorRequest,
        company: Company
    ): Promise<StandardCalculatorResponse> {
        // Build cache key including company ID for per-company caching
        const cacheKey = this.buildCacheKey(request, company.id);

        // Check Redis cache if available
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        // Make API request
        this.fastify.log.info(
            {
                companyId: company.id,
                companyName: company.name,
                request,
                requestSummary: `buyprice=${request.buyprice}, auction=${request.auction}, usacity=${request.usacity}, vehicletype=${request.vehicletype}`,
            },
            '[DefaultAdapter] Calling Auto Market Logistic calculator API'
        );

        try {
            const response = await axios.post(this.apiUrl, request, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            this.fastify.log.info(
                { companyId: company.id },
                '[DefaultAdapter] Calculator API response received'
            );

            // Extract values from response (matching existing extraction logic)
            const responseData = response.data?.data || response.data;

            const totalPrice = this.extractNumber(
                responseData?.transportation_total ||
                responseData?.transportationTotal ||
                responseData?.shipping_total ||
                responseData?.total ||
                0
            );

            const distanceMiles = this.extractNumber(
                response.data?.distance_miles ||
                response.data?.distanceMiles ||
                response.data?.distance ||
                responseData?.distance_miles ||
                responseData?.distanceMiles ||
                0
            );

            const currency = responseData?.currency || 'USD';

            if (totalPrice <= 0) {
                this.fastify.log.warn(
                    { companyId: company.id, request, responseData },
                    '[DefaultAdapter] Calculator API returned zero or invalid transportation_total'
                );
            }

            const result: StandardCalculatorResponse = {
                success: true,
                totalPrice,
                distanceMiles,
                currency,
                breakdown: {
                    transportation_total: totalPrice,
                    currency,
                    distance_miles: distanceMiles,
                    formula_source: 'calculator_api',
                    raw_response: responseData,
                },
            };

            // Cache the result
            await this.cacheResult(cacheKey, result);

            return result;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.fastify.log.error(
                    {
                        companyId: company.id,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        message: error.message,
                    },
                    '[DefaultAdapter] Error calling calculator API'
                );

                const errorMessage =
                    (error.response?.data as any)?.message ||
                    error.message ||
                    'Calculator API error';

                return {
                    success: false,
                    totalPrice: 0,
                    distanceMiles: 0,
                    currency: 'USD',
                    error: `Calculator API error: ${errorMessage}`,
                };
            }

            this.fastify.log.error(
                { companyId: company.id, error },
                '[DefaultAdapter] Unexpected error calling calculator API'
            );

            return {
                success: false,
                totalPrice: 0,
                distanceMiles: 0,
                currency: 'USD',
                error: 'An unexpected error occurred',
            };
        }
    }

    /**
     * Build cache key for Redis (includes company ID for per-company caching).
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
     * Get cached result from Redis if available.
     */
    private async getCachedResult(cacheKey: string): Promise<StandardCalculatorResponse | null> {
        const redis = (this.fastify as any).redis;
        if (!redis || typeof redis.get !== 'function') {
            return null;
        }

        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                this.fastify.log.info({ cacheKey }, '[DefaultAdapter] Using cached calculator response');
                return JSON.parse(cached);
            }
        } catch (error) {
            this.fastify.log.warn({ error }, '[DefaultAdapter] Failed to read from Redis cache');
        }

        return null;
    }

    /**
     * Cache result in Redis if available.
     */
    private async cacheResult(cacheKey: string, result: StandardCalculatorResponse): Promise<void> {
        const redis = (this.fastify as any).redis;
        if (!redis || typeof redis.set !== 'function') {
            return;
        }

        try {
            await redis.set(cacheKey, JSON.stringify(result), 'EX', this.CACHE_TTL_SECONDS);
            this.fastify.log.info({ cacheKey }, '[DefaultAdapter] Cached calculator response');
        } catch (error) {
            this.fastify.log.warn({ error }, '[DefaultAdapter] Failed to cache calculator response');
        }
    }

    /**
     * Safely extract a number from an unknown value.
     */
    private extractNumber(value: unknown): number {
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
}
