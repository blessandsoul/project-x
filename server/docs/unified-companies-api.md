# Unified Companies API - Technical Documentation

This document explains how the Calculator Adapter Pattern works, allowing each shipping company to use their own pricing API while our platform normalizes all data.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Standard Interfaces](#standard-interfaces)
3. [Field Mapping Configuration](#field-mapping-configuration)
4. [Mock API Examples](#mock-api-examples)
5. [Normalization Process](#normalization-process)
6. [Error Handling](#error-handling)
7. [Database Schema](#database-schema)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Quote Calculation Request                          │
│                   POST /vehicles/:id/calculate-quotes                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ShippingQuoteService                                 │
│                   (Orchestrates per-company calculations)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                   ┌──────────────────┼──────────────────┐
                   │                  │                  │
                   ▼                  ▼                  ▼
         ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
         │ Company A       │ │ Company B       │ │ Company C       │
         │ calculator_type │ │ calculator_type │ │ calculator_type │
         │ = 'default'     │ │ = 'custom_api'  │ │ = 'custom_api'  │
         └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                  │                   │                   │
                  ▼                   ▼                   ▼
         ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
         │ DefaultAdapter  │ │ ConfigurableAda │ │ ConfigurableAda │
         │ (Auto Market    │ │ (Company B's    │ │ (Company C's    │
         │  Logistic API)  │ │  custom API)    │ │  custom API)    │
         └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                  │                   │                   │
                  ▼                   ▼                   ▼
         ┌─────────────────────────────────────────────────────────┐
         │              StandardCalculatorResponse                  │
         │   { success, totalPrice, distanceMiles, currency }     │
         └─────────────────────────────────────────────────────────┘
                                      │
                                      ▼
         ┌─────────────────────────────────────────────────────────┐
         │                   Unified Quote Response                 │
         │          (All companies in same format)                  │
         └─────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CalculatorAdapterFactory` | `src/services/adapters/CalculatorAdapterFactory.ts` | Returns correct adapter based on `calculator_type` |
| `DefaultAdapter` | `src/services/adapters/DefaultAdapter.ts` | Wraps Auto Market Logistic API |
| `ConfigurableAdapter` | `src/services/adapters/ConfigurableAdapter.ts` | Handles custom APIs via field mapping |
| `ICalculatorAdapter` | `src/types/calculatorAdapterTypes.ts` | Interface all adapters implement |

---

## Standard Interfaces

### What Our Server Sends (StandardCalculatorRequest)

This is the normalized format we use internally, derived from user input:

```typescript
interface StandardCalculatorRequest {
  buyprice: number;        // Vehicle purchase price (often 1 for shipping-only)
  auction: string;         // 'Copart', 'IAAI', etc.
  vehicletype: string;     // 'standard' or 'heavy'
  usacity?: string;        // 'Dallas (TX)', 'CA-LOS ANGELES', etc.
  destinationport: string; // 'POTI', 'KLAIPEDA', etc.
  vehiclecategory: string; // 'Sedan', 'Bike', 'Big SUV', etc.
}
```

### What Our Server Expects Back (StandardCalculatorResponse)

All external APIs must be mapped to return data that resolves to:

```typescript
interface StandardCalculatorResponse {
  success: boolean;         // Was the calculation successful?
  totalPrice: number;       // Total shipping cost in specified currency
  distanceMiles: number;    // Distance from origin to destination
  currency: string;         // 'USD', 'EUR', etc.
  breakdown?: object;       // Optional detailed breakdown
  error?: string;           // Error message if success is false
}
```

**Critical Fields:**
- `totalPrice` - **Required**. If zero or missing, quote is considered failed.
- `distanceMiles` - Optional. Will be 0 if not provided.
- `currency` - Optional. Defaults to 'USD' if not provided.

---

## Field Mapping Configuration

The `calculator_config` JSON column stores configuration for the `ConfigurableAdapter`:

```typescript
interface CalculatorConfig {
  timeout?: number;                    // Request timeout in ms (default: 30000)
  headers?: Record<string, string>;    // Custom headers (API keys, etc.)
  field_mapping: {
    request: RequestFieldMapping;      // How to transform our request → their format
    response: ResponseFieldMapping;    // How to extract their response → our format
  };
}
```

### Request Field Mapping

Maps our standard fields to the external API's field names:

```typescript
interface RequestFieldMapping {
  buyprice?: string | null;       // null = exclude from request
  auction?: string | null;
  vehicletype?: string | null;
  usacity?: string | null;
  destinationport?: string | null;
  vehiclecategory?: string | null;
  static?: Record<string, any>;   // Fields to always include with fixed values
}
```

**Example: Our field → Their field**
```json
{
  "request": {
    "usacity": "origin_city",          // Our "usacity" → Their "origin_city"
    "destinationport": "destination",   // Our "destinationport" → Their "destination"
    "buyprice": null,                   // Exclude buyprice from request
    "static": {
      "customer_id": "PLATFORM_X",      // Always send this value
      "api_version": "2.0"
    }
  }
}
```

### Response Field Mapping

Maps their response fields to our standard format using dot-notation paths:

```typescript
interface ResponseFieldMapping {
  totalPrice: string;       // Required - path to total price
  distanceMiles?: string;   // Optional - path to distance
  currency?: string;        // Optional - path to currency
}
```

**Example: Dot-notation extraction**

If external API returns:
```json
{
  "status": "ok",
  "data": {
    "quote": {
      "pricing": {
        "total_usd": 1850.50
      }
    },
    "route": {
      "miles": 2100
    }
  }
}
```

Configuration:
```json
{
  "response": {
    "totalPrice": "data.quote.pricing.total_usd",
    "distanceMiles": "data.route.miles"
  }
}
```

---

## Mock API Examples

We have 5 mock endpoints that demonstrate different API patterns:

### 1. Simple Format (`/testing/calculator/simple`)

**What it tests:** Basic field mapping, flat response structure

**Request we send:**
```json
{
  "city": "Dallas (TX)",
  "vehicleType": "Sedan",
  "port": "POTI",
  "auction": "Copart",
  "buyPrice": 5000
}
```

**Response they return:**
```json
{
  "totalPrice": 1850.50,
  "distanceMiles": 2100,
  "currency": "USD"
}
```

**Configuration:**
```json
{
  "field_mapping": {
    "request": {
      "usacity": "city",
      "vehiclecategory": "vehicleType",
      "destinationport": "port",
      "auction": "auction",
      "buyprice": "buyPrice"
    },
    "response": {
      "totalPrice": "totalPrice",
      "distanceMiles": "distanceMiles",
      "currency": "currency"
    }
  }
}
```

---

### 2. Nested Response (`/testing/calculator/nested`)

**What it tests:** Deep nesting, dot-notation extraction

**Response they return:**
```json
{
  "status": "success",
  "data": {
    "quote": {
      "pricing": {
        "total_usd": 1620.75
      },
      "route": {
        "distance": {
          "miles": 2200
        }
      }
    },
    "currency": "USD"
  }
}
```

**Configuration:**
```json
{
  "response": {
    "totalPrice": "data.quote.pricing.total_usd",
    "distanceMiles": "data.quote.route.distance.miles",
    "currency": "data.currency"
  }
}
```

---

### 3. Different Fields + Static (`/testing/calculator/different-fields`)

**What it tests:** Completely different naming, static field requirements

**Request we send:**
```json
{
  "from_city": "Dallas (TX)",
  "car_type": "Sedan",
  "to_port": "POTI",
  "customer_id": "PLATFORM_TEST_001",
  "request_type": "instant_quote"
}
```

**Configuration with static fields:**
```json
{
  "request": {
    "usacity": "from_city",
    "vehiclecategory": "car_type",
    "destinationport": "to_port",
    "static": {
      "customer_id": "PLATFORM_TEST_001",
      "request_type": "instant_quote"
    }
  }
}
```

---

### 4. With Authentication (`/testing/calculator/with-auth`)

**What it tests:** Header-based authentication

**Configuration with headers:**
```json
{
  "headers": {
    "X-API-Key": "test-secret-key-12345",
    "X-Customer-ID": "PLATFORM_USER"
  },
  "field_mapping": {
    "request": { ... },
    "response": {
      "totalPrice": "estimate.amount",
      "distanceMiles": "estimate.distance_mi",
      "currency": "estimate.currency_code"
    }
  }
}
```

---

### 5. Minimal Response (`/testing/calculator/minimal`)

**What it tests:** Missing optional fields

**Response they return:**
```json
{
  "price": 1550.00
}
```

**What we normalize to:**
```json
{
  "success": true,
  "totalPrice": 1550.00,
  "distanceMiles": 0,        // Missing → defaults to 0
  "currency": "USD"          // Missing → defaults to "USD"
}
```

---

## Normalization Process

### Step 1: Convert StandardCalculatorRequest → External API Request

```
StandardCalculatorRequest          External API Request
─────────────────────────          ────────────────────
buyprice: 5000           →    (mapped via field_mapping.request)
auction: "Copart"        →    { "seller": "Copart" }
usacity: "Dallas (TX)"   →    { "pickup": "Dallas (TX)" }
...                      →    + static fields added
```

### Step 2: Extract External API Response → StandardCalculatorResponse

```
External API Response              StandardCalculatorResponse
─────────────────────              ────────────────────────────
{                             →    {
  "estimate": {               →      success: true,
    "amount": 2100,           →      totalPrice: 2100,      // via "estimate.amount"
    "distance_mi": 2300       →      distanceMiles: 2300,   // via "estimate.distance_mi"
  }                           →      currency: "USD"        // default
}                             →    }
```

### Step 3: Cache with Company-Scoped Key

```
Cache Key: calculator:company:{companyId}:{requestHash}

Example: calculator:company:43:{"buyprice":5000,"auction":"Copart",...}
```

---

## Error Handling

### Error Type 1: Missing Configuration

**Cause:** Company has `calculator_type='custom_api'` but no `calculator_api_url`

**Log Message:**
```
[ConfigurableAdapter] Company has calculator_type=custom_api but no calculator_api_url
```

**Result:** Quote excluded for this company, others continue.

---

### Error Type 2: API Timeout

**Cause:** External API takes longer than `timeout` (default: 30000ms)

**Log Message:**
```
[ConfigurableAdapter] Error calling custom calculator API
  status: undefined
  message: timeout of 30000ms exceeded
```

**Result:** Quote excluded for this company, others continue.

---

### Error Type 3: Authentication Failure

**Cause:** Missing or invalid API key/headers

**Log Message:**
```
[ConfigurableAdapter] Error calling custom calculator API
  status: 401
  message: Unauthorized
```

**Result:** Quote excluded for this company, others continue.

---

### Error Type 4: Invalid Response Path

**Cause:** Response field mapping path doesn't match actual response

**Log Message:**
```
[ConfigurableAdapter] Extracted totalPrice is zero or invalid
```

**Result:** Quote excluded (totalPrice = 0 is treated as failure).

---

### Error Type 5: Missing Static Fields

**Cause:** External API requires fields not in our standard request and not in `static`

**Log Message:**
```
[ConfigurableAdapter] Error calling custom calculator API
  status: 400
  message: customer_id is required
```

**Solution:** Add required fields to `field_mapping.request.static`.

---

## Database Schema

### Companies Table (relevant columns)

```sql
ALTER TABLE companies
  ADD COLUMN calculator_type ENUM('default', 'custom_api', 'formula') 
    NOT NULL DEFAULT 'default',
  ADD COLUMN calculator_api_url VARCHAR(500) NULL,
  ADD COLUMN calculator_config JSON NULL;
```

| Column | Type | Description |
|--------|------|-------------|
| `calculator_type` | ENUM | `'default'` (Auto Market), `'custom_api'` (custom), `'formula'` (future) |
| `calculator_api_url` | VARCHAR(500) | Full URL to external calculator API |
| `calculator_config` | JSON | Field mapping, headers, timeout configuration |

---

## Troubleshooting

### How to Debug a Custom API Integration

1. **Test the endpoint directly:**
   ```bash
   curl -X POST "https://company-api.com/calculate" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: their-key" \
     -d '{"field1": "value1"}'
   ```

2. **Check server logs for request/response:**
   ```
   [ConfigurableAdapter] Calling custom calculator API
     apiUrl: https://company-api.com/calculate
     requestBody: { mapped fields }
   ```

3. **Verify field mapping paths:**
   - Use a JSON path tester
   - Check for typos in dot-notation
   - Ensure response structure matches expected

4. **Check Redis cache:**
   ```bash
   redis-cli KEYS "calculator:company:*"
   redis-cli GET "calculator:company:43:..."
   ```

### Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Wrong response path | totalPrice = 0 | Check actual API response structure |
| Missing static fields | 400 Bad Request | Add to `field_mapping.request.static` |
| Wrong header name | 401 Unauthorized | Match exact header name API expects |
| URL with trailing slash | 404 Not Found | Remove trailing slash if present |
| HTTP instead of HTTPS | Connection refused | Use correct protocol |
