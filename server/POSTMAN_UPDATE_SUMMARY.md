# Postman Collection Update Summary

**Date:** 2025-12-26
**Collection:** ProjectX-API.postman_collection.json

## New Endpoints Added

### 1. Auth Section
- **POST /auth/reactivate** - Reactivate deactivated account during 30-day grace period
  - Body: `{ "identifier": "user@example.com", "password": "yourpassword" }`
  - Returns: User object with reactivation confirmation

### 2. VIN Decoder Section (NEW)
- **POST /api/vin/decode** - Decode Vehicle Identification Number
  - Body: `{ "vin": "1HGBH41JXMN109186" }`
  - Returns: Decoded vehicle information from NHTSA VPIC API
  
- **GET /api/vin/health** - Check VIN decoder service health
  - Returns: Service health status and response time

### 3. Vehicle Data Section (NEW)
- **GET /api/vehicle-makes** - Get list of all vehicle makes
  - Returns: Array of vehicle makes
  
- **GET /api/vehicle-models** - Get vehicle models for a specific make
  - Query params: `make` (required)
  - Example: `/api/vehicle-models?make=Toyota`
  - Returns: Array of models for the specified make

### 4. Calculator Section (NEW)
- **POST /api/calculator** - Calculate shipping costs
  - Body: `{ "buyprice": 5000, "auction": "Copart", "vehicletype": "Sedan", "usacity": "Los Angeles", "destinationport": "POTI", "vehiclecategory": "Sedan" }`
  - Returns: Calculated shipping costs
  
- **POST /vehicles/:vehicleId/calculate-quotes** - Calculate shipping quotes for a specific vehicle
  - Path param: `vehicleId`
  - Body: `{ "auction": "Copart", "usacity": "Los Angeles", "vehiclecategory": "Sedan" }`
  - Query params: `limit`, `offset`, `currency`, `minRating`
  - Returns: Paginated list of quotes from all companies

## Total Changes
- **1 endpoint** added to existing Auth section
- **3 new sections** created (VIN Decoder, Vehicle Data, Calculator)
- **6 new endpoints** total

## Collection Statistics
- Total sections: 15+
- Total endpoints: 100+
- All endpoints tested for JSON validity ✓

## Notes
- All new endpoints follow the existing collection structure
- CSRF tokens are not required for GET endpoints
- POST endpoints include proper Content-Type headers
- Query parameters include examples and disabled optional params
