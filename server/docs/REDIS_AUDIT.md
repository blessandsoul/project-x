# Redis Audit Report

**Date**: December 2024  
**Status**: Implemented

## Executive Summary

This document provides a comprehensive audit of all API endpoints and their Redis integration decisions.

### Changes Made

1. **Enhanced Cache Utilities** (`server/src/utils/cache.ts`)

   - Added version-key based cache invalidation (avoids O(N) KEYS scan)
   - New TTL constants: `IMMUTABLE` (24h), `REALTIME` (30s), `ACTIVE_LOTS` (5m)
   - New functions: `getCacheVersion`, `incrementCacheVersion`, `buildVersionedCacheKey`, `withVersionedCache`
   - Cache invalidation helpers: `invalidateCompanyCache`, `invalidateVehicleCache`, `invalidateReferenceDataCache`

2. **New Rate Limiting Utility** (`server/src/utils/rateLimit.ts`)

   - Redis-backed rate limiting for PM2 cluster consistency
   - Fixed-window algorithm with INCR + EXPIRE
   - Configurable fail-open/fail-closed behavior
   - Pre-configured limits for common endpoints

3. **Caching Added To**:

   - `/api/cities` - 1 hour TTL (versioned)
   - `/api/ports` - 1 hour TTL (versioned)
   - `/api/auctions` - 1 hour TTL (versioned)
   - `/api/vehicle-makes` - 1 hour TTL (versioned)
   - `/api/vehicle-models` - 1 hour TTL (versioned)
   - `/api/vin/decode` - 24 hour TTL (immutable VIN data)
   - `/api/auction/active-lots` - 5 min TTL
   - `/company/inquiries/stats` - 30 sec TTL (versioned, per-company)

4. **Rate Limiting Added To**:

   - `/user/avatar` (POST/PUT) - 10/min per user
   - `/companies/:id/logo` (POST/PUT) - 10/min per user
   - `/inquiries` (POST) - 20/min per user
   - `/inquiries/:id/messages` (POST) - 60/min per user
   - `/company/inquiries/:id/messages` (POST) - 60/min per user
   - `/auction/calculate-shipping` (POST) - 30/min per IP
   - `/api/calculator` (POST) - 30/min per IP

5. **Cache Invalidation On Writes**:
   - `CitiesService.syncCities()` → increments `v:cities`
   - `PortsService.syncPorts()` → increments `v:ports`
   - `AuctionsService.syncAuctions()` → increments `v:auctions`

## Current Redis Infrastructure

### Existing Utilities (`server/src/utils/cache.ts`)

- `withCache<T>()` - Higher-order caching function
- `getFromCache<T>()` / `setInCache()` - Basic get/set
- `buildCacheKey()` / `buildCacheKeyFromObject()` - Key generation
- `invalidateCachePattern()` - Pattern-based invalidation (uses KEYS - O(N))
- `invalidateUserCache()` - User-specific cache invalidation

### Existing Idempotency (`server/src/utils/idempotency.ts`)

- `withIdempotency<T>()` - DB-based idempotency via `idempotency_keys` table
- **Note**: Currently uses MySQL, NOT Redis

### Existing Rate Limiting

- `@fastify/rate-limit` plugin with in-memory store (default)
- Per-route config on auth endpoints

---

## Endpoint Inventory Table

| Method                   | Path                                    | Auth        | Read-Heavy | Cache Safe | Rate Limit | Idempotency | Redis Pattern                                     |
| ------------------------ | --------------------------------------- | ----------- | ---------- | ---------- | ---------- | ----------- | ------------------------------------------------- |
| **HEALTH**               |
| GET                      | /health                                 | No          | Yes        | No         | No         | No          | none                                              |
| GET                      | /health/db                              | No          | Yes        | No         | No         | No          | none                                              |
| GET                      | /health/socket                          | No          | Yes        | No         | No         | No          | none                                              |
| **AUTH**                 |
| POST                     | /auth/register                          | No          | No         | No         | Yes ✓      | No          | rate-limit                                        |
| POST                     | /auth/login                             | No          | No         | No         | Yes ✓      | No          | rate-limit                                        |
| POST                     | /auth/refresh                           | Cookie      | No         | No         | Yes ✓      | No          | rate-limit                                        |
| POST                     | /auth/logout                            | Cookie      | No         | No         | No         | No          | none                                              |
| GET                      | /auth/me                                | Cookie      | Yes        | No         | No         | No          | none                                              |
| GET                      | /auth/csrf                              | No          | No         | No         | Yes ✓      | No          | rate-limit                                        |
| GET                      | /auth/sessions                          | Cookie      | Yes        | No         | No         | No          | none                                              |
| DELETE                   | /auth/sessions                          | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| DELETE                   | /auth/sessions/:sessionId               | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| **ACCOUNT**              |
| PATCH                    | /account                                | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| POST                     | /account/change-password                | Cookie+CSRF | No         | No         | Yes ✓      | No          | rate-limit                                        |
| POST                     | /account/deactivate                     | Cookie+CSRF | No         | No         | Yes ✓      | No          | rate-limit                                        |
| **USER**                 |
| POST                     | /user/avatar                            | Cookie+CSRF | No         | No         | Yes        | No          | rate-limit                                        |
| PUT                      | /user/avatar                            | Cookie+CSRF | No         | No         | Yes        | No          | rate-limit                                        |
| GET                      | /user/avatar                            | Cookie      | Yes        | No         | No         | No          | none                                              |
| DELETE                   | /user/avatar                            | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| GET                      | /user/favorites/companies               | Cookie      | Yes        | No         | No         | No          | none                                              |
| POST                     | /user/favorites/companies/:companyId    | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| DELETE                   | /user/favorites/companies/:companyId    | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| **ADMIN USERS**          |
| GET                      | /admin/users                            | Admin       | Yes        | Yes        | No         | No          | cache (short)                                     |
| GET                      | /admin/users/:id                        | Admin       | Yes        | Yes        | No         | No          | cache (short)                                     |
| PATCH                    | /admin/users/:id                        | Admin+CSRF  | No         | No         | No         | No          | none                                              |
| DELETE                   | /admin/users/:id                        | Admin+CSRF  | No         | No         | No         | No          | none                                              |
| **COMPANIES**            |
| GET                      | /companies                              | No          | Yes        | Yes ✓      | No         | No          | cache ✓                                           |
| GET                      | /companies/search                       | No          | Yes        | Yes ✓      | No         | No          | cache ✓                                           |
| GET                      | /companies/:id                          | No          | Yes        | Yes        | No         | No          | cache                                             |
| POST                     | /companies                              | Admin+CSRF  | No         | No         | No         | No          | none                                              |
| PUT                      | /companies/:id                          | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| DELETE                   | /companies/:id                          | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| POST                     | /companies/onboard                      | Cookie+CSRF | No         | No         | Yes ✓      | No          | rate-limit                                        |
| **COMPANY LOGOS**        |
| POST                     | /companies/:id/logo                     | Cookie+CSRF | No         | No         | Yes        | No          | rate-limit                                        |
| PUT                      | /companies/:id/logo                     | Cookie+CSRF | No         | No         | Yes        | No          | rate-limit                                        |
| GET                      | /companies/:id/logo                     | No          | Yes        | Yes        | No         | No          | cache                                             |
| DELETE                   | /companies/:id/logo                     | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| **COMPANY SOCIAL LINKS** |
| GET                      | /companies/:companyId/social-links      | No          | Yes        | Yes        | No         | No          | cache                                             |
| POST                     | /companies/:companyId/social-links      | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| PUT                      | /social-links/:id                       | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| DELETE                   | /social-links/:id                       | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| **COMPANY REVIEWS**      |
| GET                      | /companies/:companyId/reviews           | No          | Yes        | Yes        | No         | No          | cache                                             |
| POST                     | /companies/:companyId/reviews           | Cookie+CSRF | No         | No         | Yes        | Yes ✓       | rate-limit + idempotency                          |
| PUT                      | /companies/:companyId/reviews/:reviewId | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| DELETE                   | /companies/:companyId/reviews/:reviewId | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| **VEHICLES**             |
| GET                      | /vehicles                               | No          | Yes        | Yes        | No         | No          | cache                                             |
| GET                      | /vehicles/search                        | No          | Yes        | Yes ✓      | No         | No          | cache ✓                                           |
| GET                      | /vehicles/:id                           | No          | Yes        | Yes        | No         | No          | cache                                             |
| GET                      | /vehicles/:id/similar                   | No          | Yes        | Yes        | No         | No          | cache                                             |
| GET                      | /vehicles/:id/photos                    | No          | Yes        | Yes        | No         | No          | cache                                             |
| GET                      | /vehicles/:id/full                      | No          | Yes        | Yes        | No         | No          | cache                                             |
| DELETE                   | /vehicles/:id                           | Admin+CSRF  | No         | No         | No         | No          | none                                              |
| **QUOTES**               |
| POST                     | /vehicles/:vehicleId/calculate-quotes   | No          | No         | Yes ✓      | Yes        | No          | cache ✓ + rate-limit                              |
| GET                      | /vehicles/:vehicleId/cheapest-quotes    | No          | Yes        | Yes ✓      | No         | No          | cache ✓                                           |
| POST                     | /vehicles/search-quotes                 | No          | No         | Yes        | Yes        | No          | cache + rate-limit                                |
| POST                     | /vehicles/compare                       | No          | No         | Yes        | Yes        | No          | cache + rate-limit                                |
| GET                      | /vehicles/:vehicleId/quotes             | No          | Yes        | Yes        | No         | No          | cache                                             |
| GET                      | /companies/:companyId/quotes            | No          | Yes        | Yes        | No         | No          | cache                                             |
| POST                     | /quotes                                 | Admin+CSRF  | No         | No         | No         | Yes ✓       | idempotency                                       |
| PUT                      | /quotes/:id                             | Admin+CSRF  | No         | No         | No         | No          | none                                              |
| DELETE                   | /quotes/:id                             | Admin+CSRF  | No         | No         | No         | No          | none                                              |
| **FAVORITES**            |
| GET                      | /favorites/vehicles                     | Cookie      | Yes        | No         | No         | No          | none                                              |
| POST                     | /favorites/vehicles/:vehicleId          | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| DELETE                   | /favorites/vehicles/:vehicleId          | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| **INQUIRIES (User)**     |
| POST                     | /inquiries                              | Cookie+CSRF | No         | No         | Yes        | No          | rate-limit                                        |
| GET                      | /inquiries                              | Cookie      | Yes        | No         | No         | No          | none                                              |
| GET                      | /inquiries/:id                          | Cookie      | Yes        | No         | No         | No          | none                                              |
| PATCH                    | /inquiries/:id                          | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| GET                      | /inquiries/:id/messages                 | Cookie      | Yes        | No         | No         | No          | none                                              |
| POST                     | /inquiries/:id/messages                 | Cookie+CSRF | No         | No         | Yes        | Yes ✓       | rate-limit (DB idempotency via client_message_id) |
| GET                      | /inquiries/:id/unread-count             | Cookie      | Yes        | No         | No         | No          | none                                              |
| POST                     | /inquiries/:id/mark-read                | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| **INQUIRIES (Company)**  |
| GET                      | /company/inquiries                      | Cookie      | Yes        | No         | No         | No          | none                                              |
| GET                      | /company/inquiries/stats                | Cookie      | Yes        | Yes        | No         | No          | cache (short)                                     |
| GET                      | /company/inquiries/:id                  | Cookie      | Yes        | No         | No         | No          | none                                              |
| PATCH                    | /company/inquiries/:id                  | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| GET                      | /company/inquiries/:id/messages         | Cookie      | Yes        | No         | No         | No          | none                                              |
| POST                     | /company/inquiries/:id/messages         | Cookie+CSRF | No         | No         | Yes        | Yes ✓       | rate-limit (DB idempotency via client_message_id) |
| POST                     | /company/inquiries/:id/mark-read        | Cookie+CSRF | No         | No         | No         | No          | none                                              |
| **REFERENCE DATA**       |
| GET                      | /api/cities                             | No          | Yes        | Yes        | No         | No          | cache (long)                                      |
| GET                      | /api/ports                              | No          | Yes        | Yes        | No         | No          | cache (long)                                      |
| GET                      | /api/auctions                           | No          | Yes        | Yes        | No         | No          | cache (long)                                      |
| GET                      | /api/vehicle-makes                      | No          | Yes        | Yes        | No         | No          | cache (long)                                      |
| GET                      | /api/vehicle-models                     | No          | Yes        | Yes        | No         | No          | cache (long)                                      |
| **VIN**                  |
| POST                     | /api/vin/decode                         | No          | No         | Yes        | Yes ✓      | No          | cache + rate-limit                                |
| GET                      | /api/vin/health                         | No          | Yes        | No         | Yes ✓      | No          | rate-limit                                        |
| **AUCTION**              |
| GET                      | /api/auction/active-lots                | No          | Yes        | Yes        | No         | No          | cache                                             |
| POST                     | /auction/calculate-shipping             | No          | No         | Yes        | Yes        | No          | cache + rate-limit                                |
| **CALCULATOR**           |
| POST                     | /api/calculator                         | No          | No         | Yes        | Yes        | No          | cache + rate-limit                                |

---

## Implementation Plan

### 1. Rate Limiting Enhancements (Redis-backed)

**Current State**: Using `@fastify/rate-limit` with in-memory store (not PM2-cluster safe)

**Action**: Configure Redis store for rate limiting to ensure consistency across PM2 workers.

**Endpoints needing rate limiting**:

- `/user/avatar` (POST/PUT) - 10/min
- `/companies/:id/logo` (POST/PUT) - 10/min
- `/inquiries` (POST) - 20/min
- `/inquiries/:id/messages` (POST) - 60/min
- `/company/inquiries/:id/messages` (POST) - 60/min
- `/vehicles/:vehicleId/calculate-quotes` (POST) - 30/min
- `/vehicles/search-quotes` (POST) - 30/min
- `/vehicles/compare` (POST) - 30/min
- `/auction/calculate-shipping` (POST) - 30/min
- `/api/calculator` (POST) - 30/min

### 2. Caching Additions

**Already Cached** (verified in code):

- `GET /companies` - 10 min
- `GET /companies/search` - 5 min
- `GET /vehicles/search` - 5 min
- `POST /vehicles/:vehicleId/calculate-quotes` - 10 min
- `GET /vehicles/:vehicleId/cheapest-quotes` - 10 min

**Should Add Caching**:

- `GET /api/cities` - 1 hour (rarely changes)
- `GET /api/ports` - 1 hour (rarely changes)
- `GET /api/auctions` - 1 hour (rarely changes)
- `GET /api/vehicle-makes` - 1 hour (rarely changes)
- `GET /api/vehicle-models` - 1 hour (rarely changes)
- `GET /companies/:id` - 5 min
- `GET /companies/:companyId/reviews` - 2 min
- `GET /company/inquiries/stats` - 30 sec (user-scoped)
- `POST /api/vin/decode` - 24 hours (VIN data is immutable)
- `GET /api/auction/active-lots` - 5 min

### 3. Idempotency

**Current State**:

- DB-based idempotency via `idempotency_keys` table
- Message idempotency via `client_message_id` column with DB unique constraint

**Decision**: Keep DB-based idempotency. Redis idempotency is NOT needed because:

1. DB constraints already guarantee uniqueness
2. `client_message_id` provides message-level idempotency
3. DB-based approach survives Redis outages

### 4. Endpoints NOT Using Redis (with justification)

| Endpoint                             | Reason                                                   |
| ------------------------------------ | -------------------------------------------------------- |
| `/auth/*`                            | Session data is security-critical; DB is source of truth |
| `/auth/me`                           | Must always reflect current user state                   |
| `/account/*`                         | User-specific mutations; caching risks stale data        |
| `/user/favorites/*`                  | User-specific; changes frequently                        |
| `/favorites/vehicles`                | User-specific; changes frequently                        |
| `/inquiries/*` (list/detail)         | Real-time messaging; stale data unacceptable             |
| `/company/inquiries/*` (list/detail) | Real-time messaging; stale data unacceptable             |
| `/health/*`                          | Must reflect actual system state                         |
| All DELETE/PATCH/PUT                 | Mutations should not be cached                           |

## Key Format Standards

```sql
# Versioned Caching (preferred - avoids KEYS scan)
cache:<feature>:v=<version>:<params>
cache:cities:v=5:all
cache:ports:v=3:all
cache:auctions:v=2:all
cache:makes:v=1:car
cache:models:v=1:car:452
cache:inquiry-stats:v=1:company:123

# Non-versioned Caching (for immutable/simple data)
cache:vin:<VIN>
cache:auction:active-lots
cache:companies:all
cache:companies:search:<hash>
cache:vehicles:search:<hash>
cache:quotes:calculate:<vehicleId>:<auction>:<city>:<currency>:<limit>:<offset>
cache:quotes:cheapest:<vehicleId>:<currency>:<limit>

# Rate Limiting
rl:avatar:user:<userId>
rl:avatar:ip:<ip>
rl:logo:user:<userId>
rl:inquiry:create:user:<userId>
rl:message:send:user:<userId>
rl:calculator:ip:<ip>
rl:shipping:calc:ip:<ip>

# Version Keys (for invalidation without KEYS scan)
v:cities
v:ports
v:auctions
v:makes
v:models
v:companies
v:vehicles
v:inquiry-stats
```

## TTL Defaults

| Cache Type                                              | TTL              | Constant                   | Rationale                     |
| ------------------------------------------------------- | ---------------- | -------------------------- | ----------------------------- |
| Reference data (cities, ports, auctions, makes, models) | 3600s (1h)       | `CACHE_TTL.LONG`           | Rarely changes, synced daily  |
| Company list/search                                     | 300-600s (5-10m) | `CACHE_TTL.SHORT`/`MEDIUM` | Changes occasionally          |
| Vehicle search                                          | 300s (5m)        | `CACHE_TTL.SHORT`          | New vehicles added frequently |
| Quote calculations                                      | 600s (10m)       | `CACHE_TTL.CALCULATION`    | Prices stable short-term      |
| VIN decode                                              | 86400s (24h)     | `CACHE_TTL.IMMUTABLE`      | VIN data is immutable         |
| Company stats                                           | 30s              | `CACHE_TTL.REALTIME`       | User expects near-real-time   |
| Active lots                                             | 300s (5m)        | `CACHE_TTL.ACTIVE_LOTS`    | Updated hourly by cron        |

---

## Manual Test Plan

### 1. Cache Hit/Miss Verification

```bash
# Test cities caching
curl http://localhost:3000/api/cities  # First call - cache miss
curl http://localhost:3000/api/cities  # Second call - cache hit (check logs)

# Verify in Redis
redis-cli KEYS "app:cache:cities:*"
redis-cli GET "app:v:cities"
```

### 2. Cache Invalidation Verification

```bash
# Get current version
redis-cli GET "app:v:cities"

# Trigger sync (manually or wait for cron)
# Version should increment after sync
redis-cli GET "app:v:cities"

# Next API call should miss cache (new version)
curl http://localhost:3000/api/cities
```

### 3. Rate Limiting Verification

```bash
# Test avatar upload rate limit (10/min)
for i in {1..12}; do
  curl -X POST http://localhost:3000/user/avatar \
    -H "Cookie: access_token=..." \
    -H "X-CSRF-Token: ..." \
    -F "file=@test.jpg"
  echo "Request $i"
done
# Requests 11-12 should return 429

# Check rate limit key in Redis
redis-cli KEYS "app:rl:avatar:*"
```

### 4. PM2 Cluster Rate Limit Consistency

```bash
# Start multiple workers
pm2 start ecosystem.config.cjs -i 4

# Send requests rapidly - should be rate limited consistently
# regardless of which worker handles each request
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/calculator \
    -H "Content-Type: application/json" \
    -d '{"buyprice":1000,"auction":"copart","vehicletype":"standard"}' &
done
wait
```

### 5. Redis Failure Graceful Degradation

```bash
# Stop Redis
redis-cli SHUTDOWN

# API should still work (fail-open for caching)
curl http://localhost:3000/api/cities  # Should return from DB

# Rate limiting should fail-open (allow requests)
curl -X POST http://localhost:3000/api/calculator ...

# Restart Redis
redis-server
```

---

## Endpoints NOT Using Redis (with justification)

| Endpoint                                      | Reason                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/auth/*` (login, register, refresh, logout)  | Session data is security-critical; DB is source of truth. Already has Fastify rate limiting. |
| `/auth/me`                                    | Must always reflect current user state (blocked, deactivated).                               |
| `/account/*`                                  | User-specific mutations; caching risks stale data.                                           |
| `/user/favorites/*`                           | User-specific; changes frequently.                                                           |
| `/favorites/vehicles`                         | User-specific; changes frequently.                                                           |
| `/inquiries/*` (list/detail/messages)         | Real-time messaging; stale data unacceptable.                                                |
| `/company/inquiries/*` (list/detail/messages) | Real-time messaging; stale data unacceptable.                                                |
| `/health/*`                                   | Must reflect actual system state.                                                            |
| All DELETE/PATCH/PUT                          | Mutations should not be cached.                                                              |
| `/admin/users/*`                              | Admin operations; correctness > speed.                                                       |

---

## Files Modified

### New Files

- `server/src/utils/rateLimit.ts` - Redis-backed rate limiting utility
- `server/docs/REDIS_AUDIT.md` - This documentation

### Modified Files

- `server/src/utils/cache.ts` - Added version-key invalidation, new TTLs
- `server/src/routes/cities.ts` - Added versioned caching
- `server/src/routes/ports.ts` - Added versioned caching
- `server/src/routes/auctions.ts` - Added versioned caching
- `server/src/routes/vehicle-makes.ts` - Added versioned caching
- `server/src/routes/vehicle-models.ts` - Added versioned caching
- `server/src/routes/vin.ts` - Added VIN decode caching
- `server/src/routes/auction.ts` - Added active-lots caching, shipping rate limit
- `server/src/routes/calculator.ts` - Added rate limiting
- `server/src/routes/inquiry.ts` - Added rate limiting
- `server/src/routes/companyInquiry.ts` - Added stats caching, message rate limit
- `server/src/routes/user.ts` - Added avatar upload rate limiting
- `server/src/routes/company.ts` - Added logo upload rate limiting
- `server/src/services/CitiesService.ts` - Added cache invalidation on sync
- `server/src/services/PortsService.ts` - Added cache invalidation on sync
- `server/src/services/AuctionsService.ts` - Added cache invalidation on sync
