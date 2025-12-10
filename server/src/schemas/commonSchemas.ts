/**
 * Common JSON Schema Definitions
 *
 * SECURITY: These schemas provide strict validation for route parameters,
 * query strings, and request bodies. They are designed to:
 * - Reject malformed input at the schema level (returns 400, not 500)
 * - Prevent SQL injection by validating types before any DB access
 * - Block common attack patterns like URL-encoded special characters
 *
 * Usage:
 * - Import these schemas in route files
 * - Use them in Fastify route schema definitions
 * - All routes with path params MUST use these schemas
 */

/**
 * Schema for a positive integer ID parameter
 * Rejects: negative numbers, zero, floats, strings, special characters
 * Examples of rejected input: "10;", "'", "1.5", "-1", "0"
 */
export const positiveIntegerSchema = {
  type: 'integer',
  minimum: 1,
} as const;

/**
 * Schema for a non-negative integer (includes zero)
 * Used for offset, count, etc.
 */
export const nonNegativeIntegerSchema = {
  type: 'integer',
  minimum: 0,
} as const;

/**
 * Schema for pagination limit parameter
 * Enforces reasonable bounds to prevent abuse
 */
export const paginationLimitSchema = {
  type: 'integer',
  minimum: 1,
  maximum: 100,
  default: 10,
} as const;

/**
 * Schema for pagination offset parameter
 */
export const paginationOffsetSchema = {
  type: 'integer',
  minimum: 0,
  default: 0,
} as const;

/**
 * Schema for pagination page parameter (1-indexed)
 */
export const paginationPageSchema = {
  type: 'integer',
  minimum: 1,
  default: 1,
} as const;

// ============================================================================
// Common Path Parameter Schemas
// ============================================================================

/**
 * Schema for routes with :id parameter
 * Example: /admin/users/:id, /vehicles/:id
 */
export const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: positiveIntegerSchema,
  },
  additionalProperties: false,
} as const;

/**
 * Schema for routes with :companyId parameter
 * Example: /companies/:companyId/social-links
 */
export const companyIdParamsSchema = {
  type: 'object',
  required: ['companyId'],
  properties: {
    companyId: positiveIntegerSchema,
  },
  additionalProperties: false,
} as const;

/**
 * Schema for routes with :vehicleId parameter
 * Example: /vehicles/:vehicleId/quotes
 */
export const vehicleIdParamsSchema = {
  type: 'object',
  required: ['vehicleId'],
  properties: {
    vehicleId: positiveIntegerSchema,
  },
  additionalProperties: false,
} as const;

/**
 * Schema for routes with :leadId parameter
 * Example: /user/leads/:leadId/offers
 */
export const leadIdParamsSchema = {
  type: 'object',
  required: ['leadId'],
  properties: {
    leadId: positiveIntegerSchema,
  },
  additionalProperties: false,
} as const;

/**
 * Schema for routes with :leadCompanyId parameter
 * Example: /company/leads/:leadCompanyId
 */
export const leadCompanyIdParamsSchema = {
  type: 'object',
  required: ['leadCompanyId'],
  properties: {
    leadCompanyId: positiveIntegerSchema,
  },
  additionalProperties: false,
} as const;

/**
 * Schema for routes with :reviewId parameter
 * Example: /companies/:companyId/reviews/:reviewId
 */
export const companyReviewParamsSchema = {
  type: 'object',
  required: ['companyId', 'reviewId'],
  properties: {
    companyId: positiveIntegerSchema,
    reviewId: positiveIntegerSchema,
  },
  additionalProperties: false,
} as const;

// ============================================================================
// Common Query String Schemas
// ============================================================================

/**
 * Schema for basic pagination query parameters
 */
export const paginationQuerySchema = {
  type: 'object',
  properties: {
    limit: paginationLimitSchema,
    offset: paginationOffsetSchema,
  },
  additionalProperties: false,
} as const;

/**
 * Schema for page-based pagination query parameters
 */
export const pageBasedPaginationQuerySchema = {
  type: 'object',
  properties: {
    page: paginationPageSchema,
    limit: paginationLimitSchema,
  },
  additionalProperties: false,
} as const;

/**
 * Schema for currency query parameter
 */
export const currencyQuerySchema = {
  type: 'object',
  properties: {
    currency: {
      type: 'string',
      minLength: 3,
      maxLength: 3,
      pattern: '^[A-Z]{3}$',
    },
  },
  additionalProperties: false,
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Merge multiple schemas into one
 * Useful for combining base schemas with route-specific properties
 */
export function mergeSchemas(...schemas: Record<string, any>[]): Record<string, any> {
  const result: Record<string, any> = {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  };

  for (const schema of schemas) {
    if (schema.properties) {
      result.properties = { ...result.properties, ...schema.properties };
    }
    if (schema.required && Array.isArray(schema.required)) {
      result.required = [...new Set([...result.required, ...schema.required])];
    }
    if (schema.additionalProperties !== undefined) {
      result.additionalProperties = schema.additionalProperties;
    }
  }

  // Remove required array if empty
  if (result.required.length === 0) {
    delete result.required;
  }

  return result;
}
