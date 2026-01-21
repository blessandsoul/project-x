import { FastifyInstance } from 'fastify';
import type { Company } from '../../types/company.js';
import type {
    ICalculatorAdapter,
    StandardCalculatorRequest,
    StandardCalculatorResponse,
} from './ICalculatorAdapter.js';

/**
 * Fake Calculator Adapter
 * 
 * ⚠️ TEMPORARY DEVELOPMENT ADAPTER ⚠️
 * This adapter generates fake randomized prices for companies without real calculator APIs.
 * 
 * Features:
 * - Deterministic randomization (same inputs = same price)
 * - Prices vary by company (each company gets different prices)
 * - Realistic price ranges based on distance estimation
 * - Easy to identify and remove (search for "FAKE" or "FakeCalculatorAdapter")
 * 
 * Used when company.calculator_type === 'fake'.
 * 
 * @example
 * To remove all fake calculators:
 * 1. Search codebase for "FakeCalculatorAdapter" or "calculator_type: 'fake'"
 * 2. Delete this file
 * 3. Remove 'fake' case from CalculatorAdapterFactory
 * 4. Update database: UPDATE companies SET calculator_type = 'default' WHERE calculator_type = 'fake'
 */
export class FakeCalculatorAdapter implements ICalculatorAdapter {
    private readonly fastify: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
    }

    /**
     * Generate a fake shipping quote with deterministic randomization.
     * 
     * The price is based on:
     * - Company ID (each company gets different base prices)
     * - Request parameters (same request = same price)
     * - Estimated distance (longer distances = higher prices)
     */
    async calculate(
        request: StandardCalculatorRequest,
        company: Company
    ): Promise<StandardCalculatorResponse> {
        this.fastify.log.info(
            {
                companyId: company.id,
                companyName: company.name,
                request,
            },
            '[FakeCalculatorAdapter] 🎲 Generating fake price (DEVELOPMENT ONLY)'
        );

        // Estimate distance based on city (simplified)
        const estimatedDistance = this.estimateDistance(request.usacity || '');

        // Generate deterministic random price based on company + request
        // Target range: $1050 - $1950
        const seed = this.generateSeed(company.id, request);
        const basePrice = this.seededRandom(seed, 600, 900); // Base shipping cost
        const perMileRate = this.seededRandom(seed + 1, 0.3, 0.5); // Lower per mile rate
        const totalPrice = Math.round(basePrice + (estimatedDistance * perMileRate));

        const result: StandardCalculatorResponse = {
            success: true,
            totalPrice,
            distanceMiles: estimatedDistance,
            currency: 'USD',
            breakdown: {
                // ⚠️ FAKE DATA - Mark clearly for easy identification
                _FAKE_DATA: true,
                _WARNING: 'This is generated fake data for development purposes',
                base_shipping: basePrice,
                distance_charge: Math.round(estimatedDistance * perMileRate),
                per_mile_rate: perMileRate,
                transportation_total: totalPrice,
                currency: 'USD',
                distance_miles: estimatedDistance,
                formula_source: 'fake_calculator_adapter',
            },
        };

        this.fastify.log.info(
            { companyId: company.id, totalPrice, estimatedDistance },
            '[FakeCalculatorAdapter] 🎲 Generated fake price'
        );

        return result;
    }

    /**
     * Estimate distance based on US city.
     * This is a simplified estimation for fake data.
     */
    private estimateDistance(usacity: string): number {
        // Extract state code if present (e.g., "TX-DALLAS" -> "TX")
        const stateMatch = usacity.match(/^([A-Z]{2})-/);
        const state = stateMatch ? stateMatch[1] : '';

        // Rough distance estimates by state (miles to Georgia port)
        const stateDistances: Record<string, number> = {
            'CA': 2500, // California - West Coast
            'WA': 2800, // Washington - Northwest
            'TX': 1200, // Texas - South
            'FL': 400,  // Florida - Southeast
            'NY': 900,  // New York - Northeast
            'IL': 800,  // Illinois - Midwest
            'GA': 100,  // Georgia - Local
            'AZ': 2000, // Arizona - Southwest
            'NV': 2400, // Nevada - West
            'OR': 2700, // Oregon - Northwest
        };

        const baseDistance = state ? (stateDistances[state] || 1500) : 1500; // Default: ~1500 miles

        // Add some variation based on city name hash
        const cityHash = this.hashString(usacity);
        const variation = (cityHash % 400) - 200; // ±200 miles variation

        return Math.max(100, baseDistance + variation);
    }

    /**
     * Generate a deterministic seed from company ID and request.
     */
    private generateSeed(companyId: number, request: StandardCalculatorRequest): number {
        const requestString = JSON.stringify({
            auction: request.auction,
            usacity: request.usacity,
            vehicletype: request.vehicletype,
            vehiclecategory: request.vehiclecategory,
        });

        return companyId * 1000 + this.hashString(requestString);
    }

    /**
     * Simple string hash function for deterministic randomization.
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Generate a seeded random number in range [min, max].
     * Same seed always produces the same result.
     */
    private seededRandom(seed: number, min: number, max: number): number {
        // Simple LCG (Linear Congruential Generator)
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        const random = ((a * seed + c) % m) / m;

        return min + (random * (max - min));
    }
}
