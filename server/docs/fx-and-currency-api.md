# FX & Currency API

This document describes how currency conversion is handled in the backend for
quote-related endpoints.

Main components:

- `exchange_rates` table – stores daily USD->GEL rates.
- `FxRateService` – reads/writes rates and integrates with the external
  exchangerate-api service.
- Quote endpoints – expose a `currency` parameter to return prices in USD or GEL.

---

## Data Model: `exchange_rates`

**Table:** `exchange_rates`

Columns:

- `id` (BIGINT, PK, auto-increment)
- `base_currency` (CHAR(3)) – e.g. `"USD"`.
- `target_currency` (CHAR(3)) – e.g. `"GEL"`.
- `rate` (DECIMAL) – 1 `base_currency` = `rate` `target_currency`.
- `rate_date` (DATE) – UTC date for which the rate applies.
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

Constraints / indexes:

- Unique on `(base_currency, target_currency, rate_date)` so there is at most
  one row per day per pair.
- Index on `(base_currency, target_currency, rate_date)` for lookups.

Example row:

```text
base_currency   = 'USD'
target_currency = 'GEL'
rate            = 2.7065
rate_date       = '2025-11-15'
```

---

## FxRateService

Implemented in `src/services/FxRateService.ts`.

Responsibilities:

- Read/write USD->GEL rates in `exchange_rates`.
- Call the external exchangerate-api only when needed.
- Provide helper methods for other services/controllers.

### ensureTodayUsdGelRate()

```ts
async ensureTodayUsdGelRate(): Promise<void>
```

- Computes the current UTC date (`YYYY-MM-DD`).
- Checks `exchange_rates` for a row where:
  - `base_currency = 'USD'`
  - `target_currency = 'GEL'`
  - `rate_date = todayUtc`.
- If a row exists:
  - Logs that todays rate already exists.
  - **Does not** call the external API.
- If no row exists:
  - Calls `https://v6.exchangerate-api.com/v6/<EXCHANGE_API_KEY>/latest/USD`.
  - Extracts `conversion_rates.GEL`.
  - Upserts a row into `exchange_rates` for today.

This method is used:

- On server startup (before `fastify.listen`).
- From a daily cron job.

### getLatestUsdGelRate()

```ts
async getLatestUsdGelRate(): Promise<number | null>
```

- Reads the most recent `USD -> GEL` rate from `exchange_rates`:

  ```sql
  SELECT rate
  FROM exchange_rates
  WHERE base_currency = 'USD'
    AND target_currency = 'GEL'
  ORDER BY rate_date DESC
  LIMIT 1;
  ```

- Returns `null` if no valid rate is found.
- Controllers use this method to convert quote totals at request time without
  calling the external API.

---

## Currency Parameter on Quote Endpoints

All quote-related endpoints treat **USD** as the internal base currency and
support an optional `currency` parameter to return values in either USD or GEL.

### Supported values

- `currency` (string, optional, case-insensitive):
  - `"usd"` → keep values in USD (default when omitted).
  - `"gel"` → convert values to GEL using `getLatestUsdGelRate()`.

If any other value is provided, a `ValidationError` is thrown with a message
similar to:

```text
Unsupported currency. Allowed values: usd, gel
```

### Converted fields

When `currency = "gel"`:

- `total_price` on each quote object.
- `breakdown.total_price` when present and numeric.

No other breakdown components are currently converted; they remain in their
original units for transparency.

---

## Interaction with Vehicles & Quotes API

Quote-related controller methods (in `CompanyController`) use `FxRateService`
like this:

- `calculateQuotesForVehicle(vehicleId, currency?)`
  - Computes quotes in USD, then optionally converts totals based on `currency`.
- `searchQuotesForVehicles(filters, limit, offset, currency?)`
  - Computes quotes for many vehicles, then converts totals when needed.
- `getQuotesByVehicle(vehicleId, currency?)`
  - Reads persisted `company_quotes` rows in USD, then optionally converts.
- `getQuotesByCompany(companyId, currency?)`
  - Same as above, but filtered by company.

See `docs/vehicles-and-quotes-api.md` for endpoint-level details and request/
response examples.
