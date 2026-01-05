# User Activity API

This document describes user activity endpoints for favorites.

Authentication is **cookie-only** (HttpOnly cookies). See `server/docs/auth-cookie-only.md`.

CSRF: Any unsafe request (`POST`, `PUT`, `PATCH`, `DELETE`) requires the `X-CSRF-Token` header.

---

## Currently Implemented Endpoints

### Favorite Companies

| Method | Path                                   | Auth   | CSRF | Description             |
| ------ | -------------------------------------- | ------ | ---- | ----------------------- |
| GET    | `/user/favorites/companies`            | Cookie | -    | List favorite companies |
| POST   | `/user/favorites/companies/:companyId` | Cookie | ✅   | Add to favorites        |
| DELETE | `/user/favorites/companies/:companyId` | Cookie | ✅   | Remove from favorites   |

### Favorite Vehicles

| Method | Path                             | Auth   | CSRF | Description                        |
| ------ | -------------------------------- | ------ | ---- | ---------------------------------- |
| GET    | `/favorites/vehicles`            | Cookie | -    | List favorite vehicles (paginated) |
| POST   | `/favorites/vehicles/:vehicleId` | Cookie | ✅   | Add to favorites                   |
| DELETE | `/favorites/vehicles/:vehicleId` | Cookie | ✅   | Remove from favorites              |

---

## 1. Favorite Companies

These endpoints manage **favorite companies per user**.

### 1.1 GET /user/favorites/companies

- **Method:** `GET`
- **URL:** `/user/favorites/companies`
- **Auth:** Required (cookie auth)
- **CSRF:** Not required (safe GET)

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

### 1.2 POST /user/favorites/companies/:companyId

- **Method:** `POST`
- **URL:** `/user/favorites/companies/:companyId`
- **Auth:** Required (cookie auth)
- **CSRF:** Required (`X-CSRF-Token` header)
- **Params:**
  - `companyId` – integer > 0
- **Body:** none

**Response 201:**

```json
{ "success": true, "status": "created" }
```

**Response 200** (already exists):

```json
{ "success": true, "status": "already_exists" }
```

Behavior:

- Idempotent: uses `INSERT IGNORE` to avoid duplicates.
- Company must exist or returns 404.

### 1.3 DELETE /user/favorites/companies/:companyId

- **Method:** `DELETE`
- **URL:** `/user/favorites/companies/:companyId`
- **Auth:** Required (cookie auth)
- **CSRF:** Required (`X-CSRF-Token` header)

**Response 204:**

- Empty body.

Behavior:

- Removes the `(user_id, company_id)` pair from `user_favorite_companies`.
- Idempotent: returns 204 even if row didn't exist.

---

## 2. Favorite Vehicles

See `user-api.md` for full documentation. Summary:

### 2.1 GET /favorites/vehicles

- **Auth:** Cookie
- **CSRF:** Not required
- **Query:** `page`, `limit` (paginated)
- **Response:** `{ items, total, limit, page, totalPages }`

### 2.2 POST /favorites/vehicles/:vehicleId

- **Auth:** Cookie
- **CSRF:** Required
- **Response 201:** `{ success: true, status: "created" }`
- **Response 200:** `{ success: true, status: "already_exists" }`

### 2.3 DELETE /favorites/vehicles/:vehicleId

- **Auth:** Cookie
- **CSRF:** Required
- **Response 204:** No content

---

## 3. Frontend Wiring Notes

- **Favorites row (companies)**

  - Use `GET /user/favorites/companies`.
  - Use returned `company_id` list to fetch full company tiles via `/companies` or `/companies/search`.

- **Favorites row (vehicles)**
  - Use `GET /favorites/vehicles` for paginated vehicle list with full details.

---

## Removed Endpoints

The following endpoints have been removed:

- ~~`GET /dashboard/summary`~~ — Removed
- ~~`GET /user/recent-companies`~~ — Removed
- ~~`POST /user/recent-companies`~~ — Removed
- ~~`GET /user/favorites`~~ — Renamed to `/user/favorites/companies`
- ~~`POST /user/favorites/:companyId`~~ — Renamed to `/user/favorites/companies/:companyId`
- ~~`DELETE /user/favorites/:companyId`~~ — Renamed to `/user/favorites/companies/:companyId`
