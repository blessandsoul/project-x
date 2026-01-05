# Admin API Documentation

This document describes the admin-only API endpoints for platform management.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Calculator Configuration Endpoints](#calculator-configuration-endpoints)
   - [GET /admin/companies/:id/calculator](#get-admincompaniesidcalculator)
   - [PATCH /admin/companies/:id/calculator](#patch-admincompaniesidcalculator)
   - [POST /admin/companies/:id/calculator/test](#post-admincompaniesidcalculatortest)
   - [DELETE /admin/companies/:id/calculator](#delete-admincompaniesidcalculator)
3. [Configuration Examples](#configuration-examples)
4. [Error Codes](#error-codes)

---

## Authentication

All admin endpoints require:
- **Cookie Authentication**: Valid access token in HttpOnly cookie
- **Admin Role**: User must have `role = 'admin'`
- **CSRF Token**: For mutating operations (PATCH, POST, DELETE)

```http
Cookie: access_token=<jwt-token>
X-CSRF-Token: <csrf-token>
```

---

## Calculator Configuration Endpoints

### GET /admin/companies/:id/calculator

Get the current calculator configuration for a company.

#### Request

```http
GET /admin/companies/43/calculator
Cookie: access_token=<jwt-token>
```

#### Response (200 OK)

```json
{
  "company_id": 43,
  "company_name": "Test Shipping Co",
  "calculator_type": "custom_api",
  "calculator_api_url": "http://localhost:3000/testing/calculator/simple",
  "calculator_config": {
    "timeout": 5000,
    "field_mapping": {
      "request": {
        "usacity": "city",
        "destinationport": "port"
      },
      "response": {
        "totalPrice": "totalPrice"
      }
    }
  },
  "is_custom_api": true,
  "has_valid_config": true
}
```

---

### PATCH /admin/companies/:id/calculator

Update the calculator configuration for a company.

#### Request

```http
PATCH /admin/companies/43/calculator
Cookie: access_token=<jwt-token>
X-CSRF-Token: <csrf-token>
Content-Type: application/json

{
  "calculator_type": "custom_api",
  "calculator_api_url": "https://company-api.example.com/calculate",
  "calculator_config": {
    "timeout": 30000,
    "headers": {
      "X-API-Key": "secret-key-here"
    },
    "field_mapping": {
      "request": {
        "usacity": "origin",
        "destinationport": "destination",
        "vehiclecategory": "vehicle_type",
        "buyprice": "price"
      },
      "response": {
        "totalPrice": "data.quote.total",
        "distanceMiles": "data.route.miles",
        "currency": "data.currency"
      }
    }
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Calculator configuration updated for company Test Shipping Co",
  "company_id": 43,
  "calculator_type": "custom_api",
  "calculator_api_url": "https://company-api.example.com/calculate",
  "calculator_config": { ... }
}
```

#### Validation Rules

| Field | Rule |
|-------|------|
| `calculator_type` | Required. Must be `"default"`, `"custom_api"`, or `"formula"` |
| `calculator_api_url` | Required if `calculator_type = "custom_api"`. Must be valid URL |
| `calculator_config` | Required if `calculator_type = "custom_api"`. Must have valid structure |
| `calculator_config.field_mapping` | Required |
| `calculator_config.field_mapping.response` | Required |
| `calculator_config.field_mapping.response.totalPrice` | Required. Must be a string (dot-notation path) |
| `calculator_config.timeout` | Optional. Must be between 1000 and 120000 (ms) |

---

### POST /admin/companies/:id/calculator/test

Test a calculator configuration without saving. Use this to verify the API works before committing.

#### Request

```http
POST /admin/companies/43/calculator/test
Cookie: access_token=<jwt-token>
X-CSRF-Token: <csrf-token>
Content-Type: application/json

{
  "calculator_api_url": "http://localhost:3000/testing/calculator/nested",
  "calculator_config": {
    "timeout": 5000,
    "field_mapping": {
      "request": {
        "usacity": "origin",
        "vehiclecategory": "vehicle",
        "destinationport": "destination"
      },
      "response": {
        "totalPrice": "data.quote.pricing.total_usd",
        "distanceMiles": "data.quote.route.distance.miles"
      }
    }
  },
  "test_request": {
    "usacity": "Dallas (TX)",
    "destinationport": "POTI",
    "vehiclecategory": "Sedan",
    "auction": "Copart",
    "buyprice": 5000
  }
}
```

#### Response (200 OK - Success)

```json
{
  "success": true,
  "test_summary": {
    "http_status": 200,
    "price_extracted": true,
    "extracted_price": 1620.75,
    "extracted_distance": 2200,
    "extracted_currency": "USD"
  },
  "request_sent": {
    "url": "http://localhost:3000/testing/calculator/nested",
    "method": "POST",
    "headers": ["Content-Type"],
    "body": {
      "origin": "Dallas (TX)",
      "destination": "POTI",
      "vehicle": "Sedan"
    }
  },
  "response_received": {
    "status": 200,
    "status_text": "OK",
    "body": {
      "status": "success",
      "data": {
        "quote": {
          "pricing": { "total_usd": 1620.75 },
          "route": { "distance": { "miles": 2200 } }
        },
        "currency": "USD"
      }
    }
  },
  "field_mapping_applied": {
    "request_mapping": { ... },
    "response_mapping": { ... }
  },
  "recommendations": [
    "Configuration looks good! Ready to save."
  ]
}
```

#### Response (200 OK - Failure)

```json
{
  "success": false,
  "test_summary": {
    "http_status": 401,
    "price_extracted": false,
    "extracted_price": null
  },
  "recommendations": [
    "API returned status 401. Check if the endpoint is correct.",
    "Could not extract price from path \"data.quote.total\". Check the response structure."
  ]
}
```

---

### DELETE /admin/companies/:id/calculator

Reset a company to use the default calculator (Auto Market Logistic).

#### Request

```http
DELETE /admin/companies/43/calculator
Cookie: access_token=<jwt-token>
X-CSRF-Token: <csrf-token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Calculator configuration reset to default for company Test Shipping Co",
  "company_id": 43,
  "calculator_type": "default"
}
```

---

## Configuration Examples

### Example 1: Simple API (flat response)

```json
{
  "calculator_type": "custom_api",
  "calculator_api_url": "https://api.example.com/quote",
  "calculator_config": {
    "timeout": 10000,
    "field_mapping": {
      "request": {
        "usacity": "city",
        "destinationport": "port",
        "vehiclecategory": "vehicle"
      },
      "response": {
        "totalPrice": "price",
        "distanceMiles": "distance",
        "currency": "currency"
      }
    }
  }
}
```

### Example 2: Nested Response (dot-notation)

```json
{
  "calculator_type": "custom_api",
  "calculator_api_url": "https://api.example.com/v2/calculate",
  "calculator_config": {
    "timeout": 30000,
    "field_mapping": {
      "request": {
        "usacity": "pickup.city",
        "destinationport": "delivery.port"
      },
      "response": {
        "totalPrice": "data.estimate.total_usd",
        "distanceMiles": "data.route.distance_miles"
      }
    }
  }
}
```

### Example 3: With Authentication Headers

```json
{
  "calculator_type": "custom_api",
  "calculator_api_url": "https://secure-api.example.com/quote",
  "calculator_config": {
    "timeout": 15000,
    "headers": {
      "Authorization": "Bearer your-api-token",
      "X-Client-ID": "project-x"
    },
    "field_mapping": {
      "request": {
        "usacity": "origin",
        "destinationport": "destination"
      },
      "response": {
        "totalPrice": "quote.amount"
      }
    }
  }
}
```

### Example 4: With Static Fields

```json
{
  "calculator_type": "custom_api",
  "calculator_api_url": "https://api.example.com/instant-quote",
  "calculator_config": {
    "timeout": 10000,
    "field_mapping": {
      "request": {
        "usacity": "from_city",
        "destinationport": "to_port",
        "vehiclecategory": "vehicle_type",
        "static": {
          "customer_id": "PLATFORM_X",
          "quote_type": "instant",
          "currency": "USD"
        }
      },
      "response": {
        "totalPrice": "total"
      }
    }
  }
}
```

### Example 5: Reset to Default

```json
{
  "calculator_type": "default"
}
```

---

## Error Codes

| HTTP Status | Error | Description |
|-------------|-------|-------------|
| 400 | ValidationError | Invalid request body or calculator_config structure |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | User is not an admin |
| 404 | NotFoundError | Company not found |
| 500 | InternalServerError | Server error |

### Common Validation Errors

| Error Message | Cause |
|---------------|-------|
| `calculator_api_url is required when calculator_type is "custom_api"` | Missing URL for custom API |
| `calculator_api_url must be a valid URL` | URL format is invalid |
| `calculator_config is required when calculator_type is "custom_api"` | Missing config for custom API |
| `field_mapping is required` | Config missing field_mapping |
| `field_mapping.response is required` | Config missing response mapping |
| `field_mapping.response.totalPrice is required` | No path defined for price extraction |
| `timeout must be a number between 1000 and 120000` | Invalid timeout value |

---

## Workflow: Onboarding a New Company API

### Step 1: Get API Documentation

Ask the company for:
- API endpoint URL
- Authentication requirements (if any)
- Example request/response

### Step 2: Test the Configuration

```http
POST /admin/companies/123/calculator/test
Content-Type: application/json

{
  "calculator_api_url": "https://their-api.com/calculate",
  "calculator_config": {
    "headers": { "X-API-Key": "their-key" },
    "field_mapping": {
      "request": { "usacity": "origin", "destinationport": "dest" },
      "response": { "totalPrice": "quote.total" }
    }
  }
}
```

Check `success: true` and verify `extracted_price` is correct.

### Step 3: Save the Configuration

```http
PATCH /admin/companies/123/calculator
Content-Type: application/json

{
  "calculator_type": "custom_api",
  "calculator_api_url": "https://their-api.com/calculate",
  "calculator_config": { ... same as test ... }
}
```

### Step 4: Verify Live Quotes

```bash
curl -X POST "http://localhost:3000/vehicles/57388038943278/calculate-quotes?limit=10" \
  -H "Content-Type: application/json" \
  -d '{"auction": "Copart", "usacity": "Dallas (TX)"}'
```

Check that company 123 has a different price than others.

### Step 5: Monitor

Check server logs for:
- `[ConfigurableAdapter] Calling custom calculator API`
- Any errors from the external API

---

## cURL Examples

### Get Calculator Config

```bash
curl -X GET "http://localhost:3000/admin/companies/43/calculator" \
  -H "Cookie: access_token=<token>"
```

### Update Calculator Config

```bash
curl -X PATCH "http://localhost:3000/admin/companies/43/calculator" \
  -H "Cookie: access_token=<token>" \
  -H "X-CSRF-Token: <csrf-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "calculator_type": "custom_api",
    "calculator_api_url": "http://localhost:3000/testing/calculator/simple",
    "calculator_config": {
      "field_mapping": {
        "request": {"usacity": "city", "destinationport": "port"},
        "response": {"totalPrice": "totalPrice"}
      }
    }
  }'
```

### Test Calculator Config

```bash
curl -X POST "http://localhost:3000/admin/companies/43/calculator/test" \
  -H "Cookie: access_token=<token>" \
  -H "X-CSRF-Token: <csrf-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "calculator_api_url": "http://localhost:3000/testing/calculator/simple",
    "calculator_config": {
      "field_mapping": {
        "request": {"usacity": "city"},
        "response": {"totalPrice": "totalPrice"}
      }
    }
  }'
```

### Reset to Default

```bash
curl -X DELETE "http://localhost:3000/admin/companies/43/calculator" \
  -H "Cookie: access_token=<token>" \
  -H "X-CSRF-Token: <csrf-token>"
```
