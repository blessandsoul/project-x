# VIN API Documentation

## Overview

This document provides comprehensive API documentation for the Vehicle Identification Number (VIN) decoding endpoints. The service integrates with the National Highway Traffic Safety Administration (NHTSA) Vehicle Product Information Catalog (VPIC) API.

### Base URL
```
http://localhost:3000
```

### Response Format
All responses follow a consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "source": "NHTSA_VPIC",
  "timestamp": "2025-11-13T22:51:00.000Z"
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error description",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

## Endpoints

### 1. VIN Decoding

**POST** `/api/vin/decode`

Decode a 17-character Vehicle Identification Number to retrieve detailed vehicle information from the NHTSA VPIC database.

#### Request Body
```json
{
  "vin": "1HGCM82633A123456"
}
```

#### Request Body Schema
```json
{
  "type": "object",
  "required": ["vin"],
  "properties": {
    "vin": {
      "type": "string",
      "minLength": 17,
      "maxLength": 17,
      "description": "17-character Vehicle Identification Number (VIN)"
    }
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "vin": "1HGCM82633A123456",
    "year": 2003,
    "make": "HONDA",
    "model": "ACCORD",
    "trim": "EX",
    "bodyClass": "Sedan/Saloon",
    "vehicleType": "PASSENGER CAR",
    "doors": 4,
    "driveType": "FWD",
    "fuelType": "Gasoline",
    "engine": {
      "configuration": "V-Shaped",
      "cylinders": 6,
      "displacementL": 3.0
    },
    "manufacturer": {
      "plantCountry": "UNITED STATES",
      "plantState": "OHIO",
      "companyName": "HONDA OF AMERICA MFG., INC."
    },
    "safety": {
      "abs": true,
      "esc": false,
      "airbags": "1st Row (Driver & Passenger)",
      "seatbelts": "Manual"
    }
  },
  "source": "NHTSA_VPIC",
  "timestamp": "2025-11-13T22:51:00.000Z"
}
```

#### Data Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `vin` | string | The decoded VIN |
| `year` | number \| null | Model year of the vehicle |
| `make` | string | Vehicle manufacturer (e.g., "HONDA") |
| `model` | string | Vehicle model (e.g., "ACCORD") |
| `trim` | string | Vehicle trim level (e.g., "EX") |
| `bodyClass` | string | Body style (e.g., "Sedan/Saloon") |
| `vehicleType` | string | Type classification (e.g., "PASSENGER CAR") |
| `doors` | number \| null | Number of doors |
| `driveType` | string | Drivetrain type (e.g., "FWD", "AWD", "RWD") |
| `fuelType` | string | Primary fuel type (e.g., "Gasoline", "Diesel") |

**Engine Object:**
| Field | Type | Description |
|-------|------|-------------|
| `configuration` | string | Engine configuration (e.g., "V-Shaped", "Inline") |
| `cylinders` | number \| null | Number of cylinders |
| `displacementL` | number \| null | Engine displacement in liters |

**Manufacturer Object:**
| Field | Type | Description |
|-------|------|-------------|
| `plantCountry` | string | Country where vehicle was manufactured |
| `plantState` | string | State where vehicle was manufactured |
| `companyName` | string | Manufacturing company name |

**Safety Object:**
| Field | Type | Description |
|-------|------|-------------|
| `abs` | boolean | Anti-lock braking system |
| `esc` | boolean | Electronic stability control |
| `airbags` | string | Airbag configuration description |
| `seatbelts` | string | Seatbelt type description |

#### Error Responses

**400 - Validation Error** (Invalid VIN format)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid VIN format. VIN must be 17 characters long.",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**422 - Processing Error** (VIN not found or API error)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "VIN not found in NHTSA database",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

**500 - Internal Server Error** (API unavailable or network issues)
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to decode VIN: NHTSA API unavailable",
    "timestamp": "2025-11-13T22:51:00.000Z"
  }
}
```

---

### 2. VIN Service Health Check

**GET** `/api/vin/health`

Check the health status of the VIN decoder service and its connection to the NHTSA VPIC API.

#### Success Response (200)
```json
{
  "service": "VIN Decoder",
  "healthy": true,
  "responseTime": 1250,
  "timestamp": "2025-11-13T22:51:00.000Z",
  "error": null
}
```

#### Unhealthy Response (200)
```json
{
  "service": "VIN Decoder",
  "healthy": false,
  "responseTime": null,
  "timestamp": "2025-11-13T22:51:00.000Z",
  "error": "NHTSA API is currently unavailable"
}
```

#### Health Check Fields

| Field | Type | Description |
|-------|------|-------------|
| `service` | string | Service name ("VIN Decoder") |
| `healthy` | boolean | Whether the service is operational |
| `responseTime` | number \| null | API response time in milliseconds (null if unhealthy) |
| `timestamp` | string | ISO 8601 timestamp of the health check |
| `error` | string \| null | Error message if unhealthy (null if healthy) |

## VIN Format Validation

VINs must be exactly 17 characters and follow the ISO 3779 standard:

- **Length**: Exactly 17 characters
- **Characters**: Can contain letters A-Z (except I, O, Q) and digits 0-9
- **Case**: Not case-sensitive (converted to uppercase internally)
- **Checksum**: Must pass mathematical validation

### Valid VIN Examples:
- `1HGCM82633A123456` (Honda Accord)
- `JH4KA8260MC000000` (Acura Legend)
- `1FTFW1ET3DFC12345` (Ford F-150)

### Invalid VIN Examples:
- `12345678901234567` (Too long)
- `JH4KA8260MC00000` (Too short)
- `JH4KA8260MC00000I` (Contains invalid character 'I')
- `JH4KA8260MC00000O` (Contains invalid character 'O')
- `JH4KA8260MC00000Q` (Contains invalid character 'Q')

## Rate Limiting

The VIN decoding service connects to the NHTSA VPIC API which may have rate limits. Consider implementing client-side caching for frequently requested VINs.

## Error Codes Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400/422 | Invalid VIN format or VIN not found |
| `INTERNAL_ERROR` | 500 | NHTSA API unavailable or server error |

## Testing Examples

### VIN Decoding
```bash
curl -X POST http://localhost:3000/api/vin/decode \
  -H "Content-Type: application/json" \
  -d '{"vin":"1HGCM82633A123456"}'
```

### Service Health Check
```bash
curl -X GET http://localhost:3000/api/vin/health
```

## Notes for Frontend Implementation

1. **VIN Input Validation**: Validate VIN format on the frontend before API calls
2. **Loading States**: VIN decoding can take 1-3 seconds, show loading indicators
3. **Error Handling**: Provide user-friendly messages for invalid VINs
4. **Caching**: Consider caching decoded VIN data to reduce API calls
5. **Offline Handling**: Handle network connectivity issues gracefully
6. **VIN Formatting**: Accept VINs with or without spaces/dashes, normalize before submission

## Data Source

All VIN data is sourced from the **NHTSA VPIC API**:
- **URL**: `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json`
- **Documentation**: https://vpic.nhtsa.dot.gov/api/
- **Update Frequency**: Data is updated regularly by NHTSA
- **Coverage**: Primarily US-market vehicles, some international coverage

## Performance Considerations

- **Response Time**: Typical API response time is 500-2000ms
- **Caching Strategy**: Implement client-side caching for frequently accessed VINs
- **Batch Processing**: For bulk VIN decoding, consider implementing batch endpoints
- **Error Retry**: Implement exponential backoff for temporary API failures

## Security Considerations

- **Input Sanitization**: VINs are validated for format but treated as user input
- **Rate Limiting**: Consider implementing rate limiting to prevent abuse
- **Data Privacy**: VINs may contain sensitive vehicle information
- **HTTPS**: Always use HTTPS in production environments
