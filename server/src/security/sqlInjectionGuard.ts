/**
 * SQL Injection Prevention Guard
 *
 * This module provides a Fastify preValidation hook that detects and rejects
 * potential SQL injection attempts before they reach route handlers.
 *
 * Strategy:
 * 1. For numeric parameters (id, limit, offset, etc.), reject any value that
 *    contains non-numeric characters
 * 2. For enum parameters, validate against allowed values
 * 3. For boolean parameters, only accept "true" or "false"
 * 4. For string parameters, reject obvious SQL injection patterns
 * 5. For path parameters, validate as numeric IDs or UUIDs
 *
 * @module security/sqlInjectionGuard
 */

import { FastifyInstance } from 'fastify';

// ---------------------------------------------------------------------------
// Parameter Type Definitions
// ---------------------------------------------------------------------------

/** Parameters that should be strictly numeric (integers) */
const NUMERIC_PARAMS = new Set([
    'id', 'companyId', 'vehicleId', 'reviewId',
    'company_id', 'vehicle_id', 'user_id',
    'limit', 'offset', 'page',
    'year', 'year_from', 'year_to',
    'odometer_from', 'odometer_to',
    'mileage_from', 'mileage_to',
]);

/** Parameters that should be strictly numeric (floats allowed) */
const NUMERIC_FLOAT_PARAMS = new Set([
    'min_rating', 'max_rating', 'minRating', 'maxRating',
    'min_base_price', 'max_base_price',
    'max_total_fee',
    'broker_fee', 'base_price', 'price_per_mile', 'customs_fee', 'service_fee',
    'price_from', 'price_to',
]);

/** Parameters that should only contain specific allowed values (enums) */
const ENUM_PARAMS: Record<string, Set<string>> = {
    order_by: new Set(['rating', 'cheapest', 'name', 'newest']),
    order_direction: new Set(['asc', 'desc']),
    sort: new Set(['price_asc', 'price_desc', 'year_desc', 'year_asc', 'mileage_asc', 'mileage_desc', 'sold_date_desc', 'sold_date_asc', 'best_value']),
    role: new Set(['user', 'dealer', 'company', 'admin']),
    // NOTE: 'source' is NOT included here because it supports comma-separated values (e.g., "copart,iaai")
    // The Zod schema (vehicleSearchSchema.ts) handles validation and transformation of comma-separated source values
};

/** Parameters that should be boolean (true/false only) */
const BOOLEAN_PARAMS = new Set([
    'is_vip', 'onboarding_free', 'is_blocked', 'buy_now',
]);

/** String parameters that should be validated for SQL injection */
const STRING_PARAMS_TO_CHECK = new Set([
    'search', 'city', 'country', 'name', 'location',
    'make', 'model',
    'title_type', 'transmission', 'fuel', 'drive', 'cylinders', 'category',
    'email', 'username',
]);

// ---------------------------------------------------------------------------
// SQL Injection Pattern Detection
// ---------------------------------------------------------------------------

/**
 * SQL injection patterns for string parameters
 * These are targeted to catch common attacks while avoiding false positives
 *
 * Patterns detected:
 * - Classic OR/AND injection: ' OR '1'='1, " OR "1"="1
 * - Numeric injection: 10 AND 1=1
 * - SQL comments: --
 * - Chained statements: ;DROP TABLE
 * - UNION attacks: UNION SELECT
 * - Time-based blind injection: SLEEP(), BENCHMARK(), WAITFOR DELAY
 * - File operations: INTO OUTFILE, LOAD_FILE()
 */
const SQL_INJECTION_PATTERNS = [
    /'\s*(OR|AND)\s*'?\d*\s*=\s*'?\d*/i,  // ' OR '1'='1, ' AND 1=1
    /"\s*(OR|AND)\s*"?\d*\s*=\s*"?\d*/i,  // " OR "1"="1
    /\d+\s+(AND|OR)\s+\d+\s*=\s*\d+/i,    // 10 AND 1=1
    /\s+(AND|OR)\s+\d+\s*=\s*\d+/i,       // value AND 1=1, value OR 1=1
    /--\s*$/,                              // SQL comment at end
    /--\s+$/,                              // SQL comment with space at end
    /;\s*(DROP|DELETE|UPDATE|INSERT|SELECT|TRUNCATE|ALTER|CREATE|EXEC)/i, // Chained SQL
    /\bUNION\s+(ALL\s+)?SELECT\b/i,       // UNION SELECT
    /\bSLEEP\s*\(/i,                       // SLEEP()
    /\bBENCHMARK\s*\(/i,                   // BENCHMARK()
    /\bWAITFOR\s+DELAY\b/i,               // WAITFOR DELAY
    /\bINTO\s+(OUT|DUMP)FILE\b/i,         // INTO OUTFILE/DUMPFILE
    /\bLOAD_FILE\s*\(/i,                  // LOAD_FILE()
];

// ---------------------------------------------------------------------------
// Validation Helper Functions
// ---------------------------------------------------------------------------

/**
 * Check if a value that should be numeric contains SQL injection
 *
 * @param value - The string value to check
 * @param allowFloat - Whether to allow floating point numbers
 * @returns true if the value is INVALID (contains non-numeric chars)
 *
 * @example
 * isInvalidNumericValue("10", false)      // false (valid)
 * isInvalidNumericValue("10 AND 1=1", false) // true (invalid - SQL injection)
 * isInvalidNumericValue("-5", false)      // false (valid)
 * isInvalidNumericValue("3.14", true)     // false (valid float)
 * isInvalidNumericValue("3.14", false)    // true (invalid - float not allowed)
 */
function isInvalidNumericValue(value: string, allowFloat: boolean): boolean {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (trimmed === '') return true; // Empty is invalid for numeric

    // Check if it's a valid number
    if (allowFloat) {
        // Allow integers and floats: 10, -5, 3.14, -2.5
        return !/^-?\d+(\.\d+)?$/.test(trimmed);
    } else {
        // Allow only integers: 10, -5
        return !/^-?\d+$/.test(trimmed);
    }
}

/**
 * Check if a string value contains SQL injection patterns
 *
 * @param value - The string value to check
 * @returns true if the value contains SQL injection patterns
 */
function containsSqlInjection(value: string): boolean {
    if (typeof value !== 'string') return false;
    return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Validate UUID (v1-v5) string format
 *
 * @param value - The string value to check
 * @returns true if the value is a valid UUID
 */
function isValidUuid(value: string): boolean {
    if (typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ---------------------------------------------------------------------------
// Main Guard Registration
// ---------------------------------------------------------------------------

/**
 * Register the SQL injection prevention guard hook
 *
 * This hook runs in the preValidation phase, BEFORE Fastify's schema validation.
 * This catches injection attempts that might bypass type coercion.
 *
 * For example, "10 AND 1=1 --" would be coerced to 10 by Fastify's schema
 * validation if we didn't catch it here first.
 *
 * @param fastify - Fastify instance to register the hook on
 */
export function registerSqlInjectionGuard(fastify: FastifyInstance): void {
    fastify.addHook('preValidation', async (request, reply) => {
        // Check query parameters
        const query = request.query as Record<string, unknown>;
        if (query && typeof query === 'object') {
            for (const [key, value] of Object.entries(query)) {
                if (typeof value !== 'string') continue;

                // Check numeric parameters for non-numeric content
                if (NUMERIC_PARAMS.has(key) && isInvalidNumericValue(value, false)) {
                    fastify.log.warn({
                        method: request.method,
                        url: request.url,
                        param: key,
                        value: value.slice(0, 100),
                    }, 'Invalid numeric value in query parameter');

                    return reply.status(400).send({
                        statusCode: 400,
                        error: 'Bad Request',
                        message: `Invalid value for parameter: ${key}. Expected integer.`,
                    });
                }

                // Check float parameters for non-numeric content
                if (NUMERIC_FLOAT_PARAMS.has(key) && isInvalidNumericValue(value, true)) {
                    fastify.log.warn({
                        method: request.method,
                        url: request.url,
                        param: key,
                        value: value.slice(0, 100),
                    }, 'Invalid numeric value in query parameter');

                    return reply.status(400).send({
                        statusCode: 400,
                        error: 'Bad Request',
                        message: `Invalid value for parameter: ${key}. Expected number.`,
                    });
                }

                // Check enum parameters for valid values
                if (ENUM_PARAMS[key]) {
                    const allowedValues = ENUM_PARAMS[key];
                    if (!allowedValues.has(value.toLowerCase())) {
                        fastify.log.warn({
                            method: request.method,
                            url: request.url,
                            param: key,
                            value: value.slice(0, 100),
                        }, 'Invalid enum value in query parameter');

                        return reply.status(400).send({
                            statusCode: 400,
                            error: 'Bad Request',
                            message: `Invalid value for parameter: ${key}. Allowed values: ${Array.from(allowedValues).join(', ')}`,
                        });
                    }
                }

                // Check boolean parameters for valid values
                if (BOOLEAN_PARAMS.has(key)) {
                    const lower = value.toLowerCase();
                    if (lower !== 'true' && lower !== 'false') {
                        fastify.log.warn({
                            method: request.method,
                            url: request.url,
                            param: key,
                            value: value.slice(0, 100),
                        }, 'Invalid boolean value in query parameter');

                        return reply.status(400).send({
                            statusCode: 400,
                            error: 'Bad Request',
                            message: `Invalid value for parameter: ${key}. Expected true or false.`,
                        });
                    }
                }

                // Check string parameters for SQL injection patterns
                if (STRING_PARAMS_TO_CHECK.has(key) && containsSqlInjection(value)) {
                    fastify.log.warn({
                        method: request.method,
                        url: request.url,
                        param: key,
                        value: value.slice(0, 100),
                    }, 'SQL injection attempt detected in query parameter');

                    return reply.status(400).send({
                        statusCode: 400,
                        error: 'Bad Request',
                        message: `Invalid value for parameter: ${key}`,
                    });
                }

                // For any other parameter, check for obvious SQL injection patterns
                if (containsSqlInjection(value)) {
                    fastify.log.warn({
                        method: request.method,
                        url: request.url,
                        param: key,
                        value: value.slice(0, 100),
                    }, 'SQL injection attempt detected in query parameter');

                    return reply.status(400).send({
                        statusCode: 400,
                        error: 'Bad Request',
                        message: `Invalid value for parameter: ${key}`,
                    });
                }
            }
        }

        // Check path parameters (these should always be numeric IDs)
        const params = request.params as Record<string, unknown>;
        if (params && typeof params === 'object') {
            for (const [key, value] of Object.entries(params)) {
                if (typeof value !== 'string') continue;

                // Skip catch-all route parameters (e.g., '*' for 404 handlers)
                if (key === '*') continue;

                // Allow UUID-based params for specific routes
                if (key === 'sessionId') {
                    if (!isValidUuid(value)) {
                        fastify.log.warn({
                            method: request.method,
                            url: request.url,
                            param: key,
                            value: value.slice(0, 100),
                        }, 'Invalid UUID value in path parameter');

                        return reply.status(400).send({
                            statusCode: 400,
                            error: 'Bad Request',
                            message: `Invalid value for parameter: ${key}. Expected UUID.`,
                        });
                    }

                    continue;
                }

                // All path params in this app should be numeric IDs
                if (isInvalidNumericValue(value, false)) {
                    fastify.log.warn({
                        method: request.method,
                        url: request.url,
                        param: key,
                        value: value.slice(0, 100),
                    }, 'Invalid numeric value in path parameter');

                    return reply.status(400).send({
                        statusCode: 400,
                        error: 'Bad Request',
                        message: `Invalid value for parameter: ${key}. Expected integer.`,
                    });
                }
            }
        }
    });

    fastify.log.debug('SQL injection prevention guard registered');
}
