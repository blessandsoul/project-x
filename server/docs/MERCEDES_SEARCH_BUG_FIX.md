# Mercedes-Benz Search Bug - Fix Summary

## Problem
Searching for "Mercedes", "Mercedes-Benz", "Benz", or any variation was returning 0 results despite having many Mercedes-Benz vehicles in the database.

## Root Cause
The vehicle search was using `canonical_brand` column (which stores the display name like "Mercedes-Benz") but comparing it against the canonical **key** value (like "mercedesbenz"). This mismatch caused all searches to fail.

Additionally, the database was missing the required `canonical_brand_key` column entirely.

## Files Changed

### 1. `server/src/models/VehicleModel.ts`
**Lines 177 and 459**: Changed from `canonical_brand` to `canonical_brand_key`

```typescript
// Before (WRONG):
conditions.push('canonical_brand = ?');

// After (CORRECT):
conditions.push('canonical_brand_key = ?');
```

### 2. `server/migrations/add_canonical_vehicle_columns.sql` (NEW)
Adds the missing canonical columns to the vehicles table:
- `canonical_brand` - Display name (e.g., "Mercedes-Benz")
- `canonical_brand_key` - Search key (e.g., "mercedesbenz")  
- `canonical_model_key` - Model search key (e.g., "cclass")

### 3. `server/src/scripts/backfillCanonicalVehicles.ts` (NEW)
Script to populate canonical values for all existing vehicles in the database.

## How to Apply the Fix

### Step 1: Run the Migration
```bash
cd server
# Apply the migration to your database
mysql -u root -p -h localhost -D your_database < migrations/add_canonical_vehicle_columns.sql
```

### Step 2: Build and Run the Backfill Script
```bash
# Build the TypeScript
npm run build

# Run the backfill script
node dist/scripts/backfillCanonicalVehicles.js
```

### Step 3: Restart the Server
The server should automatically pick up the changes. If running in development:
```bash
npm run dev
```

## Verification

After applying the fix, test these searches:
- ✅ "Mercedes" → Should return Mercedes-Benz vehicles
- ✅ "mercedes-benz" → Should return Mercedes-Benz vehicles
- ✅ "Benz" → Should return Mercedes-Benz vehicles
- ✅ "MB" → Should return Mercedes-Benz vehicles

## Impact on Other Brands

This fix also ensures proper searching for ALL brands with:
- Hyphens (Land-Rover, Rolls-Royce, Harley-Davidson)
- Multiple words (Alfa Romeo, Aston Martin)
- Common abbreviations (VW → Volkswagen, Chevy → Chevrolet)

## Technical Details

The canonicalization system works as follows:

1. **Ingestion**: When vehicles are imported, `canonicalizeVehicle()` generates:
   - `canonical_brand`: "Mercedes-Benz" (for display)
   - `canonical_brand_key`: "mercedesbenz" (for search)
   - `canonical_model_key`: "cclass" (for model search)

2. **Search**: When users search for "mercedes":
   - `toCanonicalBrandKey("mercedes")` → "mercedesbenz"
   - Query: `WHERE canonical_brand_key = 'mercedesbenz'`
   - Result: All Mercedes-Benz vehicles

This ensures consistent, case-insensitive, variation-tolerant searching.
