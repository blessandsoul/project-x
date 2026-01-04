# Postman Collection Usage Guide

## Overview

This Postman collection is configured for **cookie-based authentication** with automatic CSRF token handling. All API routes now use the `/api/v1` prefix.

## Quick Start

### 1. Import the Collection

1. Open Postman
2. Click **Import** → **File** → Select `ProjectX-API.postman_collection.json`
3. The collection will be imported with all routes and variables configured

### 2. Configure Base URL (Optional)

The collection is pre-configured with:
- **baseUrl**: `http://localhost:3000/api/v1`

To change the server URL:
1. Click on the collection name
2. Go to **Variables** tab
3. Update the `baseUrl` value

### 3. Authentication Flow

#### Step 1: Get CSRF Token (Optional - happens automatically on login)
```
GET /auth/csrf
```
This request automatically saves the CSRF token to the collection variable.

#### Step 2: Login
```
POST /auth/login
```
**Body:**
```json
{
  "identifier": "user@example.com",
  "password": "securepassword123"
}
```

**What happens automatically:**
1. ✅ Server sets `accessToken` cookie (HttpOnly)
2. ✅ Server sets `refreshToken` cookie (HttpOnly)
3. ✅ Server sets `csrf-token` cookie
4. ✅ Postman extracts CSRF token from cookie and saves to `{{csrfToken}}` variable
5. ✅ All subsequent requests automatically include cookies

#### Step 3: Use Authenticated Endpoints

After login, you can immediately use any authenticated endpoint. For example:

```
GET /auth/me
```

Postman will **automatically**:
- Send the `accessToken` cookie
- Send the `refreshToken` cookie

For **unsafe methods** (POST/PUT/PATCH/DELETE), the `X-CSRF-Token` header is already configured:
```
X-CSRF-Token: {{csrfToken}}
```

## Cookie Management

### How Cookies Work in Postman

Postman automatically:
1. **Stores cookies** from server responses
2. **Sends cookies** with subsequent requests to the same domain
3. **Handles HttpOnly cookies** (you won't see them in the UI, but they're there)

### Viewing Cookies

1. Click the **Cookies** link (below the Send button)
2. Select your domain (e.g., `localhost:3000`)
3. You'll see all cookies including `accessToken`, `refreshToken`, and `csrf-token`

### Clearing Cookies (Logout)

**Method 1: Use Logout Endpoint**
```
POST /auth/logout
```
This clears all auth cookies server-side and client-side.

**Method 2: Manual Clear**
1. Click **Cookies** → Select domain → Click **Remove All**

## CSRF Token Handling

### Automatic Extraction

The **Login** and **Register** requests have a **Test Script** that automatically extracts the CSRF token:

```javascript
// Extract CSRF token from cookie
var csrfCookie = pm.cookies.get('csrf-token');
if (csrfCookie) {
    pm.collectionVariables.set('csrfToken', csrfCookie);
    console.log('CSRF Token extracted from cookie:', csrfCookie);
}
```

### Manual Refresh

If you need to refresh the CSRF token:
```
GET /auth/csrf
```

### Using CSRF Token

All unsafe endpoints (POST/PUT/PATCH/DELETE) already have this header configured:
```
X-CSRF-Token: {{csrfToken}}
```

You don't need to do anything manually!

## Common Workflows

### Workflow 1: Register New User
1. **Get CSRF Token** (optional)
   ```
   GET /auth/csrf
   ```
2. **Register**
   ```
   POST /auth/register
   ```
   Body:
   ```json
   {
     "email": "newuser@example.com",
     "username": "newuser",
     "password": "securepass123"
   }
   ```
3. ✅ You're now logged in! Cookies and CSRF token are set automatically.

### Workflow 2: Login Existing User
1. **Login**
   ```
   POST /auth/login
   ```
   Body:
   ```json
   {
     "identifier": "user@example.com",
     "password": "securepassword123"
   }
   ```
2. ✅ Cookies and CSRF token are set automatically.

### Workflow 3: Test Protected Endpoint
1. **Login** (see Workflow 2)
2. **Call any protected endpoint**, e.g.:
   ```
   GET /auth/me
   GET /auth/sessions
   PATCH /account
   POST /companies/onboard
   ```
3. ✅ Cookies are sent automatically.

### Workflow 4: Refresh Token
```
POST /auth/refresh
```
- Automatically rotates refresh token
- Updates access token
- Extracts new CSRF token

### Workflow 5: Company Onboarding
1. **Login as user**
2. **Onboard Company**
   ```
   POST /companies/onboard
   ```
   Body:
   ```json
   {
     "name": "My Shipping Company",
     "companyPhone": "+1234567890",
     "contactEmail": "contact@company.com",
     "basePrice": 500,
     "pricePerMile": 1.5,
     "customsFee": 200,
     "serviceFee": 100,
     "brokerFee": 50
   }
   ```
3. ✅ User role upgraded to `company`, company created.

## API Routes Structure

All routes now use the `/api/v1` prefix:

### Authentication
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/csrf`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions`

### Companies
- `GET /api/v1/companies`
- `GET /api/v1/companies/search`
- `GET /api/v1/companies/:id`
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

### Auctions
- `GET /api/v1/auction/active-lots`
- `POST /api/v1/auction/calculate-shipping`

### Vehicles
- `GET /api/v1/vehicles/search`
- `GET /api/v1/vehicles/:id`

### Account
- `PATCH /api/v1/account`
- `POST /api/v1/account/change-password`
- `POST /api/v1/account/deactivate`

### Health (No /api/v1 prefix)
- `GET /health`
- `GET /health/db`

## Troubleshooting

### Issue: "CSRF token required"
**Solution:**
1. Make sure you've logged in first
2. Check that `{{csrfToken}}` variable is set (Collection → Variables)
3. Manually get CSRF token: `GET /auth/csrf`

### Issue: "Authentication required"
**Solution:**
1. Login first: `POST /auth/login`
2. Check cookies are enabled in Postman (Settings → General → Cookies)
3. View cookies: Click **Cookies** link → Check `accessToken` exists

### Issue: "Invalid or expired access token"
**Solution:**
1. Refresh token: `POST /auth/refresh`
2. Or login again: `POST /auth/login`

### Issue: Cookies not being sent
**Solution:**
1. Go to Postman Settings → General
2. Enable **Automatically follow redirects**
3. Enable **Send cookies**
4. Restart Postman

## Testing Tips

### 1. Use Console to Debug
Open Postman Console (View → Show Postman Console) to see:
- Cookie values
- CSRF token extraction logs
- Request/response details

### 2. Check Test Results
After running Login/Register, check the **Test Results** tab to verify:
- ✅ Access token cookie is set
- ✅ Refresh token cookie is set
- ✅ CSRF token cookie is set

### 3. Use Environment Variables
For testing multiple environments (dev, staging, prod):
1. Create environments in Postman
2. Set `baseUrl` for each environment
3. Switch environments as needed

## Security Notes

1. **HttpOnly Cookies**: Access and refresh tokens are HttpOnly, meaning JavaScript cannot access them (security feature)
2. **CSRF Protection**: All unsafe methods require the `X-CSRF-Token` header
3. **Cookie Scope**: Cookies are automatically scoped to the domain
4. **Token Rotation**: Refresh tokens are rotated on each use to prevent replay attacks

## Collection Variables

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `baseUrl` | API base URL | Manual |
| `csrfToken` | CSRF token for unsafe methods | ✅ Auto (from login) |

## Next Steps

1. **Import the collection** into Postman
2. **Login** using the Login request
3. **Explore** the API endpoints
4. **Test** your workflows

Happy testing! 🚀
