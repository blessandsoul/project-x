# ✅ RBAC Company UI Fix - Implementation Complete

## Summary

Fixed critical RBAC issues where company-related UI elements and routes were not properly checking user role after company deletion. The system now correctly shows/hides UI elements and enforces server-side authorization based on both `userRole` and `companyId`.

## Problem Fixed

### Before
- ❌ "Company Settings" menu item visible after deletion (only checked `companyId`)
- ❌ "Create Company" CTA missing after deletion (only checked `companyId`)
- ❌ User could navigate to `/company/settings` directly after deletion
- ❌ Server didn't enforce company membership for update endpoints

### After
- ✅ "Company Settings" disappears immediately after deletion
- ✅ "Create Company" CTA appears immediately after deletion
- ✅ `/company/settings` redirects to `/company/onboard` if not authorized
- ✅ Server enforces RBAC on all company endpoints

## Client-Side Changes

### 1. UserMenu Component (`client/src/components/Header/UserMenu.tsx`)
**Changed:** Company Settings menu item condition
```typescript
// Before
{companyId && (
  <DropdownMenuItem>Company Settings</DropdownMenuItem>
)}

// After
{userRole === 'company' && companyId && (
  <DropdownMenuItem>Company Settings</DropdownMenuItem>
)}
```

**Impact:** Menu item now requires BOTH `userRole='company'` AND `companyId`

### 2. Dashboard Page (`client/src/pages/DashboardPage.tsx`)
**Changed:** Create Company CTA condition
```typescript
// Before
{user && companyId === null && (
  <Card>Create Company CTA</Card>
)}

// After
{user && userRole === 'user' && companyId === null && (
  <Card>Create Company CTA</Card>
)}
```

**Impact:** CTA now requires `userRole='user'` in addition to `companyId=null`

### 3. Route Guards (`client/src/app/RequireAuth.tsx`)
**Added:** New `RequireCompany` guard
```typescript
export function RequireCompany({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized, userRole, companyId } = useAuth()
  
  if (!isInitialized) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (userRole !== 'company' || !companyId) {
    return <Navigate to="/company/onboard" replace />
  }
  
  return <>{children}</>
}
```

**Impact:** Prevents direct navigation to company-only pages

### 4. App Routes (`client/src/App.tsx`)
**Changed:** `/company/settings` route protection
```typescript
// Before
<Route path="/company/settings" element={
  <RequireAuth>
    <LazyRoute><CompanySettingsPage /></LazyRoute>
  </RequireAuth>
} />

// After
<Route path="/company/settings" element={
  <RequireCompany>
    <LazyRoute><CompanySettingsPage /></LazyRoute>
  </RequireCompany>
} />
```

**Impact:** Route now enforces company membership

### 5. Company Settings Page (`client/src/pages/CompanySettingsPage.tsx`)
**Changed:** Post-deletion navigation
```typescript
// Before
navigate('/', { replace: true })

// After
navigate('/dashboard', { replace: true })
```

**Impact:** Users see the "Create Company" CTA immediately after deletion

## Server-Side Changes

### 1. RBAC Middleware (`server/src/middleware/rbac.ts`) - NEW FILE
**Created:** Three reusable RBAC guards

```typescript
// Require specific role(s)
export function requireRole(...allowedRoles: UserRole[])

// Require company membership (role='company' + company_id)
export function requireCompanyMembership()

// Require NO company (for onboarding)
export function requireNoCompany()
```

**Impact:** Centralized, reusable authorization logic

### 2. Company Routes (`server/src/routes/company.ts`)
**Changed:** Added RBAC to PUT endpoint
```typescript
// Before
fastify.put('/companies/:id', {
  preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
  ...
})

// After
fastify.put('/companies/:id', {
  preHandler: [
    fastify.authenticateCookie,
    fastify.csrfProtection,
    requireCompanyMembership()
  ],
  ...
})
```

**Impact:** Server now enforces company membership for updates

**Note:** POST `/companies/onboard` already had duplicate company checks (lines 140-148), so no changes needed.

## User Flow After Deletion

```
1. User clicks "Delete Company" in /company/settings
   ↓
2. DELETE /companies/:id called
   ↓
3. Server deletes company from DB
   ↓
4. Server reverts user role: 'company' → 'user'
   ↓
5. Server clears user.company_id → null
   ↓
6. Client calls refreshProfile()
   ↓
7. Auth state updates: userRole='user', companyId=null
   ↓
8. Navigate to /dashboard
   ↓
9. UI re-renders:
   - "Company Settings" menu item: HIDDEN ✅
   - "Create Company" CTA: VISIBLE ✅
   ↓
10. User can create new company ✅
```

## Security Improvements

### Defense in Depth
1. **Client UI** - Hides unauthorized elements
2. **Client Routes** - Prevents navigation to unauthorized pages
3. **Server Middleware** - Enforces RBAC regardless of client state

### Attack Scenarios Prevented

#### Scenario 1: Manual Navigation
```
User types /company/settings after deletion
→ RequireCompany guard redirects to /company/onboard ✅
```

#### Scenario 2: Direct API Call
```
User calls PUT /companies/:id with role='user'
→ requireCompanyMembership() returns 403 ✅
```

#### Scenario 3: Stale Client State
```
Client has cached userRole='company' but server has 'user'
→ Server is source of truth, returns 403 ✅
```

## Testing Checklist

### Manual Test Steps
- [x] Delete company → "Company Settings" disappears
- [x] Delete company → "Create Company" CTA appears
- [x] Navigate to `/company/settings` after deletion → redirects
- [x] Try to call PUT `/companies/:id` with `role=user` → 403
- [x] Create new company after deletion → works

### Edge Cases Covered
- [x] User with `companyId` but `role='user'` (after deletion)
- [x] User with `role='company'` but no `companyId` (orphaned state)
- [x] Direct URL navigation to protected routes
- [x] API calls with mismatched client/server state

## Files Modified

### Client (5 files)
1. ✅ `client/src/components/Header/UserMenu.tsx`
2. ✅ `client/src/pages/DashboardPage.tsx`
3. ✅ `client/src/app/RequireAuth.tsx`
4. ✅ `client/src/App.tsx`
5. ✅ `client/src/pages/CompanySettingsPage.tsx`

### Server (2 files)
1. ✅ `server/src/middleware/rbac.ts` (NEW)
2. ✅ `server/src/routes/company.ts`

## Breaking Changes

**None.** All changes are backward compatible and only fix existing bugs.

## Deployment Notes

- ✅ No database migration required
- ✅ No environment variables needed
- ✅ No API contract changes
- ✅ TypeScript compilation passes
- ✅ Ready for production

## Related Documentation

- User role reversion: `.agent/user-role-reversion-summary.md`
- Company asset deletion: `.agent/company-asset-deletion-summary.md`
- Implementation plan: `.agent/rbac-fix-implementation-plan.md`

---

**Status:** ✅ Complete and tested
**Priority:** HIGH (Security + UX)
**Breaking Changes:** None
