# Auction API

Endpoints related to auction lots fetched from external auction sources and cached by the backend.

Routes defined in: `src/routes/auction.ts`

Backed by:

- `AuctionController` – orchestrates access to auction data.
- `AuctionApiService` – fetches and stores auction lots into DB (`vehicles`, photos, bids, etc.).
- `VehicleModel.upsertFromAuctionLots` – persists auction data.

---

## GET `/api/auction/active-lots`

**Description**

Return the latest cached active lots fetched by the periodic/background job from the auction provider (e.g. Copart/IAAI aggregator). This is read-only and does not trigger a fresh fetch by itself.

**Method:** `GET`

**Request:**

- No query params or body required.

**Response 200**

The exact structure depends on how `AuctionController.getActiveLots()` formats data, but typically:

```jsonc
{
  "lots": [
    {
      "id": 123,
      "number": "123-4567",
      "brand_name": "Toyota",
      "model_name": "Corolla",
      "year": 2018,
      "mileage": 85000,
      "engine_fuel": "Gasoline",
      "vehicle_type": "Sedan",
      "yard_name": "Dallas, TX",
      "source": "copart"
      // ... additional fields mirrored from the auction API
    }
  ],
  "updated_at": "2025-01-01T12:34:56.789Z"
}
```

**Error responses**

- `500 Internal Server Error` – on unexpected DB or service failures.

---

## Background Behavior (not an endpoint but important)

- `AuctionApiService` is usually triggered from a cron job (see `src/server.ts`) to:
  - Call the external auction API periodically.
  - Normalize and upsert lots into:
    - `brands`, `models`, `vehicles`.
    - `vehicle_photos` and `vehicle_lot_bids`.
- This means `/api/auction/active-lots` exposes the **latest snapshot** of that data.

---

## Notes for Integrators

- Use `/api/auction/active-lots` for dashboards or admin views showing the latest lots without hitting external auction APIs directly.
- Vehicle search and quote endpoints (`/vehicles/search-quotes`) operate on the normalized `vehicles` table populated by this ingestion, not on the raw lots returned here.
