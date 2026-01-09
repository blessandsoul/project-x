# Vehicle Keyword Search - Title Column Fallback

## Overview
The vehicle search system now supports a **keyword search** feature that searches the `title` column as a fallback when structured filters (make/model) don't match or when users need to search for specific trim levels, editions, or other details.

## How It Works

### Priority 1: Structured Search (Fast)
The system first tries to match using the canonical brand and model keys:
- `canonical_brand_key` (e.g., "mercedesbenz")
- `canonical_model_key` (e.g., "cclass")

This is **fast** because it uses indexed exact matches.

### Priority 2: Keyword Search (Fallback)
When a user provides a `keyword` parameter, the system searches the `title` column:
- Searches the full vehicle title (e.g., "2016 POLARIS SPORTSMAN XP 1000 HIGH LIFTER ED")
- Catches trim levels, special editions, and vehicles with missing structured data
- Uses `LIKE '%keyword%'` pattern matching

## API Usage

### Search Endpoint
```http
GET /api/v1/vehicles/search?keyword=HIGH+LIFTER
```

### Filter Object
```typescript
{
  make: "Mercedes-Benz",     // Optional: Structured filter
  model: "C-Class",          // Optional: Structured filter
  keyword: "AMG",            // Optional: Keyword fallback
  year: 2020,                // Optional: Other filters
  // ... other filters
}
```

## Use Cases

### 1. Trim Level Search
**User searches for:** `"High Lifter"`
- Structured filters won't find this (it's not a make/model)
- Keyword search finds: "2016 POLARIS SPORTSMAN XP 1000 **HIGH LIFTER** ED"

### 2. Special Editions
**User searches for:** `"AMG GT"`
- Make filter: Mercedes-Benz ✅
- Keyword: "AMG GT" ✅
- Result: "2020 MERCEDES-BENZ **AMG GT** 63 S"

### 3. Missing Structured Data
**User searches for:** `"Sportsman"`
- If `brand_name` or `model_name` is NULL or "Other"
- Keyword search finds: "2016 POLARIS **SPORTSMAN** XP 1000"

## Performance Optimization

### Current Implementation (v1)
Uses `LIKE '%keyword%'` which scans all rows.
- **Acceptable for:** Small to medium datasets (< 100k vehicles)
- **Performance:** ~100-500ms on typical queries

### Future Optimization (v2)
Apply the FULLTEXT index migration for instant searches:

```sql
-- Run this migration when ready
ALTER TABLE vehicles
  ADD FULLTEXT INDEX idx_vehicles_title_fulltext (title);
```

Then update the query to use:
```sql
WHERE MATCH(title) AGAINST('keyword' IN NATURAL LANGUAGE MODE)
```

This will reduce search time to **< 50ms** even with millions of vehicles.

## Best Practices

### For Frontend Developers
1. **Use structured filters first**: Always try to match make/model before falling back to keyword
2. **Combine filters**: Use keyword + make for better results (e.g., make="Polaris" + keyword="High Lifter")
3. **Show search type**: Indicate to users when they're doing a "keyword search" vs "filtered search"

### For Backend Developers
1. **Monitor performance**: Watch query execution time as the database grows
2. **Apply FULLTEXT index**: When you have > 50k vehicles, apply the migration
3. **Consider caching**: Popular keyword searches can be cached in Redis

## Examples

### Example 1: Find all AMG Mercedes
```javascript
const results = await vehicleModel.searchByFilters({
  make: "Mercedes-Benz",
  keyword: "AMG"
}, 20, 0);
```

### Example 2: Find Polaris High Lifter edition
```javascript
const results = await vehicleModel.searchByFilters({
  make: "Polaris",
  keyword: "High Lifter"
}, 20, 0);
```

### Example 3: Generic keyword search
```javascript
const results = await vehicleModel.searchByFilters({
  keyword: "Raptor"  // Finds Ford F-150 Raptor, Yamaha Raptor, etc.
}, 20, 0);
```

## Migration Status

- ✅ Code implementation complete
- ✅ `keyword` parameter added to search filters
- ✅ Title column search logic implemented
- ⏳ FULLTEXT index migration created (apply when needed)

## Testing

Test the keyword search with these queries:
```bash
# Test 1: Trim level
curl "http://localhost:3000/api/v1/vehicles/search?keyword=High+Lifter"

# Test 2: Special edition
curl "http://localhost:3000/api/v1/vehicles/search?make=Mercedes-Benz&keyword=AMG"

# Test 3: Model variant
curl "http://localhost:3000/api/v1/vehicles/search?keyword=Raptor"
```
