# Dealer Dashboard – Backend TODO

This file describes which backend APIs already exist and what is currently **mocked** for the **Dealer Dashboard**.

## 1. Existing APIs that could be reused

Currently, there are **no dealer-specific APIs** documented in `server/docs`. However, the following existing APIs could be partially reused for dealer dashboards once we introduce a dealer/company identity model:

- `GET /companies` and `GET /companies/:id`
  - Could be used to show basic info about the dealer company itself.
- `GET /companies/:companyId/reviews`
  - Could be used to build review-related cards (average rating, recent reviews) if we bind a user to a specific company/dealer.

> At the moment there is no "dealer" role or explicit ownership mapping in the backend docs.

---

## 2. UI blocks that are 100% MOCK DATA

All of the following blocks in the **Dealer Dashboard** are currently calculated purely on the frontend using mock data (`useMemo` with hardcoded values).

### 2.1 Leads panel & funnel (**MOCK DATA**)

Frontend fields:

- `dealerLeadsStats`:
  - `todayNew`, `weekNew`, `inProgress`, `closed`.
- `dealerFunnelStats`:
  - `profileViews`, `requests`, `deals`.

Missing backend APIs:

- **Endpoint idea:** `GET /dashboard/dealer/leads`

```yaml
# TODO-FX: Implement real dealer leads KPIs.
# API Endpoint: GET /dashboard/dealer/leads
# Summary: Return aggregated lead stats for the authenticated dealer.
# Response 200:
#   type: object
#   properties:
#     todayNew:
#       type: integer
#     weekNew:
#       type: integer
#     inProgress:
#       type: integer
#     closed:
#       type: integer
#     funnel:
#       type: object
#       properties:
#         profileViews:
#           type: integer
#         requests:
#           type: integer
#         deals:
#           type: integer
```

### 2.2 Dealer requests & lead reminders (**MOCK DATA**)

Frontend:

- `dealerRequests`: synthetic list of client requests.
- `dealerLeadReminders`: synthetic reminders.

Missing backend APIs:

- `GET /dealer/requests?status=open|in_progress|closed`
- `GET /dealer/reminders`

These should be backed by real `leads` / `conversations` tables.

### 2.3 Top promoted offers & customer reviews summary (**MOCK DATA**)

Frontend:

- `dealerTopPromoted` – top offers/positions.
- `dealerReviewsSummary` – average rating, total reviews, latest review snippets.

Potential reuse:

- `GET /companies/:companyId/reviews` can give real review data.

Missing backend APIs:

- `GET /dashboard/dealer/top-offers`
- `GET /dashboard/dealer/reviews-summary`

### 2.4 Dealer profile traffic & daily tasks (**MOCK DATA**)

Frontend:

- `dealerTrafficStats`:
  - `totalViews`, `fromSearch`, `fromCatalog`, `fromOffers`.
- `dealerTasksToday`: list of textual tasks.

Missing backend APIs:

- `GET /dashboard/dealer/traffic`
- `GET /dashboard/dealer/tasks-today`

Expected structure (example for traffic):

```yaml
# TODO-FX: Implement dealer traffic tracking.
# API Endpoint: GET /dashboard/dealer/traffic
# Summary: Traffic breakdown for dealer profile.
# Response 200:
#   type: object
#   properties:
#     totalViews:
#       type: integer
#     fromSearch:
#       type: integer
#     fromCatalog:
#       type: integer
#     fromOffers:
#       type: integer
```

### 2.5 Comparison vs previous period (**MOCK DATA**)

Frontend:

- `dealerComparisonStats`:
  - `leadsDeltaPercent`, `conversionDeltaPercent`, `marginDeltaPercent`.

Missing backend API:

- `GET /dashboard/dealer/comparison`
  - Compare selected period vs previous one.

All these metrics are currently **demo-only** and should be clearly labeled as MOCK DATA on the frontend until the corresponding backend is implemented.
