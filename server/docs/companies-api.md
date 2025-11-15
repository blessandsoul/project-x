# Companies & Pricing API

This document describes the API surface and data model for shipping companies and their pricing configuration. It is intended for backend implementers and AI agents integrating with the existing Node/Fastify backend.

Main components:

- `CompanyModel` – DB layer for `companies`, `company_social_links`, and `company_quotes`.
- `CompanyController` – business logic for companies, social links, and quotes.
- `companyRoutes` – HTTP routes exposing the API.

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

- All company fields from above.
- `social_links`: array of social link objects `{ id, company_id, url, created_at, updated_at }`.
- `quotes`: array of `CompanyQuote` objects (see Quotes API doc if needed).

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
