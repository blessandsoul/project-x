# Vehicle Makes & Models API Documentation

## Overview

This API provides endpoints to retrieve vehicle makes and models.

### Database Schema

#### Tables

1. **`vehicle_makes`** - Stores vehicle makes (brands)
   - `id` - INT, auto-increment, primary key
   - `name` - VARCHAR(150), make name (e.g., "BMW", "Toyota")
   - `is_valid` - TINYINT(1), whether the make is valid/active

2. **`vehicle_models`** - Stores vehicle models
   - `id` - BIGINT UNSIGNED, auto-increment, primary key
   - `make_id` - INT, foreign key to vehicle_makes
   - `name` - VARCHAR(255), model name (e.g., "3 Series", "Camry")
   - `vehicle_type` - VARCHAR(50), type of vehicle (e.g., "Automobile", "Motorcycle", "ATV")
   - `is_valid` - TINYINT(1), whether the model is valid/active

---

## Endpoints

### 1. Get All Makes

Retrieve all valid vehicle makes.

**Endpoint:** `GET /api/vehicle-makes`

**Example Request:**

```bash
GET /api/vehicle-makes
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 82,
  "data": [
    { "id": 1, "name": "Acura" },
    { "id": 2, "name": "Alfa Romeo" },
    { "id": 3, "name": "Aprilia" },
    ...
  ]
}
```

**Response Fields:**

- `id`: Internal database ID
- `name`: Make name (e.g., "BMW", "Toyota")

---

### 2. Get Models by Make

Retrieve vehicle models filtered by make and optionally by vehicle type.

**Endpoint:** `GET /api/vehicle-models`

**Query Parameters:**

| Parameter     | Type   | Required | Description                                           |
| ------------- | ------ | -------- | ----------------------------------------------------- |
| `makeId`      | number | Yes      | Make ID from the vehicle_makes table                  |
| `vehicleType` | string | No       | Filter by vehicle type (e.g., "Automobile", "Motorcycle") |

**Example Requests:**

```bash
# Get all models for Acura (makeId = 1)
GET /api/vehicle-models?makeId=1

# Get only Automobile models for BMW
GET /api/vehicle-models?makeId=5&vehicleType=Automobile

# Get only Motorcycle models for BMW
GET /api/vehicle-models?makeId=5&vehicleType=Motorcycle
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 18,
  "data": [
    { "id": 25, "name": "ILX", "vehicleType": "Automobile" },
    { "id": 26, "name": "Integra", "vehicleType": "Automobile" },
    { "id": 27, "name": "MDX", "vehicleType": "Automobile" },
    ...
  ]
}
```

**Response Fields:**

- `id`: Internal database ID
- `name`: Model name (e.g., "3 Series", "X5")
- `vehicleType`: Vehicle type (e.g., "Automobile", "Motorcycle", "ATV")

**Error Responses:**

```json
// Missing makeId parameter (400 Bad Request)
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "querystring must have required property 'makeId'"
}
```

---

## Vehicle Types

The `vehicleType` field can have the following values:

- `Automobile` - Cars, SUVs, Trucks
- `Motorcycle` - Motorcycles
- `ATV` - All-terrain vehicles
- `Bus` - Buses
- `Jet Sky` - Jet skis / watercraft

---

## Usage Examples

### Frontend Integration (JavaScript/TypeScript)

```typescript
// Fetch all makes
async function getMakes() {
  const response = await fetch("/api/vehicle-makes");
  const data = await response.json();

  if (data.success) {
    return data.data; // Array of makes
  }
  throw new Error("Failed to fetch makes");
}

// Fetch models for a specific make
async function getModels(makeId: number, vehicleType?: string) {
  let url = `/api/vehicle-models?makeId=${makeId}`;
  if (vehicleType) {
    url += `&vehicleType=${encodeURIComponent(vehicleType)}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.success) {
    return data.data; // Array of models
  }
  throw new Error("Failed to fetch models");
}

// Example: Build a cascading dropdown
const makes = await getMakes();
const selectedMakeId = 5; // BMW
const bmwModels = await getModels(selectedMakeId);
const bmwCars = await getModels(selectedMakeId, "Automobile");
```

### cURL Examples

```bash
# Get all makes
curl "http://localhost:3000/api/vehicle-makes"

# Get all BMW models (assumng BMW has makeId = 5)
curl "http://localhost:3000/api/vehicle-models?makeId=5"

# Get only BMW cars
curl "http://localhost:3000/api/vehicle-models?makeId=5&vehicleType=Automobile"

# Get only BMW motorcycles
curl "http://localhost:3000/api/vehicle-models?makeId=5&vehicleType=Motorcycle"
```

---

## Performance Considerations

- **Caching**: Both endpoints are cached for 1 hour (CACHE_TTL.LONG)
- **Indexes**: Tables have appropriate indexes on filtering columns

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
- **Seeding script**:
  - `server/scripts/seedVehicles.js`
