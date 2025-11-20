# Unified Pricing Calculator Specification

## 1. Purpose

The goal is to have **one unified cost calculator** on each company detail page that:

- **Looks and behaves the same** for all companies.
- Works **even if we never receive any official API** from partner companies.
- Can later be extended to **use external APIs**, but **does not depend on them**.

This document describes the **data model, calculation flow and UI behavior** for the MVP version of TrustedImporters.Ge.

---

## 2. High-Level Concept

- **Single UI component**: one calculator shown on each company detail page.
- **Company-specific logic = configuration**, not hardcoded if/else everywhere.
- The calculator takes **the same user inputs** for all companies and produces a **standardized breakdown of costs**.

Internally we use:

- **`UnifiedQuoteInput`** – what the user enters.
- **`CompanyPricingProfile`** – how a specific company calculates prices (local config).
- **`calculateUnifiedQuote(input, profile)`** – one shared function for all companies.
- **`UnifiedQuote`** – normalized result with a consistent breakdown.

---

## 3. User Inputs (UnifiedQuoteInput)

The same input form is used for every company.

- **Basic vehicle data**
  - **`carPrice`** – auction price in USD.
  - **`year`** – year of manufacture.
  - **`engineVolume`** – in liters or cc.
  - **`fuelType`** – e.g. petrol / diesel / hybrid / electric.
  - **`bodyType`** – e.g. sedan / SUV / pickup / minivan / truck.

- **Location & logistics**
  - **`auctionLocation`** – US state or zone (e.g. "CA", "NY Zone 1").
  - **`destinationPort`** – Poti / Batumi (and later other ports if needed).
  - **`destinationCity`** – optional (e.g. Tbilisi), for last-mile delivery in Georgia.

- **Other options (future-proof)**
  - **`isDismantled` / `cutCar`** – if the car is shipped cut for parts.
  - **`insuranceSelected`** – whether transport insurance is included.

Example (TypeScript-like):

```ts
type Port = 'POTI' | 'BATUMI';

type FuelType = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';

type BodyType = 'SEDAN' | 'SUV' | 'PICKUP' | 'MINIVAN' | 'TRUCK';

interface UnifiedQuoteInput {
  carPrice: number;
  year: number;
  engineVolume: number; // liters or cc
  fuelType: FuelType;
  bodyType: BodyType;

  auctionLocation: string; // state or internal zone id
  destinationPort: Port;
  destinationCity?: string;

  isDismantled?: boolean;
  insuranceSelected?: boolean;
}
```

---

## 4. Output Model (UnifiedQuote)

Regardless of company, the calculator returns **the same structure**:

- **`breakdown`** – detailed per-block costs.
- **`total`** – final approximate total in USD.
- **`currency`** – currently always `"USD"`.
- **`notes`** – technical / UX notes (e.g. "US transport included in service fee").

### Standard breakdown blocks

- **`carPrice`** – raw auction price (user input).
- **`auctionFee`** – auction commissions.
- **`usTransport`** – inland US transport from auction yard to port.
- **`oceanFreight`** – sea freight from US port to Georgia (Poti/Batumi).
- **`portFees`** – port handling, loading/unloading, documentation in Georgia.
- **`customs`** – taxes and customs duties in Georgia (estimated).
- **`serviceFee`** – importer company service fee (their commission).
- **`extra`** – other costs (insurance, cut service, storage, etc.).

Example:

```ts
interface UnifiedQuoteBreakdown {
  carPrice: number;
  auctionFee: number;
  usTransport: number;
  oceanFreight: number;
  portFees: number;
  customs: number;
  serviceFee: number;
  extra: number;
}

interface UnifiedQuote {
  breakdown: UnifiedQuoteBreakdown;
  total: number;
  currency: 'USD';
  notes: string[];
}
```

This allows a **single UI** to display a consistent table for every company.

---

## 5. Company Configuration (CompanyPricingProfile)

Each company has a **pricing profile** that defines how each block is calculated.

Key idea: **no hard-coded business rules per company in React components**.  
Instead we:

- Define a **config object for each company**.
- Use **one generic calculation function** that reads from that config.

### Core structure

```ts
interface AuctionFeeConfig {
  type: 'fixed' | 'percent' | 'tiered';
  value?: number; // for fixed or percent
  tiers?: Array<{
    minPrice: number;
    maxPrice: number;
    fee: number;
  }>;
}

interface UsTransportConfig {
  type: 'per_mile' | 'zone_flat' | 'included';
  base?: number; // base fee
  perMile?: number; // cost per mile
  zones?: Array<{
    zoneId: string; // e.g. "EAST_COAST", "WEST_COAST"
    price: number;
  }>;
}

interface OceanFreightConfigPerPort {
  type: 'per_car' | 'per_container_share';
  amount: number;
}

interface CompanyPricingProfile {
  companyId: string;

  supportedPorts: Port[];
  supportedBodyTypes: BodyType[];

  auctionFee: AuctionFeeConfig;

  usTransport: UsTransportConfig;

  oceanFreight: {
    [port in Port]?: OceanFreightConfigPerPort;
  };

  portFees: {
    fixed: number;
  };

  serviceFee: {
    fixed: number;
    percentOfCar?: number; // optional share of car price
  };

  customs: {
    strategy: 'use_global_formula' | 'external_link_only';
  };

  extra?: {
    insuranceRatePercent?: number;
    dismantlingFee?: number;
  };

  hasDetailedBreakdown: boolean; // if false, more approximate breakdown
}
```

### Example profiles (conceptual)

- **Company A** – includes US inland transport in service fee.
  - `usTransport.type = 'included'`
  - `serviceFee.fixed` is higher.
- **Company B** – fixed ocean freight per car to Poti, different price for Batumi.
  - `oceanFreight.POTI = { type: 'per_car', amount: 900 }`
  - `oceanFreight.BATUMI = { type: 'per_car', amount: 950 }`
- **Company C** – only provides a total quote page on their site (no API).
  - `hasDetailedBreakdown = false`
  - `customs.strategy = 'use_global_formula'`
  - Internal configuration uses **average market rates** for transport and duties.

All of these still use **the same UI** and **the same calculation function**.

---

## 6. Calculation Flow

High-level algorithm for `calculateUnifiedQuote(input, profile)`:

1. **Normalize inputs**
   - Validate required fields (`carPrice`, `year`, etc.).
   - Map `auctionLocation` to internal **zone id**, if `zone_flat` is used.

2. **Auction fee**
   - If `type = 'fixed'`: `auctionFee = profile.auctionFee.value`.
   - If `type = 'percent'`: `auctionFee = carPrice * value`.
   - If `type = 'tiered'`: select tier by `carPrice` and use that fee.

3. **US inland transport**
   - If `type = 'per_mile'`: calculate distance (from mapping table) × `perMile` + `base`.
   - If `type = 'zone_flat'`: find zone (`auctionLocation` → zone) and take fixed price.
   - If `type = 'included'`: `usTransport = 0`, and add a note like:
     - `"US inland transport is included in the company service fee."`

4. **Ocean freight**
   - Read config for `input.destinationPort`.
   - Use `amount` as the `oceanFreight` value.

5. **Port fees**
   - Use `profile.portFees.fixed`.

6. **Customs**
   - If `customs.strategy = 'use_global_formula'`:
     - Call internal **global customs calculator** with:
       - `carPrice`, `year`, `engineVolume`, `fuelType`, etc.
   - If `customs.strategy = 'external_link_only'`:
     - Set `customs` to **0** or a **rough estimate**, and add a note:
       - `"Customs cost is approximate. Please confirm with the customs calculator or broker."`

7. **Service fee**
   - Start with `serviceFee.fixed`.
   - If `percentOfCar` is set: add `carPrice * percentOfCar`.

8. **Extra**
   - **Insurance**: if `insuranceSelected`:
     - `extra += carPrice * insuranceRatePercent`.
   - **Dismantling / cut car**: if `isDismantled`:
     - `extra += dismantlingFee`.

9. **Total**
   - Sum all blocks:
     - `total = carPrice + auctionFee + usTransport + oceanFreight + portFees + customs + serviceFee + extra`.

10. **Return standardized result**
   - Fill `UnifiedQuote` with all block values and any notes.

---

## 7. Behavior Without External APIs

The system must work **100% offline from partner APIs**:

- All calculations are based on:
  - **Local configuration** (`CompanyPricingProfile`).
  - **Global customs formula** (owned by us).
- Partner calculators are used only as:
  - **Reference** for initial configuration.
  - **Links**/tooltips for users who want to double-check.
- If a company later provides an API:
  - We can add an optional hook inside `CompanyPricingProfile`:
    - e.g. `externalCalculator?: (input) => Promise<UnifiedQuoteOverride>`.
  - But **it is not required** for MVP.

### Key principle

> The calculator always returns a result using our own logic, and then optionally can be refined by partner data.

---

## 8. UI / UX Behavior (Company Detail Page)

On each company detail page:

- **Single calculator UI** with inputs from section 3.
- After user clicks **"Calculate"**:
  - Call `calculateUnifiedQuote(input, profile)` for this company.
  - Render a **single standardized breakdown table**:

    - **[title]** Car price  
    - **[title]** Auction fee  
    - **[title]** US inland transport  
    - **[title]** Ocean freight  
    - **[title]** Port fees  
    - **[title]** Customs (estimated)  
    - **[title]** Company service fee  
    - **[title]** Extra costs  
    - **[title]** Total

- Show:
  - **Currency** (USD).
  - **Disclaimer text**:
    - "All prices are approximate and may vary. Please confirm with the company."

If some block is **"included"** in another:

- Show value `0` (or a short text) with a note, e.g.:
  - `"Included in company service fee"`  
  - `"Included in total quote from partner"`

This keeps the **structure the same** across all companies.

---

## 9. Extensibility

The design is made to support:

- **More ports** (add new `Port` values, extend `oceanFreight` configs).
- **New body types / fuel types** without breaking existing companies.
- **Future external APIs**:
  - Add optional fields to `CompanyPricingProfile` for remote calls.
  - Still keep `calculateUnifiedQuote` as the single entry point.

---

## 10. Summary

- We have **one unified calculator** with:
  - Standard **inputs** (`UnifiedQuoteInput`).
  - Standard **outputs** (`UnifiedQuote` with `breakdown`).
- Each company is configured via **`CompanyPricingProfile`**, not hard-coded logic.
- All calculations work **without any external API**.
- The UI shows **the same breakdown table** for every company, with optional notes when costs are included or approximate.

This document should be enough for a developer to:
- Implement TypeScript types.
- Create local config files for companies.
- Implement the **single `calculateUnifiedQuote` function**.
- Integrate the calculator into the company detail page in a consistent way.
```
