# User API Documentation

## Overview

This document provides comprehensive API documentation for the user management endpoints. All endpoints use JSON for request/response bodies and follow RESTful conventions.

### Base URL

```
http://localhost:3000
```

### Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Response Format

All responses follow a consistent structure:

**Success Response:**

```json
{
  "data": { ... },
  "meta": { ... }
}
```

**Error Response:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

## Conventions

### Pagination

Many list endpoints in the wider API surface (companies, reviews, quotes, some admin lists) use a shared pagination contract.

**Query params:**

- `limit` (optional, integer) – page size.
- `offset` (optional, integer) – number of records to skip.

**Response shape:**

```jsonc
{
  "items": [
    /* ... */
  ],
  "total": 123,
  "limit": 20,
  "offset": 0,
  "page": 1,
  "totalPages": 7
}
```

Check the domain-specific docs (e.g. `server/docs/companies-api.md`) to see which endpoints implement this contract.

### Idempotent writes

Some write endpoints support **idempotent operations** via the `Idempotency-Key` header:

- `Idempotency-Key` (optional, string) – client-generated unique key per logical operation.

Server behavior:

- The first successful request for a given `(user_id, route, Idempotency-Key, request body)` is executed normally and its response is stored.
- Subsequent identical requests (same key + same body) return the stored response without repeating side effects.
- If the same key is reused with a different request body, the server returns a 4xx error indicating a key/body mismatch.

Currently, idempotency is enabled on:

- `POST /companies/:companyId/reviews`
- `POST /quotes` (admin-only)

## Endpoints

### 1. User Registration

**POST** `/register`

Register a new user account with email, username, and password validation.

#### Request Body

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123"
}
```

#### Request Body Schema

```json
{
  "type": "object",
  "required": ["email", "username", "password"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "Valid email address"
    },
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 50,
      "description": "Unique username"
    },
    "password": {
      "type": "string",
      "minLength": 6,
      "description": "Password with minimum 6 characters"
    }
  }
}
```

#### Success Response (201)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

#### Error Responses

**400 - Validation Error** (Invalid email format, password too short, etc.)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email format is invalid",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**409 - Conflict Error** (Email or username already exists)

```json
{
  "error": {
    "code": "CONFLICT_ERROR",
    "message": "Email already exists",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

---

### 2. User Login

**POST** `/login`

Authenticate user with email/username and password to receive JWT token.

#### Request Body

```json
{
  "identifier": "user@example.com",
  "password": "securepassword123"
}
```

#### Request Body Schema

```json
{
  "type": "object",
  "required": ["identifier", "password"],
  "properties": {
    "identifier": {
      "type": "string",
      "description": "Email address or username"
    },
    "password": {
      "type": "string",
      "description": "User's password"
    }
  }
}
```

#### Success Response (200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

#### Error Responses

**400 - Validation Error** (Invalid identifier format, missing password)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid identifier format",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**401 - Authentication Error** (Invalid credentials)

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid credentials",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

---

### 3. Get User Profile

**GET** `/profile`

Retrieve the authenticated user's profile information.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "created_at": "2025-11-13T22:51:00.000Z",
  "updated_at": "2025-11-13T22:51:00.000Z"
}
```

#### Error Responses

**401 - Authentication Error** (Missing or invalid token)

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Unauthorized",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**404 - Not Found Error** (User account deleted)

```json
{
  "error": {
    "code": "NOT_FOUND_ERROR",
    "message": "User not found",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

---

### 4. Update User Profile

**PUT** `/profile`

Update the authenticated user's profile information. All fields are optional.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Request Body

```json
{
  "email": "newemail@example.com",
  "username": "newusername",
  "password": "newsecurepassword123"
}
```

#### Request Body Schema

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "New email address"
    },
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 50,
      "description": "New username"
    },
    "password": {
      "type": "string",
      "minLength": 6,
      "description": "New password"
    }
  }
}
```

#### Success Response (200)

```json
{
  "id": 1,
  "email": "newemail@example.com",
  "username": "newusername",
  "created_at": "2025-11-13T22:51:00.000Z",
  "updated_at": "2025-11-13T23:51:00.000Z"
}
```

#### Error Responses

**400 - Validation Error** (Invalid email format, password too short, etc.)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email format is invalid",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**401 - Authentication Error** (Missing or invalid token)

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Unauthorized",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**404 - Not Found Error** (User account deleted)

```json
{
  "error": {
    "code": "NOT_FOUND_ERROR",
    "message": "User not found",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**409 - Conflict Error** (Email or username already taken)

```json
{
  "error": {
    "code": "CONFLICT_ERROR",
    "message": "Email already exists",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

---

### 5. Delete User Account

**DELETE** `/profile`

Permanently delete the authenticated user's account. This action cannot be undone.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)

```json
{
  "message": "Account deleted successfully"
}
```

#### Error Responses

**401 - Authentication Error** (Missing or invalid token)

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Unauthorized",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**404 - Not Found Error** (User account already deleted)

```json
{
  "error": {
    "code": "NOT_FOUND_ERROR",
    "message": "User not found",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

## Error Codes Reference

| Error Code             | HTTP Status | Description                        |
| ---------------------- | ----------- | ---------------------------------- |
| `VALIDATION_ERROR`     | 400         | Invalid input data or format       |
| `AUTHENTICATION_ERROR` | 401         | Invalid or missing credentials     |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions           |
| `NOT_FOUND_ERROR`      | 404         | Resource not found                 |
| `CONFLICT_ERROR`       | 409         | Resource conflict (duplicate data) |
| `DATABASE_ERROR`       | 500         | Database operation failed          |
| `INTERNAL_ERROR`       | 500         | Internal server error              |

## Rate Limiting

Rate limiting is enforced using the `@fastify/rate-limit` plugin. Some endpoints have per-route limits in addition to any global limits.

Examples:

- **User login**

  - `POST /login`
  - Limited by configuration (`RATE_LIMIT_USER_LOGIN_MAX`, `RATE_LIMIT_USER_LOGIN_WINDOW`).

- **VIN decoding**

  - `POST /api/vin/decode` – strict per-IP rate limit (e.g. 10 requests per minute).
  - `GET /api/vin/health` – looser limit for monitoring (e.g. 30 requests per minute).

- **Quote calculation**
  - `POST /vehicles/:vehicleId/calculate-quotes`
  - `GET /vehicles/:vehicleId/cheapest-quotes`
  - `POST /vehicles/search-quotes`
  - `POST /vehicles/compare`

If a rate limit is exceeded, the API responds with `429 Too Many Requests` and a structured error body consistent with the global error format.

## Testing Examples

### Registration

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"password123"}'
```

### Get Profile (with token)

```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile (with token)

```bash
curl -X PUT http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"newusername"}'
```

### Delete Account (with token)

```bash
curl -X DELETE http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes for Frontend Implementation

1. **Store JWT securely** - Use httpOnly cookies or secure localStorage
2. **Handle token expiration** - Implement automatic token refresh or re-login
3. **Validate responses** - Check for error codes and handle accordingly
4. **Input validation** - Validate user input on frontend before API calls
5. **Error handling** - Provide user-friendly error messages
6. **HTTPS required** - Always use HTTPS in production environments
