# RBAC Fix - Verification Checklist

## ✅ Implementation Complete

All required changes have been implemented. Use this checklist to verify the fixes work correctly.

## Client-Side Verification

### 1. Company Settings Menu Item
**Test:** Delete a company and check the user dropdown menu

- [ ] Before deletion: "Company Settings" (კომპანიის პარამეტრები) menu item is visible
- [ ] After deletion: "Company Settings" menu item disappears immediately
- [ ] After deletion: User dropdown still works (Profile, Dashboard, etc. visible)

**How to test:**
1. Login as company owner
2. Open user dropdown (top right)
3. Verify "Company Settings" is visible
4. Go to Company Settings → Delete company
5. Return to dashboard
6. Open user dropdown again
7. Verify "Company Settings" is GONE

### 2. Create Company CTA
**Test:** Delete a company and check dashboard

- [ ] Before deletion: No "Start Your Logistics Company" CTA card
- [ ] After deletion: "Start Your Logistics Company" CTA card appears
- [ ] CTA card has "Create Company" button
- [ ] Button links to `/company/onboard`

**How to test:**
1. Login as company owner
2. Go to dashboard
3. Verify NO "Start Your Logistics Company" card
4. Go to Company Settings → Delete company
5. Should redirect to `/dashboard`
6. Verify "Start Your Logistics Company" card IS visible
7. Click "Create Company" button
8. Should navigate to `/company/onboard`

### 3. Route Guard for /company/settings
**Test:** Try to access company settings after deletion

- [ ] Navigate to `/company/settings` after deletion
- [ ] Should redirect to `/company/onboard`
- [ ] No flash of company settings page
- [ ] URL changes to `/company/onboard`

**How to test:**
1. Delete company (as above)
2. Manually type `/company/settings` in address bar
3. Press Enter
4. Should immediately redirect to `/company/onboard`
5. Verify no error messages or crashes

### 4. State Refresh After Deletion
**Test:** Verify auth state updates immediately

- [ ] After deletion, `userRole` changes from `'company'` to `'user'`
- [ ] After deletion, `companyId` changes to `null`
- [ ] UI updates without page refresh
- [ ] No stale state issues

**How to test:**
1. Open browser DevTools → Console
2. Before deletion, run: `window.localStorage` (check for any cached role)
3. Delete company
4. Verify toast message: "Company deleted successfully"
5. Verify redirect to `/dashboard`
6. Verify CTA appears without manual refresh

## Server-Side Verification

### 5. PUT /companies/:id RBAC
**Test:** Try to update company with wrong role

- [ ] User with `role='user'` cannot call PUT `/companies/:id`
- [ ] Returns 403 Forbidden
- [ ] Error message: "Access denied. Requires company role" or similar

**How to test (using curl or Postman):**
```bash
# 1. Login as user (not company)
POST /auth/login
{ "identifier": "user@example.com", "password": "..." }

# 2. Try to update a company
PUT /companies/1
X-CSRF-Token: <token>
Cookie: <cookies>
{ "name": "Hacked Company" }

# Expected: 403 Forbidden
# Expected message: "Access denied" or "Requires company role"
```

### 6. POST /companies/onboard Duplicate Check
**Test:** Try to onboard second company

- [ ] User with existing `company_id` cannot onboard again
- [ ] Returns 409 Conflict
- [ ] Error message: "User already has a company"

**How to test:**
1. Login as company owner
2. Try to POST `/companies/onboard` with new company data
3. Should return 409 Conflict
4. Should NOT create duplicate company

### 7. DELETE /companies/:id Authorization
**Test:** Verify only owner/admin can delete

- [ ] Company owner can delete their own company
- [ ] Admin can delete any company
- [ ] Other users cannot delete companies

**How to test:**
1. Login as different user (not owner, not admin)
2. Try to DELETE `/companies/:id`
3. Should return 403 Forbidden

## Integration Tests

### 8. Full Delete → Create Flow
**Test:** Complete user journey

- [ ] User creates company
- [ ] User deletes company
- [ ] User sees "Create Company" CTA
- [ ] User creates NEW company
- [ ] New company works correctly

**How to test:**
1. Register new user
2. Onboard company #1
3. Verify role='company', company_id=1
4. Delete company #1
5. Verify role='user', company_id=null
6. Verify CTA appears
7. Onboard company #2
8. Verify role='company', company_id=2
9. Verify company #2 works (can update, etc.)

### 9. Direct Navigation After Deletion
**Test:** All protected routes redirect correctly

- [ ] `/company/settings` → redirects to `/company/onboard`
- [ ] `/company/:id` (if owner-only) → works or redirects appropriately
- [ ] `/dashboard` → works, shows CTA

**How to test:**
1. Delete company
2. Try each URL manually
3. Verify correct behavior

### 10. Cross-Tab Sync (if applicable)
**Test:** Multiple browser tabs

- [ ] Delete company in Tab A
- [ ] Tab B updates automatically (if using BroadcastChannel)
- [ ] Both tabs show correct state

**How to test:**
1. Open two tabs with same user
2. Delete company in Tab A
3. Check Tab B - should update
4. If not immediate, refresh Tab B
5. Verify correct state in both tabs

## Edge Cases

### 11. Orphaned State Recovery
**Test:** User with company_id but role='user'

- [ ] System handles gracefully
- [ ] User can still use app
- [ ] Can create new company

**How to manually test (requires DB access):**
```sql
-- Simulate orphaned state
UPDATE users SET role='user' WHERE id=<user_id>;
-- Don't update company_id

-- Now login and verify:
-- - "Company Settings" should NOT appear
-- - "Create Company" CTA should appear
-- - Can create new company
```

### 12. Missing company_id with role='company'
**Test:** User with role='company' but no company_id

- [ ] System handles gracefully
- [ ] Redirects to onboard
- [ ] Can create company

**How to manually test (requires DB access):**
```sql
-- Simulate missing company_id
UPDATE users SET company_id=NULL WHERE id=<user_id>;
-- Don't update role

-- Now login and verify:
-- - Redirects to /company/onboard
-- - Can create company
```

## Performance

### 13. No Performance Regression
**Test:** Verify no slowdowns

- [ ] Dashboard loads quickly
- [ ] Menu dropdown opens instantly
- [ ] Route transitions smooth
- [ ] No console errors

**How to test:**
1. Open DevTools → Performance tab
2. Record dashboard load
3. Check for any slow operations
4. Verify < 100ms for UI updates

## Accessibility

### 14. Keyboard Navigation
**Test:** All features work with keyboard

- [ ] Can navigate to "Create Company" CTA with Tab
- [ ] Can activate with Enter/Space
- [ ] Focus indicators visible
- [ ] Screen reader announces correctly

**How to test:**
1. Use only keyboard (no mouse)
2. Tab through dashboard
3. Verify CTA is reachable
4. Press Enter to activate

## Browser Compatibility

### 15. Cross-Browser Testing
**Test:** Works in all major browsers

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

**How to test:**
1. Test delete → create flow in each browser
2. Verify UI updates correctly
3. Verify no console errors

## Final Sign-Off

### All Tests Passing
- [ ] All client-side tests pass
- [ ] All server-side tests pass
- [ ] All integration tests pass
- [ ] All edge cases handled
- [ ] No performance issues
- [ ] No accessibility issues
- [ ] No browser compatibility issues

### Documentation
- [ ] Implementation plan created
- [ ] Complete summary created
- [ ] This checklist completed

### Ready for Production
- [ ] TypeScript compilation passes
- [ ] No lint errors
- [ ] No console errors
- [ ] All features working as expected

---

**Tester Name:** _______________
**Date:** _______________
**Status:** ⬜ PASS / ⬜ FAIL
**Notes:** _______________
