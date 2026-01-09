# Unified Companies API - Admin Setup Examples

This guide explains **how to configure** a partner's API in our system using the Admin Routes. It is intended for platform administrators and developers performing integrations.

---

## 🚀 The Workflow

1.  **Analyze** the partner's API docs (Request/Response format).
2.  **Map** our standard fields to their expected fields.
3.  **Test** the configuration using the Test Endpoint.
4.  **Save** the configuration to the Company profile.

---

##  Scenario: Integrating "FastShip Logistics"

**We received this documentation from FastShip:**
*   **Endpoint:** `https://api.fastship.com/quotes/v2`
*   **Method:** `POST`
*   **Auth Header:** `X-Access-Token: 12345-abcde`
*   **Their Request Format:**
    ```json
    {
      "origin_city": "Los Angeles",
      "dest_code": "POTI",
      "cargo_type": "sedan",
      "partner_id": "PROJECT_X"
    }
    ```
*   **Their Response Format:**
    ```json
    {
      "status": "success",
      "quote": {
        "final_price": 1450.00,
        "currency": "USD"
      }
    }
    ```

---

### Step 1: Create the Mapping JSON

We need to map **Our Fields** (`usacity`, `destinationport`, `vehiclecategory`, etc.) to **Their Fields**.

**The Configuration Object:**
```json
{
  "headers": {
    "X-Access-Token": "12345-abcde"
  },
  "field_mapping": {
    "request": {
      "usacity": "origin_city",          // Map our 'usacity' -> their 'origin_city'
      "destinationport": "dest_code",    // Map our 'destinationport' -> their 'dest_code'
      "vehiclecategory": "cargo_type",   // Map our 'vehiclecategory' -> their 'cargo_type'
      "static": {                        // Fields to always send
        "partner_id": "PROJECT_X"
      }
    },
    "response": {
      "totalPrice": "quote.final_price", // Where to find the price (dot-notation)
      "currency": "quote.currency"       // Where to find the currency
    }
  }
}
```

---

### Step 2: Test the Configuration (Dry Run)

Before affecting live traffic, use the test route to verify the connection and mapping.

**Route:** `POST /api/v1/admin/companies/:id/calculator/test`

**Request Body:**
```json
{
  "calculator_api_url": "https://api.fastship.com/quotes/v2",
  "calculator_config": {
    "headers": { "X-Access-Token": "12345-abcde" },
    "field_mapping": {
      "request": {
        "usacity": "origin_city",
        "destinationport": "dest_code",
        "vehiclecategory": "cargo_type",
        "static": { "partner_id": "PROJECT_X" }
      },
      "response": {
        "totalPrice": "quote.final_price"
      }
    }
  },
  "test_request": {
    "usacity": "Los Angeles (CA)",
    "destinationport": "POTI",
    "vehiclecategory": "Sedan"
  }
}
```

**What to look for in response:**
*   `"success": true`
*   `"extracted_price": 1450` (or whatever the API returns)

---

### Step 3: Go Live (Save Configuration)

Once the test passes, save the configuration to the company.

**Route:** `PATCH /api/v1/admin/companies/:id/calculator`

**Request Body:**
```json
{
  "calculator_type": "custom_api",
  "calculator_api_url": "https://api.fastship.com/quotes/v2",
  "calculator_config": {
    "timeout": 5000,
    "headers": { "X-Access-Token": "12345-abcde" },
    "field_mapping": {
      "request": {
        "usacity": "origin_city",
        "destinationport": "dest_code",
        "vehiclecategory": "cargo_type",
        "static": { "partner_id": "PROJECT_X" }
      },
      "response": {
        "totalPrice": "quote.final_price"
      }
    }
  }
}
```

---

## � Updating Field Mappings

If the partner changes their API or you need to fix a mapping error, you use the **same PATCH endpoint** as Step 3.

**To Update/Map Fields:**
Send a `PATCH` request to:
`PATCH /api/v1/admin/companies/:id/calculator`

**What to send:**
You must send the **entire** `calculator_config` object again with your changes.

**Example: Changing the destination field mapping**
If FastShip changes their field from `dest_code` to `destination_port_code`, you would send:

```json
{
  "calculator_type": "custom_api",
  "calculator_api_url": "https://api.fastship.com/quotes/v2",
  "calculator_config": {
    "headers": { "X-Access-Token": "12345-abcde" },
    "field_mapping": {
      "request": {
        "usacity": "origin_city",
        "destinationport": "destination_port_code", // <--- UPDATED THIS LINE
        "vehiclecategory": "cargo_type",
        "static": { "partner_id": "PROJECT_X" }
      },
      "response": {
        "totalPrice": "quote.final_price"
      }
    }
  }
}
```

---

## �🛠 Admin Routes Reference

Use these routes to manage the integration.

| Action | Method | Route | Description |
|--------|--------|-------|-------------|
| **View Config** | `GET` | `/api/v1/admin/companies/:id/calculator` | See the current calculator settings for a company. |
| **Update Config** | `PATCH` | `/api/v1/admin/companies/:id/calculator` | Update the mapping, URL, or API type. |
| **Test Config** | `POST` | `/api/v1/admin/companies/:id/calculator/test` | Test a configuration without saving it. |
| **Reset** | `DELETE` | `/api/v1/admin/companies/:id/calculator` | Revert the company to use the **Default Calculator**. |
