# Admin API

This document describes admin-focused endpoints intended primarily for internal tools or admin panels. All endpoints in this document **require authentication** via `Authorization: Bearer <token>` **and** the authenticated user must have `role = 'admin'`. These routes should be protected on the frontend so they are not exposed in normal user-facing flows.

> Role model: The `users.role` column is an enum of `['user', 'dealer', 'company', 'admin']`. Currently, only `user` and `admin` are used for access control. Admin endpoints described here are restricted to `role = 'admin'`; all other roles are treated as non-admin.

---

## Admin Quotes API

Admin quotes endpoints allow manual creation, update, and deletion of `company_quotes` records. These are not used in normal user flows, where quotes are generated automatically.

### POST `/quotes`

**Description:**

Create a quote manually. The client provides both `company_id` and `vehicle_id` (typically via dropdowns in an admin UI). This should **not** be used in regular user flows.

**Method:** `POST`

**Authentication & authorization:**

- Requires `Authorization: Bearer <token>`
- Requires authenticated user to have `role = 'admin'`

**Request body (JSON):**

```jsonc
{
  "company_id": 10, // required, numeric company ID
  "vehicle_id": 123 // required, numeric vehicle ID
}
```

The backend will look up the company and vehicle, derive distance from the vehicle's yard/location, and compute all monetary fields (base price, per-mile cost, fees, and total price) using the same pricing rules as automatic quote calculation. Admins do **not** input `total_price` or `price_per_mile` here.

#### Validation rules

| Field        | Required | Type    | Constraints |
| ------------ | -------- | ------- | ----------- |
| `company_id` | yes      | integer | `>= 1`      |
| `vehicle_id` | yes      | integer | `>= 1`      |

**Response 201 JSON:**

- The created quote record, matching the `CompanyQuote` shape (includes generated `id`).

**Error responses:**

- `400 Bad Request` – validation failure (missing required fields, wrong types).
- `401 Unauthorized` – missing/invalid token.
- `404 Not Found` – referenced company or vehicle does not exist.

---

### PUT `/quotes/:id`

**Description:**

Update an existing quote. Intended for admin corrections. Normal user flows should not directly manipulate quote records.

**Method:** `PUT`

**Authentication:**

- Requires `Authorization: Bearer <token>`

**Path params:**

- `id` – numeric quote ID.

**Request body (JSON):**

All fields are optional. Only provided fields are updated.

```jsonc
{
  "total_price": 12000, // optional, number
  "breakdown": {
    // optional, JSON object or null
    "base_price": 600,
    "service_fee": 250
  },
  "delivery_time_days": 30 // optional, integer >= 0 or null
}
```

#### Validation rules

| Field                | Required | Type            | Constraints          |
| -------------------- | -------- | --------------- | -------------------- |
| `id` (path)          | yes      | integer         | `>= 1`               |
| `total_price`        | no       | number          | any finite number    |
| `breakdown`          | no       | object \| null  | Optional JSON object |
| `delivery_time_days` | no       | integer \| null | `>= 0` when provided |

**Response 200 JSON:**

- The updated quote object.

**Error responses:**

- `400 Bad Request` – invalid `id` or body types.
- `401 Unauthorized` – missing/invalid token.
- `404 Not Found` – quote with the given `id` does not exist.

---

### DELETE `/quotes/:id`

**Description:**

Delete a quote. Admin-focused operation; should not be exposed in general user interfaces.

**Method:** `DELETE`

**Authentication:**

- Requires `Authorization: Bearer <token>`

**Path params:**

- `id` – numeric quote ID.

#### Validation rules

| Field | Location | Required | Type    | Constraints |
| ----- | -------- | -------- | ------- | ----------- |
| `id`  | path     | yes      | integer | `>= 1`      |

**Response 204 No Content:**

- Empty body on success.

**Error responses:**

- `400 Bad Request` – invalid `id`.
- `401 Unauthorized` – missing/invalid token.
- `404 Not Found` – quote with the given `id` does not exist.

---

## Admin Users API

These endpoints are intended for admin panels and internal tools to manage user accounts.

### GET `/admin/users`

**Description:**

Retrieve a paginated list of users for admin, with optional search/filter parameters suitable for an admin panel user list.

**Method:** `GET`

**Authentication & authorization:**

- Requires `Authorization: Bearer <token>`
- Requires authenticated user to have `role = 'admin'`

**Query params (optional):**

- `limit` – page size.
- `offset` – number of users to skip.
- `email` – partial email match (LIKE search).
- `username` – partial username match (LIKE search).
- `role` – filter by role (`user`, `dealer`, `company`, `admin`).
- `is_blocked` – filter by blocked status (`true` or `false`).
- `company_id` – filter by linked company ID.

#### Validation rules

| Field        | Location | Required | Type    | Constraints                                     |
| ------------ | -------- | -------- | ------- | ----------------------------------------------- |
| `limit`      | query    | no       | integer | `1 <= limit <= 100` (default 10)                |
| `offset`     | query    | no       | integer | `offset >= 0` (default 0)                       |
| `email`      | query    | no       | string  | any non-empty string (used in `LIKE '%value%'`) |
| `username`   | query    | no       | string  | any non-empty string (used in `LIKE '%value%'`) |
| `role`       | query    | no       | string  | `user` \| `dealer` \| `company` \| `admin`      |
| `is_blocked` | query    | no       | boolean | `true` or `false`                               |
| `company_id` | query    | no       | integer | `>= 1`                                          |

**Response 200 JSON:**

- Object wrapping a paginated list of users with metadata:

```jsonc
{
  "items": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "user1",
      "role": "user",
      "dealer_slug": null,
      "company_id": null,
      "onboarding_ends_at": null,
      "is_blocked": false,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
    // ...more users
  ],
  "meta": {
    "limit": 20, // page size used in the query
    "offset": 0, // offset used in the query
    "count": 20, // number of users in this page (items.length)
    "total": 134 // total users matching filters (for all pages)
  }
}
```

**Error responses:**

- `401 Unauthorized` – missing/invalid token.
- `403 Forbidden` – authenticated but not `role = 'admin'`.

---

### GET `/admin/users/:id`

**Description:**

Admin: Get full information about a specific user by ID.

**Method:** `GET`

**Authentication & authorization:**

- Requires `Authorization: Bearer <token>`
- Requires authenticated user to have `role = 'admin'`

**Path params:**

- `id` – numeric user ID.

#### Validation rules

| Field | Location | Required | Type    | Constraints |
| ----- | -------- | -------- | ------- | ----------- |
| `id`  | path     | yes      | integer | `>= 1`      |

**Response 200 JSON:**

- Single user object (same fields as in the list endpoint).

**Error responses:**

- `400 Bad Request` – invalid `id`.
- `401 Unauthorized` – missing/invalid token.
- `403 Forbidden` – authenticated but not `role = 'admin'`.
- `404 Not Found` – user not found.

---

### PATCH `/admin/users/:id`

**Description:**

Admin: Update selected fields on a user: role, dealer/company links, onboarding end date, and blocked state. This endpoint is also the **only** way to block or unblock a user by toggling the `is_blocked` field.

**Method:** `PATCH`

**Authentication & authorization:**

- Requires `Authorization: Bearer <token>`
- Requires authenticated user to have `role = 'admin'`

**Path params:**

- `id` – numeric user ID.

**Request body (JSON):**

All fields optional; only provided fields are updated. To block a user, set `is_blocked` to `true`. To unblock a user, set `is_blocked` to `false`.

```jsonc
{
  "role": "admin", // optional, one of: user, dealer, company, admin
  "dealer_slug": "dealer-123", // optional, string or null
  "company_id": 42, // optional, integer or null
  "onboarding_ends_at": "2025-01-01T00:00:00Z", // optional, ISO date-time or null
  "is_blocked": true // optional, boolean; true = blocked, false = unblocked
}
```

#### Validation rules

| Field                | Required | Type            | Constraints                                |
| -------------------- | -------- | --------------- | ------------------------------------------ |
| `id` (path)          | yes      | integer         | `>= 1`                                     |
| `role`               | no       | string          | `user` \| `dealer` \| `company` \| `admin` |
| `dealer_slug`        | no       | string \| null  | any non-empty string or null               |
| `company_id`         | no       | integer \| null | `>= 1` when provided                       |
| `onboarding_ends_at` | no       | string \| null  | ISO 8601 date-time when provided           |
| `is_blocked`         | no       | boolean         |                                            |

**Response 200 JSON:**

- Updated user object.

**Error responses:**

- `400 Bad Request` – invalid `id` or body types.
- `401 Unauthorized` – missing/invalid token.
- `403 Forbidden` – authenticated but not `role = 'admin'`.
- `404 Not Found` – user not found.

---

### DELETE `/admin/users/:id`

**Description:**

Admin: Permanently delete a user account by ID.

**Method:** `DELETE`

**Authentication & authorization:**

- Requires `Authorization: Bearer <token>`
- Requires authenticated user to have `role = 'admin'`

**Path params:**

- `id` – numeric user ID.

#### Validation rules

| Field | Location | Required | Type    | Constraints |
| ----- | -------- | -------- | ------- | ----------- |
| `id`  | path     | yes      | integer | `>= 1`      |

**Response 204 No Content:**

- Empty body on success.

**Error responses:**

- `400 Bad Request` – invalid `id`.
- `401 Unauthorized` – missing/invalid token.
- `403 Forbidden` – authenticated but not `role = 'admin'`.
- `404 Not Found` – user not found.

---

## Notes

- All endpoints described here rely on the global error handling and authentication mechanisms already used elsewhere in the backend.
- Frontend/admin tools should respect these validation rules to avoid unnecessary 400 responses.
- If additional admin-only routes are added later (e.g., for companies, vehicles, or auctions), they should be documented in this file with the same pattern:
  - Description
  - Auth requirements
  - Request/response examples
  - `#### Validation rules` table.
