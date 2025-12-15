# Client Cookie-Based Authentication

This document describes the client-side implementation of HttpOnly cookie-based authentication.

## Overview

The client no longer stores tokens in `localStorage`. Authentication is handled via:

- **HttpOnly cookies** set by the server (inaccessible to JavaScript)
- **CSRF token** stored in memory only (not localStorage)
- **Server-truth** from `/auth/me` for authentication state

## Key Changes from Previous Implementation

| Before                                | After                                               |
| ------------------------------------- | --------------------------------------------------- |
| Token stored in `localStorage`        | No token storage - cookies are HttpOnly             |
| `Authorization: Bearer` header        | `withCredentials: true` sends cookies automatically |
| Auth state from localStorage on mount | Auth state from `/auth/me` on mount                 |
| Manual token management               | Automatic cookie management by browser              |

---

## Architecture

### Files Modified/Created

| File                      | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `src/lib/csrf.ts`         | CSRF token management (in-memory only)         |
| `src/lib/apiClient.ts`    | Axios with cookies, CSRF header, refresh+retry |
| `src/hooks/useAuth.tsx`   | Auth provider using server-truth               |
| `src/app/RequireAuth.tsx` | Route guards with `isInitialized` check        |

---

## API Client (`src/lib/apiClient.ts`)

### Features

1. **`withCredentials: true`** - All requests include cookies
2. **CSRF header** - Automatically attached for POST/PUT/PATCH/DELETE
3. **401 refresh + retry** - Automatic token refresh on expiry

### Request Flow

```
Request → CSRF Interceptor → Server
                ↓
         Add X-CSRF-Token header
         (for unsafe methods)
```

### Response Flow (401 handling)

```
Response 401 → Is auth endpoint? → Yes → Reject
                    ↓ No
              Already retried? → Yes → Reject + dispatch session-expired
                    ↓ No
              POST /auth/refresh
                    ↓
              Success? → Retry original request
                    ↓ No
              Dispatch 'auth:session-expired' event
```

---

## CSRF Handling (`src/lib/csrf.ts`)

### Functions

```typescript
// Get token (fetches if needed)
await getCsrfToken(): Promise<string>

// Force refresh (call after login)
await refreshCsrfToken(): Promise<string>

// Clear token (call on logout)
clearCsrfToken(): void

// Sync access (may be null)
getCsrfTokenSync(): string | null
```

### Usage

CSRF token is automatically attached by `apiClient` interceptor. You don't need to manually handle it.

---

## Auth Provider (`src/hooks/useAuth.tsx`)

### State

```typescript
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean; // !!user
  isLoading: boolean;
  isInitialized: boolean; // true after first /auth/me call
  userRole: UserRole | null;
  companyId: number | null;
  // ... methods
}
```

### Initialization Flow

```
App Mount
    ↓
GET /auth/me
    ↓
200? → Set user state
401? → Clear state (not authenticated)
    ↓
isInitialized = true
```

### Login Flow

```
login(identifier, password)
    ↓
POST /auth/login
    ↓
Server sets HttpOnly cookies
    ↓
Set user state from response
    ↓
refreshCsrfToken()
```

### Logout Flow

```
logout()
    ↓
POST /auth/logout
    ↓
Server clears cookies
    ↓
clearAuthState()
clearCsrfToken()
```

---

## Route Guards (`src/app/RequireAuth.tsx`)

### RequireAuth

```tsx
function RequireAuth({ children }) {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) return null; // Wait for auth check
  if (!isAuthenticated) return <Navigate to="/login" />;

  return children;
}
```

### RequireGuest

```tsx
function RequireGuest({ children }) {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) return null; // Wait for auth check
  if (isAuthenticated) return <Navigate to="/dashboard" />;

  return children;
}
```

---

## Session Expiry Handling

When a 401 occurs and refresh fails:

1. `apiClient` dispatches `auth:session-expired` custom event
2. `AuthProvider` listens for this event
3. Auth state is cleared
4. User is redirected to login (via route guards)

---

## Migration Notes

### Removed

- `localStorage.getItem('projectx_auth_token')`
- `localStorage.setItem('projectx_auth_token', ...)`
- `Authorization: Bearer` header injection
- `token` in `AuthContextValue`

### Added

- `isInitialized` state to prevent redirect flashing
- CSRF token management
- Automatic refresh + retry on 401
- Session expiry event handling

---

## Testing Checklist

- [ ] Login sets cookies (check browser dev tools)
- [ ] No tokens in localStorage
- [ ] Protected routes work after login
- [ ] Logout clears cookies and redirects
- [ ] Refresh works when access token expires
- [ ] CSRF header present on POST/PUT/PATCH/DELETE
- [ ] Session expiry redirects to login

---

## Troubleshooting

### "CSRF token missing" error

1. Ensure `/auth/csrf` is called after login
2. Check that `refreshCsrfToken()` is called in login flow

### Infinite redirect loop

1. Check `isInitialized` is being used in route guards
2. Ensure `/auth/me` completes before rendering routes

### Cookies not being sent

1. Check `withCredentials: true` on axios instance
2. Check CORS configuration on server (`credentials: true`)
3. Check `SameSite` cookie attribute matches deployment

### 401 on every request

1. Check cookies are being set (browser dev tools)
2. Check `COOKIE_SECURE` matches protocol (HTTP vs HTTPS)
3. Check `COOKIE_SAMESITE` configuration
