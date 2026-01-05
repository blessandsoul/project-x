# Multi-Company Calculator API Extensibility Analysis

**Date:** 2025-12-27  
**Endpoint:** `POST /vehicles/:vehicleId/calculate-quotes?limit=5`  
**Question:** Will the server be easy to change so that every company has their own calculator APIs?

---

## Executive Summary

**Answer: YES, with moderate refactoring effort (6-8 hours).**

Your current architecture is **well-positioned** for this change. The system already has:
- ✅ Clear separation of concerns (Service Layer pattern)
- ✅ Company-based iteration in quote calculation
- ✅ Centralized calculator logic in `ShippingQuoteService`
- ✅ Strong type safety and error handling

**However**, the system is currently **hardcoded to use a single external calculator API** for all companies. To support per-company calculators, you'll need to:
1. Add a `calculator_api_url` field to the `companies` table
2. Introduce a **Strategy Pattern** for calculator selection
3. Refactor `ShippingQuoteService.callCalculator()` to be company-aware

---

## Current Architecture Analysis

### 1. **Request Flow**

```
Client Request
    ↓
POST /vehicles/:vehicleId/calculate-quotes
    ↓
Route Handler (company.ts:1235)
    ↓
CalculatorRequestBuilder.buildCalculatorRequest()
    ↓
CompanyController.calculateQuotesForVehicleWithInput()
    ↓
ShippingQuoteService.computeQuotesWithCalculatorInput()
    ↓
ShippingQuoteService.callCalculator() ← SINGLE CALCULATOR API
    ↓
CalculatorService.calculate() ← HARDCODED URL
    ↓
External API: https://automarketlgc.com/wp-json/calculator/v1/calculate
```

### 2. **Key Components**

#### **A. Route Handler** (`src/routes/company.ts:1235-1362`)
- ✅ **Good:** Already accepts `auction`, `usacity`, `vehiclecategory` from client
- ✅ **Good:** Uses `CalculatorRequestBuilder` for normalization
- ✅ **Good:** Delegates to controller layer

#### **B. Calculator Request Builder** (`src/services/CalculatorRequestBuilder.ts`)
- ✅ **Good:** Single source of truth for request normalization
- ✅ **Good:** Handles city/auction matching, defaults, validation
- ⚠️ **Neutral:** Currently builds a generic request (not company-specific)

#### **C. Shipping Quote Service** (`src/services/ShippingQuoteService.ts`)
- ✅ **Good:** Iterates over companies in `computeQuotesWithCalculatorInput()`
- ❌ **Problem:** Calls `this.callCalculator()` **once** for all companies
- ❌ **Problem:** `callCalculator()` is **not company-aware**

```typescript
// Current code (line 457-577)
async computeQuotesWithCalculatorInput(
  calculatorInput: CalculatorRequest,
  companies: Company[],
): Promise<QuoteComputationResult> {
  // ❌ Single API call for ALL companies
  calculatorResponse = await this.callCalculator(calculatorInput);
  
  // ✅ Iterates over companies, but all get the SAME price
  for (const company of companies) {
    quotes.push({
      companyId: company.id,
      companyName: company.name,
      totalPrice: transportationTotal, // ← Same for all
      // ...
    });
  }
}
```

#### **D. Calculator Service** (`src/services/CalculatorService.ts`)
- ❌ **Problem:** Hardcoded API URL in constructor
```typescript
private readonly apiUrl = 'https://automarketlgc.com/wp-json/calculator/v1/calculate';
```

### 3. **Database Schema**

#### **Companies Table** (`migrations/option_b_onboarding_schema.sql:51-98`)
```sql
CREATE TABLE companies (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  -- Pricing fields (currently unused for calculator-based quotes)
  base_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  price_per_mile DECIMAL(10, 4) NOT NULL DEFAULT 0.00,
  -- ...
  final_formula JSON NULL, -- ✅ Could store calculator config here
  -- ❌ MISSING: calculator_api_url, calculator_type, calculator_config
);
```

---

## Proposed Solution: Strategy Pattern with Company-Specific Calculators

### **Phase 1: Database Schema Changes** (30 minutes)

Add calculator configuration to `companies` table:

```sql
-- Migration: add_company_calculator_config.sql
ALTER TABLE companies
  ADD COLUMN calculator_type ENUM('default', 'custom_api', 'formula_based') 
    NOT NULL DEFAULT 'default' AFTER final_formula,
  ADD COLUMN calculator_api_url VARCHAR(500) NULL AFTER calculator_type,
  ADD COLUMN calculator_config JSON NULL AFTER calculator_api_url;

-- Index for filtering companies by calculator type
CREATE INDEX idx_companies_calculator_type ON companies(calculator_type);
```

**Field Descriptions:**
- `calculator_type`: 
  - `'default'`: Use the existing automarketlgc.com API
  - `'custom_api'`: Use company's own API (URL in `calculator_api_url`)
  - `'formula_based'`: Use legacy formula from `final_formula`
- `calculator_api_url`: Full URL to company's calculator endpoint
- `calculator_config`: JSON for API-specific settings (auth tokens, timeouts, etc.)

---

### **Phase 2: Introduce Calculator Strategy Interface** (1 hour)

Create `src/services/calculators/ICalculatorStrategy.ts`:

```typescript
export interface CalculatorRequest {
  buyprice: number;
  auction: string;
  vehicletype: string;
  usacity?: string;
  destinationport?: string;
  vehiclecategory?: string;
}

export interface CalculatorResponse {
  success: boolean;
  data?: {
    transportation_total: number;
    distance_miles?: number;
    currency?: string;
    [key: string]: any;
  };
  error?: string;
}

export interface ICalculatorStrategy {
  /**
   * Calculate shipping quote for a specific company
   * @param request Normalized calculator request
   * @param company Company object with calculator config
   * @returns Calculator response
   */
  calculate(
    request: CalculatorRequest,
    company: Company
  ): Promise<CalculatorResponse>;
}
```

---

### **Phase 3: Implement Calculator Strategies** (2 hours)

#### **A. Default Calculator** (`src/services/calculators/DefaultCalculatorStrategy.ts`)
```typescript
import { ICalculatorStrategy, CalculatorRequest, CalculatorResponse } from './ICalculatorStrategy.js';
import { Company } from '../../types/company.js';
import axios from 'axios';

export class DefaultCalculatorStrategy implements ICalculatorStrategy {
  private readonly DEFAULT_API_URL = 'https://automarketlgc.com/wp-json/calculator/v1/calculate';

  async calculate(
    request: CalculatorRequest,
    company: Company
  ): Promise<CalculatorResponse> {
    try {
      const response = await axios.post(this.DEFAULT_API_URL, request, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Calculator API error',
      };
    }
  }
}
```

#### **B. Custom API Calculator** (`src/services/calculators/CustomApiCalculatorStrategy.ts`)
```typescript
export class CustomApiCalculatorStrategy implements ICalculatorStrategy {
  async calculate(
    request: CalculatorRequest,
    company: Company
  ): Promise<CalculatorResponse> {
    const apiUrl = company.calculator_api_url;
    
    if (!apiUrl) {
      return {
        success: false,
        error: `Company ${company.name} has calculator_type='custom_api' but no calculator_api_url`,
      };
    }

    try {
      // Extract auth config from calculator_config JSON
      const config = company.calculator_config as any;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config?.auth_token) {
        headers['Authorization'] = `Bearer ${config.auth_token}`;
      }

      const response = await axios.post(apiUrl, request, {
        timeout: config?.timeout || 30000,
        headers,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Custom calculator API error',
      };
    }
  }
}
```

#### **C. Formula-Based Calculator** (`src/services/calculators/FormulaCalculatorStrategy.ts`)
```typescript
export class FormulaCalculatorStrategy implements ICalculatorStrategy {
  async calculate(
    request: CalculatorRequest,
    company: Company
  ): Promise<CalculatorResponse> {
    // Use legacy pricing formula from company.final_formula
    const formula = company.final_formula as any;
    
    if (!formula) {
      return {
        success: false,
        error: `Company ${company.name} has calculator_type='formula_based' but no final_formula`,
      };
    }

    // Simple distance-based calculation (example)
    const distanceMiles = 2000; // Would need to calculate from usacity
    const totalPrice = 
      (company.base_price || 0) +
      (company.price_per_mile || 0) * distanceMiles +
      (company.customs_fee || 0) +
      (company.service_fee || 0);

    return {
      success: true,
      data: {
        transportation_total: totalPrice,
        distance_miles: distanceMiles,
        currency: 'USD',
      },
    };
  }
}
```

---

### **Phase 4: Create Calculator Factory** (30 minutes)

`src/services/calculators/CalculatorFactory.ts`:

```typescript
import { ICalculatorStrategy } from './ICalculatorStrategy.js';
import { DefaultCalculatorStrategy } from './DefaultCalculatorStrategy.js';
import { CustomApiCalculatorStrategy } from './CustomApiCalculatorStrategy.js';
import { FormulaCalculatorStrategy } from './FormulaCalculatorStrategy.js';
import { Company } from '../../types/company.js';

export class CalculatorFactory {
  private defaultStrategy = new DefaultCalculatorStrategy();
  private customApiStrategy = new CustomApiCalculatorStrategy();
  private formulaStrategy = new FormulaCalculatorStrategy();

  getStrategy(company: Company): ICalculatorStrategy {
    switch (company.calculator_type) {
      case 'custom_api':
        return this.customApiStrategy;
      case 'formula_based':
        return this.formulaStrategy;
      case 'default':
      default:
        return this.defaultStrategy;
    }
  }
}
```

---

### **Phase 5: Refactor ShippingQuoteService** (2 hours)

Update `src/services/ShippingQuoteService.ts`:

```typescript
import { CalculatorFactory } from './calculators/CalculatorFactory.js';

export class ShippingQuoteService {
  private calculatorFactory: CalculatorFactory;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.calculatorService = new CalculatorService(fastify);
    this.calculatorFactory = new CalculatorFactory(); // ← NEW
  }

  async computeQuotesWithCalculatorInput(
    calculatorInput: CalculatorRequest,
    companies: Company[],
  ): Promise<QuoteComputationResult> {
    const quotes: ComputedQuote[] = [];

    // ✅ NEW: Call calculator API FOR EACH COMPANY
    for (const company of companies) {
      try {
        const strategy = this.calculatorFactory.getStrategy(company);
        const calculatorResponse = await strategy.calculate(calculatorInput, company);

        if (!calculatorResponse.success) {
          this.fastify.log.warn(
            { companyId: company.id, error: calculatorResponse.error },
            'Calculator failed for company'
          );
          continue; // Skip this company
        }

        const responseData = calculatorResponse.data!;
        const transportationTotal = this.toNumber(
          responseData.transportation_total || 0,
          'transportation_total'
        );
        const distanceMiles = responseData.distance_miles || 0;

        quotes.push({
          companyId: company.id,
          companyName: company.name,
          totalPrice: transportationTotal,
          deliveryTimeDays: (company.final_formula as any)?.delivery_time_days ?? null,
          breakdown: {
            transportation_total: transportationTotal,
            currency: responseData.currency || 'USD',
            distance_miles: distanceMiles,
            formula_source: company.calculator_type || 'default',
          },
        });
      } catch (error) {
        this.fastify.log.error(
          { companyId: company.id, error },
          'Failed to compute quote for company'
        );
      }
    }

    return {
      distanceMiles: quotes[0]?.breakdown?.distance_miles || 0,
      quotes,
    };
  }
}
```

---

### **Phase 6: Update Company Type Definition** (15 minutes)

`src/types/company.ts`:

```typescript
export interface Company {
  id: number;
  owner_user_id: number;
  name: string;
  slug: string;
  // ... existing fields ...
  final_formula?: object | null;
  
  // ✅ NEW: Calculator configuration
  calculator_type?: 'default' | 'custom_api' | 'formula_based';
  calculator_api_url?: string | null;
  calculator_config?: object | null;
}
```

---

### **Phase 7: Caching Strategy Update** (30 minutes)

Update `ShippingQuoteService.callCalculator()` to include `companyId` in cache key:

```typescript
private async callCalculatorForCompany(
  request: CalculatorRequest,
  company: Company
): Promise<any> {
  // ✅ Include company ID in cache key
  const cacheKey = `calculator:company:${company.id}:${JSON.stringify({
    buyprice: request.buyprice,
    auction: request.auction,
    usacity: request.usacity,
    // ...
  })}`;

  // ... rest of caching logic
}
```

---

## Migration Path for Existing Companies

### **Option 1: Zero Downtime (Recommended)**

1. Run migration to add new columns with `DEFAULT 'default'`
2. All existing companies automatically use `calculator_type='default'`
3. No code changes needed immediately
4. Gradually migrate companies to custom APIs:
   ```sql
   UPDATE companies 
   SET calculator_type = 'custom_api',
       calculator_api_url = 'https://company-x.com/api/calculate'
   WHERE id = 123;
   ```

### **Option 2: Bulk Migration**

If you have a CSV/JSON mapping of companies to their calculator APIs:

```sql
-- Example: Migrate Company X to custom API
UPDATE companies 
SET 
  calculator_type = 'custom_api',
  calculator_api_url = 'https://company-x.com/api/v1/shipping-quote',
  calculator_config = JSON_OBJECT(
    'auth_token', 'secret-token-here',
    'timeout', 45000
  )
WHERE name = 'Company X';
```

---

## Testing Strategy

### **1. Unit Tests**

```typescript
// tests/services/calculators/DefaultCalculatorStrategy.test.ts
describe('DefaultCalculatorStrategy', () => {
  it('should call automarketlgc.com API', async () => {
    const strategy = new DefaultCalculatorStrategy();
    const company = { id: 1, name: 'Test Co', calculator_type: 'default' };
    const request = { buyprice: 1, auction: 'Copart', vehicletype: 'standard' };
    
    const result = await strategy.calculate(request, company);
    expect(result.success).toBe(true);
  });
});
```

### **2. Integration Tests**

```typescript
// tests/routes/calculate-quotes.test.ts
describe('POST /vehicles/:vehicleId/calculate-quotes', () => {
  it('should return different prices for companies with different calculators', async () => {
    // Setup: Company 1 uses default, Company 2 uses custom API
    const response = await fastify.inject({
      method: 'POST',
      url: '/vehicles/123/calculate-quotes',
      payload: { auction: 'Copart', usacity: 'Dallas (TX)' },
    });

    const quotes = response.json().quotes;
    expect(quotes[0].total_price).not.toBe(quotes[1].total_price);
  });
});
```

---

## Performance Considerations

### **Current Performance**
- **1 API call** per vehicle (all companies get same price)
- **Cache TTL:** 24 hours (Redis)
- **Response time:** ~500ms (single API call)

### **New Performance**
- **N API calls** per vehicle (N = number of companies)
- **Cache TTL:** 24 hours per company (Redis)
- **Response time:** ~500ms × N (sequential) OR ~500ms (parallel)

### **Optimization: Parallel API Calls**

```typescript
// Use Promise.all() for parallel execution
const quotePromises = companies.map(async (company) => {
  const strategy = this.calculatorFactory.getStrategy(company);
  return strategy.calculate(calculatorInput, company);
});

const results = await Promise.all(quotePromises);
```

**Expected improvement:**
- Sequential: 5 companies × 500ms = **2.5 seconds**
- Parallel: max(500ms) = **500ms** ✅

---

## Rollback Plan

If issues arise after deployment:

1. **Database rollback:**
   ```sql
   ALTER TABLE companies
     DROP COLUMN calculator_type,
     DROP COLUMN calculator_api_url,
     DROP COLUMN calculator_config;
   ```

2. **Code rollback:**
   - Revert `ShippingQuoteService.computeQuotesWithCalculatorInput()`
   - Remove `calculators/` directory
   - Restore original `CalculatorService`

3. **Cache invalidation:**
   ```bash
   redis-cli FLUSHDB  # Clear all calculator caches
   ```

---

## Estimated Effort

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| 1 | Database migration | 30 min | Low |
| 2 | Strategy interface | 1 hour | Low |
| 3 | Implement strategies | 2 hours | Medium |
| 4 | Calculator factory | 30 min | Low |
| 5 | Refactor ShippingQuoteService | 2 hours | Medium |
| 6 | Update types | 15 min | Low |
| 7 | Update caching | 30 min | Low |
| 8 | Testing | 1.5 hours | Medium |
| 9 | Documentation | 30 min | Low |

**Total:** ~8.5 hours for a senior developer

---

## Conclusion

### **✅ Your Server is Well-Architected for This Change**

**Strengths:**
1. **Service layer separation** makes it easy to swap calculator implementations
2. **Company-based iteration** already exists in `computeQuotesWithCalculatorInput()`
3. **Strong typing** (TypeScript) prevents runtime errors
4. **Redis caching** will work seamlessly with per-company keys

**Required Changes:**
1. Add 3 columns to `companies` table
2. Implement Strategy Pattern (4 new files)
3. Refactor 1 method in `ShippingQuoteService`
4. Update 1 type definition

**Risk Level:** **Low-Medium**
- No breaking changes to API contract
- Backward compatible (existing companies use `calculator_type='default'`)
- Can be deployed incrementally (company by company)

**Recommendation:** Proceed with the refactoring. The investment (~8 hours) will pay off immediately when you onboard the first company with a custom calculator API.
