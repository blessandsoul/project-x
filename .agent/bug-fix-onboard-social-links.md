# Bug Fix: Company Social Link Not Created from Onboard

## Issue
On `/company/onboard`, when a user enters a company website in the form and submits, the `company.website` field is populated but NO social link record is created in the `company_social_links` table. The same form on `/company/settings` works correctly.

## Root Cause
**File:** `client/src/pages/company/CompanyOnboardPage.tsx`
**Lines:** 282-296 (before fix)

The onboard page was only creating social links for `websites.slice(1)` (2nd website onwards), skipping the first website under the assumption it was already stored in `company.website`.

```typescript
// BEFORE (BROKEN):
const extraWebsites = websites.slice(1) // Skip first (already in company.website)
if (extraWebsites.length > 0 && companyId) {
  const results = await createMultipleSocialLinks(companyId, extraWebsites)
}
```

**Problem:** If user enters only ONE website, `extraWebsites` is empty → no social link is created.

## Fix Applied
**File:** `client/src/pages/company/CompanyOnboardPage.tsx`
**Lines:** 282-297 (after fix)

Changed to create social links for ALL websites, including the first one:

```typescript
// AFTER (FIXED):
if (websites.length > 0 && companyId) {
  const results = await createMultipleSocialLinks(companyId, websites)
}
```

**Rationale:** 
- The first website is stored in BOTH `company.website` AND `company_social_links` table
- This matches the behavior on `/company/settings` where the website field and social links are independent
- Users expect to see their website in the social links section after onboarding

## API Calls Comparison

### Settings Page (Working)
1. `PUT /companies/:id` - updates `company.website` field
2. `POST /companies/:id/social-links` - creates social link with `{ url: "..." }`

### Onboard Page (Now Fixed)
1. `POST /companies/onboard` - creates company with `website` field
2. `POST /companies/:id/social-links` - creates social link for ALL websites (including first)

## Files Changed
- `client/src/pages/company/CompanyOnboardPage.tsx` (lines 282-297)

## Manual Test Checklist

### Test 1: Single Website on Onboard
1. Navigate to `/company/onboard`
2. Fill in company name: "Test Company"
3. Add ONE website: `https://example.com`
4. Submit form
5. ✅ Verify: DB `companies` table has `website = 'https://example.com'`
6. ✅ Verify: DB `company_social_links` table has a record with `url = 'https://example.com'`
7. ✅ Verify: Navigate to `/company/settings` and see the website in social links section

### Test 2: Multiple Websites on Onboard
1. Navigate to `/company/onboard`
2. Fill in company name: "Test Company 2"
3. Add TWO websites:
   - `https://example.com`
   - `https://facebook.com/example`
4. Submit form
5. ✅ Verify: DB `companies` table has `website = 'https://example.com'`
6. ✅ Verify: DB `company_social_links` table has TWO records:
   - `url = 'https://example.com'`
   - `url = 'https://facebook.com/example'`

### Test 3: No Website on Onboard
1. Navigate to `/company/onboard`
2. Fill in company name: "Test Company 3"
3. Do NOT add any website
4. Submit form
5. ✅ Verify: DB `companies` table has `website = NULL`
6. ✅ Verify: DB `company_social_links` table has NO records for this company
7. ✅ Verify: No errors in console

### Test 4: Settings Page Still Works
1. Navigate to `/company/settings`
2. Update website field to `https://newsite.com`
3. Add a social link: `https://twitter.com/example`
4. Submit form
5. ✅ Verify: DB `companies` table has `website = 'https://newsite.com'`
6. ✅ Verify: DB `company_social_links` table has the new social link
7. ✅ Verify: Both onboard and settings behavior are now consistent

### Test 5: Invalid URL Handling
1. Navigate to `/company/onboard`
2. Try to add an invalid URL: `not-a-url`
3. ✅ Verify: Client-side validation shows error
4. ✅ Verify: Cannot submit until valid URL is entered

## Regression Prevention
- The fix ensures onboard behavior matches settings behavior
- Both pages now use the same `createMultipleSocialLinks` service
- The `company.website` field and `company_social_links` table are now consistently populated

## Notes
- Server-side validation and normalization already exist in the API
- No server-side changes required
- The fix is minimal and only changes the client-side logic
- URL normalization (adding https://) is handled by `normalizeUrl()` function
