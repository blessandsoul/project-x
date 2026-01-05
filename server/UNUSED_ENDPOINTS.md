# Deprecated/Potentially Unused Server Endpoints Analysis

**Date:** 2025-12-26
**Analysis Method:** Cross-referenced server routes with client-side API usage

## ⚠️ Confirmed Unused Endpoints

These endpoints exist in the server but have **NO client-side usage** found:

### 1. Auction Active Lots
- `GET /api/auction/active-lots` (auction.ts)
- **Status:** No client calls found
- **Recommendation:** Likely a backend-only job API or deprecated

### 2. Auctions List  
- `GET /api/auctions` (auctions.ts)
- **Status:** No client calls found
- **Recommendation:** Check if used by any external service

### 3. Cheapest Quotes
- `GET /vehicles/:vehicleId/cheapest-quotes` (company.ts)
- **Status:** No client calls found
- **Recommendation:** May have been replaced by `POST /vehicles/:vehicleId/calculate-quotes`

### 4. Admin User Management (entire section)
- `GET /admin/users` (user.ts)
- `GET /admin/users/:id` (user.ts)
- `PATCH /admin/users/:id` (user.ts)
- `DELETE /admin/users/:id` (user.ts)
- **Status:** No admin panel implemented yet in client
- **Recommendation:** Keep if admin dashboard is planned

### 5. Company Inquiries (company-side endpoints)
- `GET /company/inquiries` (companyInquiry.ts)
- `GET /company/inquiries/stats` (companyInquiry.ts)
- `GET /company/inquiries/:id` (companyInquiry.ts)
- `PATCH /company/inquiries/:id` (companyInquiry.ts)
- `GET /company/inquiries/:id/messages` (companyInquiry.ts)
- `POST /company/inquiries/:id/messages` (companyInquiry.ts)
- `POST /company/inquiries/:id/mark-read` (companyInquiry.ts)
- **Status:** Company dashboard inquiry management not implemented in client
- **Recommendation:** Keep if company dashboard is planned

### 6. Health Check Extended
- `GET /health/db` (health.ts)
- `GET /health/socket` (health.ts)
- **Status:** Infrastructure/DevOps endpoints
- **Recommendation:** Keep for monitoring purposes

## ✅ In Postman But NOT in Server (Deprecated in Collection)

No deprecated endpoints found in Postman collection - all Postman endpoints map to existing server routes.

## 📊 Summary

| Category | Count | Action |
|----------|-------|--------|
| Server endpoints total | 91 | - |
| Used by client | ~70 | Keep |
| Admin endpoints (no UI) | 4 | Keep for future |
| Company inquiry endpoints (no UI) | 7 | Keep for future |
| Health/monitoring endpoints | 2 | Keep for ops |
| Potentially deprecated | 3 | Review |

## 🔴 Candidates for Removal

If you want to clean up truly unused code, consider reviewing:

1. **`GET /api/auction/active-lots`** - No apparent usage
2. **`GET /api/auctions`** - No apparent usage  
3. **`GET /vehicles/:vehicleId/cheapest-quotes`** - Possibly replaced by calculate-quotes

## Notes

- Many "unused" endpoints are for features not yet built in client (admin panel, company dashboard)
- Health endpoints are typically used by infrastructure monitoring
- The inquiry system has both user-side and company-side endpoints - check if company dashboard is planned