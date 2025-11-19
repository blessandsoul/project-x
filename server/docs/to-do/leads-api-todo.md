# Leads API – Backend TODO

This file describes **required extensions** to the existing `Leads API` (`server/docs/leads.md`) to fully support the flow:

- User on **Vehicle Details** page selects up to 5 companies.
- Sends one consolidated request about a specific vehicle.
- Companies see a **lead bubble** with vehicle snapshot in their dashboard.
- Companies submit **structured offers** (price, timing, conditions).
- User compares up to 5 offers and selects one.
- Winning company gets the lead; others see it as **lost** (optionally with paid insights).

---

## 1. Extend `POST /leads/from-quotes` (user request payload)

Current request body (from `leads.md`):

```jsonc
{
  "vehicleId": 555,
  "selectedCompanyIds": [10, 12, 15],
  "name": "John Doe",
  "contact": "+995 555 000000",
  "message": "Please contact me tomorrow morning",
  "priority": "price"
}
```

To give companies enough context about **what exactly user wants**, add the following optional fields (backwards compatible):

```yaml
# TODO-FX: Extend POST /leads/from-quotes payload.
# API Endpoint: POST /leads/from-quotes
# Summary: Create a lead for a specific vehicle and invite selected companies.
# Extended Request Body (additional fields):
#   type: object
#   properties:
#     budgetUsdMin:
#       type: number
#       nullable: true
#       description: "Minimum desired total budget in USD (car + delivery + customs + service)."
#     budgetUsdMax:
#       type: number
#       nullable: true
#       description: "Maximum desired total budget in USD."
#     desiredDurationDays:
#       type: integer
#       nullable: true
#       description: "Ideal delivery time (e.g. 14 days)."
#     maxAcceptableDurationDays:
#       type: integer
#       nullable: true
#       description: "Hard limit for delivery time the user is still OK with."
#     damageTolerance:
#       type: string
#       nullable: true
#       enum: ["minimal", "moderate", "any"]
#       description: "How much damage the user is willing to accept to get a better deal."
#     serviceExtras:
#       type: array
#       nullable: true
#       items:
#         type: string
#       description: "Requested extra services: full_customs, photo_report, doc_support, etc."
#     preferredContactChannel:
#       type: string
#       nullable: true
#       enum: ["whatsapp", "telegram", "phone", "email"]
#       description: "Where the company should contact the user first."
```

**Implementation hint (DB):** these can be stored either as explicit columns on `leads` or in a JSONB column like `leads.details`.

> Status: **REQUIRED** to support rich lead context for both user comparison UI and company-side offer forms.

---

## 2. Expose vehicle snapshot in company-side lead endpoints

Goal: company dashboard should show a **bubble with the car image and title** for each new invitation.

### 2.1 `GET /company/leads` – add `vehicle` snapshot

Current example (`leads.md`):

```jsonc
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
```

Proposed extension:

```yaml
# TODO-FX: Attach vehicle snapshot to company lead list.
# API Endpoint: GET /company/leads
# Extended Response item (additional fields inside leadSummary or sibling `vehicle` object):
#   properties:
#     vehicle:
#       type: object
#       description: "Snapshot of the vehicle this lead refers to."
#       properties:
#         id:
#           type: integer
#           description: "Same as request.vehicleId from POST /leads/from-quotes."
#         title:
#           type: string
#           example: "2019 Toyota Camry SE"
#         year:
#           type: integer
#           example: 2019
#         mainImageUrl:
#           type: string
#           format: uri
#           example: "https://.../camry.jpg"
#         auctionLotUrl:
#           type: string
#           nullable: true
#           format: uri
#           description: "Optional link to the auction lot or listing."
```

This allows the frontend to render the **jumping lead bubble** with:

- Car image.
- Short title (brand, model, year).
- Status badge and countdown to `expiresAt`.

### 2.2 `GET /company/leads/:leadCompanyId` – include same `vehicle` block

For detailed lead view, include the same `vehicle` object alongside `lead`:

```yaml
# TODO-FX: Attach vehicle snapshot to company lead details.
# API Endpoint: GET /company/leads/{leadCompanyId}
# Extended Response (additional field):
#   properties:
#     vehicle:
#       $ref: "#/components/schemas/LeadVehicleSnapshot"  # same structure as above
```

> Status: **REQUIRED** for visual bubble UI in company dashboard and to give immediate context without opening the vehicle page.

---

## 3. Lead & offer status semantics for companies (WIN / LOST)

Current docs describe closing a lead when the user selects an offer, but do not formalize **company-side WIN/LOST semantics**.

### 3.1 LeadCompany status

Introduce/clarify `lead_companies.status` values exposed via `/company/leads` and `/company/leads/:leadCompanyId`:

```yaml
# TODO-FX: Standardize lead_companies.status values.
# Possible values:
#   - NEW: company has been invited, no offer submitted yet.
#   - OFFER_SENT: company submitted at least one ACTIVE offer.
#   - WON: user selected this company's offer for the lead.
#   - LOST: user selected another company's offer for the same lead.
#   - EXPIRED: invitation expired before any offer was accepted.
```

On `POST /user/leads/:leadId/select-offer`:

- Set `lead_companies.status = 'WON'` for the winning `leadCompanyId`.
- Set `lead_companies.status = 'LOST'` for all other companies on that `leadId`.
- Keep existing `lead_offers.status = 'SELECTED' | 'REJECTED'` logic.

> Status: **REQUIRED** to show clear WIN/LOST state in company dashboard and to power paid “lost lead” analytics later.

---

## 4. (Optional / future) Paid "lost lead" insight endpoint

Business goal: allow companies that **lost** a lead to pay to see why they lost (what the winning offer looked like).

### 4.1 Conceptual endpoint

```yaml
# TODO-FX: Design paid lost-lead insights API.
# API Endpoint: GET /company/leads/{leadCompanyId}/lost-insights
# Auth: company JWT, must own this leadCompanyId, and lead_companies.status must be LOST.
# Access control: gated by billing/subscription logic (out of scope for now).
# Response 200 (example shape):
#   type: object
#   properties:
#     winnerSummary:
#       type: object
#       description: "High-level info about the winning company and offer (no PII)."
#       properties:
#         companyRating:
#           type: number
#         estimatedTotalUsd:
#           type: number
#         estimatedDurationDays:
#           type: integer
#         keyDifferentiators:
#           type: array
#           items:
#             type: string
#           example:
#             - "Cheaper by 400 USD"
#             - "Faster by 4 days"
#             - "Better rating (4.9 vs 4.2)"
#     canContactUserAgain:
#       type: boolean
#       description: "Whether follow-up contact is allowed by policy."
```

> Status: **OPTIONAL / PHASE 2** – not required for initial launch of lead exchange, but important for future monetization (paid analytics for LOST leads).

---

## 5. Mapping to frontend features

These backend changes directly support:

- Vehicle Details page:
  - Rich lead creation form (budget, timing, damage tolerance, extras, contact channel).
- User Dashboard:
  - Comparing offers taking into account requested vs offered budget/timing.
- Company Dashboard:
  - Animated "new lead" bubbles with car photo and status.
  - Clear WIN/LOST states for each lead invitation.
  - Future upsell: paid access to lost-lead insight reports.
