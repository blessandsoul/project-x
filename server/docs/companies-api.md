# Companies & Pricing API

This document describes the API surface and data model for shipping companies and their pricing configuration. It is intended for backend implementers and AI agents integrating with the existing Node/Fastify backend.

Main components:

- `CompanyModel` – DB layer for `companies`, `company_social_links`, and `company_quotes`.
- `CompanyController` – business logic for companies, social links, and quotes.
- `companyRoutes` – HTTP routes exposing the API.

---

### GET `/companies/search`

**Description:**

Search companies with filters, pagination and sorting. This endpoint is intended for frontend company listings (search results, explore screens, etc.).

**Method:** `GET`

**Query params:**

- `limit` (optional, number) – page size, default 20, max 100.
- `offset` (optional, number) – number of companies to skip, default 0.
- `search` (optional, string) – case‑insensitive search on company `name`.
  - When provided, must be **at least 4 characters** long.
  - Shorter non‑empty values cause `400 Bad Request` with:
    - `error: "SEARCH_TOO_SHORT"`.
- `min_rating` (optional, number) – minimum average rating.
- `min_base_price` (optional, number) – minimum `base_price`.
- `max_base_price` (optional, number) – maximum `base_price`.
- `max_total_fee` (optional, number) – maximum total fixed shipping fee, implemented as a filter on `cheapest_score` (see below).
- `country` (optional, string) – exact match on `country` code/value.
- `city` (optional, string) – exact match on `city`.
- `is_vip` (optional, boolean: `true`/`false`) – filter VIP companies.
- `onboarding_free` (optional, boolean: `true`/`false`) – filter companies with free onboarding.
- `order_by` (optional, string) – sort field:
  - `"rating"` – weighted rating (see below).
  - `"cheapest"` – cheapest companies first, based on `cheapest_score`.
  - `"name"` – alphabetical by name.
  - `"newest"` – newest companies first (by `created_at`).
- `order_direction` (optional, string) – `"asc"` or `"desc"` for supported sort modes.

**Sorting details:**

- When `order_by = "cheapest"`:
  - Default is **cheapest first** (`cheapest_score ASC`) when no `order_direction` is provided.
  - `order_direction=desc` inverts this (most expensive first).
- When `order_by = "rating"`:

  - Uses a **weighted rating** that considers both rating and review count:

    ```sql
    ORDER BY (rating * LEAST(review_count, 20)) DESC, rating DESC
    ```

  - `review_count` is the number of reviews per company from `company_reviews`.
  - This means a company with many reviews and a 4.9 rating will rank above a company with a single 5.0 review.

- When `order_by` is not provided but `search` is provided:
  - The same **weighted rating** order is used by default.
- When neither `order_by` nor `search` is provided:
  - Default order is `created_at DESC` (newest first).

**`cheapest_score` background:**

- `cheapest_score` is a precomputed numeric column on `companies` used purely for fast filtering/sorting.
- It is calculated in the backend whenever company pricing changes:

  ```text
  cheapest_score = base_price + customs_fee + service_fee + broker_fee
  ```

- The search API uses `cheapest_score` for:
  - `max_total_fee` filter.
  - `order_by=cheapest` sorting.

**Response 200 JSON:**

```jsonc
{
  "items": [
    {
      "id": 10,
      "name": "ACME Shipping",
      "logo": "https://...",
      "base_price": 500,
      "price_per_mile": 0.5,
      "customs_fee": 300,
      "service_fee": 200,
      "broker_fee": 150,
      "final_formula": null,
      "description": "Fast shipping to Poti",
      "phone_number": "+995...",
      "rating": 4.9,
      "country": "GE",
      "city": "Tbilisi",
      "is_vip": true,
      "is_onboarding_free": true,
      "cheapest_score": 1150,
      "created_at": "2025-11-16T00:00:00.000Z",
      "updated_at": "2025-11-16T00:00:00.000Z",
      "reviewCount": 42
    }
  ],
  "total": 120,
  "limit": 20,
  "offset": 0
}
```

**Error responses:**

- `400 Bad Request` – when `search` is present but shorter than 4 characters.
- Standard error handling for internal errors via the global error handler.

---

## Data Model: Company

**Table:** `companies`

Key columns used by the API:

- `id` (number) – primary key.
- `name` (string) – company name.
- `logo` (string or null) – logo URL.
- `base_price` (DECIMAL/string) – fixed base component of shipping price.
- `price_per_mile` (DECIMAL/string) – cost per mile.
- `customs_fee` (DECIMAL/string) – customs-related fee.
- `service_fee` (DECIMAL/string) – service/handling fee.
- `broker_fee` (DECIMAL/string) – brokerage fee.
- `final_formula` (JSON or null) – optional per-company overrides of the default pricing formula.
- `description` (string or null) – human description.
- `phone_number` (string or null) – contact phone.
- `created_at`, `updated_at` – timestamps.

`CompanyModel` also manages:

- `company_social_links` – social URLs per company.
- `company_quotes` – stored quotes by company & vehicle (see separate Quotes doc if needed).

---

## Company APIs

All routes are defined in `src/routes/company.ts` and use `CompanyController` under the hood.

### GET `/companies`

**Description:**
Return a paginated list of companies.

**Method:** `GET`

**Query params (current implementation uses defaults):**

- `limit` (optional, default 100, max 1000) – number of companies.
- `offset` (optional, default 0) – number of companies to skip.

**Response 200 JSON (array):**

Each company object includes at least:

- `id`
- `name`
- `logo`
- `base_price`
- `price_per_mile`
- `customs_fee`
- `service_fee`
- `broker_fee`
- `final_formula`
- `description`
- `phone_number`
- `rating` – numeric average rating (0–5) derived from reviews.
- `reviewCount` – total number of reviews for this company.
- `created_at`
- `updated_at`

> Exact fields match the `Company` TypeScript interface in `src/types/company.ts`.

**Error responses:**

- Standard error handling (internal errors) via global error handler.

---

### GET `/companies/:id`

**Description:**
Return one company by ID, including its related social links and quotes.

**Method:** `GET`

**Path params:**

- `id` – numeric company ID.

**Response 200 JSON:**

- All company fields from above (including `rating` and `reviewCount`).
- `social_links`: array of social link objects `{ id, company_id, url, created_at, updated_at }`.

Quotes are no longer embedded directly in this response; use the
paginated quotes endpoint instead (see below).

**Error responses:**

- `400 Bad Request` – invalid `id` (non-numeric or <= 0).
- `404 Not Found` – company does not exist.

---

### POST `/companies`

**Description:**
Create a new company with pricing configuration. Companies are required before any quotes can be calculated.

**Method:** `POST`

**Body (JSON):**

```jsonc
{
  "name": "ACME Shipping", // required
  "logo": "https://...", // optional
  "base_price": 500, // required, number
  "price_per_mile": 0.5, // required, number
  "customs_fee": 300, // required, number
  "service_fee": 200, // required, number
  "broker_fee": 150, // required, number
  "final_formula": {
    // optional, overrides default formula
    "base_price": 600, // optional override
    "price_per_mile": 0.45, // optional override
    "customs_fee": 250,
    "service_fee": 220,
    "broker_fee": 160,
    "delivery_time_days": 35
  },
  "description": "Fast shipping to Poti", // optional
  "phone_number": "+995..." // optional
}
```

**Default pricing formula (when `final_formula` is not used):**

For a given company and vehicle with distance `D` miles and vehicle retail value and calc_price:

```text
mileage_cost  = price_per_mile * D
shipping_total = base_price + mileage_cost + customs_fee + service_fee + broker_fee
insurance_fee  = retail_value * 0.01

// returned total_price in quotes:
// total_price = vehicle calc_price + shipping_total + insurance_fee
```

If `final_formula` is present and is an object, those fields override the company base values (e.g. use `final_formula.base_price` instead of `base_price`).

**Response 201 JSON:**

The created `Company` object, including generated `id`.

**Error responses:**

- `400 Bad Request` – when required fields are missing or invalid types.

---

### PUT `/companies/:id`

**Description:**
Update an existing company. Only provided fields are updated; others remain unchanged.

**Method:** `PUT`

**Path params:**

- `id` – numeric company ID.

**Body (JSON):**

Same shape as `POST /companies`, but **all fields optional**.

Examples:

```jsonc
{
  "base_price": 550,
  "price_per_mile": 0.48,
  "final_formula": null
}
```

**Response 200 JSON:**

- The updated `Company` object.

**Error responses:**

- `400 Bad Request` – invalid `id`.
- `404 Not Found` – company does not exist.

---

### DELETE `/companies/:id`

**Description:**
Delete a company. Underlying logic is responsible for cleaning up related social links and quotes (no orphans).

**Method:** `DELETE`

**Path params:**

- `id` – numeric company ID.

**Response 204 No Content:**

- Empty body on success.

**Error responses:**

- `400 Bad Request` – invalid `id`.
- `404 Not Found` – company does not exist.

---

## Social Links API

Social links are optional URLs pointing to a company’s social profiles.

### GET `/companies/:companyId/social-links`

**Description:**
List all social links for a company.

**Method:** `GET`

**Path params:**

- `companyId` – numeric company ID.

**Response 200 JSON (array):**

Each item:

- `id`
- `company_id`
- `url`
- `created_at`
- `updated_at`

**Error responses:**

- `400 Bad Request` – invalid `companyId`.
- `404 Not Found` – company does not exist.

---

### POST `/companies/:companyId/social-links`

**Description:**
Create a social link for a company.

**Method:** `POST`

**Path params:**

- `companyId` – numeric company ID.

**Body (JSON):**

```jsonc
{
  "url": "https://facebook.com/acme"
}
```

**Response 201 JSON:**

- The created social link object.

**Error responses:**

- `400 Bad Request` – invalid `companyId` or missing/invalid `url`.
- `404 Not Found` – company does not exist.

---

### PUT `/social-links/:id`

**Description:**
Update an existing social link.

**Method:** `PUT`

**Path params:**

- `id` – numeric social link ID.

**Body (JSON):**

```jsonc
{
  "url": "https://instagram.com/acme"
}
```

**Response 200 JSON:**

- Updated social link object.

**Error responses:**

- `400 Bad Request` – invalid `id`.
- `404 Not Found` – social link does not exist.

---

### DELETE `/social-links/:id`

**Description:**
Delete a social link.

**Method:** `DELETE`

**Path params:**

- `id` – numeric social link ID.

**Response 204 No Content:**

- Empty body on success.

**Error responses:**

- `400 Bad Request` – invalid `id`.
- `404 Not Found` – social link does not exist.

---

## How Company Pricing Interacts with Quotes

The **Companies & Pricing API** doesn’t compute quotes by itself, but its data is consumed by `ShippingQuoteService` when you call quote endpoints.

Key points:

- `base_price`, `price_per_mile`, `customs_fee`, `service_fee`, `broker_fee` are all required to compute shipping.
- `final_formula` is optional JSON that can override these per company without changing code.
- When quote endpoints run:
  - They pull `Company` objects via `CompanyModel.findAll(...)`.
  - For each company and vehicle, `ShippingQuoteService`:
    - Normalizes all price fields to numbers.
    - Applies `final_formula` overrides if present.
    - Computes `total_price` including vehicle `calc_price` and insurance based on `retail_value`.
    - Optionally converts quote totals to GEL when the `currency` parameter
      is set to `"gel"` on quote endpoints (see `fx-and-currency-api.md`).

This means you can:

- Use the Companies API to:
  - Add new shippers.
  - Tweak their pricing.
  - Override formulas via JSON.
- Without any additional code changes in the quote engine.

---

## Typical Flows

### 1. Onboarding a New Company

1. Call `POST /companies` with base prices and fees.
2. Optionally call `POST /companies/:companyId/social-links` to attach social URLs.
3. Once created, the company will automatically be included in:
   - `POST /vehicles/:vehicleId/calculate-quotes`.
   - `POST /vehicles/search-quotes` (limited by `SEARCH_QUOTES_COMPANY_LIMIT`).
   - `POST /vehicles/compare` (vehicle comparison flows).

---

## Company Reviews API (Summary)

Reviews are user-generated and stored in `company_reviews`. They are not
embedded in the company object; instead, they are exposed via a
paginated endpoint.

### GET `/companies/:companyId/reviews`

**Description:**

Return a paginated list of reviews for a company.

**Query params:**

- `limit` (optional, number) – page size, default 10, max 50.
- `offset` (optional, number) – number of reviews to skip, default 0.

**Response 200 JSON:**

```jsonc
{
  "items": [
    {
      "id": 1,
      "company_id": 10,
      "user_id": 5,
      "rating": 5,
      "comment": "Great experience",
      "created_at": "2025-11-16T00:00:00.000Z",
      "updated_at": "2025-11-16T00:00:00.000Z"
    }
  ],
  "total": 123,
  "limit": 10,
  "offset": 0
}
```

Use the `rating` and `reviewCount` fields on `/companies` and
`/companies/:id` for aggregated information, and this endpoint for
actual review content.

---

## Company Quotes API (Summary)

Quotes for a company (across vehicles) are exposed via a dedicated,
paginated endpoint. They are not embedded into `/companies/:id`.

### GET `/companies/:companyId/quotes`

**Description:**

Fetch a paginated list of quotes for a specific company across all
vehicles.

**Query params:**

- `limit` (optional, number) – page size, default 20, max 100.
- `offset` (optional, number) – number of quotes to skip, default 0.
- `currency` (optional, string) – `"usd"` (default) or `"gel"`. When
  `"gel"`, `total_price` and `breakdown.total_price` are converted
  using the latest FX rate.

**Response 200 JSON:**

```jsonc
{
  "items": [
    {
      "id": 1,
      "company_id": 10,
      "vehicle_id": 123,
      "total_price": 12345.67,
      "breakdown": {
        /* pricing breakdown object */
      },
      "delivery_time_days": 35,
      "created_at": "2025-11-16T00:00:00.000Z"
    }
  ],
  "total": 200,
  "limit": 20,
  "offset": 0
}
```

This endpoint is intended for admin/reporting views or company detail
tabs that need to list many quotes, while keeping the main
`/companies/:id` response small.

### 2. Adjusting Pricing

1. Call `PUT /companies/:id` with updated numbers or a `final_formula` object.
2. New quote calculations will pick up the changes immediately.

### 3. Deactivating a Company

- Currently, the model doesn’t expose an explicit `active` flag; simplest approach:
  - Delete the company with `DELETE /companies/:id` (and its quotes/social links), **or**
  - Add an `active` column and adjust `CompanyModel.findAll` to filter by it (future extension).

---

This document, together with `docs/vehicles-and-quotes-api.md`, gives an AI or developer enough context to:

- Create/update companies and their pricing.
- Understand how pricing inputs flow into quote calculations.
- Integrate frontend or other services against the Companies API.
