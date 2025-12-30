# Mock Calculator API Testing Guide

This guide explains how to test the Calculator Adapter Pattern using mock calculator endpoints.

## Overview

The adapter pattern allows each company to have its own calculator API. To test this, we've created 5 mock calculator endpoints that simulate different API formats:

| Endpoint | Tests | Description |
|----------|-------|-------------|
| `/testing/calculator/simple` | Basic field mapping | Flat structure, similar field names |
| `/testing/calculator/nested` | Dot-notation extraction | Deeply nested response structure |
| `/testing/calculator/different-fields` | Different field names + static fields | Completely different naming convention |
| `/testing/calculator/with-auth` | Header authentication | Requires API key and customer ID headers |
| `/testing/calculator/minimal` | Missing optional fields | Only returns price, no distance/currency |

---

## Step 1: Verify Mock Endpoints Are Working

First, check that the mock endpoints are registered:

```bash
curl http://localhost:3000/testing/calculator
```

**Expected Response:**
```json
{
  "description": "Mock Calculator API Endpoints for Testing Adapter Pattern",
  "endpoints": [
    {"path": "/testing/calculator/simple", "method": "POST", "description": "..."},
    ...
  ]
}
```

### Test Each Endpoint Directly

**1. Simple Endpoint:**
```bash
curl -X POST http://localhost:3000/testing/calculator/simple \
  -H "Content-Type: application/json" \
  -d '{"city": "Dallas (TX)", "vehicleType": "Sedan", "port": "POTI", "auction": "Copart", "buyPrice": 5000}'
```

**2. Nested Endpoint:**
```bash
curl -X POST http://localhost:3000/testing/calculator/nested \
  -H "Content-Type: application/json" \
  -d '{"origin": "Dallas (TX)", "vehicle": "Sedan", "destination": "POTI", "auctionHouse": "Copart", "purchasePrice": 5000}'
```

**3. Different Fields Endpoint:**
```bash
curl -X POST http://localhost:3000/testing/calculator/different-fields \
  -H "Content-Type: application/json" \
  -d '{"from_city": "Dallas (TX)", "car_type": "Sedan", "to_port": "POTI", "sale_location": "Copart", "cost": 5000, "customer_id": "PLATFORM_TEST_001", "request_type": "instant_quote"}'
```

**4. Auth Endpoint:**
```bash
curl -X POST http://localhost:3000/testing/calculator/with-auth \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-secret-key-12345" \
  -H "X-Customer-ID: PLATFORM_USER" \
  -d '{"pickup": "Dallas (TX)", "delivery": "POTI", "vehicle_category": "Sedan", "seller": "Copart", "value": 5000}'
```

**5. Minimal Endpoint:**
```bash
curl -X POST http://localhost:3000/testing/calculator/minimal \
  -H "Content-Type: application/json" \
  -d '{"src": "Dallas (TX)", "dst": "POTI", "type": "Sedan"}'
```

---

## Step 2: Configure Test Companies

Run these SQL statements in phpMyAdmin to configure 5 companies with different calculators.

> **Note:** Replace `[COMPANY_ID_X]` with actual company IDs from your database.
> To find company IDs: `SELECT id, name FROM companies LIMIT 10;`

### Company 1: Simple Format (ID: 1)
```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'http://localhost:3000/testing/calculator/simple',
  calculator_config = '{
    "timeout": 5000,
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
  }'
WHERE id = 1;
```

### Company 2: Nested Format (ID: 2)
```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'http://localhost:3000/testing/calculator/nested',
  calculator_config = '{
    "timeout": 5000,
    "field_mapping": {
      "request": {
        "usacity": "origin",
        "vehiclecategory": "vehicle",
        "destinationport": "destination",
        "auction": "auctionHouse",
        "buyprice": "purchasePrice"
      },
      "response": {
        "totalPrice": "data.quote.pricing.total_usd",
        "distanceMiles": "data.quote.route.distance.miles",
        "currency": "data.currency"
      }
    }
  }'
WHERE id = 2;
```

### Company 3: Different Fields + Static (ID: 3)
```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'http://localhost:3000/testing/calculator/different-fields',
  calculator_config = '{
    "timeout": 5000,
    "field_mapping": {
      "request": {
        "usacity": "from_city",
        "vehiclecategory": "car_type",
        "destinationport": "to_port",
        "auction": "sale_location",
        "buyprice": "cost",
        "static": {
          "customer_id": "PLATFORM_TEST_001",
          "request_type": "instant_quote"
        }
      },
      "response": {
        "totalPrice": "total",
        "distanceMiles": "miles",
        "currency": "curr"
      }
    }
  }'
WHERE id = 3;
```

### Company 4: With Authentication (ID: 4)
```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'http://localhost:3000/testing/calculator/with-auth',
  calculator_config = '{
    "timeout": 5000,
    "headers": {
      "X-API-Key": "test-secret-key-12345",
      "X-Customer-ID": "PLATFORM_USER"
    },
    "field_mapping": {
      "request": {
        "usacity": "pickup",
        "destinationport": "delivery",
        "vehiclecategory": "vehicle_category",
        "auction": "seller",
        "buyprice": "value"
      },
      "response": {
        "totalPrice": "estimate.amount",
        "distanceMiles": "estimate.distance_mi",
        "currency": "estimate.currency_code"
      }
    }
  }'
WHERE id = 4;
```

### Company 5: Minimal Response (ID: 5)
```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'http://localhost:3000/testing/calculator/minimal',
  calculator_config = '{
    "timeout": 5000,
    "field_mapping": {
      "request": {
        "usacity": "src",
        "destinationport": "dst",
        "vehiclecategory": "type"
      },
      "response": {
        "totalPrice": "price"
      }
    }
  }'
WHERE id = 5;
```

---

## Step 3: Test the Adapter Pattern

Now call the quote calculation endpoint:

```bash
curl -X POST "http://localhost:3000/vehicles/57388038943278/calculate-quotes?limit=10" \
  -H "Content-Type: application/json" \
  -d '{"auction": "Copart", "usacity": "Dallas (TX)"}'
```

### What to Look For

**1. Different prices for different companies:**
```json
{
  "quotes": [
    {"companyId": 1, "companyName": "Company 1", "totalPrice": 1850.50, ...},
    {"companyId": 2, "companyName": "Company 2", "totalPrice": 1620.75, ...},
    {"companyId": 3, "companyName": "Company 3", "totalPrice": 1800.00, ...},
    {"companyId": 4, "companyName": "Company 4", "totalPrice": 2100.00, ...},
    {"companyId": 5, "companyName": "Company 5", "totalPrice": 1550.00, ...},
    {"companyId": 6, "companyName": "Company 6", "totalPrice": 270.00, ...}  // Default adapter
  ]
}
```

**2. Server logs showing different adapters:**
```
[ConfigurableAdapter] Calling custom calculator API
  companyId: 1
  apiUrl: http://localhost:3000/testing/calculator/simple

[ConfigurableAdapter] Calling custom calculator API
  companyId: 2
  apiUrl: http://localhost:3000/testing/calculator/nested

[DefaultAdapter] Calling Auto Market Logistic calculator API
  companyId: 6
```

**3. Redis cache keys with company IDs:**
```bash
redis-cli KEYS "calculator:company:*"
```
Should show keys like:
- `calculator:company:1:{requestHash}`
- `calculator:company:2:{requestHash}`
- etc.

---

## Step 4: Test Error Handling

### Test 1: Invalid API URL
```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'http://localhost:9999/invalid',
  calculator_config = '{"field_mapping":{"request":{},"response":{"totalPrice":"total"}}}'
WHERE id = 1;
```

Then call the endpoint - company 1 should be excluded but others should still work.

### Test 2: Missing Authentication
```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'http://localhost:3000/testing/calculator/with-auth',
  calculator_config = '{
    "timeout": 5000,
    "field_mapping": {
      "request": {"usacity": "pickup"},
      "response": {"totalPrice": "estimate.amount"}
    }
  }'
WHERE id = 1;
```

This will fail because headers are missing - check server logs for 401 error.

### Test 3: Missing Static Fields
```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'http://localhost:3000/testing/calculator/different-fields',
  calculator_config = '{
    "timeout": 5000,
    "field_mapping": {
      "request": {"usacity": "from_city"},
      "response": {"totalPrice": "total"}
    }
  }'
WHERE id = 1;
```

This will fail because `customer_id` and `request_type` static fields are missing.

---

## Step 5: Reset Companies to Default

To reset all companies back to the default Auto Market Logistic calculator:

```sql
UPDATE companies 
SET 
  calculator_type = 'default',
  calculator_api_url = NULL,
  calculator_config = NULL
WHERE id IN (1, 2, 3, 4, 5);
```

---

## Troubleshooting

### Issue: Mock endpoints not responding

**Check:** Is the server running?
```bash
curl http://localhost:3000/health
```

**Check:** Are routes registered? Look for this log on server start:
```
[MockCalculator] Mock calculator routes registered at /testing/calculator/*
```

### Issue: ConfigurableAdapter returns 0 price

**Check 1:** Verify the response path is correct
```bash
# Test the mock endpoint directly
curl -X POST http://localhost:3000/testing/calculator/nested \
  -H "Content-Type: application/json" \
  -d '{"origin": "Dallas (TX)"}'

# Look at the response structure and verify your path
# e.g., "data.quote.pricing.total_usd"
```

**Check 2:** Look at server logs for the raw response
```
[ConfigurableAdapter] Custom calculator API response received
```

### Issue: Authentication endpoint returns 401

**Check:** Verify headers are configured correctly in `calculator_config.headers`
```json
{
  "headers": {
    "X-API-Key": "test-secret-key-12345",
    "X-Customer-ID": "PLATFORM_USER"
  }
}
```

### Issue: Different-fields endpoint returns 400

**Check:** Verify static fields are configured
```json
{
  "field_mapping": {
    "request": {
      "static": {
        "customer_id": "PLATFORM_TEST_001",
        "request_type": "instant_quote"
      }
    }
  }
}
```

---

## Summary: Testing Checklist

- [ ] Mock endpoints are accessible at `/testing/calculator/*`
- [ ] Each endpoint responds with correct format when tested directly
- [ ] Companies are configured with different `calculator_type='custom_api'`
- [ ] Quote endpoint returns different prices for different companies
- [ ] Server logs show `[ConfigurableAdapter]` for custom API companies
- [ ] Server logs show `[DefaultAdapter]` for default companies
- [ ] Redis cache keys include company IDs
- [ ] Error handling works (invalid URL, missing auth, missing static fields)
- [ ] Companies reset to default work correctly
