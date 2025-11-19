# VehicleDetailsPage – Backend TODO

This file describes how the **Vehicle Details** page maps to existing backend APIs and where mock/derived data is used.

## 1. Existing APIs already powering VehicleDetails

From `docs/vehicles-and-quotes-api.md`:

### 1.1 Vehicle core data + photos

- `GET /vehicles/:id/full`
  - Response:
    - `vehicle`: same shape as `GET /vehicles/:id` (brand, model, year, yard, source, prices, etc.).
    - `photos`: same shape as `GET /vehicles/:id/photos`.

> This maps directly to the `vehicle` and `photos` used by `useVehicleDetails` and the gallery on `VehicleDetailsPage`.

### 1.2 Quotes for a vehicle

- `POST /vehicles/:vehicleId/calculate-quotes`
- `GET /vehicles/:vehicleId/quotes`
  - Return `distance_miles` and a list of quotes with full pricing breakdown.

> These endpoints are already the **source of truth** for the quote cards, best quote, average price, and savings calculations in `VehicleDetailsPage`.

## 2. What is still frontend-only or implicitly derived

### 2.1 "Best quote", average price, savings amount

On the page:

- `sortedQuotes`
- `bestQuote`
- `averageTotalPrice`
- `savingsAmount`

These are computed in the frontend based on the `quotes` payload.

**Status:** derived data – no separate backend API is strictly required.

> Optionally, a future `/vehicles/:vehicleId/quotes/summary` endpoint could precompute these metrics, but it is not necessary for correctness.

### 2.2 User context / linkage between quotes and user (**MISSING**)

Currently, quotes are **not** linked to a specific user in backend docs:

- There is no `user_id` in quote results exposed by docs.
- The dashboard concept of "open requests" assumes some notion of user-associated quotes or orders.

Potential future API direction:

- `POST /user/vehicles/:vehicleId/quotes`
  - Persist a quote selection as a user request/order.
- `GET /user/quotes`
  - List quotes linked to the authenticated user (status: open/closed/cancelled).

These are out of scope of current VehicleDetails docs but important for integrating VehicleDetails with the dashboard.

### 2.3 FX and currency display

Docs: `docs/fx-and-currency-api.md`

- Quote endpoints already support `currency=usd|gel`.

On `VehicleDetailsPage`:

- Monetary formatting is handled on the frontend (`formatMoney`).

**Status:** OK – no additional backend work required beyond what is already documented.
