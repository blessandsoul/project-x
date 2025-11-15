# VIN API

Endpoints for decoding Vehicle Identification Numbers and checking VIN decoder service health.

Routes defined in: `src/routes/vin.ts`

Relies on `VinController` and an external NHTSA VPIC API.

---

## POST `/api/vin/decode`

**Description**

Decode a 17-character VIN and return vehicle information from the NHTSA VPIC API.

**Method:** `POST`

**Request body**

```jsonc
{
  "vin": "1HGCM82633A004352"
}
```

- `vin`: must be exactly 17 characters. Validation is enforced via JSON schema.

**Response 200 (success)**

`VinController.decodeVIN` returns a structured object; typical shape is:

```jsonc
{
  "success": true,
  "vin": "1HGCM82633A004352",
  "data": {
    // Decoded fields from NHTSA VPIC, e.g. make, model, year, body style, etc.
  }
}
```

**Response 400 (invalid VIN or decode error)**

If decoding fails or VIN is invalid, the route throws a `ValidationError`, handled by the global error handler. Typical error response:

```jsonc
{
  "error": "VIN decode failed",
  "details": "<optional details>",
  "statusCode": 400
}
```

---

## GET `/api/vin/health`

**Description**

Check the health/status of the VIN decoder integration (connectivity to NHTSA VPIC).

**Method:** `GET`

**Request:**

- No body or query params.

**Response 200**

```jsonc
{
  "service": "VIN Decoder",
  "healthy": true,
  "responseTime": 123, // ms, if available
  "timestamp": "2025-01-01T12:34:56.789Z",
  "error": null
}
```

If the VIN service is unhealthy:

```jsonc
{
  "service": "VIN Decoder",
  "healthy": false,
  "responseTime": null,
  "timestamp": "2025-01-01T12:34:56.789Z",
  "error": "<error message>"
}
```

**Error responses**

- Underlying errors are surfaced in the `error` field; status usually remains 200 since this is a health/introspection endpoint.

---

## Notes for Integrators

- Use `/api/vin/decode` for user-facing VIN decode flows.
- Use `/api/vin/health` for monitoring and alerting about NHTSA VPIC availability.
- For internal health checks that also include DB and VIN, use `/health` (see `health-api.md`).
