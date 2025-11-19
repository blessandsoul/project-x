# Company Dashboard – Backend TODO

This file describes existing APIs and missing pieces for the **Company (network) Dashboard**.

## 1. Existing APIs that could be reused

From `docs/companies-api.md` and `docs/vehicles-and-quotes-api.md`:

- `GET /companies`
- `GET /companies/:id`
- `GET /companies/:companyId/reviews`
- `GET /companies/:companyId/quotes`

These can provide:

- Basic company info (name, logo, city/country, rating, reviewCount).
- Detailed reviews for a specific company.
- Quotes per company across vehicles (for pricing/performance analysis).

However, **there is no concept of "network" (multiple dealers, aggregated brand health, network alerts, goals, etc.) in current docs.**

---

## 2. UI blocks that are currently MOCK DATA

Every metric in the **Company Dashboard** is built from frontend-only mock data. Below are the main blocks.

### 2.1 Network stats (**MOCK DATA**)

Frontend:

- `companyNetworkStats`:
  - `totalProfileViews`, `dealersCount`, `activeCompaniesCount`.

Missing backend API:

```yaml
# TODO-FX: Implement company network stats.
# API Endpoint: GET /dashboard/company/network-stats
# Summary: Aggregated stats for a company network (OEM or importer group).
# Response 200:
#   type: object
#   properties:
#     totalProfileViews:
#       type: integer
#     dealersCount:
#       type: integer
#     activeCompaniesCount:
#       type: integer
```

### 2.2 Dealer activity by state (**MOCK DATA**)

Frontend:

- `companyDealerActivityByState`: top states with `state`, `leads`.

Missing backend API:

- `GET /dashboard/company/dealer-activity-by-state`

Expected response (example):

```yaml
# Response 200:
#   type: object
#   properties:
#     items:
#       type: array
#       items:
#         type: object
#         properties:
#           state:
#             type: string
#           leads:
#             type: integer
```

### 2.3 Brand health (**MOCK DATA**)

Frontend:

- `companyBrandHealth`:
  - `averageRating`, `totalReviews`.

We can reuse review data from:

- `GET /companies/:companyId/reviews`

But we still need an aggregated summary endpoint:

- `GET /dashboard/company/brand-health`
  - Could internally aggregate from the reviews table across all dealers.

### 2.4 Service quality (**MOCK DATA**)

Frontend fields:

- `companyServiceQuality`:
  - `avgReplyMinutes`, `handledPercent`.

Missing backend API:

- `GET /dashboard/company/service-quality`
  - Needs real support data (tickets, response times) in DB.

### 2.5 Campaigns, audience segments, competitors (**MOCK DATA**)

Frontend:

- `companyCampaigns` – marketing campaigns with impressions/clicks/leads.
- `companyAudienceSegments` – segments with sharePercent.
- `companyCompetitors` – competitor rating & trend.

None of these are present in current backend docs.

Possible future endpoints:

- `GET /dashboard/company/campaigns`
- `GET /dashboard/company/audience-segments`
- `GET /dashboard/company/competitors`

### 2.6 Alerts, network actions, goals (**MOCK DATA**)

Frontend:

- `companyAlerts` – risk/alert messages.
- `companyNetworkActions` – list of quick actions for network management.
- `companyGoals` – goals with `label`, `progressPercent`.

Missing backend APIs:

- `GET /dashboard/company/alerts`
- `GET /dashboard/company/actions`
- `GET /dashboard/company/goals`

Example for goals:

```yaml
# TODO-FX: Implement company goals API.
# API Endpoint: GET /dashboard/company/goals
# Response 200:
#   type: object
#   properties:
#     items:
#       type: array
#       items:
#         type: object
#         properties:
#           id:
#             type: string
#           label:
#             type: string
#           progressPercent:
#             type: integer
```

All of these sections are **demo/network analytics** and currently have **no backend implementation**; they should remain explicitly marked as MOCK DATA until the above APIs (or a consolidated `/dashboard/company/overview`) are implemented.
