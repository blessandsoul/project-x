# Bug Fix: Company Website Not Saved from Onboard (COMPLETE)

## Issues Found & Fixed

### Issue 1: Social Links Not Created (FIXED)
**Root Cause:** Onboard page was only creating social links for `websites.slice(1)`, skipping the first website.

**Fix:** Changed to create social links for ALL websites, including the first one.

### Issue 2: Website Field NULL in Database (FIXED) ⚠️ **CRITICAL UX BUG**
**Root Cause:** User types website URL in input field but **doesn't click the '+' button** before submitting. The website stays in the input field and is NOT added to the `websites` array, so it's never sent to the server.

**Fix:** Auto-add website from input field on form submit if there's a value that hasn't been added to the list yet.

## Complete Fix Applied

**File:** `client/src/pages/company/CompanyOnboardPage.tsx`

### Change 1: Auto-Add Website from Input (Lines 245-258)
```typescript
// Step 0: Auto-add website from input if user typed but didn't click '+'
// This prevents data loss when user expects the typed value to be saved
let finalWebsites = [...websites]
if (newWebsite.trim()) {
  const normalized = normalizeUrl(newWebsite.trim())
  if (isValidUrl(normalized) && !finalWebsites.some(w => normalizeUrl(w) === normalized)) {
    finalWebsites.push(normalized)
    console.log('[Onboarding] Auto-added website from input:', normalized)
  }
}

// Step 1: Create company
// First website goes to company.website, ALL websites go to social links
const primaryWebsite = finalWebsites.length > 0 ? finalWebsites[0] : undefined
```

### Change 2: Use finalWebsites for Social Links (Line 296-300)
```typescript
if (finalWebsites.length > 0 && companyId) {
  console.log('[Onboarding] Creating social links for websites:', finalWebsites)
  const results = await createMultipleSocialLinks(companyId, finalWebsites)
}
```

## What This Fixes

### Before (BROKEN):
1. User types `https://example.com` in input field
2. User **forgets to click '+' button**
3. User clicks "Create Company"
4. ❌ Website is NOT sent to server
5. ❌ `company.website` = `null`
6. ❌ No social link created

### After (FIXED):
1. User types `https://example.com` in input field
2. User clicks "Create Company" (with or without clicking '+')
3. ✅ Website is auto-added from input field
4. ✅ `company.website` = `'https://example.com'`
5. ✅ Social link created with URL

## Network Calls (Example)

When user types `https://test.ge` and submits:

1. **POST** `/companies/onboard`
   ```json
   {
     "name": "Test Company",
     "website": "https://test.ge"
   }
   ```
   ✅ Creates company with website field populated

2. **POST** `/companies/:id/social-links`
   ```json
   { "url": "https://test.ge" }
   ```
   ✅ Creates social link record

## Console Logs to Verify

When testing, you should see:
```
[Onboarding] Auto-added website from input: https://test.ge
[Onboarding] Creating social links for websites: ["https://test.ge"]
[Onboarding] Social links creation results: [{ url: "https://test.ge", success: true, ... }]
```

## Testing Instructions

### Test 1: Type Website Without Clicking '+' ⚠️ **CRITICAL**
1. Navigate to `/company/onboard`
2. Fill in company name
3. **Type** `https://test.ge` in website input
4. **DO NOT click the '+' button**
5. Click "Create Company"
6. ✅ **Expected:** 
   - Console shows: `[Onboarding] Auto-added website from input: https://test.ge`
   - DB `companies.website` = `'https://test.ge'`
   - DB `company_social_links` has record with URL

### Test 2: Click '+' Button (Original Flow)
1. Navigate to `/company/onboard`
2. Fill in company name
3. Type `https://test.ge` in website input
4. **Click the '+' button**
5. See website added to list
6. Click "Create Company"
7. ✅ **Expected:** Same result as Test 1

### Test 3: Multiple Websites
1. Type `https://example.com`, click '+'
2. Type `https://facebook.com/example` but **DON'T click '+'**
3. Submit
4. ✅ **Expected:** BOTH websites saved (one from list, one auto-added from input)

## Files Changed
- ✅ `client/src/pages/company/CompanyOnboardPage.tsx` (lines 245-310)

## Summary
This fix addresses BOTH issues:
1. ✅ Social links are now created for ALL websites (not just slice(1))
2. ✅ Website from input field is auto-added on submit (prevents data loss)

The combination ensures that no matter how the user interacts with the form, their website will be saved correctly.
