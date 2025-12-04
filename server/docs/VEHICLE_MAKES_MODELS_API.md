# Vehicle Makes & Models API Documentation

## Overview

This API provides endpoints to retrieve vehicle makes and models filtered by vehicle type (car or motorcycle).

### Database Schema

#### Tables

1. **`vehicle_models`** - Source of truth for make/model data
2. **`vehicle_makes`** - Derived lookup table for efficient make filtering

### Type Filtering Rules

The API supports two top-level vehicle types:

- **`car`**: Includes vehicles with `vehicle_types` containing `car`, `multipurpose`, or `truck`
- **`motorcycle`**: Includes vehicles with `vehicle_types` containing `motorcycle`

A make can appear in both categories if it has models of both types.

---

## Endpoints

### 1. Get Makes by Type

Retrieve all vehicle makes filtered by type.

**Endpoint:** `GET /api/vehicle-makes`

**Query Parameters:**

| Parameter | Type   | Required | Description                         |
| --------- | ------ | -------- | ----------------------------------- |
| `type`    | string | Yes      | Vehicle type: `car` or `motorcycle` |

**Example Requests:**

```bash
# Get car makes
GET /api/vehicle-makes?type=car

# Get motorcycle makes
GET /api/vehicle-makes?type=motorcycle
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 123,
      "makeId": 452,
      "name": "BMW"
    },
    {
      "id": 124,
      "makeId": 845,
      "name": "APRILIA"
    }
  ]
}
```

**Response Fields:**

- `id`: Internal database ID (vehicle_makes.id)
- `makeId`: External make ID (vehicle_makes.make_id, corresponds to NHTSA or other external source)
- `name`: Make name (e.g., "BMW", "APRILIA")

**Error Responses:**

```json
// Missing type parameter (400 Bad Request)
{
  "success": false,
  "error": "Missing required query parameter: type",
  "message": "The \"type\" parameter is required and must be either \"car\" or \"motorcycle\""
}

// Invalid type parameter (400 Bad Request)
{
  "success": false,
  "error": "Invalid type parameter",
  "message": "The \"type\" parameter must be either \"car\" or \"motorcycle\""
}

// Server error (500 Internal Server Error)
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to fetch vehicle makes"
}
```

---

### 2. Get Models by Type and Make

Retrieve vehicle models filtered by type and make.

**Endpoint:** `GET /api/vehicle-models`

**Query Parameters:**

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `type`    | string | Yes      | Vehicle type: `car` or `motorcycle`  |
| `makeId`  | number | Yes      | Make ID (from vehicle_makes.make_id) |

**Example Requests:**

```bash
# Get BMW car models
GET /api/vehicle-models?type=car&makeId=452

# Get APRILIA motorcycle models
GET /api/vehicle-models?type=motorcycle&makeId=845
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1001,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "3 Series",
      "vehicleTypes": "car",
      "firstYear": 2015,
      "lastYear": 2024
    },
    {
      "id": 1002,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "X5",
      "vehicleTypes": "car,multipurpose",
      "firstYear": 2018,
      "lastYear": 2024
    },
    {
      "id": 1003,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "R 1250 GS Adventure",
      "vehicleTypes": "motorcycle",
      "firstYear": 2019,
      "lastYear": 2024
    }
  ]
}
```

**Response Fields:**

- `id`: Internal database ID (vehicle_models.id)
- `makeId`: Make ID (vehicle_models.make_id)
- `makeName`: Make name (vehicle_models.make_name)
- `modelName`: Model name (vehicle_models.model_name)
- `vehicleTypes`: Comma-separated vehicle types (e.g., "car", "car,multipurpose,truck", "motorcycle")
- `firstYear`: First production year (nullable)
- `lastYear`: Last production year (nullable)

**Error Responses:**

```json
// Missing type parameter (400 Bad Request)
{
  "success": false,
  "error": "Missing required query parameter: type",
  "message": "The \"type\" parameter is required and must be either \"car\" or \"motorcycle\""
}

// Invalid type parameter (400 Bad Request)
{
  "success": false,
  "error": "Invalid type parameter",
  "message": "The \"type\" parameter must be either \"car\" or \"motorcycle\""
}

// Missing makeId parameter (400 Bad Request)
{
  "success": false,
  "error": "Missing required query parameter: makeId",
  "message": "The \"makeId\" parameter is required and must be a numeric value"
}

// Invalid makeId parameter (400 Bad Request)
{
  "success": false,
  "error": "Invalid makeId parameter",
  "message": "The \"makeId\" parameter must be a positive numeric value"
}

// Server error (500 Internal Server Error)
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to fetch vehicle models"
}
```

---

## SQL Filtering Logic

### Car Type Filtering

When `type=car`, the API returns models where `vehicle_types` contains any of: `car`, `multipurpose`, or `truck`.

```sql
SELECT vm.*
FROM vehicle_models vm
WHERE vm.make_id = :makeId
  AND (
    vm.vehicle_types LIKE '%car%'
    OR vm.vehicle_types LIKE '%multipurpose%'
    OR vm.vehicle_types LIKE '%truck%'
  )
ORDER BY vm.model_name ASC;
```

### Motorcycle Type Filtering

When `type=motorcycle`, the API returns models where `vehicle_types` contains `motorcycle` as a set element.

```sql
SELECT vm.*
FROM vehicle_models vm
WHERE vm.make_id = :makeId
  AND FIND_IN_SET('motorcycle', vm.vehicle_types) > 0
ORDER BY vm.model_name ASC;
```

---

## Usage Examples

### Frontend Integration (JavaScript/TypeScript)

```typescript
// Fetch car makes
async function getCarMakes() {
  const response = await fetch("/api/vehicle-makes?type=car");
  const data = await response.json();

  if (data.success) {
    return data.data; // Array of makes
  }
  throw new Error(data.message);
}

// Fetch models for a specific make
async function getModels(type: "car" | "motorcycle", makeId: number) {
  const response = await fetch(
    `/api/vehicle-models?type=${type}&makeId=${makeId}`
  );
  const data = await response.json();

  if (data.success) {
    return data.data; // Array of models
  }
  throw new Error(data.message);
}

// Example: Build a cascading dropdown
const carMakes = await getCarMakes();
const selectedMakeId = 452; // BMW
const bmwModels = await getModels("car", selectedMakeId);
```

### cURL Examples

```bash
# Get all car makes
curl "http://localhost:3000/api/vehicle-makes?type=car"

# Get all motorcycle makes
curl "http://localhost:3000/api/vehicle-makes?type=motorcycle"

# Get BMW car models
curl "http://localhost:3000/api/vehicle-models?type=car&makeId=452"

# Get APRILIA motorcycle models
curl "http://localhost:3000/api/vehicle-models?type=motorcycle&makeId=845"
```

---

## Database Maintenance

### Rebuilding vehicle_makes Table

If you update `vehicle_models`, rebuild the `vehicle_makes` lookup table:

```sql
-- Clear existing data
TRUNCATE TABLE vehicle_makes;

-- Rebuild from vehicle_models
INSERT INTO vehicle_makes (make_id, make_name, has_car, has_motorcycle)
SELECT
  vm.make_id,
  vm.make_name,
  MAX(
    CASE
      WHEN vm.vehicle_types LIKE '%car%'
        OR vm.vehicle_types LIKE '%multipurpose%'
        OR vm.vehicle_types LIKE '%truck%'
      THEN 1 ELSE 0
    END
  ) AS has_car,
  MAX(
    CASE
      WHEN FIND_IN_SET('motorcycle', vm.vehicle_types) > 0
      THEN 1 ELSE 0
    END
  ) AS has_motorcycle
FROM vehicle_models vm
GROUP BY vm.make_id, vm.make_name;
```

---

## Performance Considerations

- **Indexes**: Both tables have appropriate indexes on filtering columns (`has_car`, `has_motorcycle`, `vehicle_types`, `make_id`)
- **Caching**: Consider implementing Redis caching for makes lists as they change infrequently
- **Pagination**: Models endpoint returns all results; consider adding pagination if result sets grow large

---

## Testing

### Test Cases

1. **Valid car makes request**: `GET /api/vehicle-makes?type=car` → 200 OK
2. **Valid motorcycle makes request**: `GET /api/vehicle-makes?type=motorcycle` → 200 OK
3. **Missing type parameter**: `GET /api/vehicle-makes` → 400 Bad Request
4. **Invalid type parameter**: `GET /api/vehicle-makes?type=invalid` → 400 Bad Request
5. **Valid car models request**: `GET /api/vehicle-models?type=car&makeId=452` → 200 OK
6. **Valid motorcycle models request**: `GET /api/vehicle-models?type=motorcycle&makeId=845` → 200 OK
7. **Missing makeId parameter**: `GET /api/vehicle-models?type=car` → 400 Bad Request
8. **Invalid makeId parameter**: `GET /api/vehicle-models?type=car&makeId=abc` → 400 Bad Request
9. **Non-existent makeId**: `GET /api/vehicle-models?type=car&makeId=999999` → 200 OK (empty array)

---

## Implementation Files

- **Models**:
  - `server/src/models/VehicleMakeModel.ts`
  - `server/src/models/VehicleModelsModel.ts`
- **Controllers**:
  - `server/src/controllers/vehicleMakesController.ts`
  - `server/src/controllers/vehicleModelsController.ts`
- **Routes**:
  - `server/src/routes/vehicle-makes.ts`
  - `server/src/routes/vehicle-models.ts`
- **Migrations**:
  - `server/migrations/create_vehicle_makes_and_models.sql`
