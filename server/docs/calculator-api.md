# Calculator API & Quote Pricing Architecture

This document describes the centralized quote/price calculation system using the external Calculator API.

---

## Overview

**All quote price calculations now use POST `/api/calculator` as the single source of truth.**

The Calculator API is an external service that handles:

- Distance calculations between auction locations and destination ports
- Shipping/transportation cost computation
- Insurance calculations
- Customs and clearance fees
- Ocean freight costs

**Important:** Quote prices returned are **shipping/transportation costs only**.
Vehicle price is NOT included since the user already knows the bid amount.

---

## Strict Input Requirements

The calculator API is **case-sensitive** and requires exact values. All inputs must be normalized before calling.

### Auction Normalization

Raw values from vehicle data must be normalized to canonical auction names:

| Input (raw)        | Output (canonical) |
| ------------------ | ------------------ |
| `copart`, `COPART` | `Copart`           |
| `iaai`, `IAAI`     | `IAAI`             |
| `manheim`          | `Manheim`          |
| `adesa`            | `Adesa`            |

### City Smart Matching

The `usacity` field must exactly match a city from `/api/cities`. The `CalculatorRequestBuilder` service performs smart matching:

1. **Exact match** (case-insensitive, normalized)
2. **Contains match** (input contains canonical or vice versa)
3. **Word overlap** (significant words match)

Examples:

- `"Permian Basin (TX)"` → matches `"Permian Basin"` (if in cities list)
- `"DALLAS, TX"` → matches `"Dallas"`
- `"los angeles"` → matches `"Los Angeles"`

### Default Values

When calling `/vehicles/:vehicleId/calculate-quotes`:

| Field             | Default Value | Notes                                    |
| ----------------- | ------------- | ---------------------------------------- |
| `buyprice`        | `1`           | Always 1 (price doesn't affect shipping) |
| `vehicletype`     | `"standard"`  | Only `"standard"` or `"heavy"` allowed   |
| `vehiclecategory` | `"Sedan"`     | Case-sensitive                           |
| `destinationport` | `"POTI"`      | Uppercase                                |

This architecture ensures:

- Consistent pricing across all endpoints
- Centralized business logic maintenance
- Easy updates to pricing formulas without code changes

**Caching:** The service caches calculator API responses:

- In-memory cache for calculator responses (24 hour TTL)
- Redis cache for calculator responses (24 hour TTL)

Calculator API prices change infrequently (every few weeks), so a long cache TTL
reduces unnecessary API calls while still allowing updates within a reasonable time.

**Note:** Geocoding and distance calculation are now handled entirely by the calculator API.

**No DB Persistence:** Quotes are NOT persisted to the `company_quotes` table since calculator
API prices can change anytime. The `company_quotes`, `auction_branch_distances`, and `yards`
tables are no longer updated by this service. Historical data in these tables is preserved
but not used for new calculations.

---

## Calculator API Endpoint

### POST `/api/calculator`

**Description:**
Calculate shipping costs using the external calculator API.

**Method:** `POST`

**Request Body (JSON):**

```jsonc
{
  "buyprice": 7500, // Required: Vehicle purchase price (number > 0)
  "auction": "Copart", // Required: Auction source
  "vehicletype": "standard", // Required: Vehicle type
  "usacity": "Dallas", // Optional: US city/location
  "coparturl": "https://...", // Optional: Copart lot URL
  "destinationport": "POTI", // Optional: Destination port (default: "POTI")
  "vehiclecategory": "Sedan" // Optional: Vehicle category
}
```

#### Field Specifications

| Field             | Required | Type   | Constraints                                                                 |
| ----------------- | -------- | ------ | --------------------------------------------------------------------------- |
| `buyprice`        | yes      | number | Must be a positive number                                                   |
| `auction`         | yes      | string | One of: `Copart`, `IAAI`, `Manheim`, `Adesa`                                |
| `vehicletype`     | yes      | string | One of: `standard`, `heavy`                                                 |
| `usacity`         | no       | string | US city name for origin location                                            |
| `coparturl`       | no       | string | Full Copart lot URL (for Copart vehicles)                                   |
| `destinationport` | no       | string | Destination port code (default: `POTI`)                                     |
| `vehiclecategory` | no       | string | One of: `Sedan`, `Bike`, `Small SUV`, `Big SUV`, `Pickup`, `Van`, `Big Van` |

**Response 200 JSON:**

The calculator returns a comprehensive pricing breakdown:

```jsonc
{
  "success": true,
  "data": {
    "total_price": 12500,
    "shipping_cost": 3200,
    "insurance_cost": 150,
    "customs_cost": 800,
    "distance_miles": 7800
    // ... additional fields from external calculator
  }
}
```

**Error Responses:**

- `400 Bad Request` – Invalid or missing required parameters
- `500 Internal Server Error` – Calculator API unavailable

---

## Internal Architecture

### Services

#### `ShippingQuoteService` (Primary)

Location: `src/services/ShippingQuoteService.ts`

This is the main service for quote calculations. It:

1. Maps vehicle/company data to calculator request format
2. Calls the Calculator API via `CalculatorService`
3. Transforms responses for use by controllers
4. Handles errors gracefully with proper logging

**Key Methods:**

```typescript
// Compute quotes for a vehicle across all companies
async computeQuotesForVehicle(
  vehicle: Vehicle,
  companies: Company[],
  destinationPort?: string
): Promise<QuoteComputationResult>

// Compute shipping quotes based on distance only
async computeShippingQuotesForDistance(
  distanceMiles: number,
  companies: Company[]
): Promise<Array<{ companyId: number; companyName: string; shippingPrice: number }>>

// Get distance from address to port
async getDistanceForAddress(
  address: string,
  source: string,
  port?: string
): Promise<number>
```

#### `CalculatorService`

Location: `src/services/CalculatorService.ts`

Low-level service that handles HTTP communication with the external calculator API.

```typescript
async calculate(params: CalculateRequest): Promise<CalculateResponse>
```

#### `LegacyShippingQuoteService` (Deprecated)

Location: `src/services/legacyShippingQuoteService.ts`

**DO NOT USE IN NEW CODE.**

This file contains the original quote calculation logic that was based on:

- Geo API calls (Geoapify) to calculate distance
- Company pricing fields: `base_price`, `price_per_mile`, `customs_fee`, `service_fee`, `broker_fee`
- Manual formula application per company

Preserved for:

- Historical reference
- Understanding the old calculation formulas
- Potential emergency fallback (not recommended)

---

## Data Flow

### Quote Calculation Flow

```
┌─────────────────┐
│  Controller     │
│  (e.g. Company) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  ShippingQuoteService   │
│  - Maps vehicle data    │
│  - Builds request       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  CalculatorService      │
│  - HTTP POST to API     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  External Calculator    │
│  automarketlgc.com      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Response Processing    │
│  - Extract totals       │
│  - Build breakdown      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Database (optional)    │
│  - Store in quotes      │
└─────────────────────────┘
```

### Request Mapping

The `ShippingQuoteService` maps internal data to calculator format:

| Internal Field         | Calculator Field  | Transformation                              |
| ---------------------- | ----------------- | ------------------------------------------- |
| `vehicle.calc_price`   | `buyprice`        | Direct numeric conversion                   |
| `vehicle.source`       | `auction`         | Normalized: copart→Copart, iaai→IAAI        |
| `vehicle.vehicle_type` | `vehicletype`     | Mapped: heavy keywords→heavy, else standard |
| `vehicle.yard_name`    | `usacity`         | City extracted from yard name               |
| `vehicle.lot_url`      | `coparturl`       | Direct (for Copart vehicles only)           |
| (default)              | `destinationport` | Default: "POTI" if not specified            |
| `vehicle.category`     | `vehiclecategory` | Mapped to allowed categories                |

---

## Endpoints Using Calculator

The following endpoints now use the Calculator API for pricing:

### Vehicle Quote Endpoints

| Endpoint                                | Method | Description                              |
| --------------------------------------- | ------ | ---------------------------------------- |
| `/vehicles/:vehicleId/calculate-quotes` | POST   | Calculate and persist quotes for vehicle |
| `/vehicles/:vehicleId/quotes`           | GET    | Get stored quotes for vehicle            |
| `/vehicles/search-quotes`               | POST   | Search vehicles with quotes (no persist) |
| `/vehicles/compare`                     | POST   | Compare quotes for multiple vehicles     |

### Auction/Catalog Endpoints

| Endpoint                      | Method | Description                            |
| ----------------------------- | ------ | -------------------------------------- |
| `/auction/calculate-shipping` | POST   | Calculate shipping from auction branch |

---

## Error Handling

### Calculator API Failures

When the Calculator API fails:

1. **Logging**: Full context is logged (vehicle ID, company ID, request body, error message)
2. **Error Response**: Clear error returned to client
3. **No Fallback**: The system does NOT fall back to legacy calculations automatically

```typescript
// Example error handling
try {
  const result = await this.calculatorService.calculate(request);
  if (!result.success) {
    throw new ValidationError(result.error || "Calculator API error");
  }
} catch (error) {
  this.fastify.log.error(
    {
      vehicleId: vehicle.id,
      request,
      error,
    },
    "Calculator API call failed"
  );
  throw error;
}
```

### Graceful Degradation

For non-critical paths (e.g., catalog shipping estimates), the service may:

- Return `-1` for `shippingPrice` to indicate "calculation failed"
- Return default distance values when distance cannot be determined

---

## Database Considerations

### Fields Still Used

These company fields are still read for reference/display but **not used for calculation**:

- `base_price`
- `price_per_mile`
- `customs_fee`
- `service_fee`
- `broker_fee`
- `final_formula`

### Quote Storage

The `company_quotes` table stores calculator results:

```sql
-- Breakdown now contains calculator response data
{
  "calculator_total": 12500,
  "shipping_cost": 3200,
  "insurance_cost": 150,
  "customs_cost": 800,
  "distance_miles": 7800,
  "calc_price": 7500,
  "retail_value": 15000,
  "formula_source": "calculator_api",
  "calculator_response": { /* raw response */ }
}
```

---

## Migration Notes

### What Changed

1. **`ShippingQuoteService`**: Completely rewritten to use Calculator API
2. **Legacy code**: Moved to `legacyShippingQuoteService.ts`
3. **Distance calculation**: Now handled by Calculator API, not Geoapify
4. **Pricing formulas**: All handled by external calculator

### What Stayed the Same

1. **Controller interfaces**: No changes to controller method signatures
2. **Response formats**: Quote response structure unchanged
3. **Database schema**: No schema changes required
4. **Company fields**: Still stored, used for reference/display

### Rollback Procedure

If rollback is needed:

1. Rename `ShippingQuoteService.ts` to `ShippingQuoteService.calculator.ts`
2. Rename `ShippingQuoteService.ts.backup` to `ShippingQuoteService.ts`
3. Restart the server

---

## Testing

### Manual Testing

```bash
# Test calculator endpoint directly
curl -X POST http://localhost:3000/api/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "buyprice": 7500,
    "auction": "Copart",
    "vehicletype": "standard",
    "destinationport": "POTI"
  }'

# Test vehicle quote calculation
curl -X POST http://localhost:3000/vehicles/123/calculate-quotes
```

### Verification Checklist

- [ ] Calculator API responds with valid data
- [ ] Vehicle quotes are calculated correctly
- [ ] Search quotes endpoint works
- [ ] Compare vehicles endpoint works
- [ ] Auction shipping calculation works
- [ ] Error handling works when calculator is unavailable
- [ ] Logs contain sufficient debugging information

---

## Related Documentation

- `vehicles-and-quotes-api.md` - Vehicle and quote endpoint documentation
- `companies-api.md` - Company pricing fields documentation
- `auction-locations-api.md` - Auction location and shipping endpoints
