# User API

Authentication, user profile, avatar management, favorites, vehicle watchlist, and activity tracking endpoints.

Routes defined in: `src/routes/user.ts`

Requires JWT authentication for profile-related endpoints.

---

## POST `/register`

**Description**

Register a new user account. Supports both regular users and company accounts.

**Method:** `POST`

**Rate Limit:** 3 requests per hour per IP (prevents spam account creation)

**Request body**

```jsonc
{
  "email": "user@example.com", // required
  "username": "john_doe", // required, 3-50 chars
  "password": "secret123", // required, min 6 chars
  "role": "user", // optional: "user" or "company" (default: "user")
  // Company-specific fields (required when role = "company"):
  "name": "My Shipping Co", // company name
  "companyPhone": "+1234567890", // optional contact phone
  "basePrice": 500, // optional pricing
  "pricePerMile": 1.5, // optional pricing
  "customsFee": 200, // optional fee
  "serviceFee": 150, // optional fee
  "brokerFee": 100 // optional fee
}
```

**Validations**

- `email`: valid email format, unique.
- `username`: 3–50 characters, unique.
- `password`: minimum length 6.
- `role`: must be "user" or "company" if provided.
- `name`: required when role = "company".

**Response 201**

```jsonc
{
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "role": "user"
  }
}
```

**Error responses**

- `400 Bad Request` – validation errors, duplicate email/username.
- `409 Conflict` – if uniqueness is enforced and conflicts occur.
- `429 Too Many Requests` – rate limit exceeded.

---

## POST `/login`

**Description**

Authenticate a user by email or username and password.

**Method:** `POST`

**Rate Limit:** 5 requests per 5 minutes per IP (prevents brute force)

**Request body**

```jsonc
{
  "identifier": "user@example.com", // or username
  "password": "secret123"
}
```

**Response 200**

```jsonc
{
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "role": "user",
    "company_id": null,
    "avatar_url": "/uploads/users/john_doe/avatars/avatar.png",
    "original_avatar_url": "/uploads/users/john_doe/avatars/avatar-original.png"
  }
}
```

**Error responses**

- `401 Unauthorized` – invalid credentials or account blocked.
- `400 Bad Request` – invalid body shape.
- `429 Too Many Requests` – rate limit exceeded.

---

## GET `/profile`

**Description**

Return the authenticated user's profile.

**Method:** `GET`

**Authentication**

- Requires JWT in `Authorization` header:

```http
Authorization: Bearer <token>
```

**Response 200**

```jsonc
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-02T00:00:00.000Z"
}
```

**Error responses**

- `401 Unauthorized` – missing/invalid token.
- `404 Not Found` – user not found (e.g., deleted).

---

## PUT `/profile`

**Description**

Update authenticated user's profile (partial updates allowed).

**Method:** `PUT`

**Authentication**

- Requires JWT in `Authorization` header.

**Request body**

```jsonc
{
  "email": "new@example.com", // optional
  "username": "new_username", // optional
  "password": "newSecret123" // optional
}
```

**Response 200**

```jsonc
{
  "id": 1,
  "email": "new@example.com",
  "username": "new_username",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-03T00:00:00.000Z"
}
```

**Error responses**

- `400 Bad Request` – invalid email/username/password.
- `401 Unauthorized` – missing/invalid token.
- `404 Not Found` – user not found.

---

## DELETE `/profile`

**Description**

Delete the authenticated user's account permanently.

**Method:** `DELETE`

**Authentication**

- Requires JWT in `Authorization` header.

**Response 200**

```jsonc
{
  "message": "Account deleted successfully"
}
```

**Error responses**

- `401 Unauthorized` – missing/invalid token.
- `404 Not Found` – user not found.

---

---

## Avatar Management

### POST `/user/avatar`

**Description**

Upload or replace the authenticated user's avatar image.

**Method:** `POST`

**Authentication:** Required (JWT)

**Content-Type:** `multipart/form-data`

**Request body**

- `file`: Image file (JPEG, PNG, WebP, GIF)

**Processing**

- Original image saved as `avatar-original.{ext}`
- Resized to 256x256 (preserving aspect ratio) saved as `avatar.{ext}`
- Quality: 90% for JPEG/WebP, compression level 9 for PNG

**Response 201**

```jsonc
{
  "avatarUrl": "/uploads/users/john_doe/avatars/avatar.png",
  "originalAvatarUrl": "/uploads/users/john_doe/avatars/avatar-original.png"
}
```

**Error responses**

- `400 Bad Request` – no file provided or not an image.
- `401 Unauthorized` – missing/invalid token.
- `403 Forbidden` – company users must use company logo as avatar.

---

### PUT `/user/avatar`

Alias for `POST /user/avatar` (idempotent update semantics).

---

### GET `/user/avatar`

**Description**

Get URLs for the authenticated user's avatar.

**Method:** `GET`

**Authentication:** Required (JWT)

**Response 200**

```jsonc
{
  "avatarUrl": "/uploads/users/john_doe/avatars/avatar.png",
  "originalAvatarUrl": "/uploads/users/john_doe/avatars/avatar-original.png"
}
```

Returns `null` values if no avatar exists.

---

### DELETE `/user/avatar`

**Description**

Delete the authenticated user's avatar files.

**Method:** `DELETE`

**Authentication:** Required (JWT)

**Response 204** – No content on success.

---

## Favorite Companies

### GET `/user/favorites`

**Description**

List the authenticated user's favorite companies.

**Method:** `GET`

**Authentication:** Required (JWT)

**Response 200**

```jsonc
{
  "items": [
    {
      "id": 1,
      "name": "Fast Shipping Co",
      "slug": "fast-shipping-co",
      "rating": 4.5,
      "logo_url": "/uploads/companies/fast-shipping-co/logos/fast-shipping-co.png"
    }
  ]
}
```

---

### POST `/user/favorites/:companyId`

**Description**

Add a company to the user's favorites.

**Method:** `POST`

**Authentication:** Required (JWT)

**Path params:**

- `companyId` – numeric company ID

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

- `400 Bad Request` – invalid company ID.
- `401 Unauthorized` – missing/invalid token.

---

### DELETE `/user/favorites/:companyId`

**Description**

Remove a company from the user's favorites.

**Method:** `DELETE`

**Authentication:** Required (JWT)

**Path params:**

- `companyId` – numeric company ID

**Response 204** – No content on success.

---

## Recently Viewed Companies

### GET `/user/recent-companies`

**Description**

List companies the user has recently viewed.

**Method:** `GET`

**Authentication:** Required (JWT)

**Query params:**

- `limit` (optional) – max items to return (default: 20)

**Response 200**

```jsonc
{
  "items": [
    {
      "id": 1,
      "name": "Fast Shipping Co",
      "slug": "fast-shipping-co",
      "viewed_at": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/user/recent-companies`

**Description**

Record that the user viewed a company (for tracking recently viewed).

**Method:** `POST`

**Authentication:** Required (JWT)

**Request body**

```jsonc
{
  "company_id": 1
}
```

**Response 201**

```jsonc
{
  "success": true
}
```

---

## Vehicle Watchlist

### GET `/favorites/vehicles`

**Description**

List the authenticated user's favorite vehicles (watchlist) with pagination.

**Method:** `GET`

**Authentication:** Required (JWT)

**Query params:**

- `page` (optional) – page number (default: 1)
- `limit` (optional) – items per page (default: 20, max: 250)

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

- `401 Unauthorized` – missing/invalid token.

---

### POST `/favorites/vehicles/:vehicleId`

**Description**

Add a vehicle to the user's watchlist.

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

**Error responses**

- `400 Bad Request` – invalid vehicle ID.
- `401 Unauthorized` – missing/invalid token.
- `404 Not Found` – vehicle does not exist.

---

### DELETE `/favorites/vehicles/:vehicleId`

**Description**

Remove a vehicle from the user's watchlist.

**Method:** `DELETE`

**Authentication:** Required (JWT)

**Path params:**

- `vehicleId` – numeric vehicle ID

**Response 204** – No content on success.

**Error responses**

- `400 Bad Request` – invalid vehicle ID.
- `401 Unauthorized` – missing/invalid token.

---

## Notes for Integrators

- All profile operations rely on `fastify.authenticate` middleware, which validates the JWT and attaches `request.user`.
- The same JWT is used for any future authenticated endpoints.
- JWT tokens expire after 7 days by default (configurable via `JWT_EXPIRES_IN`).
- User data is cached in Redis for 5 minutes to reduce database load.
- When a user is blocked, their auth cache is invalidated immediately.
- Avatar uploads are processed using Sharp for consistent image handling.
- Company users cannot upload personal avatars; they use their company logo instead.
