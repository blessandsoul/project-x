# Shared Dashboard Components – Backend TODO

This file covers shared dashboard pieces used across roles (User/Dealer/Company) and how they map to existing or missing backend APIs.

## 1. SectionCards (high-level KPI cards)

Component: `components/section-cards.tsx`

Current state:

- All displayed numbers (leads, listings, deals, margin, views, quotes, conv%, rating, totals) are **hard-coded constants** in the frontend.
- They are animated for UX, but not backed by real data.

**Status:** 100% MOCK DATA.

### Suggested backend direction

Instead of many separate endpoints, consider a single role-aware endpoint:

- `GET /dashboard/summary`
  - Authenticated, uses user role (user/dealer/company) from JWT.
  - Returns a structure like:

```yaml
# API Endpoint: GET /dashboard/summary
# Summary: Role-aware top-level KPI metrics for SectionCards.
# Response 200:
#   type: object
#   properties:
#     role:
#       type: string
#       enum: ["user", "dealer", "company"]
#     kpis:
#       type: array
#       items:
#         type: object
#         properties:
#           key:
#             type: string
#             example: "dealer.leads"
#           label:
#             type: string
#           value:
#             type: number
#           trend:
#             type: string
#             enum: ["up", "down", "flat"]
```

Frontend can then map `kpis` into cards for each role.

---

## 2. CompanyTile (company list tile)

Component: `components/dashboard/CompanyTile.tsx`

Current state:

- Uses props shaped like the frontend mock type `Company`:
  - `id`, `name`, `logo`, `rating`, `reviewCount`, `vipStatus`, `location.city`, `location.state`.
- On the backend side, very similar data already exists:
  - `GET /companies`
  - `GET /companies/search`

**Status:**

- Data shape is close to real backend responses.
- Only `location` nesting is purely frontend; backend uses flat `city` / `country` fields.

### Existing APIs to use

From `docs/companies-api.md`:

- `GET /companies`
- `GET /companies/search`

These include:

- `id`, `name`, `logo`, `rating`, `reviewCount`, `city`, `country`, `is_vip` (and more).

### Minimal alignment needed

Frontend `Company` type should be adjusted to match backend:

- `location.city` → `city`
- `location.state` → could be derived or mapped from backend fields if/when added.
- `vipStatus` → `is_vip` from backend.

No new backend endpoints are required specifically for `CompanyTile`; we only need to:

- Use real responses from `/companies` or `/companies/search` in dashboard containers.
- Map fields appropriately on the client.

---

## 3. Favorites / Recently Viewed (shared concept)

Conceptually shared across dashboard and possibly other pages.

See `dashboard-user.md` for detailed API TODOs; recap:

- `GET /user/favorites` (+ POST/DELETE)
- `GET /user/recent-companies` (+ optional POST)

These APIs, once implemented, will be used not only by the dashboard but also by catalog/company detail pages.

---

## 4. Error & loading states

Skeleton and error states in the dashboard currently:

- Use local flags like `isDashboardLoading` and `dashboardError` (hard-coded in frontend).

To wire them to real data, we should:

- Tie these flags to real API calls:
  - `/dashboard/summary`
  - `/companies/search`
  - user-specific endpoints (`/user/favorites`, etc.).

No additional backend endpoints are required purely for skeletons; they will derive from the existing/future API calls above.
