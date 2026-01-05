# Calculator Adapter Pattern - Testing Guide

## Prerequisites

1. Database migration has been run (`add_calculator_config.sql`)
2. Server is running: `cd server && npm run dev`
3. Client is running (for UI testing): `cd client && npm run dev`

---

## Test 1: Verify Backward Compatibility (Default Adapter)

All existing companies should continue working with `calculator_type='default'`.

### 1.1 Check existing companies have default type

```sql
SELECT id, name, calculator_type, calculator_api_url, calculator_config 
FROM companies 
LIMIT 5;
```

**Expected:** `calculator_type = 'default'`, `calculator_api_url = NULL`, `calculator_config = NULL`

### 1.2 Test quote calculation (existing flow)

```bash
curl -X POST "http://localhost:3000/vehicles/57388038943278/calculate-quotes?limit=5" \
  -H "Content-Type: application/json" \
  -d '{"auction": "Copart", "usacity": "Dallas (TX)"}'
```

**Expected:** Same response as before - all companies with same price from Auto Market Logistic API.

### 1.3 Check server logs

Look for: `Computing quotes using adapter pattern (per-company calculators)`

```
[DefaultAdapter] Calling Auto Market Logistic calculator API
[DefaultAdapter] Calculator API response received
[DefaultAdapter] Cached calculator response
```

---

## Test 2: Verify Redis Caching (Per-Company Keys)

### 2.1 Check Redis cache keys

```bash
# If using redis-cli
redis-cli KEYS "calculator:company:*"
```

**Expected:** Keys in format `calculator:company:{companyId}:{requestHash}`

### 2.2 Verify cache hit on second request

Run the same curl command again and check logs for:

```
[DefaultAdapter] Using cached calculator response
```

---

## Test 3: Test Custom Calculator (ConfigurableAdapter)

### 3.1 Set up a test company with custom API

Use [httpbin.org](https://httpbin.org) as a mock API:

```sql
-- Update an existing company (or create a test one)
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'https://httpbin.org/post',
  calculator_config = JSON_OBJECT(
    'timeout', 30000,
    'headers', JSON_OBJECT(
      'X-Test-Header', 'test-value'
    ),
    'field_mapping', JSON_OBJECT(
      'request', JSON_OBJECT(
        'usacity', 'origin_city',
        'destinationport', 'destination',
        'vehicletype', 'vehicle_type',
        'auction', 'auction_source',
        'buyprice', 'price'
      ),
      'response', JSON_OBJECT(
        'totalPrice', 'json.price',
        'distanceMiles', 'json.price',
        'currency', 'headers.Content-Type'
      )
    )
  )
WHERE id = 1;  -- Replace with your test company ID
```

### 3.2 Test the custom calculator

```bash
curl -X POST "http://localhost:3000/vehicles/57388038943278/calculate-quotes?limit=5" \
  -H "Content-Type: application/json" \
  -d '{"auction": "Copart", "usacity": "Dallas (TX)"}'
```

### 3.3 Check server logs

Look for:

```
[ConfigurableAdapter] Calling custom calculator API
  apiUrl: https://httpbin.org/post
  requestBody: { origin_city: "Dallas (TX)", destination: "POTI", ... }
```

### 3.4 Revert test company

```sql
UPDATE companies 
SET 
  calculator_type = 'default',
  calculator_api_url = NULL,
  calculator_config = NULL
WHERE id = 1;  -- Same ID as above
```

---

## Test 4: Test Error Handling

### 4.1 Test with invalid API URL

```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'https://invalid-url-that-does-not-exist.example.com/api',
  calculator_config = JSON_OBJECT(
    'timeout', 5000,
    'field_mapping', JSON_OBJECT(
      'request', JSON_OBJECT(),
      'response', JSON_OBJECT('totalPrice', 'total')
    )
  )
WHERE id = 1;
```

### 4.2 Call the endpoint

```bash
curl -X POST "http://localhost:3000/vehicles/57388038943278/calculate-quotes?limit=5" \
  -H "Content-Type: application/json" \
  -d '{"auction": "Copart", "usacity": "Dallas (TX)"}'
```

**Expected:** 
- Other companies with `calculator_type='default'` still return quotes
- Company 1 is excluded from results
- Server logs show: `[ConfigurableAdapter] Error calling custom calculator API`

### 4.3 Revert

```sql
UPDATE companies 
SET 
  calculator_type = 'default',
  calculator_api_url = NULL,
  calculator_config = NULL
WHERE id = 1;
```

---

## Test 5: Test Missing Configuration

### 5.1 Set custom_api without URL

```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = NULL,
  calculator_config = NULL
WHERE id = 1;
```

### 5.2 Call the endpoint

**Expected:** 
- Company 1 fails gracefully
- Log shows: `Company has calculator_type=custom_api but no calculator_api_url`
- Other companies still return quotes

### 5.3 Revert

```sql
UPDATE companies 
SET calculator_type = 'default'
WHERE id = 1;
```

---

## Test 6: Performance Verification

### 6.1 Time the parallel execution

```bash
# Run with timing
time curl -X POST "http://localhost:3000/vehicles/57388038943278/calculate-quotes?limit=10" \
  -H "Content-Type: application/json" \
  -d '{"auction": "Copart", "usacity": "Dallas (TX)"}'
```

**Expected:** ~500ms for 10 companies (parallel), not 5000ms (sequential)

### 6.2 Check logs for success/failure counts

```
Computed quotes using adapter pattern
  successCount: 10
  failureCount: 0
  quoteCount: 10
```

---

## Example: Real Custom Calculator Configuration

When you have a real company with their own API, configure like this:

```sql
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'https://company-api.example.com/v1/shipping/quote',
  calculator_config = JSON_OBJECT(
    'timeout', 45000,
    'headers', JSON_OBJECT(
      'Authorization', 'Bearer YOUR_API_KEY_HERE',
      'Content-Type', 'application/json',
      'X-Client-ID', 'project-x'
    ),
    'field_mapping', JSON_OBJECT(
      'request', JSON_OBJECT(
        'usacity', 'origin.city',
        'destinationport', 'destination.port',
        'vehicletype', 'vehicle.type',
        'vehiclecategory', 'vehicle.category',
        'auction', 'source.auction',
        'buyprice', 'vehicle.price',
        'static', JSON_OBJECT(
          'customer_id', 'PROJECT_X_PLATFORM',
          'quote_type', 'instant',
          'currency', 'USD'
        )
      ),
      'response', JSON_OBJECT(
        'totalPrice', 'data.quote.total_usd',
        'distanceMiles', 'data.route.distance_miles',
        'currency', 'data.quote.currency'
      )
    )
  )
WHERE id = 123;  -- Replace with actual company ID
```

---

## Rollback Instructions

If issues arise, rollback to the previous implementation:

### 1. Database rollback

```sql
-- Run migrations/rollback_calculator_config.sql
DROP INDEX idx_companies_calculator_type ON companies;
ALTER TABLE companies
  DROP COLUMN calculator_config,
  DROP COLUMN calculator_api_url,
  DROP COLUMN calculator_type;
```

### 2. Code rollback

Revert the following files:
- `src/services/ShippingQuoteService.ts`
- `src/types/company.ts`
- `src/models/CompanyModel.ts`

Delete the new files:
- `src/services/adapters/` (entire directory)
- `src/types/calculatorAdapterTypes.ts`

### 3. Clear Redis cache

```bash
redis-cli FLUSHDB
# Or selectively:
redis-cli KEYS "calculator:company:*" | xargs redis-cli DEL
```

---

## Troubleshooting

### Issue: All companies return 0 price

**Cause:** Auto Market Logistic API is down or unreachable

**Check:**
```bash
curl -X POST "https://automarketlgc.com/wp-json/calculator/v1/calculate" \
  -H "Content-Type: application/json" \
  -d '{"buyprice": 1, "auction": "Copart", "vehicletype": "standard", "usacity": "TX-DALLAS", "destinationport": "POTI", "vehiclecategory": "Sedan"}'
```

### Issue: Custom calculator returns wrong price

**Check:**
1. Verify `field_mapping.response.totalPrice` JSON path is correct
2. Test the API directly with the mapped request body
3. Check server logs for raw response

### Issue: Cache not invalidating

**Solution:**
```bash
redis-cli DEL "calculator:company:1:..."  # Delete specific key
```

### Issue: TypeScript compilation errors

**Check:**
```bash
cd server && npx tsc --noEmit
```
