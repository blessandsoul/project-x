# Vehicle Makes & Models API - Quick Reference

## API Endpoints Summary

| Endpoint              | Method | Description                          |
| --------------------- | ------ | ------------------------------------ |
| `/api/vehicle-makes`  | GET    | Get makes filtered by type           |
| `/api/vehicle-models` | GET    | Get models filtered by type and make |

---

## Example Requests & Responses

### 1. Get Car Makes

**Request:**

```http
GET /api/vehicle-makes?type=car HTTP/1.1
Host: localhost:3000
```

**Response:**

```json
{
  "success": true,
  "count": 150,
  "data": [
    { "id": 1, "makeId": 440, "name": "AUDI" },
    { "id": 2, "makeId": 452, "name": "BMW" },
    { "id": 3, "makeId": 482, "name": "FORD" },
    { "id": 4, "makeId": 474, "name": "HONDA" },
    { "id": 5, "makeId": 448, "name": "MERCEDES-BENZ" }
  ]
}
```

---

### 2. Get Motorcycle Makes

**Request:**

```http
GET /api/vehicle-makes?type=motorcycle HTTP/1.1
Host: localhost:3000
```

**Response:**

```json
{
  "success": true,
  "count": 45,
  "data": [
    { "id": 10, "makeId": 845, "name": "APRILIA" },
    { "id": 11, "makeId": 452, "name": "BMW" },
    { "id": 12, "makeId": 468, "name": "DUCATI" },
    { "id": 13, "makeId": 474, "name": "HONDA" },
    { "id": 14, "makeId": 480, "name": "KAWASAKI" }
  ]
}
```

---

### 3. Get BMW Car Models

**Request:**

```http
GET /api/vehicle-models?type=car&makeId=452 HTTP/1.1
Host: localhost:3000
```

**Response:**

```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": 1001,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "2 Series",
      "vehicleTypes": "car",
      "firstYear": 2014,
      "lastYear": 2024
    },
    {
      "id": 1002,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "3 Series",
      "vehicleTypes": "car",
      "firstYear": 2012,
      "lastYear": 2024
    },
    {
      "id": 1003,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "X3",
      "vehicleTypes": "car,multipurpose",
      "firstYear": 2011,
      "lastYear": 2024
    },
    {
      "id": 1004,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "X5",
      "vehicleTypes": "car,multipurpose",
      "firstYear": 2007,
      "lastYear": 2024
    }
  ]
}
```

---

### 4. Get BMW Motorcycle Models

**Request:**

```http
GET /api/vehicle-models?type=motorcycle&makeId=452 HTTP/1.1
Host: localhost:3000
```

**Response:**

```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": 2001,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "F 750 GS",
      "vehicleTypes": "motorcycle",
      "firstYear": 2018,
      "lastYear": 2024
    },
    {
      "id": 2002,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "R 1250 GS",
      "vehicleTypes": "motorcycle",
      "firstYear": 2019,
      "lastYear": 2024
    },
    {
      "id": 2003,
      "makeId": 452,
      "makeName": "BMW",
      "modelName": "S 1000 RR",
      "vehicleTypes": "motorcycle",
      "firstYear": 2010,
      "lastYear": 2024
    }
  ]
}
```

---

### 5. Get Models for Non-Existent Make

**Request:**

```http
GET /api/vehicle-models?type=car&makeId=999999 HTTP/1.1
Host: localhost:3000
```

**Response:**

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

---

## Error Examples

### Missing Type Parameter

**Request:**

```http
GET /api/vehicle-makes HTTP/1.1
Host: localhost:3000
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Missing required query parameter: type",
  "message": "The \"type\" parameter is required and must be either \"car\" or \"motorcycle\""
}
```

---

### Invalid Type Parameter

**Request:**

```http
GET /api/vehicle-makes?type=truck HTTP/1.1
Host: localhost:3000
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Invalid type parameter",
  "message": "The \"type\" parameter must be either \"car\" or \"motorcycle\""
}
```

---

### Missing MakeId Parameter

**Request:**

```http
GET /api/vehicle-models?type=car HTTP/1.1
Host: localhost:3000
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Missing required query parameter: makeId",
  "message": "The \"makeId\" parameter is required and must be a numeric value"
}
```

---

### Invalid MakeId Parameter

**Request:**

```http
GET /api/vehicle-models?type=car&makeId=abc HTTP/1.1
Host: localhost:3000
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Invalid makeId parameter",
  "message": "The \"makeId\" parameter must be a positive numeric value"
}
```

---

## Frontend Integration Examples

### React Component Example

```tsx
import { useState, useEffect } from "react";

interface Make {
  id: number;
  makeId: number;
  name: string;
}

interface Model {
  id: number;
  makeId: number;
  makeName: string;
  modelName: string;
  vehicleTypes: string;
  firstYear: number | null;
  lastYear: number | null;
}

function VehicleSelector() {
  const [vehicleType, setVehicleType] = useState<"car" | "motorcycle">("car");
  const [makes, setMakes] = useState<Make[]>([]);
  const [selectedMakeId, setSelectedMakeId] = useState<number | null>(null);
  const [models, setModels] = useState<Model[]>([]);

  // Fetch makes when vehicle type changes
  useEffect(() => {
    fetch(`/api/vehicle-makes?type=${vehicleType}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMakes(data.data);
          setSelectedMakeId(null);
          setModels([]);
        }
      });
  }, [vehicleType]);

  // Fetch models when make is selected
  useEffect(() => {
    if (selectedMakeId) {
      fetch(`/api/vehicle-models?type=${vehicleType}&makeId=${selectedMakeId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setModels(data.data);
          }
        });
    }
  }, [vehicleType, selectedMakeId]);

  return (
    <div>
      <select
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value as "car" | "motorcycle")}
      >
        <option value="car">Car</option>
        <option value="motorcycle">Motorcycle</option>
      </select>

      <select
        value={selectedMakeId || ""}
        onChange={(e) => setSelectedMakeId(Number(e.target.value))}
      >
        <option value="">Select Make</option>
        {makes.map((make) => (
          <option key={make.id} value={make.makeId}>
            {make.name}
          </option>
        ))}
      </select>

      <select disabled={!selectedMakeId}>
        <option value="">Select Model</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.modelName} ({model.firstYear}-{model.lastYear})
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

### Vanilla JavaScript Example

```javascript
// Fetch and populate makes dropdown
async function loadMakes(type) {
  const response = await fetch(`/api/vehicle-makes?type=${type}`);
  const data = await response.json();

  if (data.success) {
    const select = document.getElementById("make-select");
    select.innerHTML = '<option value="">Select Make</option>';

    data.data.forEach((make) => {
      const option = document.createElement("option");
      option.value = make.makeId;
      option.textContent = make.name;
      select.appendChild(option);
    });
  }
}

// Fetch and populate models dropdown
async function loadModels(type, makeId) {
  const response = await fetch(
    `/api/vehicle-models?type=${type}&makeId=${makeId}`
  );
  const data = await response.json();

  if (data.success) {
    const select = document.getElementById("model-select");
    select.innerHTML = '<option value="">Select Model</option>';

    data.data.forEach((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = `${model.modelName} (${model.firstYear}-${model.lastYear})`;
      select.appendChild(option);
    });
  }
}

// Event listeners
document.getElementById("type-select").addEventListener("change", (e) => {
  loadMakes(e.target.value);
});

document.getElementById("make-select").addEventListener("change", (e) => {
  const type = document.getElementById("type-select").value;
  loadModels(type, e.target.value);
});
```

---

## Testing with cURL

```bash
# Test car makes
curl -X GET "http://localhost:3000/api/vehicle-makes?type=car"

# Test motorcycle makes
curl -X GET "http://localhost:3000/api/vehicle-makes?type=motorcycle"

# Test car models for BMW (makeId=452)
curl -X GET "http://localhost:3000/api/vehicle-models?type=car&makeId=452"

# Test motorcycle models for BMW
curl -X GET "http://localhost:3000/api/vehicle-models?type=motorcycle&makeId=452"

# Test error: missing type
curl -X GET "http://localhost:3000/api/vehicle-makes"

# Test error: invalid type
curl -X GET "http://localhost:3000/api/vehicle-makes?type=invalid"

# Test error: missing makeId
curl -X GET "http://localhost:3000/api/vehicle-models?type=car"

# Test error: invalid makeId
curl -X GET "http://localhost:3000/api/vehicle-models?type=car&makeId=abc"
```

---

## Notes

- All responses include `success`, `count`, and `data` fields
- Results are sorted alphabetically by name (makes) or model name (models)
- Empty results return `count: 0` and `data: []` (not an error)
- Type parameter is case-insensitive (`car`, `Car`, `CAR` all work)
- MakeId must be a positive integer
