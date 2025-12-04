# Vehicles & Quotes API

This document describes how vehicle data and quote calculations work in the backend, focusing on:

- `VehicleModel` (DB access for the `vehicles` table)
- Vehicle CRUD/read endpoints
- Quote calculation endpoints that use vehicles
- Search filters (year, price, mileage, fuel, etc.)
- Currency handling for quotes (USD and GEL)

It is intended as reference for implementing or consuming the backend from other services or AI agents.

---

## Currency Support (USD / GEL)

All prices are stored and calculated internally in **USD**.

Quote-related endpoints support an optional **`currency`** parameter so clients can request
responses in either USD or GEL:

- `currency` (optional, case-insensitive):
  - `"usd"` → keep values in USD (default when omitted)
  - `"gel"` → convert values to Georgian Lari using the latest `USD -> GEL` rate
    stored in the `exchange_rates` table.

If an unsupported value is provided (anything other than `usd` / `gel`), the backend
returns a validation error.

Converted fields:

- `total_price` on each quote.
- `breakdown.total_price` when present and numeric.

The FX rate is refreshed once per day using an external API and cached in
`exchange_rates`. See `docs/fx-and-currency-api.md` for details.

---

## Data Model: Vehicle

**Table:** `vehicles`

Key columns used by the current APIs:

- `id` (number) – primary key
- `brand_name` (string) – brand, also exposed as `make`
- `model_name` (string) – model, also exposed as `model`
- `year` (number) – model year
- `yard_name` (string) – auction yard name (used for distance)
- `source` (string) – source (e.g. COPART/IAAI)
- `mileage` (number or null) – odometer reading
- `retail_value` (number or string) – used in insurance calculation
- `calc_price` (number or string) – vehicle price from auction
- `engine_fuel` (string or null) – fuel type in English
- `engine_fuel_rus` (string or null) – fuel type in Russian/alt language
- `vehicle_type` (string or null) – category (e.g. SUV, Sedan)
- `drive` (string or null) – drive wheels info (e.g. FWD, RWD, 4WD)

`VehicleModel` exposes these operations (simplified):

- `findById(id)` – load a single vehicle (fields above + aliases `make`, `model`).
- `findAll(limit, offset)` – list vehicles with basic fields.
- `searchByFilters(filters, limit, offset)` – search vehicles for the search-quotes endpoint.
- `countByFilters(filters)` – count vehicles matching `searchByFilters` filters.
- `getPhotosByVehicleId(vehicleId)` – fetch vehicle photos.
- `deleteById(id)` – delete vehicle.
- `upsertFromAuctionLots(lots)` – batch ingest/update vehicles from auction API.

---

## Vehicle API

### GET `/vehicles`

**Description:**
Return a paginated list of vehicles with basic fields.

**Method:** `GET`

**Query params (current implementation in code is fixed limit/offset or internal; if extended later, they would typically be):**

- `limit` (optional, default 100, max 1000)
- `offset` (optional, default 0)

**Response 200 JSON (array of vehicles):**

Each item includes (based on current `findAll`):

- `id`
- `brand_name`
- `model_name`
- `make` (alias for `brand_name`)
- `model` (alias for `model_name`)
- `year`
- `yard_name`
- `source`
- `retail_value`

This endpoint is intentionally minimal and does **not** include photos. Use `/vehicles/search` or `/vehicles/:id/photos`/`/vehicles/:id/full` when you need images.

**Errors:**

- Standard error wrapper via global error handler (validation errors are unlikely on this endpoint).

---

### GET `/vehicles/search`

**Description:**

Search vehicles by filters suitable for frontend search UI. Supports make/model/year range, price/odometer range, fuel type, transmission, drive, title type, cylinders, sale date, and pagination. Returns a paginated list with vehicle info and a single thumbnail per vehicle.

All query parameters are validated with Zod before processing. Invalid values return a `400 Bad Request` with validation error details.

**Method:** `GET`

**Query params:**

#### Basic Filters

- `make` (optional, string) – partial match on brand name.
- `model` (optional, string) – partial match on model name.
- `source` (optional, string) – exact match on source (e.g. `copart`, `iaai`).
- `category` (optional, string) – partial match on vehicle type.
- `buy_now` (optional, boolean-like: `true` / `false`) – when `true`, only return vehicles with active Buy It Now option.

#### Year Filter

- `year` (optional, number) – exact year match.
- `year_from` (optional, number) – minimum year (inclusive).
- `year_to` (optional, number) – maximum year (inclusive).

#### Price Filter

- `price_from` (optional, number) – minimum price, must be ≥ 0.
- `price_to` (optional, number) – maximum price, must be ≥ 0.

#### Odometer Filter

- `odometer_from` (optional, number) – minimum mileage, must be ≥ 0.
- `odometer_to` (optional, number) – maximum mileage, must be ≤ 250,000.
- `mileage_from`, `mileage_to` (optional) – legacy aliases, same behavior as odometer params.

> **Note:** Maps to DB column `mileage`.

#### Title Type Filter

- `title_type` (optional, string) – comma-separated list of title types.
- **Allowed values:** `clean title`, `nonrepairable`, `salvage title`
- Example: `title_type=clean title,salvage title`

> **Note:** Uses partial matching (LIKE) on DB column `document`. For example, `clean title` will match "CLEAN TITLE - GA", "Clean Title - TX", etc.

#### Transmission Filter

- `transmission` (optional, string) – comma-separated list.
- **Allowed values:** `auto`, `manual`
- Example: `transmission=auto,manual`

#### Fuel Filter

- `fuel` (optional, string) – comma-separated list of fuel types.
- **Allowed values:** `petrol`, `diesel`, `electric`, `flexible`, `hybrid`
- Example: `fuel=petrol,diesel,hybrid`
- `fuel_type` (optional) – legacy single-value filter (partial match).

> **Note:** Filters on DB columns `engine_fuel` and `engine_fuel_rus`.

#### Drive Filter

- `drive` (optional, string) – comma-separated list of drive types.
- **Allowed values:** `front`, `rear`, `full`
- Example: `drive=front,full`

> **Special rule:** When `full` is selected, it matches DB values containing `full`, `full/front`, or `full/rear`.

#### Cylinders Filter

- `cylinders` (optional, string) – comma-separated list.
- **Allowed values:** `0`, `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `U`
- Example: `cylinders=4,6,8`

> **Note:** Values are kept as strings (not numbers). `U` = Unknown.

#### Sale Date Filter

- `sold_from` (optional, string) – minimum sale date.
- `sold_to` (optional, string) – maximum sale date.
- **Accepted formats:** `YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss`
- Example: `sold_from=2024-01-01&sold_to=2024-12-31`

> **Note:** Combines DB columns `sold_at_date` and `sold_at_time` for filtering.

#### Pagination & Sorting

- `page` (optional, number, default: 1) – page number, must be ≥ 1.
- `limit` (optional, number, default: 20, max: 250) – items per page.
- `sort` (optional, string) – sorting order:

| Value            | Description                | Use Case                          |
| ---------------- | -------------------------- | --------------------------------- |
| `price_asc`      | Price low → high           | Find cheapest vehicles            |
| `price_desc`     | Price high → low           | Browse premium vehicles           |
| `year_desc`      | Year newest → oldest       | Find newest models                |
| `year_asc`       | Year oldest → newest       | Find classic/older vehicles       |
| `mileage_asc`    | Mileage low → high         | Find low-mileage vehicles         |
| `mileage_desc`   | Mileage high → low         | Find high-mileage deals           |
| `sold_date_desc` | Recently sold first        | See latest auction results        |
| `sold_date_asc`  | Oldest sold first          | Historical analysis               |
| `best_value`     | Best price + mileage combo | **Recommended** – Find best deals |
| _(default)_      | Most recently added        | New listings first                |

> **Tip:** Use `best_value` to find vehicles with the best combination of low price and low mileage. This is ideal for users looking for the best deals.

#### Free-Text Search

- `search` (optional, string) – combined free-text search over make/model/year or VIN/lot ID.

  The backend parses the `search` string into `make`, `model`, and `year` **only if those fields are not already passed explicitly**:

  - Extracts a year in the range `1950–2099` from the string (if present).
  - Uses the first remaining word as `make`.
  - Uses the remaining words joined with spaces as `model`.
  - If the string looks like a VIN (alphanumeric, ≥11 chars), searches by VIN.
  - If the string is purely numeric, searches by lot ID.

  Examples:

  - `GET /vehicles/search?search=Toyota` → `make="Toyota"`.
  - `GET /vehicles/search?search=Toyota Corolla 2018` → `make="Toyota"`, `model="Corolla"`, `year=2018`.
  - `GET /vehicles/search?search=1HGBH41JXMN109186` → searches by VIN.

**Response 200 JSON:**

```jsonc
{
  "items": [
    {
      "id": 123,
      "vin": "1HGBH41JXMN109186",
      "source_lot_id": "12345678",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2018,
      "mileage": 85000,
      "yard_name": "Dallas, TX",
      "source": "copart",
      "retail_value": 20000,
      "calc_price": 7300,
      "buy_it_now_price": 7600,
      "buy_it_now": 1,
      "engine_fuel": "petrol",
      "engine_volume": 2.0,
      "category": "Sedan",
      "drive": "front",
      "document": "clean title",
      "transmission": "auto",
      "cylinders": "4",
      "sold_at_date": "2024-06-15",
      "sold_at_time": "14:30:00",
      "sold_at": "2024-06-15 14:30:00",
      "primary_photo_url": "https://.../full.jpg",
      "primary_thumb_url": "https://.../thumb_min.jpg"
    }
  ],
  "total": 1234,
  "limit": 20,
  "page": 1,
  "totalPages": 62
}
```

**Response Fields:**

| Field               | Type   | Description                     |
| ------------------- | ------ | ------------------------------- |
| `id`                | number | Vehicle ID                      |
| `vin`               | string | Vehicle Identification Number   |
| `source_lot_id`     | string | Lot ID from auction source      |
| `make`              | string | Brand name                      |
| `model`             | string | Model name                      |
| `year`              | number | Model year                      |
| `mileage`           | number | Odometer reading                |
| `yard_name`         | string | Auction yard location           |
| `source`            | string | Auction source (copart/iaai)    |
| `retail_value`      | number | Estimated retail value          |
| `calc_price`        | number | Current auction price           |
| `buy_it_now_price`  | number | Buy It Now price (if available) |
| `buy_it_now`        | number | Buy It Now flag (1 = active)    |
| `engine_fuel`       | string | Fuel type                       |
| `engine_volume`     | number | Engine displacement             |
| `category`          | string | Vehicle category/type           |
| `drive`             | string | Drive type (front/rear/full)    |
| `document`          | string | Title/document type             |
| `transmission`      | string | Transmission type               |
| `cylinders`         | string | Number of cylinders             |
| `sold_at_date`      | string | Sale date (YYYY-MM-DD)          |
| `sold_at_time`      | string | Sale time (HH:mm:ss)            |
| `sold_at`           | string | Combined sale datetime          |
| `primary_photo_url` | string | Full-size photo URL             |
| `primary_thumb_url` | string | Thumbnail URL                   |

> **UI hint:** Use `primary_thumb_url` for catalog/list thumbnails, and `primary_photo_url` when you need a larger image preview.

**Example Requests:**

```bash
# Basic search by make and year range
GET /vehicles/search?make=bmw&year_from=2018&year_to=2022

# Filter by odometer and title type
GET /vehicles/search?odometer_from=10000&odometer_to=80000&title_type=clean title

# Multi-value filters
GET /vehicles/search?transmission=auto,manual&fuel=petrol,diesel&drive=front,full

# Filter by cylinders and sort by price
GET /vehicles/search?cylinders=4,6,8&sort=price_asc

# Filter by sale date range
GET /vehicles/search?sold_from=2024-01-01&sold_to=2024-06-30

# Combined filters with pagination
GET /vehicles/search?make=toyota&fuel=hybrid&page=2&limit=50
```

**Error Responses:**

- `400 Bad Request` – Invalid query parameters (Zod validation failed).

---

### GET `/vehicles/:id`

**Description:**
Return a single vehicle by ID with core fields needed for quotes.

**Method:** `GET`

**Path params:**

- `id` – numeric vehicle ID.

**Response 200 JSON:**

- `id`
- `brand_name`
- `model_name`
- `make`
- `model`
- `year`
- `yard_name`
- `source`
- `retail_value`
- `calc_price`

**Error responses:**

- `404 Not Found` if the vehicle does not exist.
- `400 Bad Request` if `id` is not a valid number (handled as `ValidationError`).

---

### GET `/vehicles/:id/similar`

**Description:**

Return a list of vehicles **similar** to the given base vehicle ID. Intended for
"You may also like" / related vehicles blocks in the UI.

Similarity is currently based on:

- same `brand_name` / `model_name` (aliases `make` / `model`)

The backend also _orders_ results so that vehicles with closer `calc_price`
to the base vehicle appear first when price data is available, but price is
not a hard filter.

These rules are implemented in `VehicleModel.findSimilarById` and can be tuned
later without changing the public API.

**Method:** `GET`

**Path params:**

- `id` – numeric vehicle ID to find similar vehicles for.

**Query params (all optional):**

- `limit` (number, default `10`)
  - Maximum number of similar vehicles to return.
- `offset` (number, default `0`)
  - Number of records to skip for pagination.
- `year_range` (number, default `2`)
  - Year window around the base vehicle year.
  - Example: if base year = `2015` and `year_range=2`, then similar vehicles
    must have `year` between `2013` and `2017`.
- `price_radius` (number, default `0.2` → 20%)
  - Relative price band around the base vehicle's `calc_price`.
  - Example: if base `calc_price = 3000` and `price_radius=0.2`, similar
    vehicles must have `calc_price` between `2400` and `3600`.
  - If `calc_price` is missing, the backend falls back to `retail_value` when
    available, otherwise the price filter is skipped.

**Response 200 JSON:**

```jsonc
{
  "vehicleId": 57388039193975,
  "items": [
    {
      "id": 67890123456789,
      "brand_name": "Ford",
      "model_name": "Escape",
      "make": "Ford",
      "model": "Escape",
      "year": 2015,
      "mileage": 120000,
      "yard_name": "Appleton (WI)",
      "source": "iaai",
      "retail_value": 8827.0,
      "calc_price": 2913.0,
      "buy_it_now_price": 0,
      "buy_it_now": 0,
      "fuel_type": "petrol",
      "category": "v",
      "drive": "full",
      "primary_photo_url": "https://.../full.jpg",
      "primary_thumb_url": "https://.../thumb_min.jpg"
    }
  ],
  "offset": 0,
  "limit": 10,
  "total": 42,
  "yearRange": 2,
  "priceRadius": 0.2
}
```

Notes:

- If **no similar vehicles** match the filters, `items` will be an empty
  array and the request still returns `200 OK`.
- If the base vehicle ID does not exist, the backend returns `404 Not Found`.

**Error responses:**

- `404 Not Found` if the base vehicle does not exist.
- `400 Bad Request` if `id` is not a valid number (handled as `ValidationError`).

---

### DELETE `/vehicles/:id`

**Description:**
Delete a vehicle from the database.

**Method:** `DELETE`

**Path params:**

- `id` – numeric vehicle ID.

**Response 204 No Content:**

- Empty body on success.

**Error responses:**

- `404 Not Found` if the vehicle does not exist.
- `400 Bad Request` for invalid `id`.

---

## Vehicle Favorites API

Endpoints for managing user's favorite vehicles. Routes defined in: `src/routes/favorites.ts`

### GET `/favorites/vehicles`

**Description:**

List the authenticated user's favorite vehicles with pagination.

**Method:** `GET`

**Authentication:** Required (JWT)

**Query params:**

- `page` (optional, number) – page number, default 1.
- `limit` (optional, number) – items per page, default 20.

**Response 200 JSON:**

```jsonc
{
  "items": [
    {
      "id": 123,
      "brand_name": "Toyota",
      "model_name": "Corolla",
      "year": 2018,
      "calc_price": 7300,
      "primary_photo_url": "https://.../full.jpg"
    }
  ],
  "total": 15,
  "limit": 20,
  "page": 1,
  "totalPages": 1
}
```

**Error responses:**

- `401 Unauthorized` – missing/invalid token.

---

### POST `/favorites/vehicles/:vehicleId`

**Description:**

Add a vehicle to the user's favorites.

**Method:** `POST`

**Authentication:** Required (JWT)

**Path params:**

- `vehicleId` – numeric vehicle ID

**Response 201**

```jsonc
{
  "success": true
}
```

**Error responses:**

- `400 Bad Request` – invalid vehicle ID.
- `401 Unauthorized` – missing/invalid token.

---

### DELETE `/favorites/vehicles/:vehicleId`

**Description:**

Remove a vehicle from the user's favorites.

**Method:** `DELETE`

**Authentication:** Required (JWT)

**Path params:**

- `vehicleId` – numeric vehicle ID

**Response 204** – No content on success.

**Error responses:**

- `400 Bad Request` – invalid vehicle ID.
- `401 Unauthorized` – missing/invalid token.

---

### GET `/vehicles/:id/photos`

**Description:**
Return all photos for a vehicle.

**Method:** `GET`

**Path params:**

- `id` – numeric vehicle ID.

**Response 200 JSON (array):**

Each item (from `vehicle_photos`):

- `id`
- `vehicle_id`
- `url`
- `thumb_url`
- `thumb_url_min`
- `thumb_url_middle`

**Error responses:**

- `404 Not Found` if the vehicle does not exist (depending on controller guard) or just an empty array if photos are missing.

---

### GET `/vehicles/:id/full`

**Description:**
Return a combined object with vehicle core data + photos.

**Method:** `GET`

**Path params:**

- `id` – numeric vehicle ID.

**Response 200 JSON:**

```jsonc
{
  "vehicle": {
    /* same shape as GET /vehicles/:id */
  },
  "photos": [
    /* same shape as GET /vehicles/:id/photos */
  ]
}
```

**Error responses:**

- `404 Not Found` if the vehicle does not exist.

---

## Quote Calculation API (Per Vehicle)

### POST `/vehicles/:vehicleId/calculate-quotes`

**Description:**
Calculate quotes for **all companies** for a single vehicle and **persist** them into `company_quotes`. Returns the created quotes plus distance.

**Method:** `POST`

**Path params:**

- `vehicleId` – numeric vehicle ID.

**Query params (optional):**

- `currency` – `"usd"` (default) or `"gel"`. Controls the currency of returned
  `total_price` values and `breakdown.total_price`.

**Request body:**

- Currently no body fields are required; path param is enough.

#### Validation rules

| Field       | Location | Required | Type   | Constraints                                 |
| ----------- | -------- | -------- | ------ | ------------------------------------------- |
| `vehicleId` | path     | yes      | number | Integer, `>= 1`                             |
| `currency`  | query    | no       | string | 3-letter code; backend supports `usd`/`gel` |

**Processing steps:**

1. Load vehicle via `VehicleModel.findById(vehicleId)`.
2. Load companies via `CompanyModel.findAll` (up to 1000).
3. Compute distance from `vehicle.yard_name` to Poti, Georgia using `ShippingQuoteService` (yards table + cache + Geoapify fallback).
4. For each company, compute quote using:
   - `base_price`, `price_per_mile`, `customs_fee`, `service_fee`, `broker_fee`.
   - `distance_miles`.
   - Vehicle `retail_value` (insurance) and `calc_price` (vehicle cost).
5. Insert one row into `company_quotes` per company.

**Response 201 JSON:**

```jsonc
{
  "vehicle_id": 123,
  "make": "Toyota",
  "model": "Corolla",
  "year": 2018,
  "mileage": 85000,
  "yard_name": "Dallas, TX",
  "source": "copart",
  "distance_miles": 7800,
  "quotes": [
    {
      "company_id": 42,
      "company_name": "ACME Shipping",
      "total_price": 12345.67, // vehicle + shipping + insurance, in requested currency
      "delivery_time_days": 35, // optional per-company override
      "breakdown": {
        "base_price": 500,
        "distance_miles": 7800,
        "price_per_mile": 0.5,
        "mileage_cost": 3900,
        "customs_fee": 300,
        "service_fee": 200,
        "broker_fee": 150,
        "retail_value": 20000,
        "insurance_rate": 0.01,
        "insurance_fee": 200,
        "shipping_total": 5050,
        "calc_price": 7300,
        "total_price": 12350,
        "formula_source": "default" // or "final_formula"
      }
    }
  ]
}
```

**Error responses:**

- `404 Not Found` — vehicle not found.
- `400 Bad Request` — invalid `vehicleId` path parameter.
- `422 Unprocessable Entity` (via `ValidationError`) — no companies configured or unable to compute distance.

---

### GET `/vehicles/:vehicleId/quotes`

**Description:**
Return quotes for a single vehicle.

**Method:** `GET`

**Path params:**

- `vehicleId` – numeric vehicle ID.

**Query params (optional):**

- `currency` – `"usd"` (default) or `"gel"`. Controls the currency of returned
  `total_price` values and `breakdown.total_price`.

#### Validation rules

| Field       | Location | Required | Type   | Constraints                                 |
| ----------- | -------- | -------- | ------ | ------------------------------------------- |
| `vehicleId` | path     | yes      | number | Integer, `>= 1`                             |
| `currency`  | query    | no       | string | 3-letter code; backend supports `usd`/`gel` |

**Response 200 JSON:**

```jsonc
{
  "vehicle_id": 123,
  "make": "Toyota",
  "model": "Corolla",
  "year": 2018,
  "mileage": 85000,
  "yard_name": "Dallas, TX",
  "source": "copart",
  "distance_miles": 7800,
  "quotes": [
    {
      "company_name": "ACME Shipping",
      "total_price": 12345.67, // vehicle + shipping + insurance, in requested currency
      "delivery_time_days": 35, // optional per-company override
      "breakdown": {
        "base_price": 500,
        "distance_miles": 7800,
        "price_per_mile": 0.5,
        "mileage_cost": 3900,
        "customs_fee": 300,
        "service_fee": 200,
        "broker_fee": 150,
        "retail_value": 20000,
        "insurance_rate": 0.01,
        "insurance_fee": 200,
        "shipping_total": 5050,
        "calc_price": 7300,
        "total_price": 12350,
        "formula_source": "default" // or "final_formula"
      }
    }
  ]
}
```

**Error responses:**

- `404 Not Found` — vehicle not found.
- `400 Bad Request` — invalid `vehicleId` path parameter.

---

## Search Quotes API (Vehicles + Quotes, Not Persisted)

### POST `/vehicles/search-quotes`

**Description:**
Search vehicles by multiple filters, compute quotes for each vehicle for a limited number of companies, and return everything **without** writing to `company_quotes`.

Used for search/list screens.

**Method:** `POST`

**Request body fields (all optional):**

Vehicle filters:

- `make` (string) – partial match on `brand_name`.
  - Validation: 2–100 characters.
- `model` (string) – partial match on `model_name`.
  - Validation: 2–100 characters.
- `year` (number) – exact match on `year`.
- `year_from` (number) – `year >= year_from`.
- `year_to` (number) – `year <= year_to`.
  - Validation: year-related fields are expected to be reasonable model years (roughly 1950–2100).
- `mileage_from` (number) – `mileage >= mileage_from`.
- `mileage_to` (number) – `mileage <= mileage_to`.
  - Validation: mileage bounds must be non-negative numbers.
- `fuel_type` (string) – partial match on `(engine_fuel OR engine_fuel_rus)`.
  - Validation: 1–50 characters.
- `category` (string) – partial match on `vehicle_type`.
  - Validation: 1–50 characters.
- `drive` (string) – partial match on `drive` (e.g. `"4WD"`).
  - Validation: 1–50 characters.

Quote-level filters:

- `price_from` (number) – minimum **total quote price** (vehicle + shipping). Must be >= 0.
- `price_to` (number) – maximum **total quote price**. Must be >= 0.

Pagination:

- `limit` (number, default 20, max 50) – vehicles per page.
  - Validation: integer >= 1 and <= 50.
- `offset` (number, default 0) – number of vehicles to skip.
  - Validation: integer >= 0.

Currency:

- `currency` (string, optional) – `"usd"` (default) or `"gel"`. When set to `"gel"`,
  all quote `total_price` values and `breakdown.total_price` are converted using the
  latest stored USD->GEL exchange rate.

#### Validation rules

| Field          | Required | Type   | Constraints                              |
| -------------- | -------- | ------ | ---------------------------------------- |
| `make`         | no       | string | 2–100 characters                         |
| `model`        | no       | string | 2–100 characters                         |
| `year`         | no       | number | Reasonable model year (≈1950–2100)       |
| `year_from`    | no       | number | `>= 1950`, `<= 2100`                     |
| `year_to`      | no       | number | `>= 1950`, `<= 2100`                     |
| `mileage_from` | no       | number | `>= 0`                                   |
| `mileage_to`   | no       | number | `>= 0`                                   |
| `fuel_type`    | no       | string | 1–50 characters                          |
| `category`     | no       | string | 1–50 characters                          |
| `drive`        | no       | string | 1–50 characters                          |
| `price_from`   | no       | number | `>= 0`                                   |
| `price_to`     | no       | number | `>= 0`                                   |
| `limit`        | no       | number | Integer, `1 <= limit <= 50` (default 20) |
| `offset`       | no       | number | Integer, `offset >= 0` (default 0)       |
| `currency`     | no       | string | `"usd"` (default) or `"gel"`             |

> **Important:** At least one search filter field (`make`, `model`, `year`, `year_from`, `year_to`, `price_from`, `price_to`, `mileage_from`, `mileage_to`, `fuel_type`, `category`, or `drive`) **must** be provided. An entirely empty request body (only pagination/currency or nothing at all) is rejected with `400 Bad Request`.

**Filter behavior:**

- All provided filters are combined with `AND`.
- Vehicle filters are applied in SQL via `VehicleModel.searchByFilters` / `countByFilters`.
- `price_from` / `price_to` are applied **in memory** on each computed quote’s `total_price`.
  - Vehicles with **no quotes** inside the requested price range are skipped.

**Companies limit:**

- The number of companies considered per search is limited by `SEARCH_QUOTES_COMPANY_LIMIT` env var.
- Default: 10.
- Hard max: 1000.

**Response 200 JSON:**

```jsonc
{
  "items": [
    {
      "vehicle_id": 123,
      "make": "Toyota",
      "model": "Corolla",
      "year": 2018,
      "mileage": 85000,
      "yard_name": "Dallas, TX",
      "source": "copart",
      "distance_miles": 7800,
      "quotes": [
        {
          "company_id": 42,
          "company_name": "ACME Shipping",
          "total_price": 12345.67,
          "delivery_time_days": 35,
          "breakdown": {
            /* same format as above */
          }
        }
      ]
    }
  ],
  "total": 1234, // total number of vehicles matching DB filters
  "limit": 20, // effective limit
  "offset": 0, // effective offset
  "page": 1, // derived from offset/limit
  "totalPages": 62 // ceil(total / limit)
}
```

**Error responses:**

- `422 Unprocessable Entity` (ValidationError) — when:
  - No vehicles found for the given filters.
  - No companies configured for quote calculation.
  - Distance cannot be determined for the yard.
- `400 Bad Request` — if the request body contains invalid types (e.g., non-numeric `limit`) **or** when no search filters are provided (empty body).

---

## Compare Vehicles API

### POST `/vehicles/compare`

**Description:**

Compare quotes for a fixed list of vehicles. The client provides a small
array of vehicle IDs (e.g. from favorites or a search result), and the
backend computes quotes for each and returns a comparison-friendly
structure in a single response.

**Method:** `POST`

**Request body:**

```jsonc
{
  "vehicle_ids": [123, 456, 789], // required, 1–5 numeric IDs
  "quotes_per_vehicle": 3, // optional, small positive integer, default 3
  "currency": "gel" // optional, "usd" (default) or "gel"
}
```

Constraints:

- `vehicle_ids` must be a non-empty array of positive numeric IDs.
- Duplicate IDs are ignored; each vehicle appears at most once in the
  response.
- After de-duplication, at most **5** vehicles may be compared in a
  single call. Sending more than 5 results in a validation error.
- `quotes_per_vehicle` is treated as a small positive integer (>= 1). Very large values are not allowed by the backend and may be capped/validated.

#### Validation rules

| Field                | Required | Type     | Constraints                                          |
| -------------------- | -------- | -------- | ---------------------------------------------------- |
| `vehicle_ids`        | yes      | number[] | Non-empty array of positive numeric IDs (1–5 unique) |
| `quotes_per_vehicle` | no       | number   | Integer, `>= 1`, small (backend caps large values)   |
| `currency`           | no       | string   | `"usd"` (default) or `"gel"`                         |

**Processing steps:**

1. Validate `vehicle_ids` array (non-empty, max 5 after de-duplication).
2. For each unique `vehicle_id`:
   - Load the vehicle via `VehicleModel.findById`.
   - Compute quotes for the vehicle using `ShippingQuoteService` and the
     configured set of companies (limited by `SEARCH_QUOTES_COMPANY_LIMIT`).
   - Sort quotes by `total_price` ascending.
   - Convert totals to the requested `currency` (`usd` or `gel`).
   - Keep only the best `quotes_per_vehicle` quotes per vehicle.

**Response 200 JSON:**

```jsonc
{
  "currency": "GEL",
  "vehicles": [
    {
      "vehicle_id": 123,
      "make": "Toyota",
      "model": "Camry",
      "year": 2018,
      "mileage": 95000,
      "yard_name": "Dallas, TX",
      "source": "copart",
      "distance_miles": 7800,
      "quotes": [
        {
          "company_id": 42,
          "company_name": "ACME Shipping",
          "total_price": 13000,
          "delivery_time_days": 35,
          "breakdown": {
            /* same structure as other quote breakdowns, in requested currency */
          }
        },
        {
          "company_name": "FastLine",
          "total_price": 13200,
          "delivery_time_days": 30,
          "breakdown": {
            /* ... */
          }
        }
      ]
    }
  ]
}
```

**Error responses:**

- `400 Bad Request` (`VALIDATION_ERROR`) when:
  - `vehicle_ids` is missing or empty.
  - Any `vehicle_id` is not a valid positive number.
  - More than 5 unique `vehicle_ids` are provided.
- `404 Not Found` (`NOT_FOUND_ERROR`) if any referenced vehicle does not
  exist.
- `422 Unprocessable Entity` (`ValidationError`) if no companies are
  configured for quote calculation.

---

## Summary of Filters vs Columns

| Request field   | Internal filter key | Column(s) used                                       |
| --------------- | ------------------- | ---------------------------------------------------- |
| `make`          | `make`              | `vehicles.brand_name`                                |
| `model`         | `model`             | `vehicles.model_name`                                |
| `year`          | `year`              | `vehicles.year`                                      |
| `year_from`     | `yearFrom`          | `vehicles.year >=`                                   |
| `year_to`       | `yearTo`            | `vehicles.year <=`                                   |
| `odometer_from` | `mileageFrom`       | `vehicles.mileage >=`                                |
| `odometer_to`   | `mileageTo`         | `vehicles.mileage <=`                                |
| `mileage_from`  | `mileageFrom`       | `vehicles.mileage >=` (legacy alias)                 |
| `mileage_to`    | `mileageTo`         | `vehicles.mileage <=` (legacy alias)                 |
| `title_type`    | `titleTypes`        | `vehicles.document` (IN clause, multi-value)         |
| `transmission`  | `transmissionTypes` | `vehicles.transmission` (IN clause, multi-value)     |
| `fuel`          | `fuelTypes`         | `vehicles.engine_fuel` OR `engine_fuel_rus` (multi)  |
| `fuel_type`     | `fuelType`          | `vehicles.engine_fuel` OR `engine_fuel_rus` (legacy) |
| `drive`         | `driveTypes`        | `vehicles.drive` (multi-value, special `full` logic) |
| `cylinders`     | `cylinderTypes`     | `vehicles.cylinders` (IN clause, multi-value)        |
| `sold_from`     | `soldFrom`          | `vehicles.sold_at_date` + `sold_at_time >=`          |
| `sold_to`       | `soldTo`            | `vehicles.sold_at_date` + `sold_at_time <=`          |
| `category`      | `category`          | `vehicles.vehicle_type`                              |
| `price_from`    | `priceFrom`         | `vehicles.calc_price >=`                             |
| `price_to`      | `priceTo`           | `vehicles.calc_price <=`                             |

---

## Suggested Additional API Docs

To give another developer (or AI) a complete view of the backend, it would be useful to create similar `.md` docs for these areas:

1. **Companies & Pricing API**

   - File idea: `docs/companies-api.md`
   - Would cover:
     - `POST /companies`, `PUT /companies/:id`, `GET /companies`, `GET /companies/:id`, `DELETE /companies/:id`.
     - Pricing fields (`base_price`, `price_per_mile`, `customs_fee`, `service_fee`, `broker_fee`, `final_formula`).
     - How `final_formula` overrides default pricing.

2. **Company Quotes API**

   - File idea: `docs/company-quotes-api.md`
   - Would cover:
     - `GET /vehicles/:vehicleId/quotes`
     - `GET /companies/:companyId/quotes`
     - Admin `POST /quotes`, `PUT /quotes/:id`, `DELETE /quotes/:id`.
     - Structure of `company_quotes` table and `breakdown` JSON.

3. **Auction Ingestion API**

   - File idea: `docs/auction-api.md`
   - Would cover:
     - `AuctionApiService` operations.
     - `auctionRoutes` endpoints (if exposed) for triggering ingest.
     - How `upsertFromAuctionLots` maps auction payloads into `vehicles`, `brands`, `models`, `vehicle_photos`, `vehicle_lot_bids`.

4. **Geo & Distance / ShippingQuoteService**
   - File idea: `docs/shipping-quotes-engine.md`
   - Would cover:
     - Distance computation flow (yards table → in-memory cache → Redis (optional) → Geoapify fallback).
     - Quote formula (base price + mileage cost + customs + service + broker + insurance + vehicle cost).
     - How `final_formula` JSON can override fee components.

If you tell me which of these you want next (e.g. "companies-api" + "company-quotes-api"), I can generate the corresponding `.md` files in the same style as this document.
