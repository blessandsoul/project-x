# Auction Locations API

This document describes the read-only endpoints that expose Copart and IAAI auction yard locations sourced from local JSON data files.

## Overview

Two separate endpoints provide flattened location lists for each auction source:

- `/auction/locations/copart`
- `/auction/locations/iaai`

Both endpoints return an array of simple objects suitable for populating UI selects, where `name` is used as the label and `address` (with ZIP) is used as the value.

```jsonc
[
  {
    "name": "string", // Human-readable location name
    "address": "string" // Street + ZIP, used as value
  }
]
```

---

## Data sources

- Copart locations are loaded from `server/src/data/copart.json`.
- IAAI locations are loaded from `server/src/data/iaa.json`.

Both JSON files share the same high-level structure:

```jsonc
[
  {
    "_id": "...",
    "state": "GA",
    "locations": [
      {
        "_id": "...",
        "name": "COPART ATLANTA EAST" or "Atlanta (GA)",
        "city": "...",
        "address": "6089 HIGHWAY 20",
        "zip": "30052",
        "phone": "..."
      }
    ]
  }
]
```

Only entries that contain `name`, `address` and `zip` are exposed by the API.

---

## GET /auction/locations/copart

Returns a flattened list of **Copart** auction locations.

- **Method**: `GET`
- **Path**: `/auction/locations/copart`
- **Auth**: none (public, read-only)

### Response

```jsonc
[
  {
    "name": "GA COPART ATLANTA EAST",
    "address": "6089 HIGHWAY 20, 30052"
  },
  {
    "name": "CA COPART SAN DIEGO",
    "address": "7847 AIRWAY ROAD, 92154"
  }
]
```

### Naming rules

For each entry in `copart.json`:

- `state` is a 2-letter state (or province) code.
- `locations` is an array of location objects.

The API builds fields as follows:

- **name**
  - `"<STATE> <NAME>"`
  - Example: `state = "GA"`, `name = "COPART ATLANTA EAST"` → `"GA COPART ATLANTA EAST"`.
- **address**
  - `"<ADDRESS>, <ZIP>"`
  - Example: `"6089 HIGHWAY 20"` + `"30052"` → `"6089 HIGHWAY 20, 30052"`.

Locations missing `name`, `address` or `zip` are skipped.

---

## GET /auction/locations/iaai

Returns a flattened list of **IAAI** auction locations.

- **Method**: `GET`
- **Path**: `/auction/locations/iaai`
- **Auth**: none (public, read-only)

### Response

```jsonc
[
  {
    "name": "Atlanta (GA)",
    "address": "125 Old Highway 138, 30052"
  },
  {
    "name": "Houston (TX)",
    "address": "2535 W. Mount Houston Rd., 77038"
  }
]
```

### Naming rules

For each entry in `iaa.json`:

- `state` is a 2-letter state code.
- `locations` is an array of location objects.

The API builds fields as follows:

- **name**
  - Exactly the `name` from JSON (no state prefix).
  - Example: `"Atlanta (GA)"` remains `"Atlanta (GA)"`.
- **address**
  - `"<ADDRESS>, <ZIP>"`
  - Example: `"125 Old Highway 138"` + `"30052"` → `"125 Old Highway 138, 30052"`.

Locations missing `name`, `address` or `zip` are skipped.

---

## Usage in client applications

These endpoints are designed for UI controls such as dropdowns or autocomplete inputs.

Typical usage pattern:

- Use `name` as the **display label**.
- Use `address` as the **internal value**.

Example (pseudocode):

```ts
const res = await fetch("/auction/locations/copart");
const locations = await res.json();

// React example
const options = locations.map((loc) => ({
  label: loc.name,
  value: loc.address,
}));
```

Clients can choose which endpoint to call based on the selected auction source (Copart vs IAAI) or call both and merge results if needed.

---

## POST /auction/calculate-shipping

Calculates shipping quotes for all companies based on an auction branch address.

- **Method**: `POST`
- **Path**: `/auction/calculate-shipping`
- **Auth**: none (public)
- **Content-Type**: `application/json`

### Request Body

```jsonc
{
  "address": "6089 HIGHWAY 20, 30052", // Full address from auction location
  "source": "copart" // "copart" or "iaai"
}
```

### Response

```jsonc
{
  "distanceMiles": 7234,
  "quotes": [
    {
      "companyId": 1,
      "companyName": "AutoShip Pro",
      "shippingPrice": 2450
    },
    {
      "companyId": 2,
      "companyName": "FastCar Transport",
      "shippingPrice": 2680
    }
  ]
}
```

### How it works

1. **Geocoding**: The address is geocoded using the Geoapify API to get latitude/longitude coordinates.
2. **Distance Calculation**: The great-circle distance (haversine formula) is calculated from the auction branch to Poti, Georgia (destination port at 42.1537°N, 41.6714°E).
3. **Caching**: Results are cached in the `auction_branch_distances` table to avoid repeated geocoding API calls.
4. **Quote Calculation**: For each company, the shipping price is calculated using their pricing formula:
   - `shippingPrice = base_price + (price_per_mile × distance) + customs_fee + service_fee + broker_fee`

### Error Responses

- **400 Bad Request**: Missing or invalid `address` or `source` parameter.
- **500 Internal Server Error**: Database or geocoding service unavailable.

### Usage Example

```ts
const response = await fetch("/auction/calculate-shipping", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    address: "6089 HIGHWAY 20, 30052",
    source: "copart",
  }),
});

const { distanceMiles, quotes } = await response.json();

// Map quotes by company ID for easy lookup
const priceByCompany = new Map(
  quotes.map((q) => [q.companyId, q.shippingPrice])
);
```

---

## Database Schema

### auction_branch_distances

Caches geocoded auction branch locations and their distances to Poti, Georgia.

```sql
CREATE TABLE auction_branch_distances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  address VARCHAR(500) NOT NULL,
  source ENUM('copart', 'iaai') NOT NULL,
  lat DECIMAL(10, 7) NULL,
  lon DECIMAL(10, 7) NULL,
  distance_to_poti_miles INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_address_source (address(255), source)
);
```
