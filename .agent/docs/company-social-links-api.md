# Company Social Links API - Structured Links Documentation

## Overview

The Company Social Links system provides **structured** link management:
- **1 Website link** (company's main website, any valid URL)
- **2 Social links** (Facebook and Instagram only)

This provides clear separation between the company's website and their social media presence.

---

## Database Schema

### Table: `company_social_links`

```sql
CREATE TABLE company_social_links (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id INT UNSIGNED NOT NULL,
  link_type ENUM('website', 'social') NOT NULL DEFAULT 'social',
  platform ENUM('facebook', 'instagram') NULL COMMENT 'Required for social links',
  url VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_company_social_links_company_id (company_id),
  KEY idx_company_social_links_type (company_id, link_type),
  
  CONSTRAINT fk_company_social_links_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Key Constraints

| Field | Constraint |
|-------|------------|
| `link_type` | ENUM: `'website'` or `'social'` |
| `platform` | ENUM: `'facebook'` or `'instagram'` (NULL for website) |
| **Website count** | Max 1 per company (enforced by application) |
| **Social count** | Max 2 per company (enforced by application) |
| **Duplicate platform** | Not allowed (enforced by application) |

---

## TypeScript Types

### Server Types (`server/src/types/company.ts`)

```typescript
export type SocialLinkType = 'website' | 'social';
export type SocialPlatform = 'facebook' | 'instagram';

export const SUPPORTED_SOCIAL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram'];

export interface CompanySocialLink {
  id: number;
  company_id: number;
  link_type: SocialLinkType;
  platform: SocialPlatform | null;
  url: string;
  created_at?: string;
  updated_at?: string;
}

export interface StructuredSocialLinks {
  website: { id: number; url: string } | null;
  social_links: Array<{
    id: number;
    platform: SocialPlatform;
    url: string;
  }>;
}
```

### Client Types (`client/src/services/companySocialLinksService.ts`)

Same types are mirrored in the client service.

---

## API Endpoints

### 1. GET `/companies/:companyId/social-links`

**Purpose**: Fetch structured social links for a company

**Authentication**: None (public endpoint)

**Response** (200 OK):
```json
{
  "website": {
    "id": 1,
    "url": "https://example.com"
  },
  "social_links": [
    {
      "id": 2,
      "platform": "facebook",
      "url": "https://facebook.com/example"
    },
    {
      "id": 3,
      "platform": "instagram",
      "url": "https://instagram.com/example"
    }
  ]
}
```

**If no links exist**:
```json
{
  "website": null,
  "social_links": []
}
```

---

### 2. POST `/companies/:companyId/social-links`

**Purpose**: Create a new social link

**Authentication**: Required (Cookie-based HttpOnly access token)

**CSRF Protection**: Required

**Authorization**: Admin OR company owner

#### Create Website Link

**Request**:
```json
{
  "link_type": "website",
  "url": "https://example.com"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "company_id": 123,
  "link_type": "website",
  "platform": null,
  "url": "https://example.com",
  "created_at": "2024-12-25T10:00:00Z",
  "updated_at": "2024-12-25T10:00:00Z"
}
```

#### Create Social Link

**Request**:
```json
{
  "link_type": "social",
  "platform": "facebook",
  "url": "https://facebook.com/example"
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "company_id": 123,
  "link_type": "social",
  "platform": "facebook",
  "url": "https://facebook.com/example",
  "created_at": "2024-12-25T10:00:00Z",
  "updated_at": "2024-12-25T10:00:00Z"
}
```

#### Validation Rules

| Rule | Error Status | Message |
|------|--------------|---------|
| Missing `link_type` | 422 | Schema validation error |
| Invalid `link_type` | 422 | Must be 'website' or 'social' |
| Missing `platform` for social | 422 | Platform is required for social links |
| Invalid `platform` | 422 | Unsupported social platform |
| Website already exists | 409 | Company already has a website |
| 2+ social links exist | 409 | Company already has maximum 2 social links |
| Duplicate platform | 409 | Social platform already exists |

---

### 3. PUT `/social-links/:id`

**Purpose**: Update an existing social link

**Authentication**: Required

**Authorization**: Admin OR owner of the company that owns this link

**Request**:
```json
{
  "url": "https://new-url.com",
  "platform": "instagram"
}
```

**Notes**:
- Cannot change `link_type` (website ↔ social conversion not allowed)
- Can update `url`
- Can update `platform` (only for social links)

---

### 4. DELETE `/social-links/:id`

**Purpose**: Delete a social link

**Authentication**: Required

**Authorization**: Admin OR owner

**Response**: 204 No Content

---

## Client Service Usage

### Import

```typescript
import {
  getCompanySocialLinks,
  createWebsiteLink,
  createSocialMediaLink,
  createOnboardingSocialLinks,
  deleteSocialLink,
  StructuredSocialLinks,
  SocialPlatform,
} from '@/services/companySocialLinksService'
```

### Get Social Links

```typescript
const links = await getCompanySocialLinks(companyId)
// links.website -> { id, url } | null
// links.social_links -> [{ id, platform, url }, ...]
```

### Create Website

```typescript
await createWebsiteLink(companyId, 'https://example.com')
```

### Create Social Link

```typescript
await createSocialMediaLink(companyId, 'facebook', 'https://facebook.com/example')
await createSocialMediaLink(companyId, 'instagram', 'https://instagram.com/example')
```

### Batch Create During Onboarding

```typescript
const result = await createOnboardingSocialLinks(
  companyId,
  'https://example.com', // website
  [
    { platform: 'facebook', url: 'https://facebook.com/example' },
    { platform: 'instagram', url: 'https://instagram.com/example' },
  ]
)

// result.website -> SocialLink | null
// result.social_links -> SocialLink[]
// result.errors -> [{ type, message, url }]
```

---

## Frontend Implementation Guide

### Onboarding Form State

```typescript
const [website, setWebsite] = useState('')
const [socialLinks, setSocialLinks] = useState<Array<{
  platform: 'facebook' | 'instagram'
  url: string
}>>([])
```

### Platform Selection (Restricted to Facebook/Instagram)

```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select platform" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="facebook">Facebook</SelectItem>
    <SelectItem value="instagram">Instagram</SelectItem>
  </SelectContent>
</Select>
```

### Prevent Duplicate Platform Selection

```tsx
const usedPlatforms = socialLinks.map(l => l.platform)

<SelectItem 
  value="facebook" 
  disabled={usedPlatforms.includes('facebook')}
>
  Facebook
</SelectItem>
<SelectItem 
  value="instagram" 
  disabled={usedPlatforms.includes('instagram')}
>
  Instagram
</SelectItem>
```

### Max 2 Social Links

```tsx
{socialLinks.length < 2 && (
  <Button onClick={addSocialLink}>
    Add Social Link
  </Button>
)}
```

---

## Migration Guide

### SQL Migration

Run the migration file: `server/migrations/add_structured_social_links.sql`

```sql
-- Add columns
ALTER TABLE company_social_links
  ADD COLUMN link_type ENUM('website', 'social') NOT NULL DEFAULT 'social',
  ADD COLUMN platform ENUM('facebook', 'instagram') NULL;

-- Mark first link per company as website
-- Auto-detect platforms from URLs
-- Add indexes
```

### Data Migration

Existing links are migrated as:
1. First link per company → `link_type='website'`
2. Other links → `link_type='social'`
3. Platform auto-detected from URL (facebook.com → facebook, etc.)

---

## Success Criteria

- [x] Only `facebook` and `instagram` platforms allowed
- [x] Max 1 website per company
- [x] Max 2 social links per company
- [x] No duplicate platforms
- [x] `platform` required for social links
- [x] GET returns structured `{ website, social_links }`
- [x] POST validates link_type and platform
- [x] Proper error responses (409 for conflicts, 422 for validation)
- [x] Server TypeScript compiles
- [x] Client TypeScript compiles

---

## Files Modified

### Server
- `server/migrations/add_structured_social_links.sql` - Database migration
- `server/src/types/company.ts` - TypeScript types
- `server/src/models/CompanyModel.ts` - Database methods with validation
- `server/src/controllers/companyController.ts` - Controller methods
- `server/src/routes/company.ts` - API routes with new schema

### Client
- `client/src/services/companySocialLinksService.ts` - Complete rewrite

### Frontend (TODO)
- `client/src/pages/company/CompanyOnboardPage.tsx` - Update onboarding form
- `client/src/pages/CompanySettingsPage.tsx` - Update settings page
- `client/src/pages/CompanyProfilePage.tsx` - Update display
