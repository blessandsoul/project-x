# RBAC Company UI Fix - Implementation Plan

## Problem Summary
After deleting a company:
1. ❌ "Company Settings" menu item still appears (should disappear)
2. ❌ "Create Company" CTA doesn't appear (should appear)
3. ❌ User can still navigate to `/company/settings` directly
4. ❌ Server RBAC checks may be insufficient

## Root Causes

### Client Issues
1. **UserMenu.tsx** (line 140): Only checks `companyId`, doesn't verify `userRole === 'company'`
2. **DashboardPage.tsx** (line 583): Only checks `companyId === null`, doesn't verify `userRole === 'user'`
3. **No route guard** for `/company/settings`
4. **State refresh** after deletion might not trigger re-renders

### Server Issues
1. Need to verify RBAC on company-only endpoints
2. Need to ensure `/companies/onboard` blocks users who already have companies

## Implementation Steps

### Phase 1: Client UI Fixes

#### 1.1 Fix UserMenu Dropdown (CRITICAL)
**File:** `client/src/components/Header/UserMenu.tsx`
**Line:** 140-150

**Current:**
```tsx
{companyId && (
  <DropdownMenuItem>Company Settings</DropdownMenuItem>
)}
```

**Fix:**
```tsx
{companyId && userRole === 'company' && (
  <DropdownMenuItem>Company Settings</DropdownMenuItem>
)}
```

**Rationale:** After deletion, `companyId` might still be cached but `userRole` is updated to 'user'

#### 1.2 Fix Dashboard CTA Card
**File:** `client/src/pages/DashboardPage.tsx`
**Line:** 583-603

**Current:**
```tsx
{user && companyId === null && (
  <Card>Create Company CTA</Card>
)}
```

**Fix:**
```tsx
{user && userRole === 'user' && companyId === null && (
  <Card>Create Company CTA</Card>
)}
```

**Rationale:** Explicitly check role is 'user' to ensure proper state

#### 1.3 Add Route Guard for Company Settings
**File:** `client/src/app/RequireAuth.tsx` or create new guard

**Create:** `RequireCompany` component
```tsx
export function RequireCompany({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized, userRole, companyId } = useAuth()
  
  if (!isInitialized) return <LoadingSpinner />
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (userRole !== 'company' || !companyId) {
    return <Navigate to="/company/onboard" replace />
  }
  
  return <>{children}</>
}
```

**Update routes** to wrap `/company/settings` with `RequireCompany`

#### 1.4 Ensure State Refresh After Deletion
**File:** `client/src/pages/CompanySettingsPage.tsx` (or wherever delete is triggered)

**After successful deletion:**
```tsx
await refreshProfile() // Already called
// Ensure navigation happens AFTER state refresh
navigate('/dashboard')
```

### Phase 2: Server RBAC Fixes

#### 2.1 Create Reusable RBAC Middleware
**File:** `server/src/middleware/rbac.ts` (NEW)

```typescript
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request, reply) => {
    if (!request.user) {
      throw new AuthorizationError('Authentication required')
    }
    
    if (!allowedRoles.includes(request.user.role)) {
      throw new AuthorizationError(`Requires role: ${allowedRoles.join(' or ')}`)
    }
  }
}

export function requireCompanyMembership() {
  return async (request, reply) => {
    if (!request.user) {
      throw new AuthorizationError('Authentication required')
    }
    
    if (request.user.role !== 'company') {
      throw new AuthorizationError('Requires company role')
    }
    
    if (!request.user.company_id) {
      throw new AuthorizationError('No active company')
    }
  }
}
```

#### 2.2 Apply to Company Endpoints
**File:** `server/src/routes/company.ts`

**GET/PUT `/companies/:id`** (settings endpoints):
```typescript
fastify.get('/companies/:id', {
  preHandler: [
    fastify.authenticateCookie,
    requireCompanyMembership(), // NEW
  ],
  // ...
})
```

**POST `/companies/onboard`**:
```typescript
fastify.post('/companies/onboard', {
  preHandler: [
    fastify.authenticateCookie,
    fastify.csrfProtection,
  ],
  // ...
}, async (request, reply) => {
  // Check if user already has company
  if (request.user.company_id) {
    throw new ConflictError('User already has a company')
  }
  // ... rest of logic
})
```

### Phase 3: Testing

#### 3.1 Manual Test Checklist
- [ ] Delete company → "Company Settings" disappears immediately
- [ ] Delete company → "Create Company" CTA appears immediately
- [ ] Navigate to `/company/settings` after deletion → redirects to `/company/onboard`
- [ ] Try to call company endpoints with `role=user` → 403 error
- [ ] Try to onboard second company → 409 error

#### 3.2 Integration Test
Create test script that:
1. Creates company
2. Verifies UI shows "Company Settings"
3. Deletes company
4. Verifies UI shows "Create Company" CTA
5. Attempts to access `/company/settings` → blocked

## Files to Modify

### Client
1. ✅ `client/src/components/Header/UserMenu.tsx` - Add `userRole` check
2. ✅ `client/src/pages/DashboardPage.tsx` - Add `userRole` check to CTA
3. ✅ `client/src/app/RequireAuth.tsx` - Add `RequireCompany` guard
4. ✅ `client/src/App.tsx` - Wrap company routes with guard

### Server
1. ✅ `server/src/middleware/rbac.ts` - Create RBAC middleware (NEW)
2. ✅ `server/src/routes/company.ts` - Apply RBAC to endpoints
3. ✅ `server/src/routes/company.ts` - Add onboard duplicate check

## Success Criteria
- ✅ UI is driven by `userRole` + `companyId` (not just `companyId`)
- ✅ State refresh after deletion updates UI immediately
- ✅ Route guards prevent direct navigation
- ✅ Server enforces RBAC regardless of client state
- ✅ No stale localStorage/sessionStorage reliance

## Rollout Plan
1. Implement client fixes first (immediate UX improvement)
2. Add route guards (prevent manual navigation)
3. Implement server RBAC (security hardening)
4. Test end-to-end flow
5. Deploy

---

**Priority:** HIGH
**Estimated Time:** 2-3 hours
**Breaking Changes:** None (only fixes)
