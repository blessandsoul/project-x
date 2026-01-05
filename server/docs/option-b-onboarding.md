# Option B: 2-Step Onboarding Implementation

## Overview

This document describes the 2-step registration/onboarding flow:

1. **Step 1**: User registers → creates user with `role='user'`
2. **Step 2**: User creates company via `/companies/onboard` → `role` becomes `'company'`

---

## API Contracts

### POST /auth/register

**Description**: Register a new user account (user role only).

**Auth**: None (public endpoint)

**Rate Limit**: 5 requests per 15 minutes per IP

**Request Body** (strict schema, no additional properties):

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePass123"
}
```

| Field      | Type   | Required | Constraints                |
| ---------- | ------ | -------- | -------------------------- |
| `email`    | string | ✅       | Valid email, max 255 chars |
| `username` | string | ✅       | 3-50 characters            |
| `password` | string | ✅       | 6-255 characters           |

**Response** (201 Created):

```json
{
  "registered": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "company_id": null,
    "avatar_url": null,
    "original_avatar_url": null,
    "company_logo_url": null,
    "original_company_logo_url": null
  }
}
```

**Cookies Set**:

- `access_token` (HttpOnly, 15 min TTL)
- `refresh_token` (HttpOnly, 14 days TTL)
- `csrf_token` (readable by JS)

**Error Responses**:

- `409 CONFLICT_ERROR`: Email or username already exists

---

### POST /companies/onboard

**Description**: Create a company for the authenticated user.

**Auth**: Cookie-based (HttpOnly access token)

**CSRF**: Required (`X-CSRF-Token` header)

**Rate Limit**: 3 requests per hour per user

**Prerequisites**:

- User must be authenticated
- User must NOT already have a company (`company_id IS NULL`)

**Request Body** (strict schema, no additional properties):

```json
{
  "name": "ACME Logistics",
  "companyPhone": "+1-555-123-4567",
  "basePrice": 500,
  "pricePerMile": 1.25,
  "customsFee": 200,
  "serviceFee": 150,
  "brokerFee": 100
}
```

| Field          | Type   | Required | Constraints       |
| -------------- | ------ | -------- | ----------------- |
| `name`         | string | ✅       | 1-255 characters  |
| `companyPhone` | string | ❌       | 3-50 characters   |
| `basePrice`    | number | ❌       | >= 0 (default: 0) |
| `pricePerMile` | number | ❌       | >= 0 (default: 0) |
| `customsFee`   | number | ❌       | >= 0 (default: 0) |
| `serviceFee`   | number | ❌       | >= 0 (default: 0) |
| `brokerFee`    | number | ❌       | >= 0 (default: 0) |

**Response** (201 Created):

```json
{
  "company": {
    "id": 456,
    "name": "ACME Logistics",
    "slug": "acme-logistics",
    "phone_number": "+1-555-123-4567",
    "base_price": 500,
    "price_per_mile": 1.25,
    "customs_fee": 200,
    "service_fee": 150,
    "broker_fee": 100,
    "rating": 0,
    "is_vip": false,
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "user": {
    "id": 123,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "company",
    "company_id": 456
  }
}
```

**Error Responses**:

- `401 UNAUTHORIZED`: Not authenticated
- `403 AUTHORIZATION_ERROR`: CSRF token missing/invalid
- `409 CONFLICT_ERROR`: User already has a company

---

## Database Schema Changes

### Migration File

`server/migrations/option_b_onboarding_schema.sql`

### Key Changes

#### `companies` table

- **Added**: `owner_user_id INT UNSIGNED NULL` with `UNIQUE` constraint
- **FK**: `owner_user_id` → `users.id` (ON DELETE SET NULL)
- **Purpose**: Enforces 1 company per user, enables clean authorization checks

#### `users` table

- **Existing**: `company_id INT UNSIGNED NULL` (FK to `companies.id`)
- **Index**: Added on `company_id` for faster lookups

### Bidirectional Relationship

```
users.company_id ──────────► companies.id
companies.owner_user_id ───► users.id
```

Both columns are kept for:

1. **Authorization**: Check `companies.owner_user_id` to verify ownership
2. **User context**: Check `users.company_id` to get user's company quickly

---

## Modified/Created Files

| File                                        | Action   | Description                                    |
| ------------------------------------------- | -------- | ---------------------------------------------- |
| `migrations/option_b_onboarding_schema.sql` | Created  | Full schema rebuild with owner_user_id         |
| `src/routes/auth.ts`                        | Modified | Simplified register to user-only               |
| `src/routes/company.ts`                     | Modified | Added POST /companies/onboard                  |
| `src/controllers/userController.ts`         | Modified | Simplified register method                     |
| `src/models/CompanyModel.ts`                | Modified | Added owner_user_id support, findByOwnerUserId |
| `src/types/company.ts`                      | Modified | Added owner_user_id to interfaces              |
| `docs/option-b-onboarding.md`               | Created  | This documentation                             |

---

## Test Checklist

### 1. Registration Flow

- [ ] `POST /auth/register` with valid data → 201, role=user, company_id=null
- [ ] `POST /auth/register` with duplicate email → 409
- [ ] `POST /auth/register` with duplicate username → 409
- [ ] `POST /auth/register` with extra fields (e.g., role, name) → 400 (additionalProperties: false)

### 2. Login & Auth

- [ ] `POST /auth/login` → 200, returns user with role/company_id
- [ ] `GET /auth/me` → returns current user state

### 3. Company Onboarding

- [ ] `POST /companies/onboard` without auth → 401
- [ ] `POST /companies/onboard` without CSRF → 403
- [ ] `POST /companies/onboard` with valid data → 201, company created, user.role=company
- [ ] `POST /companies/onboard` again → 409 (already has company)
- [ ] `GET /auth/me` after onboard → role=company, company_id set

### 4. Company Owner Routes

- [ ] `PUT /companies/:id` as owner → 200
- [ ] `PUT /companies/:id` as non-owner → 403
- [ ] `POST /companies/:id/logo` as owner → 201
- [ ] `DELETE /companies/:id` as owner → 204

### 5. Edge Cases

- [ ] Concurrent onboard requests → only one succeeds (UNIQUE constraint)
- [ ] Rate limit: 4th onboard request within 1 hour → 429

---

## Client Integration Notes

### Registration Form

Only collect:

- Email
- Username
- Password

### Post-Login Onboarding

After successful login, check `user.company_id`:

- If `null` → show "Create Your Company" onboarding screen
- If set → user is already a company owner

### Onboarding Form

Collect:

- Company name (required)
- Phone number (optional)
- Pricing fields (optional, default to 0)

### After Onboarding

1. Call `POST /companies/onboard`
2. On success, call `GET /auth/me` to refresh user state
3. Update UI to reflect `role=company` and `company_id`

---

## Running the Migration

⚠️ **WARNING**: This migration WIPES all existing data.

```bash
# From project root
cd server

# Run migration (MySQL)
mysql -u root -p your_database < migrations/option_b_onboarding_schema.sql
```

Or via your preferred MySQL client/tool.
