# Company Asset Deletion Implementation

## Overview
When a company is deleted via `DELETE /companies/:id`, the server now automatically cleans up all uploaded assets associated with that company.

## What Gets Deleted
- **Company logo files** (both resized and original versions)
- **Entire company directory** under `uploads/companies/{slug}/`
- All subdirectories and files within the company folder

## What Gets Updated
- **Owner user's role** - Reverted from `'company'` to `'user'`
- **Owner user's company_id** - Set to `null`
- This allows the user to create a new company in the future if needed

## What Is Protected
- **User assets** (`uploads/users/`) are never touched
- **Other companies' assets** are protected by path validation
- **Uploads root directory** cannot be deleted

## Implementation Details

### 1. Filesystem Utilities (`server/src/utils/fs.ts`)

#### `safeRmrf(targetPath: string): Promise<boolean>`
Safely deletes a directory or file with security protections:
- ✅ Resolves absolute paths
- ✅ Prevents path traversal attacks
- ✅ Blocks deletion of uploads root
- ✅ Handles missing paths gracefully
- ✅ Logs all operations

#### `deleteCompanyAssets(companySlug: string): Promise<boolean>`
Deletes all assets for a specific company:
- Takes sanitized company slug
- Deletes `uploads/companies/{slug}/` directory
- Returns `true` if deleted, `false` if didn't exist

### 2. Controller Changes (`server/src/controllers/companyController.ts`)

The `deleteCompany` method now:
1. **Fetches company details** before deletion (to get slug and owner_user_id)
2. **Deletes from database** (hard delete with cascading)
3. **Reverts owner user's role** from `'company'` to `'user'` and clears `company_id`
4. **Cleans up assets** after successful DB deletion
5. **Logs results** (success or failure)
6. **Never fails** the operation due to user update or filesystem errors (best-effort)

```typescript
async deleteCompany(id: number): Promise<void> {
  // 1. Get company details before deletion
  const company = await this.companyModel.findById(id);
  const ownerUserId = company.owner_user_id;
  
  // 2. Delete from DB
  const deleted = await this.companyModel.delete(id);
  
  // 3. Revert user role (best-effort)
  if (ownerUserId) {
    await this.userModel.update(ownerUserId, {
      role: 'user',
      company_id: null,
    });
  }
  
  // 4. Clean up assets (best-effort)
  if (company.slug) {
    await deleteCompanyAssets(company.slug);
  }
}
```

### 3. Security Features

#### Path Traversal Prevention
```typescript
// ❌ BLOCKED
await safeRmrf('../../etc/passwd');
// Error: Path traversal detected

// ❌ BLOCKED
await safeRmrf('/etc/passwd');
// Error: Path outside uploads directory
```

#### Root Protection
```typescript
// ❌ BLOCKED
await safeRmrf(uploadsRoot);
// Error: Cannot delete uploads root directory
```

#### Safe Paths
```typescript
// ✅ ALLOWED
await safeRmrf('companies/my-company');
await deleteCompanyAssets('my-company');
```

## Testing

### Run Test Script
```bash
cd server
npx tsx scripts/test-company-asset-deletion.ts
```

### Test Coverage
- ✅ Path traversal prevention
- ✅ Uploads root protection
- ✅ Successful asset deletion
- ✅ Missing directory handling
- ✅ Empty slug handling

### Manual Testing
1. Create a test company via API
2. Upload a logo for the company
3. Verify files exist in `uploads/companies/{slug}/logos/`
4. Delete the company via `DELETE /companies/:id`
5. Verify the directory is removed
6. Check server logs for deletion confirmation

## API Behavior

### Request
```http
DELETE /companies/:id
Authorization: Cookie (company owner or admin)
X-CSRF-Token: {token}
```

### Response (Unchanged)
```http
HTTP/1.1 204 No Content
```

### Authorization
- ✅ Company owner can delete their own company
- ✅ Admin can delete any company
- ❌ Other users cannot delete companies

## Error Handling

### Database Deletion Fails
- ❌ Returns 404 if company not found
- ❌ Returns 403 if not authorized
- ❌ Asset cleanup is skipped

### Asset Deletion Fails
- ✅ Database deletion succeeds
- ✅ Returns 204 success
- ⚠️ Error logged for manual cleanup
- ⚠️ Operation does not fail

### Logs
```javascript
// Success
{
  companyId: 123,
  slug: 'my-company',
  message: 'Company assets deleted successfully'
}

// Failure (best-effort)
{
  companyId: 123,
  slug: 'my-company',
  error: 'Permission denied',
  message: 'Failed to delete company assets - manual cleanup may be required'
}
```

## Directory Structure

### Before Deletion
```
uploads/
├── companies/
│   ├── my-company/          ← Will be deleted
│   │   └── logos/
│   │       ├── my-company.jpg
│   │       └── my-company-original.jpg
│   └── other-company/       ← Protected
│       └── logos/
└── users/                   ← Protected
    └── john/
        └── avatars/
```

### After Deletion
```
uploads/
├── companies/
│   └── other-company/       ← Unchanged
│       └── logos/
└── users/                   ← Unchanged
    └── john/
        └── avatars/
```

## Migration Notes

### Existing Companies
- No migration needed
- Asset cleanup only applies to future deletions
- Orphaned assets from past deletions remain (manual cleanup if needed)

### Backwards Compatibility
- ✅ API contract unchanged
- ✅ Response codes unchanged
- ✅ Authorization unchanged
- ✅ No breaking changes

## Future Enhancements

### Potential Additions
1. **Soft delete support** - Move to `deleted_at` column instead of hard delete
2. **Asset archival** - Move to archive folder instead of deleting
3. **Retry queue** - Queue failed deletions for retry
4. **Bulk cleanup** - Admin endpoint to clean orphaned assets
5. **Storage metrics** - Track disk usage per company

### Related Entities
Currently only company-owned assets are deleted. Future work could include:
- Vehicle images (if companies can upload vehicle photos)
- Document attachments
- Message attachments
- Gallery images

## Troubleshooting

### Assets Not Deleted
1. Check server logs for error messages
2. Verify company slug is correct
3. Check filesystem permissions
4. Manually delete: `rm -rf uploads/companies/{slug}`

### Permission Errors
```bash
# Fix permissions (Linux/Mac)
chmod -R 755 uploads/companies

# Fix permissions (Windows)
icacls uploads\companies /grant Users:F /T
```

### Path Issues
- Ensure `process.cwd()` points to server root
- Verify `uploads/` directory exists
- Check for symlinks or junction points
