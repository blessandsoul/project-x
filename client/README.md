# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Authentication

The client uses **secure HttpOnly cookie-based authentication**. No tokens are stored in JavaScript - authentication is handled entirely via cookies set by the server.

### How It Works

1. **Login/Register**: User submits credentials → Server sets HttpOnly cookies (`access_token`, `refresh_token`) → Client calls `/auth/me` to get user data
2. **Authenticated Requests**: All API calls include `credentials: 'include'` so cookies are sent automatically
3. **CSRF Protection**: For unsafe methods (POST/PUT/PATCH/DELETE), the client reads the `csrf_token` cookie and sends it as `X-CSRF-Token` header
4. **Token Refresh**: When a 401 is received, the client automatically calls `/auth/refresh` and retries the original request once
5. **Session Expiry**: If refresh fails, a `auth:session-expired` event is dispatched and the user is logged out

### Key Files

| File                         | Purpose                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/lib/apiClient.ts`       | Axios instance with `withCredentials: true`, CSRF header injection, and 401 refresh/retry interceptor |
| `src/lib/csrf.ts`            | CSRF token management (fetch, cache, clear)                                                           |
| `src/hooks/useAuth.tsx`      | Auth context provider with `login`, `register`, `logout`, user state, and session expiry listener     |
| `src/app/RequireAuth.tsx`    | Route guards for protected and guest-only routes                                                      |
| `src/pages/SessionsPage.tsx` | UI for viewing and revoking active sessions                                                           |

### Auth Flow Diagram

```
┌─────────────┐     POST /auth/login      ┌─────────────┐
│   Client    │ ─────────────────────────▶│   Server    │
│             │◀───────────────────────── │             │
└─────────────┘   Set-Cookie: access_token└─────────────┘
                  Set-Cookie: refresh_token
                  Set-Cookie: csrf_token

┌─────────────┐     GET /auth/me          ┌─────────────┐
│   Client    │ ─────────────────────────▶│   Server    │
│  (cookies)  │◀───────────────────────── │             │
└─────────────┘   { user: {...} }         └─────────────┘

┌─────────────┐     POST /api/resource    ┌─────────────┐
│   Client    │ ─────────────────────────▶│   Server    │
│  + cookies  │   X-CSRF-Token: <token>   │             │
│             │◀───────────────────────── │             │
└─────────────┘   200 OK                  └─────────────┘
```

### Refresh Logic (`src/lib/apiClient.ts`)

- On 401 response (except auth endpoints), the interceptor:
  1. Queues concurrent requests to prevent multiple refresh calls
  2. Calls `POST /auth/refresh` (which rotates the refresh token)
  3. Retries the original request once
  4. If refresh fails, dispatches `auth:session-expired` event

### CSRF Header Attachment (`src/lib/apiClient.ts`)

- Request interceptor checks if method is POST/PUT/PATCH/DELETE
- Reads `csrf_token` from in-memory cache (or fetches via `/auth/csrf`)
- Attaches `X-CSRF-Token` header to the request

### Security Notes

- **Never store tokens in localStorage/sessionStorage** - they're in HttpOnly cookies
- **Always use `apiClient`** for API calls (ensures cookies and CSRF are handled)
- **CSRF token is readable** (not HttpOnly) so JavaScript can read and send it as a header
- **Access token expires in 15 minutes**, refresh token in 14 days

## Company Onboarding (2-Step Registration)

The platform uses a **2-step registration flow** for company creation:

### Flow

1. **Step 1 - User Registration**: User registers via `POST /auth/register` (email, username, password only)

   - User starts with `role = 'user'` and `company_id = null`

2. **Step 2 - Company Onboarding**: Authenticated user creates company via `POST /companies/onboard`
   - After success: `role = 'company'` and `company_id = <new company id>`

### Key Files

| File                                       | Purpose                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `src/services/companyOnboardService.ts`    | API service for `POST /companies/onboard` with typed error handling    |
| `src/pages/company/CompanyOnboardPage.tsx` | Onboarding form UI with shadcn/ui components                           |
| `src/app/RequireAuth.tsx`                  | Contains `RequireNoCompany` guard (auth required, no existing company) |

### Route Protection

- **Route**: `/company/onboard`
- **Guard**: `RequireNoCompany`
  - User must be authenticated
  - User must NOT already have a company (`company_id === null`)
  - If user has company → redirects to `/company/:id`

### Navigation Entry Points

- **Dashboard**: Shows "Create Company" CTA card when user is authenticated but has no company
- **Profile dropdown**: Can add link to `/company/onboard` for users without a company

### Error Handling

| HTTP Status | Error Type     | Action                              |
| ----------- | -------------- | ----------------------------------- |
| 401         | `unauthorized` | Redirect to login                   |
| 403         | `forbidden`    | Show "Account blocked" message      |
| 409         | `conflict`     | User already has company → redirect |
| 422         | `validation`   | Show validation errors inline       |
| 429         | `rate_limit`   | Show "Too many attempts" message    |

### After Successful Onboarding

1. Call `GET /auth/me` to refresh auth state
2. Auth context updates with new `role` and `company_id`
3. Redirect user to `/company/:id`

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
