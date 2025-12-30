import type { FastifyInstance } from 'fastify';
import type { Company } from './company.js';

// =============================================================================
// STANDARD CALCULATOR INTERFACES
// =============================================================================

/**
 * Standard calculator request format.
 * 
 * This interface normalizes input from various sources into a consistent format
 * that all adapters can work with. Based on the existing CalculatorRequestBody
 * from CalculatorRequestBuilder.ts.
 * 
 * Fields match the Auto Market Logistic API format (current default calculator).
 */
export interface StandardCalculatorRequest {
    /** Vehicle purchase price (typically 1 for shipping-only calculations) */
    buyprice: number;

    /** Auction source: 'Copart', 'IAAI', etc. (case-sensitive) */
    auction: string;

    /** Vehicle type: 'standard' or 'heavy' */
    vehicletype: string;

    /** US city in canonical format: 'TX-DALLAS', 'CA-LOS ANGELES' */
    usacity?: string;

    /** Optional Copart URL for direct vehicle lookup */
    coparturl?: string;

    /** Destination port: 'POTI', etc. */
    destinationport: string;

    /** Vehicle category: 'Sedan', 'Bike', 'Small SUV', etc. */
    vehiclecategory: string;
}

/**
 * Standard calculator response format.
 * 
 * This interface normalizes output from various calculator APIs into a 
 * consistent format. Based on the response extraction logic in 
 * ShippingQuoteService.computeQuotesWithCalculatorInput().
 */
export interface StandardCalculatorResponse {
    /** Whether the calculation was successful */
    success: boolean;

    /** Total shipping price in the specified currency */
    totalPrice: number;

    /** Distance in miles (from US city to destination port) */
    distanceMiles: number;

    /** Currency code (default: 'USD') */
    currency: string;

    /** Detailed breakdown of costs (structure varies by calculator) */
    breakdown?: Record<string, unknown>;

    /** Error message if success is false */
    error?: string;
}

// =============================================================================
// CALCULATOR ADAPTER INTERFACE
// =============================================================================

/**
 * Calculator adapter interface.
 * 
 * All calculator adapters must implement this interface. The adapter pattern
 * allows different companies to have their own pricing APIs while providing
 * a consistent interface to the ShippingQuoteService.
 * 
 * @example
 * ```typescript
 * const adapter = factory.getAdapter(company);
 * const result = await adapter.calculate(request, company);
 * console.log(result.totalPrice);
 * ```
 */
export interface ICalculatorAdapter {
    /**
     * Calculate shipping quote for a specific company.
     * 
     * @param request - Normalized calculator request
     * @param company - Company object with calculator configuration
     * @returns Normalized calculator response
     */
    calculate(
        request: StandardCalculatorRequest,
        company: Company
    ): Promise<StandardCalculatorResponse>;
}

// =============================================================================
// CALCULATOR CONFIGURATION (for custom_api type)
// =============================================================================

/**
 * Field mapping configuration for request transformation.
 * 
 * Maps StandardCalculatorRequest fields to the external API's field names.
 * Use null to exclude a field from the request.
 */
export interface RequestFieldMapping {
    /** Field name for buyprice (default: 'buyprice') */
    buyprice?: string | null;

    /** Field name for auction (default: 'auction') */
    auction?: string | null;

    /** Field name for vehicletype (default: 'vehicletype') */
    vehicletype?: string | null;

    /** Field name for usacity (default: 'usacity') */
    usacity?: string | null;

    /** Field name for destinationport (default: 'destinationport') */
    destinationport?: string | null;

    /** Field name for vehiclecategory (default: 'vehiclecategory') */
    vehiclecategory?: string | null;

    /** Static fields to always include in the request */
    static?: Record<string, unknown>;
}

/**
 * Field mapping configuration for response transformation.
 * 
 * Maps the external API's response fields to StandardCalculatorResponse fields.
 * Supports dot-notation JSON paths (e.g., 'data.quote.total').
 */
export interface ResponseFieldMapping {
    /** JSON path to total price (required, e.g., 'transportation_total' or 'data.quote.total') */
    totalPrice: string;

    /** JSON path to distance in miles (e.g., 'distance_miles' or 'data.distance') */
    distanceMiles?: string;

    /** JSON path to currency code (e.g., 'currency' or 'data.currency') */
    currency?: string;
}

/**
 * Complete calculator configuration stored in companies.calculator_config.
 * 
 * This configuration tells the ConfigurableAdapter how to communicate with
 * a company's custom calculator API.
 * 
 * @example
 * ```json
 * {
 *   "timeout": 30000,
 *   "headers": {
 *     "X-API-Key": "secret-key-here",
 *     "Content-Type": "application/json"
 *   },
 *   "field_mapping": {
 *     "request": {
 *       "usacity": "origin_city",
 *       "destinationport": "destination",
 *       "static": { "customer_id": "PROJECT_X" }
 *     },
 *     "response": {
 *       "totalPrice": "data.quote.total_usd",
 *       "distanceMiles": "data.route.miles",
 *       "currency": "data.currency"
 *     }
 *   }
 * }
 * ```
 */
export interface CalculatorConfig {
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;

    /** Custom headers to send with the request (e.g., API keys) */
    headers?: Record<string, string>;

    /** Field mapping configuration */
    field_mapping: {
        /** Request field mapping (StandardCalculatorRequest → External API) */
        request: RequestFieldMapping;

        /** Response field mapping (External API → StandardCalculatorResponse) */
        response: ResponseFieldMapping;
    };
}

// =============================================================================
// CALCULATOR TYPE ENUM
// =============================================================================

/**
 * Calculator type enum matching the database ENUM.
 */
export type CalculatorType = 'default' | 'custom_api' | 'formula';

// =============================================================================
// ADAPTER FACTORY OPTIONS
// =============================================================================

/**
 * Options for creating adapter instances.
 */
export interface AdapterFactoryOptions {
    /** Fastify instance for logging and Redis access */
    fastify: FastifyInstance;
}
