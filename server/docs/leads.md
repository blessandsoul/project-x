# Leads API

This document describes all endpoints related to the lead exchange flow between users and companies.

Base URL (dev): `http://localhost:3000`

---

## 1. Create Lead From Selected Companies

**POST** `/leads/from-quotes`

Creates a new lead for the authenticated user and invites selected companies to respond.

- **Auth**: Required (user JWT)
- **Use case**: User has selected a vehicle and chooses which companies to send their contact details to.

### Request Body

```json
{
  "vehicleId": 555,
  "selectedCompanyIds": [10, 12, 15],
  "name": "John Doe",
  "contact": "+995 555 000000",
  "message": "Please contact me tomorrow morning",
  "priority": "price"
}
```

- `vehicleId` (integer, required)
- `selectedCompanyIds` (integer[], required, min 1)
  - Company IDs to invite.
- `name` (string, required)
  - User name to share with the selected company.
- `contact` (string, required)
  - Contact info (phone/email) to share.
- `message` (string, optional)
- `priority` (string, optional)
  - One of: `"price" | "speed" | "premium_service"`.

### Response `201 Created`

```json
{
  "leadId": 123,
  "invitedCompanyIds": [10, 12, 15],
  "estimatedResponseTimeHours": 24
}
```

- A row is created in `leads` with `user_id = <authenticated user id>`.
- Rows are created in `lead_companies` for each invited company.

---

## 2. User Side Leads (My Requests)

These endpoints expose the lead inbox for the authenticated **user**.

### 2.1 List My Leads

**GET** `/user/leads`

- **Auth**: Required (user JWT)

Returns all leads where `leads.user_id` equals the authenticated user.

#### Example Response `200 OK`

```json
[
  {
    "id": 123,
    "status": "NEW",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "summary": {
      "budgetUsdMin": null,
      "budgetUsdMax": null,
      "carType": "SUV",
      "priority": "price"
    },
    "offersCount": 2
  }
]
```

- `status` is one of: `NEW`, `MATCHED`/`CLOSED` (depending on implementation), etc.
- `offersCount` is the number of offers in `lead_offers` for that lead.

### 2.2 List Offers For a Lead

**GET** `/user/leads/:leadId/offers`

- **Auth**: Required (user JWT)
- **Access control**: Only works if the lead belongs to this user (`leads.user_id`).

#### Example Request

`GET /user/leads/123/offers`

#### Example Response `200 OK`

```json
[
  {
    "offerId": 1,
    "companyId": 14,
    "companyName": "Best Imports LLC",
    "companyRating": 4.8,
    "companyCompletedDeals": null,
    "estimatedTotalUsd": 9500,
    "estimatedTotalUsdMax": 10500,
    "serviceFeeUsd": 300,
    "estimatedDurationDays": 14,
    "comment": "We can ship in 2 weeks",
    "status": "ACTIVE"
  }
]
```

If the lead exists but has no offers yet, the endpoint returns `[]`.

If the lead does not belong to the authenticated user, the API returns a `NOT_FOUND_ERROR`.

### 2.3 Select Offer For a Lead

**POST** `/user/leads/:leadId/select-offer`

- **Auth**: Required (user JWT)
- **Access control**: Lead must belong to this user.

#### Request Body

```json
{
  "offerId": 1
}
```

- `offerId` must be an existing offer for this `leadId`.

#### Response `200 OK`

```json
{
  "leadId": 123,
  "selectedOfferId": 1
}
```

Side effects:

- `lead_offers`:
  - The selected offer is marked `status = 'SELECTED'`.
  - All other offers for the same lead are marked `status = 'REJECTED'`.
- `leads`:
  - Lead is marked as closed (e.g. `status = 'CLOSED'`).
- At this point you can implement logic to share the user contact with the selected company only.

---

## 3. Company Side Leads (Invitations)

These endpoints expose the lead inbox for **company users**.

A company user is a user with:

- `role = 'company'`
- `company_id` not null

### 3.1 List Leads For Company

**GET** `/company/leads`

- **Auth**: Required (company JWT)

Returns leads where the authenticated user’s `company_id` is invited via `lead_companies`.

#### Example Response `200 OK`

```json
[
  {
    "leadCompanyId": 1,
    "leadId": 123,
    "status": "NEW",
    "invitedAt": "2025-11-18T18:30:00.000Z",
    "expiresAt": "2025-11-19T18:30:00.000Z",
    "leadSummary": {
      "budgetUsdMin": null,
      "budgetUsdMax": null,
      "carType": "SUV",
      "auctionSources": ["copart"],
      "priority": "price"
    }
  }
]
```

### 3.2 Get Lead Details For Company

**GET** `/company/leads/:leadCompanyId`

- **Auth**: Required (company JWT)
- **Access control**: Only rows in `lead_companies` for this company’s `company_id`.

#### Example Request

`GET /company/leads/1`

#### Example Response `200 OK`

```json
{
  "leadCompanyId": 1,
  "leadId": 123,
  "status": "NEW",
  "invitedAt": "2025-11-18T18:30:00.000Z",
  "expiresAt": "2025-11-19T18:30:00.000Z",
  "lead": {
    "budgetUsdMin": null,
    "budgetUsdMax": null,
    "carType": "SUV",
    "auctionSources": ["copart"],
    "message": "Please contact me tomorrow morning",
    "priority": "price"
  }
}
```

**Note**: User contact details are not exposed here; they should only be shared with the selected company after the user picks an offer.

### 3.3 Submit Offer For a Lead (Company)

**POST** `/company/leads/:leadCompanyId/offers`

- **Auth**: Required (company JWT)
- **Access control**: `leadCompanyId` must belong to the authenticated company.

#### Request Body

```json
{
  "estimatedTotalUsd": 9500,
  "estimatedTotalUsdMax": 10500,
  "serviceFeeUsd": 300,
  "estimatedDurationDays": 14,
  "comment": "We can ship in 2 weeks"
}
```

- `estimatedTotalUsd` (number, required)
- `estimatedTotalUsdMax` (number, optional)
- `serviceFeeUsd` (number, optional)
- `estimatedDurationDays` (integer, optional)
- `comment` (string, optional)

#### Response `201 Created`

```json
{
  "offerId": 1,
  "leadId": 123,
  "companyId": 14,
  "status": "ACTIVE",
  "createdAt": "2025-11-18T18:33:34.000Z"
}
```

An entry is created in `lead_offers` bound to:

- `lead_id` (the parent lead)
- `company_id` (from the authenticated company user)
- `lead_company_id` (the specific invitation row)

The user will later see this offer through `/user/leads/:leadId/offers` and may select it via `/user/leads/:leadId/select-offer`.

---

## 4. Summary of Auth Rules

- `POST /leads/from-quotes`

  - Auth: user JWT
  - Effect: creates `leads` + `lead_companies` rows.

- `GET /user/leads`
- `GET /user/leads/:leadId/offers`
- `POST /user/leads/:leadId/select-offer`

  - Auth: user JWT
  - Only accesses leads where `leads.user_id` = current user.

- `GET /company/leads`
- `GET /company/leads/:leadCompanyId`
- `POST /company/leads/:leadCompanyId/offers`
  - Auth: company JWT (user with `role = 'company'` and valid `company_id`).
  - Only accesses rows where `lead_companies.company_id` matches the company.
