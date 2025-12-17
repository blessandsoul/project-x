# Cache Inventory

**Date**: December 2024  
**Status**: Implemented with Versioned Cache Strategy

## Overview

This document inventories all cached API endpoints and their cache invalidation strategy. All mutable entity caches now use **versioned cache keys** to ensure automatic freshness after writes.

## Cache Strategy

### Versioned Cache Keys (Preferred)

Instead of using `KEYS` pattern matching to invalidate caches (O(N) and blocks Redis), we use version keys:

1. **Version key**: `v:{entity}` (e.g., `v:companies` → `5`)
2. **Cache key**: `cache:{entity}:v={version}:{params}` (e.g., `cache:companies:v=5:all`)
3. **On write**: `INCR v:{entity}` → `6`
4. **Result**: Old keys (`v=5`) expire naturally via TTL; new reads use `v=6`

### Benefits

- No Redis SCAN operations (O(1) instead of O(N))
- No blocking during invalidation
- Old cache entries expire naturally
- Atomic version increment

---

## Cached Endpoints Inventory

### Companies (Feature: `companies`)

| Method | Path                             | Cache Key Pattern                                 | TTL    | Versioned | Write Invalidation           |
| ------ | -------------------------------- | ------------------------------------------------- | ------ | --------- | ---------------------------- |
| GET    | `/companies`                     | `cache:companies:v={v}:all`                       | 10 min | ✅        | POST/PUT/DELETE `/companies` |
| GET    | `/companies/search`              | `cache:companies:v={v}:search:{hash}`             | 5 min  | ✅        | POST/PUT/DELETE `/companies` |
| POST   | `/vehicles/:id/calculate-quotes` | `cache:companies:v={v}:quotes:calculate:{params}` | 10 min | ✅        | POST/PUT/DELETE `/companies` |
| GET    | `/vehicles/:id/cheapest-quotes`  | `cache:companies:v={v}:quotes:cheapest:{params}`  | 10 min | ✅        | POST/PUT/DELETE `/companies` |

**Write endpoints that bump `v:companies`:**

- `POST /companies` (create)
- `PUT /companies/:id` (update)
- `DELETE /companies/:id` (delete)

### Vehicles (Feature: `vehicles`)

| Method | Path               | Cache Key Pattern                    | TTL   | Versioned | Write Invalidation     |
| ------ | ------------------ | ------------------------------------ | ----- | --------- | ---------------------- |
| GET    | `/vehicles/search` | `cache:vehicles:v={v}:search:{hash}` | 5 min | ✅        | DELETE `/vehicles/:id` |

**Write endpoints that bump `v:vehicles`:**

- `DELETE /vehicles/:id` (delete)

**Note**: Vehicles are primarily synced from external auction sources (Copart/IAAI), not created via API. The sync jobs should also bump `v:vehicles` when they update vehicle data.

### Reference Data (Already Versioned)

| Method | Path                  | Feature    | Cache Key Pattern                    | TTL    | Versioned |
| ------ | --------------------- | ---------- | ------------------------------------ | ------ | --------- |
| GET    | `/api/cities`         | `cities`   | `cache:cities:v={v}:all`             | 1 hour | ✅        |
| GET    | `/api/ports`          | `ports`    | `cache:ports:v={v}:all`              | 1 hour | ✅        |
| GET    | `/api/auctions`       | `auctions` | `cache:auctions:v={v}:all`           | 1 hour | ✅        |
| GET    | `/api/vehicle-makes`  | `makes`    | `cache:makes:v={v}:{type}`           | 1 hour | ✅        |
| GET    | `/api/vehicle-models` | `models`   | `cache:models:v={v}:{type}:{makeId}` | 1 hour | ✅        |

**Write invalidation**: Sync services call `incrementCacheVersion(fastify, 'cities')` etc.

### Inquiry Stats (Already Versioned)

| Method | Path                       | Feature         | Cache Key Pattern                        | TTL    | Versioned |
| ------ | -------------------------- | --------------- | ---------------------------------------- | ------ | --------- |
| GET    | `/company/inquiries/stats` | `inquiry-stats` | `cache:inquiry-stats:v={v}:company:{id}` | 30 sec | ✅        |

### Immutable Data (Non-Versioned, Safe)

| Method | Path                       | Cache Key Pattern           | TTL      | Notes                      |
| ------ | -------------------------- | --------------------------- | -------- | -------------------------- |
| POST   | `/api/vin/decode`          | `vin:{VIN}`                 | 24 hours | VIN data is immutable      |
| GET    | `/api/auction/active-lots` | `cache:auction:active-lots` | 5 min    | Updated by hourly cron job |

---

## Version Keys

| Key               | Entity             | Bumped By                         |
| ----------------- | ------------------ | --------------------------------- |
| `v:companies`     | Companies, quotes  | POST/PUT/DELETE `/companies/*`    |
| `v:vehicles`      | Vehicles           | DELETE `/vehicles/:id`, sync jobs |
| `v:cities`        | Cities             | `CitiesService.syncCities()`      |
| `v:ports`         | Ports              | `PortsService.syncPorts()`        |
| `v:auctions`      | Auctions           | `AuctionsService.syncAuctions()`  |
| `v:makes`         | Vehicle makes      | Sync jobs                         |
| `v:models`        | Vehicle models     | Sync jobs                         |
| `v:inquiry-stats` | Inquiry statistics | Inquiry create/update             |

---

## TTL Constants

| Constant                | Value        | Use Case                                                |
| ----------------------- | ------------ | ------------------------------------------------------- |
| `CACHE_TTL.LONG`        | 3600s (1h)   | Reference data (cities, ports, auctions, makes, models) |
| `CACHE_TTL.MEDIUM`      | 600s (10m)   | Company list                                            |
| `CACHE_TTL.SHORT`       | 300s (5m)    | Search results                                          |
| `CACHE_TTL.CALCULATION` | 600s (10m)   | Quote calculations                                      |
| `CACHE_TTL.IMMUTABLE`   | 86400s (24h) | VIN decode                                              |
| `CACHE_TTL.REALTIME`    | 30s          | Stats                                                   |
| `CACHE_TTL.ACTIVE_LOTS` | 300s (5m)    | Active auction lots                                     |

---

## Verification

### Manual Test: Cache Freshness After Write

```bash
# 1. Get current companies (cache miss, then hit)
curl http://localhost:3000/companies
curl http://localhost:3000/companies  # Should be cache hit

# 2. Check Redis version
redis-cli GET "v:companies"  # e.g., returns "5"

# 3. Create a new company (as admin)
curl -X POST http://localhost:3000/companies \
  -H "Cookie: access_token=..." \
  -H "X-CSRF-Token: ..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Co","base_price":100,...}'

# 4. Check Redis version again
redis-cli GET "v:companies"  # Should be "6" now

# 5. Get companies again - should include new company
curl http://localhost:3000/companies  # Cache miss (new version), fresh data
```

### Logs to Watch

With debug logging enabled, you should see:

```
Cache hit: cache:companies:v=5:all
...
Cache version incremented: companies -> 6
...
Cache miss: cache:companies:v=6:all
Cache set: cache:companies:v=6:all
```

---

## Files Modified

### This Audit

- `server/src/routes/company.ts`

  - Converted `GET /companies` to `withVersionedCache`
  - Converted `GET /companies/search` to `withVersionedCache`
  - Converted quote calculation endpoints to `withVersionedCache`
  - Added `incrementCacheVersion(fastify, 'companies')` to POST/PUT/DELETE

- `server/src/routes/vehicle.ts`
  - Converted `GET /vehicles/search` to `withVersionedCache`
  - Added `incrementCacheVersion(fastify, 'vehicles')` to DELETE

### Previously Implemented (Already Versioned)

- `server/src/routes/cities.ts` - Uses `withVersionedCache`
- `server/src/routes/ports.ts` - Uses `withVersionedCache`
- `server/src/routes/auctions.ts` - Uses `withVersionedCache`
- `server/src/routes/vehicle-makes.ts` - Uses `withVersionedCache`
- `server/src/routes/vehicle-models.ts` - Uses `withVersionedCache`
- `server/src/routes/companyInquiry.ts` - Uses `withVersionedCache` for stats

---

## Endpoints NOT Cached (By Design)

| Endpoint                              | Reason                                   |
| ------------------------------------- | ---------------------------------------- |
| `/auth/*`                             | Security-critical; DB is source of truth |
| `/auth/me`                            | Must reflect current user state          |
| `/account/*`                          | User-specific mutations                  |
| `/user/favorites/*`                   | User-specific; changes frequently        |
| `/favorites/vehicles`                 | User-specific; changes frequently        |
| `/inquiries/*`                        | Real-time messaging                      |
| `/company/inquiries/*` (except stats) | Real-time messaging                      |
| `/health/*`                           | Must reflect actual system state         |
| All POST/PUT/PATCH/DELETE             | Mutations should not be cached           |
