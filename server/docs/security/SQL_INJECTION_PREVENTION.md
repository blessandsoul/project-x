# SQL Injection Prevention Guide

This document describes the comprehensive SQL injection prevention measures implemented in the Project-X backend API.

## Table of Contents

1. [Overview](#overview)
2. [Defense-in-Depth Strategy](#defense-in-depth-strategy)
3. [Input Validation Layer](#input-validation-layer)
4. [Parameterized Queries](#parameterized-queries)
5. [Error Handling](#error-handling)
6. [Testing & Verification](#testing--verification)
7. [Best Practices for Developers](#best-practices-for-developers)

---

## Overview

SQL injection is a code injection technique that exploits security vulnerabilities in an application's database layer. Our backend implements multiple layers of defense to prevent SQL injection attacks:

- **Pre-validation hooks** - Reject malicious input before schema validation
- **JSON Schema validation** - Strict type checking on all route parameters
- **Parameterized queries** - All SQL uses `?` placeholders, never string concatenation
- **Whitelist validation** - Enum parameters only accept predefined values
- **Error masking** - Database errors never expose internal details

---

## Defense-in-Depth Strategy

We employ a multi-layered approach to SQL injection prevention:

```
┌─────────────────────────────────────────────────────────────┐
│                    Incoming Request                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: PreValidation Hook (server.ts)                    │
│  - Validates numeric parameters are strictly numeric        │
│  - Validates enum parameters against whitelist              │
│  - Validates boolean parameters are true/false only         │
│  - Detects SQL injection patterns in string parameters      │
│  - Returns HTTP 400 on invalid input                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: JSON Schema Validation (Fastify/Zod)              │
│  - Type checking (integer, string, boolean, etc.)           │
│  - Range validation (min, max, minLength, maxLength)        │
│  - Pattern validation (regex for dates, emails, etc.)       │
│  - additionalProperties: false rejects unknown fields       │
│  - Returns HTTP 400 on validation failure                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Controller/Service Layer                          │
│  - Additional business logic validation                     │
│  - Whitelist validation for sensitive operations            │
│  - Authorization checks                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Model Layer (Parameterized Queries)               │
│  - All SQL uses ? placeholders                              │
│  - ORDER BY uses whitelist mapping                          │
│  - No string concatenation of user input                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Error Handler (errorHandler.ts)                   │
│  - Masks database error details                             │
│  - Returns generic error messages to clients                │
│  - Logs full error details server-side                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Input Validation Layer

### PreValidation Hook (`server.ts`)

The preValidation hook runs BEFORE Fastify's schema validation to catch SQL injection attempts that might bypass type coercion.

#### Numeric Parameter Validation

Parameters that should be integers are strictly validated:

```typescript
const NUMERIC_PARAMS = new Set([
  "id",
  "companyId",
  "vehicleId",
  "leadId",
  "leadCompanyId",
  "reviewId",
  "company_id",
  "vehicle_id",
  "lead_id",
  "user_id",
  "limit",
  "offset",
  "page",
  "year",
  "year_from",
  "year_to",
  "odometer_from",
  "odometer_to",
  "mileage_from",
  "mileage_to",
]);
```

**Rejected values:**

- `"10 AND 1=1 --"` → 400 Bad Request
- `"12-2"` → 400 Bad Request
- `"10'"` → 400 Bad Request
- `"10%22"` → 400 Bad Request

#### Float Parameter Validation

Parameters that accept decimal values:

```typescript
const NUMERIC_FLOAT_PARAMS = new Set([
  "min_rating",
  "max_rating",
  "minRating",
  "maxRating",
  "min_base_price",
  "max_base_price",
  "max_total_fee",
  "broker_fee",
  "base_price",
  "price_per_mile",
  "price_from",
  "price_to",
]);
```

#### Enum Parameter Validation

Parameters with predefined allowed values:

```typescript
const ENUM_PARAMS = {
  order_by: new Set(['rating', 'cheapest', 'name', 'newest']),
  order_direction: new Set(['asc', 'desc']),
  sort: new Set(['price_asc', 'price_desc', 'year_desc', 'year_asc', ...]),
  role: new Set(['user', 'dealer', 'company', 'admin']),
  source: new Set(['copart', 'iaai']),
};
```

**Rejected values:**

- `"asc AND 1=1 --"` → 400 Bad Request
- `"rating; DROP TABLE"` → 400 Bad Request

#### Boolean Parameter Validation

```typescript
const BOOLEAN_PARAMS = new Set([
  "is_vip",
  "onboarding_free",
  "is_blocked",
  "buy_now",
]);
```

Only accepts `"true"` or `"false"` (case-insensitive).

#### SQL Injection Pattern Detection

```typescript
const SQL_INJECTION_PATTERNS = [
  /'\s*(OR|AND)\s*'?\d*\s*=\s*'?\d*/i, // ' OR '1'='1
  /"\s*(OR|AND)\s*"?\d*\s*=\s*"?\d*/i, // " OR "1"="1
  /\d+\s+(AND|OR)\s+\d+\s*=\s*\d+/i, // 10 AND 1=1
  /\s+(AND|OR)\s+\d+\s*=\s*\d+/i, // value AND 1=1
  /--\s*$/, // SQL comment at end
  /;\s*(DROP|DELETE|UPDATE|INSERT|SELECT|TRUNCATE|ALTER|CREATE|EXEC)/i,
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  /\bSLEEP\s*\(/i,
  /\bBENCHMARK\s*\(/i,
  /\bWAITFOR\s+DELAY\b/i,
  /\bINTO\s+(OUT|DUMP)FILE\b/i,
  /\bLOAD_FILE\s*\(/i,
];
```

### JSON Schema Validation

All routes define strict JSON schemas for params, querystring, and body:

```typescript
// Path parameter schema
export const idParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "integer", minimum: 1 },
  },
  additionalProperties: false,
};

// Query parameter schema example
const searchQuerySchema = {
  type: "object",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    offset: { type: "integer", minimum: 0, default: 0 },
    search: { type: "string", maxLength: 255 },
  },
  additionalProperties: false,
};
```

**Key schema features:**

- `additionalProperties: false` - Rejects unexpected fields
- `type: 'integer'` - Ensures numeric values
- `minimum/maximum` - Enforces value ranges
- `maxLength` - Prevents oversized input
- `pattern` - Validates format (dates, emails, etc.)

---

## Parameterized Queries

### Model Layer Implementation

All database queries use parameterized statements with `?` placeholders:

```typescript
// ✅ CORRECT: Parameterized query
async findByEmail(email: string): Promise<User | null> {
  const rows = await this.executeQuery(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

// ❌ WRONG: String concatenation (NEVER DO THIS)
async findByEmail(email: string): Promise<User | null> {
  const rows = await this.executeQuery(
    `SELECT * FROM users WHERE email = '${email}'`  // VULNERABLE!
  );
  return rows[0] || null;
}
```

### ORDER BY Whitelist

Dynamic ORDER BY clauses use whitelist mapping:

```typescript
// CompanyModel.ts
private getOrderByColumn(orderBy: string): string {
  switch (orderBy) {
    case 'rating': return 'c.rating';
    case 'cheapest': return 'c.base_price';
    case 'name': return 'c.name';
    case 'newest': return 'c.created_at';
    default: return 'c.rating';
  }
}

// Usage
const orderByColumn = this.getOrderByColumn(orderBy);
const sql = `SELECT * FROM companies ORDER BY ${orderByColumn} ${orderDir}`;
```

### Search Query Example

```typescript
// VehicleModel.ts - searchByFilters
async searchByFilters(params: SearchParams): Promise<Vehicle[]> {
  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (params.make) {
    conditions.push('make = ?');
    queryParams.push(params.make);
  }

  if (params.year_from) {
    conditions.push('year >= ?');
    queryParams.push(params.year_from);
  }

  if (params.year_to) {
    conditions.push('year <= ?');
    queryParams.push(params.year_to);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const sortClause = this.getSortClause(params.sort);

  const sql = `
    SELECT * FROM vehicles
    ${whereClause}
    ORDER BY ${sortClause}
    LIMIT ? OFFSET ?
  `;

  return this.executeQuery(sql, [...queryParams, params.limit, params.offset]);
}
```

---

## Error Handling

### Error Handler Plugin (`errorHandler.ts`)

The global error handler ensures database errors never expose internal details:

```typescript
fastify.setErrorHandler((error, request, reply) => {
  // Handle validation errors
  if (isFastifyValidationError(error)) {
    return reply.status(400).send({
      error: { code: "INVALID_REQUEST", message: "Invalid request parameters" },
    });
  }

  // Handle database errors - NEVER expose details
  if (isDatabaseError(error)) {
    fastify.log.error({ error, url: request.url }, "Database error");
    return reply.status(500).send({
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }

  // Handle rate limit errors
  if (error.message.includes("Rate limit exceeded")) {
    return reply.status(429).send({
      error: { code: "RATE_LIMIT_EXCEEDED", message: error.message },
    });
  }

  // Default: mask all other errors
  return reply.status(500).send({
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
});
```

### Response Codes

| Scenario                 | Status Code | Error Code            |
| ------------------------ | ----------- | --------------------- |
| Invalid parameter format | 400         | `INVALID_REQUEST`     |
| SQL injection attempt    | 400         | `Bad Request`         |
| Invalid enum value       | 400         | `Bad Request`         |
| Rate limit exceeded      | 429         | `RATE_LIMIT_EXCEEDED` |
| Database error           | 500         | `INTERNAL_ERROR`      |
| Duplicate entry          | 409         | `DUPLICATE_ENTRY`     |

---

## Testing & Verification

### Manual Testing

Test SQL injection payloads against endpoints:

```bash
# Path parameter injection
curl "http://localhost:3000/companies/10%27"
# Expected: 400 Bad Request

# Query parameter injection
curl "http://localhost:3000/vehicles/search?year=10%20AND%201=1%20--"
# Expected: 400 Bad Request

# Enum parameter injection
curl "http://localhost:3000/companies/search?order_by=rating%20AND%201=1%20--"
# Expected: 400 Bad Request

# Body parameter injection
curl -X POST "http://localhost:3000/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin'\''--","password":"test"}'
# Expected: 401 Unauthorized (not 500)
```

### OWASP ZAP Testing

Run OWASP ZAP Active Scan against the API:

1. Start the server with increased rate limits for testing
2. Configure ZAP to scan `http://localhost:3000`
3. Run Active Scan with SQL Injection rules enabled
4. Verify no High/Critical SQL injection alerts

**Note:** Rate limiting may cause false positives. Disable or increase rate limits during security testing.

---

## Best Practices for Developers

### DO ✅

1. **Always use parameterized queries**

   ```typescript
   await this.executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
   ```

2. **Define strict JSON schemas for all routes**

   ```typescript
   schema: {
     params: idParamsSchema,
     querystring: paginationQuerySchema,
     body: createUserBodySchema,
   }
   ```

3. **Use `additionalProperties: false`** to reject unexpected fields

4. **Validate enum values against whitelists**

   ```typescript
   if (!ALLOWED_ROLES.includes(role)) {
     throw new ValidationError("Invalid role");
   }
   ```

5. **Use whitelist mapping for ORDER BY**

   ```typescript
   const column = ORDER_BY_MAP[orderBy] || "created_at";
   ```

6. **Log security events** for monitoring
   ```typescript
   fastify.log.warn({ param, value }, "SQL injection attempt detected");
   ```

### DON'T ❌

1. **Never concatenate user input into SQL**

   ```typescript
   // WRONG!
   `SELECT * FROM users WHERE name = '${name}'`;
   ```

2. **Never trust client-side validation alone**

3. **Never expose database error details to clients**

4. **Never use dynamic table/column names from user input**

   ```typescript
   // WRONG!
   `SELECT * FROM ${tableName} WHERE ${columnName} = ?`;
   ```

5. **Never disable schema validation for convenience**

---

## Files Reference

| File                                 | Purpose                                        |
| ------------------------------------ | ---------------------------------------------- |
| `src/server.ts`                      | PreValidation hook for SQL injection detection |
| `src/middleware/errorHandler.ts`     | Global error handler with error masking        |
| `src/schemas/commonSchemas.ts`       | Shared JSON schemas for route validation       |
| `src/schemas/vehicleSearchSchema.ts` | Zod schema for vehicle search validation       |
| `src/models/*.ts`                    | Model layer with parameterized queries         |

---

## Changelog

| Date       | Change                                                       |
| ---------- | ------------------------------------------------------------ |
| 2025-12-10 | Initial SQL injection hardening implementation               |
| 2025-12-10 | Added preValidation hook for numeric/enum/boolean validation |
| 2025-12-10 | Added SQL injection pattern detection                        |
| 2025-12-10 | Fixed rate limit error handling (429 instead of 500)         |
| 2025-12-10 | Added whitelist validation for ORDER BY clauses              |
