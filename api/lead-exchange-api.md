# Lead Exchange API Specification

This document describes the API required to support the lead exchange flow for the **"Personal Recommendation"** block ("მიიღეთ პირადი რეკომენდაცია კომპანიების შესახებ").

Goal: **User submits a single request form, and multiple companies can compete for this lead based on the provided parameters.**

---

## 1. Core Concepts & Data Model

### 1.1. Lead (User Request)

Represents a single user request for help with importing a car.

```ts
Lead {
  id: string;               // unique lead id (UUID)
  userId?: string | null;   // optional platform user id (if the user is logged in)

  // Contact & identity
  name: string;
  contact: string;          // phone / Telegram / email

  // Request details
  budgetUsdMin?: number | null;   // optional
  budgetUsdMax?: number | null;   // optional
  carType?: string | null;        // e.g. "SUV", "sedan", "premium"
  auctionSources?: string[];      // e.g. ["Copart", "IAAI"]
  brand?: string | null;          // e.g. "Toyota", "BMW"
  model?: string | null;          // e.g. "Camry", "X5"
  yearFrom?: number | null;       // minimal desired production year
  color?: string | null;          // e.g. "white", "black", "grey", "any"
  message?: string | null;        // free text

  // Preferences
  priority?: "price" | "speed" | "premium_service" | null;

  // Internal
  status: "NEW" | "MATCHED" | "CLOSED" | "CANCELLED";
  createdAt: string;       // ISO datetime
  updatedAt: string;       // ISO datetime
}
```

### 1.2. LeadCompany (Lead ↔ Company matching)

Represents that a specific company is invited to compete for this lead.

```ts
LeadCompany {
  id: string;                 // unique id
  leadId: string;
  companyId: string;

  status: "INVITED" | "VIEWED" | "RESPONDED" | "EXPIRED";
  invitedAt: string;          // ISO datetime
  viewedAt?: string | null;
  respondedAt?: string | null;
  expiresAt?: string | null;  // when company can no longer respond
}
```

### 1.3. LeadOffer (Company response to a lead)

Represents a specific offer from a company for this lead.

```ts
LeadOffer {
  id: string;
  leadId: string;
  companyId: string;

  // Commercial terms
  estimatedTotalUsd: number;      // total estimated cost range lower bound
  estimatedTotalUsdMax?: number;  // optional upper bound
  serviceFeeUsd?: number | null;  // company fee

  // Timeline
  estimatedDurationDays?: number | null;  // expected duration

  // Description
  comment?: string | null;        // free-form explanation

  // Status
  status: "ACTIVE" | "SELECTED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  updatedAt: string;
}
```

### 1.4. LeadSelection (User choice)

Represents user selecting one company / offer.

```ts
LeadSelection {
  id: string;
  leadId: string;
  companyId: string;
  offerId?: string | null;    // optional if selection is not tied to a specific offer
  createdAt: string;
}
```

---

## 2. High-Level Flow

1. **User submits lead form** on the homepage.
2. Backend creates a `Lead` record and performs **matching** to relevant companies based on filters (budget, type, auction, etc.).
3. For each matched company, backend creates a `LeadCompany` record with status `INVITED`.
4. Companies see new leads in their **company dashboard** and can respond with `LeadOffer`s.
5. User sees all offers in their **user dashboard** and can select one company/offer.
6. When user selects an offer, the corresponding `LeadOffer` and `LeadSelection` are updated, and the lead is marked as `CLOSED`.

---

## 3. Endpoints for Public Website (User side)

### 3.1. Create Lead (Homepage form)

**POST** `/api/leads`

Used by the homepage block to create a new lead from the quick form.

#### Request body (JSON)

```json
{
  "name": "string",                  
  "contact": "string",               
  "budgetUsdMin": 7000,               
  "budgetUsdMax": 12000,              
  "carType": "SUV",                 
  "auctionSources": ["Copart"],      
  "message": "Looking for a family SUV", 
  "priority": "price"               
}
```

Notes:

- `budgetUsdMin` / `budgetUsdMax` are optional (homepage form currently has only a **single numeric `budget` field** – backend can map it to `budgetUsdMax` and optionally derive `budgetUsdMin` from it).
- `carType`, `auctionSources`, `priority` are optional for the first iteration but should be supported.

### 3.1.1. Mapping from current homepage form

The current homepage form sends the following conceptual fields:

- `name` – user name
- `contact` – phone / Telegram
- `budget` – single number in USD (optional)
- `carType` – one of: `"any" | "sedan" | "suv" | "hatchback" | "premium"`
- `auctionSource` – one of: `"any" | "copart" | "iaai" | "manheim"`
- `priority` – one of: `"price" | "speed" | "premium_service"`
- `message` – free text (optional)

Recommended mapping to `POST /api/leads` body:

- If `budget` is provided:
  - set `budgetUsdMax = budget` (number);
  - optionally set `budgetUsdMin = Math.floor(budget * 0.7)` or leave `null`.
- `carType`:
  - if value is `"any"`, set `carType = null` (treat as no preference);
  - otherwise pass the exact value (`"sedan"`, `"suv"`, etc.).
- `auctionSources`:
  - if `auctionSource === "any"`, set `auctionSources` to an empty array or omit this field (backend should treat as no restriction);
  - otherwise set `auctionSources = [auctionSource]`.
- `priority` – pass through as is (`"price" | "speed" | "premium_service"`).
- `message` – pass through as is.

#### Response 201 (Created)

```json
{
  "id": "lead_123",
  "status": "NEW",
  "estimatedResponseTimeHours": 24
}
```

The frontend needs only `id` and an approximate response time to show a success message.

---

### 3.2. Get User Leads (My Requests)

**GET** `/api/user/leads`

Returns the list of leads for the currently authenticated user (for future personal cabinet / dashboard).

#### Response 200

```json
[
  {
    "id": "lead_123",
    "status": "MATCHED",
    "createdAt": "2025-01-01T10:00:00Z",
    "summary": {
      "budgetUsdMin": 7000,
      "budgetUsdMax": 12000,
      "carType": "SUV",
      "priority": "price"
    },
    "offersCount": 3
  }
]
```

---

### 3.3. Get Offers for a Lead (User view)

**GET** `/api/user/leads/:leadId/offers`

Returns all active offers for the given lead visible to the user.

#### Response 200

```json
[
  {
    "offerId": "offer_1",
    "companyId": "company_1",
    "companyName": "Best Imports LLC",
    "companyRating": 4.8,
    "companyCompletedDeals": 120,
    "estimatedTotalUsd": 9500,
    "estimatedTotalUsdMax": 11000,
    "serviceFeeUsd": 700,
    "estimatedDurationDays": 30,
    "comment": "We can handle full process including customs.",
    "status": "ACTIVE"
  }
]
```

Notes:

- Contact details (phone/email) of the user **should not be included here** – they are implicit.
- Company contact details may be shown or partially masked according to business rules.

---

### 3.4. Select Offer (User picks a company)

**POST** `/api/user/leads/:leadId/select-offer`

User selects one company/offer. This action can also trigger revealing contact details to the selected company.

#### Request body

```json
{
  "offerId": "offer_1"
}
```

#### Response 200

```json
{
  "leadId": "lead_123",
  "selectedOfferId": "offer_1",
  "companyId": "company_1",
  "status": "CLOSED"
}
```

Side effects:

- Mark lead as `CLOSED`.
- Mark selected `LeadOffer` as `SELECTED` and others as `REJECTED`/`EXPIRED`.
- Optionally, grant the selected company access to full user contact details.

---

## 4. Endpoints for Company Dashboard

### 4.1. List Leads for Company

**GET** `/api/company/leads`

Returns leads that match this company, with basic information.

Query params (optional):

- `status` – filter by `INVITED`, `VIEWED`, `RESPONDED`, `EXPIRED`.

#### Response 200

```json
[
  {
    "leadCompanyId": "lc_1",
    "leadId": "lead_123",
    "status": "INVITED",
    "invitedAt": "2025-01-01T10:00:00Z",
    "expiresAt": "2025-01-02T10:00:00Z",
    "leadSummary": {
      "budgetUsdMin": 7000,
      "budgetUsdMax": 12000,
      "carType": "SUV",
      "auctionSources": ["Copart"],
      "priority": "price"
    }
  }
]
```

Notes:

- User contact details are **not returned** here.
- Company only sees the information needed to decide if they want to respond.

---

### 4.2. Get Detailed Lead Info for Company

**GET** `/api/company/leads/:leadCompanyId`

Returns detailed information about a specific lead match from the company perspective.

#### Response 200

```json
{
  "leadCompanyId": "lc_1",
  "leadId": "lead_123",
  "status": "INVITED",
  "invitedAt": "2025-01-01T10:00:00Z",
  "expiresAt": "2025-01-02T10:00:00Z",
  "lead": {
    "budgetUsdMin": 7000,
    "budgetUsdMax": 12000,
    "carType": "SUV",
    "auctionSources": ["Copart"],
    "message": "Looking for a family SUV",
    "priority": "price"
  }
}
```

Side effect:

- Backend may mark `LeadCompany.status` as `VIEWED` when this endpoint is called.

---

### 4.3. Submit Offer for a Lead

**POST** `/api/company/leads/:leadCompanyId/offers`

Company responds to a lead with a concrete commercial offer.

#### Request body

```json
{
  "estimatedTotalUsd": 9500,
  "estimatedTotalUsdMax": 11000,
  "serviceFeeUsd": 700,
  "estimatedDurationDays": 30,
  "comment": "We can handle auction bidding, shipping, and customs."
}
```

#### Response 201

```json
{
  "offerId": "offer_1",
  "leadId": "lead_123",
  "companyId": "company_1",
  "status": "ACTIVE",
  "createdAt": "2025-01-01T12:00:00Z"
}
```

Side effects:

- Mark `LeadCompany.status` as `RESPONDED`.
- Mark old offers from this company for this lead as `EXPIRED` if only one active offer is allowed.

---

## 5. Matching Logic (Backend responsibility)

Matching is done **after** `POST /api/leads` succeeds:

1. Find all companies that:
   - operate on requested `auctionSources` (if provided),
   - can serve the requested `carType` (if provided),
   - support the given budget range,
   - are active and allowed to receive leads.

2. For each such company create a `LeadCompany` record.
3. Optionally limit the number of companies per lead (e.g. max 5–7) to avoid spamming the user.

This logic is purely backend and can evolve without changing the public API, as long as the contract above is respected.

---

## 6. Privacy & Contact Sharing

- User contacts (`name`, `contact`) are stored in `Lead` but are **never returned** to company endpoints directly.
- Once the user selects an offer (`POST /api/user/leads/:leadId/select-offer`), backend can:
  - either send the user contact details to the selected company via a **separate internal mechanism** (e.g. internal API/event),
  - or expose them through a separate authenticated endpoint (not covered here) that is only available to the selected company.

This keeps the promise: _"თქვენი კონტაქტი არ გადაეცემა მესამე მხარეებს"_ – only companies that the user explicitly chooses get access.

---

## 7. Error Handling (General)

Use standard HTTP status codes:

- `400 Bad Request` – validation errors (missing name/contact, invalid budget, etc.).
- `401 Unauthorized` – when user/company is not authenticated.
- `403 Forbidden` – when a company/user tries to access a lead not belonging to them.
- `404 Not Found` – lead / leadCompany / offer does not exist.
- `409 Conflict` – user tries to select an offer for a closed lead.

Error response shape:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Contact is required",
  "fields": {
    "contact": "This field is required"
  }
}
```
