# TrustedImporters.Ge – Missing APIs to Replace Mock Data

## Purpose

The frontend currently still relies on `mocks/_mockData` for several areas (navigation, home content, companies, examples, reviews, etc.).  
This document describes **APIs that do not yet exist in the backend docs** but are required to:

- Fully replace mock data with real backend data.
- Keep the current UX/flows for Home, Search, Catalog, Company Profile, Dashboard, Auctions.

This document does **not** list endpoints that already exist (`/vehicles/*`, `/companies`, `/login`, `/profile`, `/api/vin/*`, etc.), only the missing ones and recommended extensions.

---

## 1. Portal Content & Navigation

### 1.1. GET `/api/navigation`

**Current state**

- The frontend uses `mockNavigationItems` from `client/src/mocks/_mockData.js` to render the header navigation on all pages.

**Goal**

- Return the main navigation configuration (id, label, URL) from the backend.

**Request**

- `GET /api/navigation`

**Response (200)**

```jsonc
[
  {
    "id": "home",
    "label": "Home",
    "href": "/"
  },
  {
    "id": "search",
    "label": "Search",
    "href": "/search"
  },
  {
    "id": "catalog",
    "label": "Catalog",
    "href": "/catalog"
  },
  {
    "id": "dashboard",
    "label": "Dashboard",
    "href": "/dashboard"
  },
  {
    "id": "logisticsRadar",
    "label": "Logistics Radar",
    "href": "/logistics-radar"
  },
  {
    "id": "auctionListings",
    "label": "Auction Listings",
    "href": "/auction-listings"
  },
  {
    "id": "carfax",
    "label": "VIN Check",
    "href": "/vin"
  }
]
```

**Used by frontend**

- `Header` component on all pages: `HomePage`, `AuctionListingsPage`, `CompanySearchPage`, `CompanyCatalogPage`, `DashboardPage`, `CarfaxPage`, `LogisticsRadarPage`, etc.

---

### 1.2. GET `/api/content/home`

**Current state**

- Home page content (title, subtitle, description, feature list) is taken from `mockContent` in `_mockData.js`.

**Goal**

- Serve home page content from the backend (preparation for a future CMS / configuration layer).

**Request**

- `GET /api/content/home`

**Response (200)**

```jsonc
{
  "title": "Import cars from the USA to Georgia",
  "subtitle": "Find trusted companies for vehicle import",
  "description": "Our platform helps you find the best companies for importing cars from the USA to Georgia...",
  "features": [
    {
      "id": "1",
      "title": "Full service",
      "description": "From documentation to delivery – everything in one place."
    },
    {
      "id": "2",
      "title": "Experienced companies",
      "description": "Only verified and highly rated importers."
    },
    {
      "id": "3",
      "title": "Transparent pricing",
      "description": "No hidden fees or commissions."
    }
  ]
}
```

**Used by**

- `HomePage` and multiple blocks under `components/home/*`.

---

### 1.3. GET `/api/footer/links`

**Current state**

- `mockFooterLinks` from `_mockData.js` are used by the `Footer` component on all pages.

**Goal**

- Store and manage footer links on the backend.

**Request**

- `GET /api/footer/links`

**Response (200)**

```jsonc
[
  { "id": "privacy", "label": "Privacy", "href": "/privacy" },
  { "id": "terms", "label": "Terms", "href": "/terms" },
  { "id": "support", "label": "Support", "href": "/support" }
]
```

---

## 2. Search Filters for Companies

### 2.1. GET `/api/search/filters`

**Current state**

- Default filters are taken from `mockSearchFilters` in `_mockData.js`:
  - `geography[]` (US states),
  - `services[]`,
  - `priceRange: [min, max]`,
  - `rating`,
  - `vipOnly`.

- Used in:
  - `useCompanySearch` (initial state for shared filter context),
  - `CompanySearchPage`, `CompanyCatalogPage`,
  - home sections: `QuickSearchSection`, `PriceCalculatorSection`, `AudienceSegmentationSection`, `ReadyScenariosSection`,
  - `services/companiesApi.ts` (to derive fake states/services for companies from existing backend data).

**Goal**

- Provide a single endpoint with default search filters and reference lists (states, services, etc.).

**Request**

- `GET /api/search/filters`

**Response (200)**

```jsonc
{
  "geography": ["California", "Texas", "Florida", "New York", "Georgia"],
  "services": [
    "Full Import Service",
    "Documentation",
    "Shipping",
    "Customs Clearance",
    "Vehicle Inspection"
  ],
  "priceRange": [1000, 10000],
  "rating": 0,
  "vipOnly": false
}
```

**Future extensions**

- This endpoint can later be extended to include more dictionaries for the UI (e.g. company types, categories, etc.).

---

## 3. Import Cases & Example Vehicles

### 3.1. GET `/api/imports/recent-cases`

**Current state**

- `mockRecentCases` in `_mockData.js` are used at the bottom of `AuctionListingsPage` in the section "recent successful imports".

**Goal**

- Show real examples of successfully completed imports (make/model, from/to, duration).

**Request**

- `GET /api/imports/recent-cases`

**Response (200)**

```jsonc
[
  {
    "id": "case-1",
    "make": "BMW",
    "model": "X5",
    "from": "USA (New York)",
    "to": "Batumi",
    "days": 12,
    "completedAt": "2024-05-12"
  }
]
```

**Used by**

- `AuctionListingsPage` – "recent import cases" section.

---

### 3.2. GET `/companies/:companyId/imported-cars`

**Current state**

- `mockCars` (generated based on `mockCompanies`) are used in `CompanyProfilePage` in the "Imported vehicles examples" section.

**Goal**

- For a given company, return examples of vehicles they have already imported.

**Request**

- `GET /companies/:companyId/imported-cars`

**Response (200)**

```jsonc
[
  {
    "id": "car-uuid",
    "companyId": "1",
    "make": "Toyota",
    "model": "Camry",
    "year": 2018,
    "price": 15000,
    "mileage": 85000,
    "imageUrl": "https://…",
    "vin": "1HGCM82633A004352",
    "bodyType": "Sedan",
    "fuelType": "Gasoline",
    "transmission": "Automatic"
  }
]
```

**Used by**

- `CompanyProfilePage` – examples of imported cars for that company.

---

## 4. Company Reviews API

### 4.1. GET `/companies/:companyId/reviews`

**Current state**

- Reviews are embedded into `mockCompanies[].reviews`:
  - `CompanyProfilePage` – "Reviews" section.
  - `TestimonialsSection` (home) – aggregates reviews from all companies.

- `companies-api.md` does not describe any dedicated reviews endpoint; it only covers company pricing and social links.

**Goal**

- Provide reviews per company as a separate endpoint.

**Request**

- `GET /companies/:companyId/reviews`

**Response (200)**

```jsonc
[
  {
    "id": "rev-1",
    "userName": "John Doe",
    "rating": 5,
    "comment": "Everything went smoothly",
    "date": "2024-10-01"
  }
]
```

**Used by**

- `CompanyProfilePage` – reviews list.
- `TestimonialsSection` – picks first N reviews across companies.

---

### 4.2. POST `/companies/:companyId/reviews` (optional)

**Goal (optional)**

- Allow users to submit a review for a company from the frontend.

**Request**

- `POST /companies/:companyId/reviews`

```jsonc
{
  "rating": 5,
  "comment": "Text of the review",
  "userName": "optional if taken from profile"
}
```

**Response (201)**

```jsonc
{
  "id": "rev-uuid",
  "userName": "John Doe",
  "rating": 5,
  "comment": "Text of the review",
  "date": "2024-10-01"
}
```

---

## 5. Extending Existing Companies Endpoints (fields)

The frontend currently consumes companies like this:

- `GET /companies` → `services/companiesApi.ts → mapApiCompanyToUiCompany()`  
  and then injects client-side data derived from mocks:

  - `rating = 0`
  - `reviewCount = 0`
  - `vipStatus = false`
  - `location.state` / `location.city` – picked from `mockSearchFilters.geography` and hardcoded `city: "Tbilisi"`.
  - `services[]` – taken from `mockSearchFilters.services`.

To get rid of these mock-based enrichments and match the `mockCompanies` shape more closely, we recommend extending the existing `/companies` and `/companies/:id` endpoints.

### 5.1. Recommended additional fields in `GET /companies` and `GET /companies/:id`

**Suggested payload shape (additions marked):**

```jsonc
{
  "id": 1,
  "name": "Premium Auto Import LLC",
  "logo": "https://...",
  "description": "…",
  "phone_number": "+995...",
  "base_price": 500,
  "price_per_mile": 0.5,
  "customs_fee": 300,
  "service_fee": 200,
  "broker_fee": 150,

  "rating": 4.6,
  "reviewCount": 32,
  "vipStatus": true,

  "location": {
    "state": "California",
    "city": "Los Angeles"
  },

  "services": [
    "Full Import Service",
    "Documentation",
    "Shipping"
  ],

  "priceRange": {
    "min": 1500,
    "max": 3500,
    "currency": "USD"
  }
}
```

**Why:**

- `CompanySearchPage`, `CompanyCatalogPage`, `CompanyProfilePage` and Home sections (`FeaturedCompaniesSection`, `CompanyCompareSection`, `TestimonialsSection`) all rely on these fields when using mocks.
- Providing them from the backend removes hard-coded UI logic and makes the data consistent across features.

---

## 6. Summary

**New endpoints to implement**

1. `GET /api/navigation`  
2. `GET /api/content/home`  
3. `GET /api/footer/links`  
4. `GET /api/search/filters`  
5. `GET /api/imports/recent-cases`  
6. `GET /companies/:companyId/imported-cars`  
7. `GET /companies/:companyId/reviews`  
8. *(optional)* `POST /companies/:companyId/reviews`

**Extensions to existing endpoints**

- `GET /companies`  
- `GET /companies/:id`

Add the following fields to the response:

- `rating`
- `reviewCount`
- `vipStatus`
- `location` (state, city)
- `services` (string[])
- `priceRange` ({ min, max, currency })

Implementing the endpoints and field extensions above will allow the frontend to fully drop `mocks/_mockData` for navigation, companies, reviews, examples, and home content, while keeping the current UX intact.
