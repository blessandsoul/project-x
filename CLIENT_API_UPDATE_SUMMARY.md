# Client-Side API Update Summary

## Overview

Updated all client-side code to use the new `/api/v1` prefix for API endpoints, matching the server-side route structure changes.

## Changes Made

### 1. API Client Base URL (`lib/apiClient.ts`)

**Updated the base URL to include `/api/v1` prefix:**

```typescript
export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000/api/v1'
  : 'https://api.trendingnow.ge/api/v1'
```

This change automatically applies the `/api/v1` prefix to all API calls made through the `apiClient`.

### 2. Removed Hardcoded `/api` Prefixes

Since the base URL now includes `/api/v1`, removed redundant `/api` prefixes from individual endpoint paths:

#### Files Updated:

1. **`lib/vinApi.ts`**
   - `/api/vin/decode` → `/vin/decode`
   - `/api/vin/health` → `/vin/health`

2. **`api/services.ts`**
   - `/api/services` → `/services`

3. **`api/vehicleMakesModels.ts`**
   - `/api/vehicle-makes` → `/vehicle-makes`
   - `/api/vehicle-models` → `/vehicle-models`

4. **`components/catalog/ShippingCalculator.tsx`**
   - `/api/cities` → `/cities`
   - `/api/ports` → `/ports`
   - `/api/calculator/quotes` → `/calculator/quotes`

5. **`components/auction/AuctionSidebarFilters.tsx`**
   - `/api/cities` → `/cities`

## Resulting API Endpoints

All client-side API calls now correctly use the `/api/v1` prefix:

### Authentication
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`

### Companies
- `GET /api/v1/companies`
- `GET /api/v1/companies/search`
- `POST /api/v1/companies/onboard`
- `PUT /api/v1/companies/:id`

### Calculator
- `POST /api/v1/calculator`
- `POST /api/v1/calculator/quotes`

### Reference Data
- `GET /api/v1/cities`
- `GET /api/v1/ports`
- `GET /api/v1/auctions`
- `GET /api/v1/vehicle-makes`
- `GET /api/v1/vehicle-models`
- `GET /api/v1/services`

### VIN Decoder
- `POST /api/v1/vin/decode`
- `GET /api/v1/vin/health`

### Vehicles
- `GET /api/v1/vehicles/search`
- `GET /api/v1/vehicles/:id`

### Account
- `PATCH /api/v1/account`
- `POST /api/v1/account/change-password`

## Environment Configuration

### Development
- **Server**: `http://localhost:3000/api/v1`
- **Client**: Runs on separate port (typically 5173)
- **CORS**: Enabled for `http://localhost:5173`

### Production
- **Server**: `https://api.trendingnow.ge/api/v1`
- **Client**: Can be served from the same domain or separately

## Serving Client Through Server

To serve the client through your server (single domain deployment):

### Option 1: Static File Serving (Recommended for Production)

1. **Build the client:**
   ```bash
   cd client
   npm run build
   ```

2. **Configure server to serve static files:**
   ```typescript
   // In server/src/server.ts or a new static file plugin
   import fastifyStatic from '@fastify/static'
   import path from 'path'
   
   // Serve static files from client/dist
   fastify.register(fastifyStatic, {
     root: path.join(__dirname, '../../client/dist'),
     prefix: '/', // Serve at root
   })
   
   // API routes are already at /api/v1, so they won't conflict
   ```

3. **Update client base URL for production:**
   ```typescript
   // In client/.env.production or vite.config.ts
   export const API_BASE_URL = import.meta.env.DEV
     ? 'http://localhost:3000/api/v1'
     : '/api/v1' // Relative URL for same-domain deployment
   ```

### Option 2: Proxy During Development

Your current setup with separate dev servers is fine for development. The client dev server (Vite) can proxy API requests:

```typescript
// In client/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

## Testing

### 1. Verify API Calls
- Open browser DevTools → Network tab
- All API calls should show `/api/v1/...` in the URL
- Check for 404 errors (indicates missing route updates)

### 2. Test Authentication Flow
1. Register/Login
2. Check that cookies are set
3. Verify CSRF token is extracted
4. Test authenticated endpoints

### 3. Test Reference Data
- Cities dropdown should load
- Ports dropdown should load
- Vehicle makes/models should load

## Backward Compatibility

**Breaking Change**: Old clients using `/api/...` endpoints will receive 404 errors.

**Migration Path**:
1. Deploy server with new `/api/v1` routes
2. Deploy updated client immediately after
3. Monitor for 404 errors in production logs

## Notes

- All API calls automatically include cookies (authentication)
- CSRF tokens are automatically extracted and sent
- No manual token management required
- Health check endpoints (`/health`, `/health/db`) remain at root level (no `/api/v1` prefix)

## Files Modified

### Core API Client
- `client/src/lib/apiClient.ts`

### API Modules
- `client/src/lib/vinApi.ts`
- `client/src/api/services.ts`
- `client/src/api/vehicleMakesModels.ts`

### Components
- `client/src/components/catalog/ShippingCalculator.tsx`
- `client/src/components/auction/AuctionSidebarFilters.tsx`

## Verification Checklist

- [x] Base URL updated to include `/api/v1`
- [x] All hardcoded `/api` prefixes removed
- [x] VIN decoder endpoints updated
- [x] Calculator endpoints updated
- [x] Reference data endpoints updated (cities, ports, services, makes, models)
- [x] Authentication endpoints use new prefix (handled by base URL)
- [x] Company endpoints use new prefix (handled by base URL)
- [x] No duplicate `/api/v1/api/...` paths

## Next Steps

1. **Test locally**: Start both server and client, verify all API calls work
2. **Update environment variables**: Ensure production URLs are correct
3. **Deploy server first**: Deploy server with new routes
4. **Deploy client**: Deploy updated client immediately after
5. **Monitor**: Watch for 404 errors in production logs
