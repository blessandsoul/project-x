# User API

Authentication, user profile, avatar management, favorites, and activity tracking endpoints.

Routes defined in: `src/routes/user.ts`, `src/routes/auth.ts`, `src/routes/account.ts`, `src/routes/favorites.ts`

Authentication is **cookie-only** (HttpOnly cookies). See `server/docs/auth-httpOnly-cookies.md`.

CSRF: Any unsafe request (`POST`, `PUT`, `PATCH`, `DELETE`) on protected endpoints requires the `X-CSRF-Token` header.

---

## Endpoint Summary

### Authentication (`/auth/*`)

| Method | Path                        | Auth   | CSRF | Description             |
| ------ | --------------------------- | ------ | ---- | ----------------------- |
| POST   | `/auth/register`            | -      | -    | Register new user       |
| POST   | `/auth/login`               | -      | -    | Login, set cookies      |
| POST   | `/auth/refresh`             | Cookie | -    | Rotate refresh token    |
| POST   | `/auth/logout`              | Cookie | -    | Revoke session          |
| GET    | `/auth/me`                  | Cookie | -    | Get current user        |
| GET    | `/auth/csrf`                | -      | -    | Get CSRF token          |
| GET    | `/auth/sessions`            | Cookie | -    | List sessions           |
| DELETE | `/auth/sessions`            | Cookie | ✅   | Revoke all sessions     |
| DELETE | `/auth/sessions/:sessionId` | Cookie | ✅   | Revoke specific session |

### Account Management (`/account/*`)

| Method | Path                       | Auth   | CSRF | Description           |
| ------ | -------------------------- | ------ | ---- | --------------------- |
| PATCH  | `/account`                 | Cookie | ✅   | Update email/username |
| POST   | `/account/change-password` | Cookie | ✅   | Change password       |
| POST   | `/account/deactivate`      | Cookie | ✅   | Soft-delete account   |

### User Avatar (`/user/avatar`)

| Method | Path           | Auth   | CSRF | Description                        |
| ------ | -------------- | ------ | ---- | ---------------------------------- |
| POST   | `/user/avatar` | Cookie | ✅   | Upload avatar (2MB, JPEG/PNG/WEBP) |
| PUT    | `/user/avatar` | Cookie | ✅   | Upload avatar (alias)              |
| GET    | `/user/avatar` | Cookie | -    | Get avatar URLs                    |
| DELETE | `/user/avatar` | Cookie | ✅   | Delete avatar                      |

### Favorite Vehicles (`/favorites/vehicles`)

| Method | Path                             | Auth   | CSRF | Description                |
| ------ | -------------------------------- | ------ | ---- | -------------------------- |
| GET    | `/favorites/vehicles`            | Cookie | -    | List favorites (paginated) |
| POST   | `/favorites/vehicles/:vehicleId` | Cookie | ✅   | Add to favorites           |
| DELETE | `/favorites/vehicles/:vehicleId` | Cookie | ✅   | Remove from favorites      |

### Favorite Companies (`/user/favorites/companies`)

| Method | Path                                   | Auth   | CSRF | Description             |
| ------ | -------------------------------------- | ------ | ---- | ----------------------- |
| GET    | `/user/favorites/companies`            | Cookie | -    | List favorite companies |
| POST   | `/user/favorites/companies/:companyId` | Cookie | ✅   | Add to favorites        |
| DELETE | `/user/favorites/companies/:companyId` | Cookie | ✅   | Remove from favorites   |

### Admin Users (`/admin/users/*`) — JWT header auth

| Method | Path               | Auth  | Description |
| ------ | ------------------ | ----- | ----------- |
| GET    | `/admin/users`     | Admin | List users  |
| GET    | `/admin/users/:id` | Admin | Get user    |
| PATCH  | `/admin/users/:id` | Admin | Update user |
| DELETE | `/admin/users/:id` | Admin | Delete user |

---

## Removed/Deprecated Endpoints

- ~~`POST /register`~~ — Use `POST /auth/register`
- ~~`POST /login`~~ — Use `POST /auth/login`
- ~~`GET /profile`~~ — Use `GET /auth/me`
- ~~`PUT /profile`~~ — Use `PATCH /account`
- ~~`DELETE /profile`~~ — Use `POST /account/deactivate`
- ~~`GET /user/favorites`~~ — Renamed to `GET /user/favorites/companies`
- ~~`POST /user/favorites/:companyId`~~ — Renamed to `POST /user/favorites/companies/:companyId`
- ~~`DELETE /user/favorites/:companyId`~~ — Renamed to `DELETE /user/favorites/companies/:companyId`
- ~~`GET /user/recent-companies`~~ — Removed
- ~~`POST /user/recent-companies`~~ — Removed
- ~~`GET /dashboard/summary`~~ — Removed

---

## Avatar Management

### POST `/user/avatar`

**Description**

Upload or replace the authenticated user's avatar image.

**Method:** `POST`

**Authentication:** Required (cookie auth)

**CSRF:** Required (`X-CSRF-Token` header)

**Content-Type:** `multipart/form-data`

**Request body**

- `file`: Image file (JPEG, PNG, WebP only — GIF/SVG rejected)

**Limits**

- Max file size: 2 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Magic byte verification (prevents disguised files)

**Processing**

- Image sanitized via `sharp` (strips metadata, re-encodes)
- Resized to max 512x512 (preserving aspect ratio)
- Quality: 90% for JPEG/WebP, compression level 9 for PNG

**Response 201**

```jsonc
{
  "avatarUrl": "/uploads/users/john_doe/avatars/avatar.png",
  "originalAvatarUrl": "/uploads/users/john_doe/avatars/avatar.png"
}
```

Note: Both URLs point to the sanitized version for security.

**Error responses**

- `400 Bad Request` – no file, invalid type, or file too large.
- `401 Unauthorized` – missing/invalid cookie auth.
- `403 Forbidden` – company users must use company logo as avatar, or missing CSRF.

---

### PUT `/user/avatar`

Alias for `POST /user/avatar` (idempotent update semantics).

**CSRF:** Required

---

### GET `/user/avatar`

**Description**

Get URLs for the authenticated user's avatar.

**Method:** `GET`

**Authentication:** Required (cookie auth)

**CSRF:** Not required (safe GET)

**Response 200**

```jsonc
{
  "avatarUrl": "/uploads/users/john_doe/avatars/avatar.png",
  "originalAvatarUrl": "/uploads/users/john_doe/avatars/avatar.png"
}
```

Returns `null` values if no avatar exists.

---

### DELETE `/user/avatar`

**Description**

Delete the authenticated user's avatar files.

**Method:** `DELETE`

**Authentication:** Required (cookie auth)

**CSRF:** Required (`X-CSRF-Token` header)

**Response 204** – No content on success.

---

## Favorite Companies

### GET `/user/favorites/companies`

**Description**

List the authenticated user's favorite companies.

**Method:** `GET`

**Authentication:** Required (cookie auth)

**CSRF:** Not required (safe GET)

**Response 200**

```jsonc
{
  "items": [
    {
      "user_id": 1,
      "company_id": 10,
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/user/favorites/companies/:companyId`

**Description**

Add a company to the user's favorites.

**Method:** `POST`

**Authentication:** Required (cookie auth)

**CSRF:** Required (`X-CSRF-Token` header)

**Path params:**

- `companyId` – numeric company ID (positive integer)

**Response 201**

```jsonc
{
  "success": true,
  "status": "created"
}
```

**Response 200** (already in favorites)

```jsonc
{
  "success": true,
  "status": "already_exists"
}
```

**Error responses**

- `400 Bad Request` – invalid company ID.
- `401 Unauthorized` – missing/invalid cookie auth.
- `403 Forbidden` – missing CSRF token.
- `404 Not Found` – company does not exist.

---

### DELETE `/user/favorites/companies/:companyId`

**Description**

Remove a company from the user's favorites.

**Method:** `DELETE`

**Authentication:** Required (cookie auth)

**CSRF:** Required (`X-CSRF-Token` header)

**Path params:**

- `companyId` – numeric company ID

**Response 204** – No content on success (idempotent).

---

## Vehicle Watchlist

### GET `/favorites/vehicles`

**Description**

List the authenticated user's favorite vehicles (watchlist) with pagination.

**Method:** `GET`

**Authentication:** Required (cookie auth)

**CSRF:** Not required (safe GET)

**Query params:**

- `page` (optional) – page number (default: 1, min: 1)
- `limit` (optional) – items per page (default: 20, max: 100)

**Response 200**

```jsonc
{
  "items": [
    {
      "id": 12345,
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "mileage": 45000,
      "yard_name": "Copart - Los Angeles",
      "source": "copart",
      "retail_value": 25000,
      "calc_price": 18500,
      "fuel_type": "Gasoline",
      "category": "Sedan",
      "drive": "FWD",
      "primary_photo_url": "https://example.com/photos/12345.jpg",
      "primary_thumb_url": "https://example.com/thumbs/12345.jpg"
    }
  ],
  "total": 42,
  "limit": 20,
  "page": 1,
  "totalPages": 3
}
```

**Error responses**

- `401 Unauthorized` – missing/invalid cookie auth.

---

### POST `/favorites/vehicles/:vehicleId`

**Description**

Add a vehicle to the user's watchlist.

**Method:** `POST`

**Authentication:** Required (cookie auth)

**CSRF:** Required (`X-CSRF-Token` header)

**Path params:**

- `vehicleId` – numeric vehicle ID (positive integer)

**Response 201**

```jsonc
{
  "success": true,
  "status": "created"
}
```

**Response 200** (already in watchlist)

```jsonc
{
  "success": true,
  "status": "already_exists"
}
```

**Error responses**

- `400 Bad Request` – invalid vehicle ID.
- `401 Unauthorized` – missing/invalid cookie auth.
- `403 Forbidden` – missing CSRF token.
- `404 Not Found` – vehicle does not exist.

---

### DELETE `/favorites/vehicles/:vehicleId`

**Description**

Remove a vehicle from the user's watchlist.

**Method:** `DELETE`

**Authentication:** Required (cookie auth)

**CSRF:** Required (`X-CSRF-Token` header)

**Path params:**

- `vehicleId` – numeric vehicle ID

**Response 204** – No content on success (idempotent).

**Error responses**

- `400 Bad Request` – invalid vehicle ID.
- `401 Unauthorized` – missing/invalid cookie auth.
- `403 Forbidden` – missing CSRF token.

---

## Notes for Integrators

- Protected endpoints use `authenticateCookie` middleware for cookie-based session auth.
- Unsafe methods (POST, PUT, PATCH, DELETE) require CSRF token via `X-CSRF-Token` header.
- Get CSRF token from `GET /auth/csrf` endpoint.
- Clients must use HttpOnly cookie authentication via `/auth/*` routes.
- User data is cached in Redis for 5 minutes to reduce database load.
- When a user is blocked or deactivated, their auth cache is invalidated immediately.
- Avatar uploads are processed using Sharp for consistent image handling and security.
- Company users cannot upload personal avatars; they use their company logo instead.
