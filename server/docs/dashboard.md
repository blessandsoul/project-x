# Dashboard & User Activity API

This document describes shared dashboard-related endpoints used by user/company dashboards and other pages (catalog, company detail).

Currently implemented endpoints:

- `GET /dashboard/summary`
- `GET /user/favorites`
- `POST /user/favorites/:companyId`
- `DELETE /user/favorites/:companyId`
- `GET /user/recent-companies`
- `POST /user/recent-companies`

---

## 1. GET /dashboard/summary

Role-aware top-level KPI metrics for dashboard SectionCards.

- **Method:** `GET`
- **URL:** `/dashboard/summary`
- **Auth:** Required (JWT)

### 1.1 Request

No body or query params. Uses `request.user` from JWT:

- `id` (number)
- `role` (string) – expected values: `"user" | "dealer" | "company" | "admin"`

### 1.2 Response (200 OK)

```jsonc
{
  "role": "company",
  "kpis": [
    {
      "key": "company.leads.total",
      "label": "Total Leads",
      "value": 42,
      "trend": "flat"
    },
    {
      "key": "company.leads.new",
      "label": "New Leads",
      "value": 5,
      "trend": "flat"
    },
    {
      "key": "company.offers.sent",
      "label": "Offers Sent",
      "value": 12,
      "trend": "flat"
    },
    {
      "key": "company.deals.won",
      "label": "Deals Won",
      "value": 3,
      "trend": "flat"
    }
  ]
}
```

Schema:

```yaml
# API Endpoint: GET /dashboard/summary
# Summary: Role-aware top-level KPI metrics for dashboards.

200:
  type: object
  properties:
    role:
      type: string
      enum: ["user", "dealer", "company", "admin"]
    kpis:
      type: array
      items:
        type: object
        properties:
          key:
            type: string
          label:
            type: string
          value:
            type: number
          trend:
            type: string
            enum: ["up", "down", "flat"]
```

### 1.3 Role-specific behavior

The backend derives KPIs based on `request.user.role`.

#### role = "company"

- Looks up `company_id` from `users.company_id`.
- Computes aggregates from `lead_companies` for that `company_id`:
  - `company.leads.total` – count where `status IN ('NEW', 'OFFER_SENT', 'WON', 'LOST')`.
  - `company.leads.new` – count where `status = 'NEW'`.
  - `company.offers.sent` – count where `status = 'OFFER_SENT'`.
  - `company.deals.won` – count where `status = 'WON'`.
- All `trend` values are currently `"flat"` (no historical comparison yet).

#### role in { "user", "dealer", "admin" }

Treats these as end-users for now.

- Uses `leads.user_id = request.user.id` to compute:
  - `user.leads.total` – total leads created by this user.
- Uses `user_favorite_vehicles.user_id` to compute:
  - `user.favorites.vehicles` – count of favorite vehicles.
- Uses `user_favorite_companies.user_id` to compute:
  - `user.favorites.companies` – count of favorite companies.

Example response for a regular user:

```jsonc
{
  "role": "user",
  "kpis": [
    {
      "key": "user.leads.total",
      "label": "Total Leads",
      "value": 2,
      "trend": "flat"
    },
    {
      "key": "user.favorites.vehicles",
      "label": "Favorite Vehicles",
      "value": 5,
      "trend": "flat"
    },
    {
      "key": "user.favorites.companies",
      "label": "Favorite Companies",
      "value": 1,
      "trend": "flat"
    }
  ]
}
```

---

## 2. User favorite companies

These endpoints manage **favorite companies per user**. They are separate from the existing vehicle favorites (`/favorites/vehicles`).

### 2.1 GET /user/favorites

- **Method:** `GET`
- **URL:** `/user/favorites`
- **Auth:** Required (JWT)

Returns a list of favorite company IDs for the authenticated user.

**Response 200:**

```jsonc
{
  "items": [
    {
      "user_id": 1,
      "company_id": 10,
      "created_at": "2025-11-19T13:00:00.000Z"
    }
  ]
}
```

Notes:

- Backed by `user_favorite_companies (user_id, company_id, created_at)`.
- No pagination for now; frontend can handle small lists.

### 2.2 POST /user/favorites/:companyId

- **Method:** `POST`
- **URL:** `/user/favorites/:companyId`
- **Auth:** Required (JWT)
- **Params:**
  - `companyId` – integer > 0
- **Body:** none

**Response 201:**

```json
{ "success": true }
```

Behavior:

- Idempotent: uses `INSERT IGNORE` to avoid duplicates.

### 2.3 DELETE /user/favorites/:companyId

- **Method:** `DELETE`
- **URL:** `/user/favorites/:companyId`
- **Auth:** Required (JWT)

**Response 204:**

- Empty body.

Behavior:

- Removes the `(user_id, company_id)` pair from `user_favorite_companies`.

---

## 3. User recently viewed companies

Server-side history of which companies a user recently viewed.

### 3.1 POST /user/recent-companies

- **Method:** `POST`
- **URL:** `/user/recent-companies`
- **Auth:** Required (JWT)

**Request body:**

```jsonc
{
  "company_id": 10
}
```

- `company_id` (number, required, > 0)

**Response 201:**

```json
{ "success": true }
```

Behavior:

- Inserts a new row into `user_recent_companies (user_id, company_id, viewed_at)`.
- No deduplication logic yet; frontend can control how often this is called.

### 3.2 GET /user/recent-companies

- **Method:** `GET`
- **URL:** `/user/recent-companies`
- **Auth:** Required (JWT)
- **Query params:**
  - `limit` (integer, optional; default 20, max 100 enforced in code)

**Response 200:**

```jsonc
{
  "items": [
    {
      "id": 5,
      "user_id": 1,
      "company_id": 10,
      "viewed_at": "2025-11-19T13:05:00.000Z"
    }
  ]
}
```

Notes:

- Ordered by `viewed_at DESC`.
- Limited to `limit` items.

---

## 4. Frontend wiring notes

- **SectionCards / top KPI cards**

  - Use `GET /dashboard/summary`.
  - Map `kpis` array directly to cards; keys are stable (`company.leads.total`, `user.favorites.companies`, etc.).

- **Favorites row (companies)**

  - Use `GET /user/favorites`.
  - Use returned `company_id` list to fetch full company tiles via `/companies` or `/companies/search`.

- **Recently viewed companies row**
  - Use `POST /user/recent-companies` when a company detail page is opened.
  - Use `GET /user/recent-companies` to show recent history, then fetch company details as needed.
