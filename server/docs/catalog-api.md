# Catalog API (Makes & Models)

This document describes the catalog endpoints for **vehicle makes and models**
used by the frontend filters. Data is stored in the local database tables
`vehicle_makes` and `vehicle_models`, and periodically synchronized from the
NHTSA VPIC API.

Routes defined in: `src/routes/catalog.ts`

---

## Data Model

### Table: `vehicle_makes`

Stores car and motorcycle makes.

Key columns:

- `id` (BIGINT, PK) – internal ID.
- `vehicle_type` (ENUM `('car', 'motorcycle')`) – type of vehicle.
- `external_make_id` (INT) – VPIC `MakeId`.
- `name` (VARCHAR) – VPIC `MakeName`.
- `created_at`, `updated_at` – timestamps.

Notes:

- The same make can exist once per vehicle type, e.g.:
  - `vehicle_type = 'car', external_make_id = 474, name = 'BMW'`
  - `vehicle_type = 'motorcycle', external_make_id = 474, name = 'BMW'`

### Table: `vehicle_models`

Stores models for each make.

Key columns:

- `id` (BIGINT, PK) – internal ID.
- `make_id` (BIGINT, FK → `vehicle_makes.id`).
- `external_model_id` (INT) – VPIC `Model_ID`.
- `name` (VARCHAR) – VPIC `Model_Name`.
- `created_at`, `updated_at` – timestamps.

---

## Synchronization

A background job in `src/server.ts` keeps the catalog up-to-date:

- **Cron:** `0 3 1 * *` (once per month at 03:00 server time).
- For each type `car` and `motorcycle`, it:
  1. Calls VPIC `GetMakesForVehicleType/<type>?format=json`.
  2. Upserts rows into `vehicle_makes`.
  3. For each make, calls `GetModelsForMake/<MakeName>?format=json`.
  4. Upserts rows into `vehicle_models`.

The catalog routes **read from the DB**. The first call for a given type may
trigger a sync if the tables are empty; afterwards, only the cron (or manual
admin actions) update the catalog.

---

## GET `/catalog/makes`

**Description**

Return a list of makes for a given vehicle type (car or motorcycle), suitable
for populating a dropdown in the frontend.

**Method:** `GET`

**Query params:**

- `type` (optional, string)
  - Allowed values: `"car"`, `"motorcycle"`.
  - Default: `"car"` when omitted.
- `q` (optional, string)
  - Case-insensitive substring filter on make name.
  - Example: `q=bmw` matches `"BMW"`.

**Validation rules**

| Field | Location | Required | Type   | Constraints                             |
| ----- | -------- | -------- | ------ | --------------------------------------- |
| type  | query    | no       | string | `"car"` or `"motorcycle"` (default car) |
| q     | query    | no       | string | any non-empty string                    |

**Response 200 JSON**

```jsonc
{
  "items": [
    {
      "makeId": 474, // VPIC MakeId (external_make_id)
      "name": "BMW" // MakeName
    },
    {
      "makeId": 475,
      "name": "TESLA"
    }
  ]
}
```

- The list is sorted by `name` ascending.
- Use `makeId` when calling the models endpoint.

**Error responses**

- `400 Bad Request`
  - `VALIDATION_ERROR` – invalid `type` value.
- `502 Bad Gateway`
  - `CATALOG_MAKES_ERROR` – database or sync error.

---

## GET `/catalog/makes/:makeId/models`

**Description**

Return all models for a specific make (by VPIC `MakeId`) and vehicle type.

**Method:** `GET`

**Path params:**

- `makeId` – numeric VPIC `MakeId` returned from `GET /catalog/makes`.

**Query params:**

- `type` (optional, string)
  - Allowed values: `"car"`, `"motorcycle"`.
  - Default: `"car"`.

**Validation rules**

| Field  | Location | Required | Type   | Constraints                             |
| ------ | -------- | -------- | ------ | --------------------------------------- |
| makeId | path     | yes      | number | Positive integer (`>= 1`)               |
| type   | query    | no       | string | `"car"` or `"motorcycle"` (default car) |

**Response 200 JSON**

```jsonc
{
  "make": {
    "makeId": 474, // VPIC MakeId
    "name": "BMW", // MakeName from vehicle_makes
    "type": "car" // vehicle_type
  },
  "items": [
    {
      "makeId": 474, // VPIC MakeId
      "makeName": "BMW", // MakeName
      "modelId": 1890, // VPIC Model_ID
      "name": "X5" // Model_Name
    },
    {
      "makeId": 474,
      "makeName": "BMW",
      "modelId": 1891,
      "name": "X6"
    }
  ]
}
```

- `items` is sorted by `name` ascending.
- If the make exists for the given `type` but has no models, `items` is an
  empty array.

**Error responses**

- `400 Bad Request`
  - `VALIDATION_ERROR` – `makeId` not a positive integer or `type` invalid.
- `404 Not Found`
  - `MAKE_NOT_FOUND` – no make in `vehicle_makes` for the given `makeId` and
    `type` (even after scheduled syncs).
- `502 Bad Gateway`
  - `CATALOG_MODELS_ERROR` – database error while loading models.

---

## Frontend Usage Summary

1. **Load makes for cars**

   ```http
   GET /catalog/makes?type=car
   ```

2. **Load makes for motorcycles**

   ```http
   GET /catalog/makes?type=motorcycle
   ```

3. **Search makes by name**

   ```http
   GET /catalog/makes?type=car&q=bmw
   ```

4. **Get models for a selected make**

   ```http
   GET /catalog/makes/474/models?type=car
   ```

   Use `makeId` from the `/catalog/makes` response.

These endpoints are stable and can be considered part of the public API
surface for building search filters and dropdowns on the frontend.
