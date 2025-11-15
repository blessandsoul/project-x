# User API

Authentication and user profile endpoints (registration, login, profile CRUD).

Routes defined in: `src/routes/user.ts`

Requires JWT authentication for profile-related endpoints.

---

## POST `/register`

**Description**

Register a new user account.

**Method:** `POST`

**Request body**

```jsonc
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "secret123"
}
```

**Validations**

- `email`: valid email format, unique.
- `username`: 3–50 characters, unique.
- `password`: minimum length 6.

**Response 201**

```jsonc
{
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe"
  }
}
```

**Error responses**

- `400 Bad Request` – validation errors, duplicate email/username.
- `409 Conflict` – if uniqueness is enforced and conflicts occur (via `ConflictError`).

---

## POST `/login`

**Description**

Authenticate a user by email or username and password.

**Method:** `POST`

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
    "username": "john_doe"
  }
}
```

**Error responses**

- `401 Unauthorized` – invalid credentials (`AuthenticationError`).
- `400 Bad Request` – invalid body shape.

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

## Notes for Integrators

- All profile operations rely on `fastify.authenticate` middleware, which validates the JWT and attaches `request.user`.
- The same JWT is used for any future authenticated endpoints (e.g. admin or user-specific operations).
