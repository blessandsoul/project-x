# Authentication (Cookie-Only)

This backend uses **HttpOnly cookie-based authentication only**.

- Requests using `Authorization: Bearer <token>` will return **401 Unauthorized**.
- Requests using `x-access-token: <token>` will return **401 Unauthorized**.
- Clients must authenticate via `/auth/*` routes and rely on cookies.

## Overview

The system uses:

- **access token**: short-lived JWT stored in an **HttpOnly** cookie (`access_token`)
- **refresh token**: long-lived opaque token stored in an **HttpOnly** cookie (`refresh_token`) with restricted path
- **CSRF protection**: double-submit cookie pattern via a readable `csrf_token` cookie + `x-csrf-token` header
- **sessions**: persisted in MySQL (audit) and cached in Redis (speed)

## Cookie behavior

- **`access_token`**

  - HttpOnly
  - Path: `/`
  - Sent with all API requests (when `credentials`/`withCredentials` is enabled)

- **`refresh_token`**

  - HttpOnly
  - Path: `/auth/refresh`
  - Only sent to `/auth/refresh` (limits exposure)

- **`csrf_token`**
  - Not HttpOnly
  - Path: `/`
  - Must be read by the client and sent as `x-csrf-token` for unsafe requests

## Environment configuration

Typical variables:

```env
ACCESS_TTL_MINUTES=15
REFRESH_TTL_DAYS=14

COOKIE_SECURE=false
COOKIE_SAMESITE=lax
# COOKIE_DOMAIN=...

TRUST_PROXY=false
MAX_SESSIONS_PER_USER=10

JWT_ACCESS_SECRET=...
CSRF_SECRET=...
```

## Client requirements

### Browser (React/SPA)

- Axios: `withCredentials: true`
- Fetch: `credentials: 'include'`

### Postman

- Use the built-in cookie jar.
- Use a consistent host (don’t mix `localhost` and `127.0.0.1`).

## API endpoints

### POST `/auth/login`

Authenticates user and sets cookies.

- **Request JSON**:

```json
{ "identifier": "user@example.com", "password": "password123" }
```

- **Response JSON**: user payload only (no tokens in body)

### GET `/auth/me`

Returns current user if `access_token` cookie is valid.

### POST `/auth/refresh`

Rotates refresh token and re-issues access token.

- Requires `refresh_token` cookie (Path: `/auth/refresh`).

### POST `/auth/logout`

Clears cookies and revokes the current session.

### GET `/auth/csrf`

Ensures CSRF cookie is set and returns token payload.

### GET `/auth/sessions`

List sessions for the current user.

### DELETE `/auth/sessions`

Revokes **all** sessions for the current user (logout everywhere).

- **CSRF required**
  - Cookie: `csrf_token=...`
  - Header: `x-csrf-token: <same value>`

### DELETE `/auth/sessions/:sessionId`

Revokes a specific session.

- **CSRF required**

## CSRF rules

CSRF is required for unsafe methods:

- `POST`
- `PUT`
- `PATCH`
- `DELETE`

To pass CSRF:

- The request must include the `csrf_token` cookie
- The request must include `x-csrf-token` header with the same value

## Regression checklist

- [ ] Cookie login works (`POST /auth/login` sets cookies)
- [ ] Cookie me works (`GET /auth/me` returns user)
- [ ] Refresh works (`POST /auth/refresh` rotates tokens)
- [ ] Logout works (`POST /auth/logout` clears cookies and revokes session)
- [ ] Any request with `Authorization: Bearer ...` returns 401
- [ ] Any request with `x-access-token: ...` returns 401
- [ ] Legacy `POST /login` returns 410
- [ ] `POST /register` returns user payload and does not issue a token
