# User Dashboard – Backend TODO

This file describes which backend APIs already exist for the **User Dashboard** and which parts of the UI are currently backed by **mock data** and require new endpoints.

## 1. Existing APIs that can be used

### 1.1 Companies listing & recommendations

**Docs:** `docs/companies-api.md`

- `GET /companies/search`
  - Filters: `min_rating`, `city`, `country`, `is_vip`, `max_total_fee`, etc.
  - Sorting: `order_by=rating|cheapest|name|newest` + `order_direction`.
  - Response items include: `id`, `name`, `logo`, `rating`, `reviewCount`, `is_vip`, `country`, `city`, pricing fields.

**Can power UI blocks:**

- Recommended companies for user:
  - e.g. `GET /companies/search?order_by=rating&order_direction=desc&min_rating=4`.
- General company catalog / explore sections.

### 1.2 Company details & reviews

**Docs:** `docs/companies-api.md`

- `GET /companies/:id`
  - One company with `rating` and aggregated `reviewCount`.
- `GET /companies/:companyId/reviews`
  - Paginated list of reviews.

**Can power UI blocks:**

- Deep-link from dashboard tiles to company details.
- Future: dashboard summary showing latest review snippets (if needed).

### 1.3 Vehicles & quotes (for open requests concept)

**Docs:** `docs/vehicles-and-quotes-api.md`

- `POST /vehicles/:vehicleId/calculate-quotes`
- `GET /vehicles/:vehicleId/quotes`

**Can power UI blocks conceptually:**

- "Open requests / price quotes" if we bind quotes to a user or to their recent vehicles.

> Note: currently quotes are not user-specific; binding to a user will require additional API design.

---

## 2. UI pieces currently backed by MOCK DATA (need API)

The following parts of the **User Dashboard** are currently implemented with local state + mock data on the frontend.

### 2.1 Favorites and Recently Viewed companies (**MOCK DATA**)

Frontend:

- Hooks: `useFavorites`, `useRecentlyViewed`.
- Data source: `mockCompanies` on the client.

Missing backend APIs:

1. **User favorites companies**

   - **Endpoint idea:** `GET /user/favorites`
   - **Purpose:** return the list of companies favorited by the authenticated user.
   - **Auth:** JWT required.
   - **Response (example):**

   ```jsonc
   {
     "items": [
       {
         "company_id": 10,
         "added_at": "2025-11-16T00:00:00.000Z"
       }
     ]
   }
   ```

   - Additional write endpoints:
     - `POST /user/favorites/:companyId`
     - `DELETE /user/favorites/:companyId`

2. **User recently viewed companies**

   - **Endpoint idea:** `GET /user/recent-companies`
   - **Purpose:** recently viewed companies history for the user.
   - **Auth:** JWT required.
   - **Response (example):**

   ```jsonc
   {
     "items": [
       {
         "company_id": 10,
         "viewed_at": "2025-11-16T10:15:00.000Z"
       }
     ]
   }
   ```

   - Optional write endpoint for server-side tracking:
     - `POST /user/recent-companies` with `{ "company_id": number }` when a company page is opened.

> **Status:** All favorites/recent data in the current dashboard is MOCK DATA and stored only in frontend hooks. Backend endpoints do not exist yet.

### 2.2 User activity stats (**MOCK DATA**)

Frontend data:

- `activityStats` with fields like:
  - `viewedCount`, `favoritesCount`, `requestsCount`.
- Currently derived from frontend hooks and mock arrays.

Missing backend API:

- **Endpoint idea:** `GET /dashboard/user-stats`
- **Purpose:** aggregated counts for the authenticated user.
- **Auth:** JWT required.
- **Expected Data (OpenAPI-style):**

```yaml
# TODO-FX: Replace mock activityStats with real API.
# API Endpoint: GET /dashboard/user-stats
# Summary: Return aggregated user activity metrics for the dashboard.
# Response 200:
#   type: object
#   properties:
#     viewedCount:
#       type: integer
#       example: 12
#     favoritesCount:
#       type: integer
#       example: 4
#     requestsCount:
#       type: integer
#       example: 1
```

### 2.3 Open requests / quotes list in dashboard (**MOCK DATA**)

Frontend:

- `mockOpenRequests` – synthetic list of "open requests / price quotes".

There is no user-facing requests/quotes API.

Missing backend API (conceptual):

- `GET /user/requests` or `GET /user/quotes`:
  - List of quotes/requests the user has created and that are in an "open" state.

Example sketch:

```yaml
# TODO-FX: Design user-specific quotes API.
# API Endpoint: GET /user/quotes
# Summary: List quotes associated with the authenticated user.
# Response 200:
#   type: object
#   properties:
#     items:
#       type: array
#       items:
#         type: object
#         properties:
#           id:
#             type: integer
#           companyName:
#             type: string
#           vehicleId:
#             type: integer
#           status:
#             type: string
#             example: "open"
```

### 2.4 Guides, Special Offers, Reminders (**MOCK DATA**)

Frontend:

- `mockGuides` – helpful articles.
- `mockOffers` – promo offers.
- `mockReminders` – reminder messages.

No corresponding API in `server/docs` currently.

Possible future endpoints:

- `GET /content/guides`
- `GET /content/offers`
- `GET /dashboard/user-reminders`

All three blocks are **purely demo/mocked** today and should be clearly marked as such in frontend comments.
