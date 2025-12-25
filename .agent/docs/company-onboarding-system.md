# Company Onboarding System Documentation

## Overview

The Company Onboarding system implements a **2-step registration flow** where users first create a personal account, then optionally create a company profile. This document explains the complete flow, database interactions, and API communication.

---

## System Architecture

### High-Level Flow

```
┌─────────────────┐
│  User Registers │ (Step 1: POST /auth/register)
│  role: 'user'   │
│  company_id: NULL│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Logs In   │ (POST /auth/login)
│  Authenticated  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Company  │ (Step 2: POST /companies/onboard)
│ role: 'company' │
│ company_id: X   │
└─────────────────┘
```

---

## Database Schema

### Tables Involved

#### 1. `users` Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'company', 'admin') DEFAULT 'user',
  company_id INT NULL,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);
```

**Key Fields:**
- `role`: Changes from `'user'` → `'company'` after onboarding
- `company_id`: NULL initially, set to company ID after onboarding
- `is_blocked`: Prevents onboarding if TRUE

#### 2. `companies` Table
```sql
CREATE TABLE companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_user_id INT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  -- Contact Info
  phone_number VARCHAR(50),
  contact_email VARCHAR(255),
  website VARCHAR(255),
  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  -- Multi-language Descriptions
  description_geo TEXT COMMENT 'Company description in Georgian',
  description_eng TEXT COMMENT 'Company description in English',
  description_rus TEXT COMMENT 'Company description in Russian',
  established_year INT,
  services JSON,
  -- Pricing
  base_price DECIMAL(10,2) DEFAULT 0,
  price_per_mile DECIMAL(10,2) DEFAULT 0,
  customs_fee DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  broker_fee DECIMAL(10,2) DEFAULT 0,
  cheapest_score DECIMAL(10,2) DEFAULT 0,
  -- Metadata
  rating DECIMAL(3,2) DEFAULT 0,
  is_vip BOOLEAN DEFAULT FALSE,
  subscription_free BOOLEAN DEFAULT TRUE,
  subscription_ends_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_owner (owner_user_id)
);
```

**Key Constraints:**
- `owner_user_id` is UNIQUE (one company per user)
- Cascade deletion: deleting a company sets user's `company_id` to NULL

#### 3. `company_social_links` Table
```sql
CREATE TABLE company_social_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

---

## Client-Side Flow (React)

### Component: `CompanyOnboardPage.tsx`

**Location:** `client/src/pages/company/CompanyOnboardPage.tsx`

#### State Management

```typescript
// Form state (managed by react-hook-form + zod)
const form = useForm<OnboardFormValues>({
  resolver: zodResolver(onboardFormSchema),
  defaultValues: {
    name: '',
    companyPhone: '',
    contactEmail: '',
    country: '',
    city: '',
    state: '',
    description: '',
    establishedYear: undefined,
    services: [],
    basePrice: 0,
    pricePerMile: 0,
    customsFee: 0,
    serviceFee: 0,
    brokerFee: 0,
  }
})

// Separate state for websites (not in form)
const [websites, setWebsites] = useState<string[]>([])

// Logo state
const [logoFile, setLogoFile] = useState<File | null>(null)
const [logoPreview, setLogoPreview] = useState<string | null>(null)

// Progress tracking
const [currentStep, setCurrentStep] = useState<OnboardingStep>('idle')
```

#### Submission Flow

```typescript
const onSubmit = async (data: OnboardFormValues) => {
  setIsSubmitting(true)
  setCurrentStep('creating')
  
  try {
    // Step 1: Create company (API call)
    const result = await onboardCompany({
      name: data.name,
      companyPhone: data.companyPhone,
      contactEmail: data.contactEmail,
      website: websites[0], // First website goes to company.website
      country: data.country,
      city: data.city,
      state: data.state,
      description: data.description,
      establishedYear: data.establishedYear,
      services: data.services,
      basePrice: data.basePrice,
      pricePerMile: data.pricePerMile,
      customsFee: data.customsFee,
      serviceFee: data.serviceFee,
      brokerFee: data.brokerFee,
    })
    
    const companyId = result.company.id
    
    // Step 2: Upload logo (if selected)
    if (logoFile && companyId) {
      setCurrentStep('uploading_logo')
      await uploadCompanyLogo(companyId, logoFile)
    }
    
    // Step 3: Add ALL websites as social links
    if (websites.length > 0 && companyId) {
      setCurrentStep('adding_websites')
      await createMultipleSocialLinks(companyId, websites)
    }
    
    // Step 4: Refresh auth state
    setCurrentStep('refreshing')
    await refreshProfile() // Updates user context with new role
    
    setCurrentStep('done')
    
    // Redirect to company page
    navigate(`/company/${companyId}`, { replace: true })
    
  } catch (error) {
    // Handle errors (unauthorized, conflict, validation, etc.)
  }
}
```

---

## API Communication

### Service: `companyOnboardService.ts`

**Location:** `client/src/services/companyOnboardService.ts`

```typescript
export async function onboardCompany(
  data: CompanyOnboardRequest
): Promise<CompanyOnboardResponse> {
  try {
    const response = await apiClient.post<CompanyOnboardResponse>(
      '/companies/onboard',
      data
    )
    return response.data
  } catch (error) {
    throw parseOnboardError(error)
  }
}
```

**Request Payload:**
```typescript
interface CompanyOnboardRequest {
  // Required
  name: string
  // Contact info (optional)
  companyPhone?: string
  contactEmail?: string
  website?: string
  // Location (optional)
  country?: string
  city?: string
  state?: string
  // Company details (optional)
  description?: string
  establishedYear?: number
  services?: string[]
  // Pricing (optional, defaults to 0)
  basePrice?: number
  pricePerMile?: number
  customsFee?: number
  serviceFee?: number
  brokerFee?: number
}
```

**Response:**
```typescript
interface CompanyOnboardResponse {
  company: {
    id: number
    name: string
    slug: string
    phone_number: string | null
    contact_email: string | null
    website: string | null
    country: string | null
    city: string | null
    state: string | null
    description: string | null
    established_year: number | null
    base_price: number
    price_per_mile: number
    customs_fee: number
    service_fee: number
    broker_fee: number
    rating: number
    is_vip: boolean
    created_at: string
  }
  user: {
    id: number
    email: string
    username: string
    role: 'company'
    company_id: number
  } | null
}
```

**Error Types:**
- `unauthorized` (401): Not authenticated
- `forbidden` (403): Account blocked
- `conflict` (409): User already has company
- `validation` (422): Invalid input
- `rate_limit` (429): Too many attempts
- `network`: Network error
- `unknown`: Unknown error

---

## Server-Side Flow (Fastify)

### Route: `POST /companies/onboard`

**Location:** `server/src/routes/company.ts` (lines 85-278)

#### Security & Validation

```typescript
fastify.post('/companies/onboard', {
  preHandler: [
    fastify.authenticateCookie,  // Verify JWT from HttpOnly cookie
    fastify.csrfProtection        // Verify CSRF token from header
  ],
  schema: {
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        companyPhone: { type: 'string', minLength: 3, maxLength: 50 },
        contactEmail: { type: 'string', format: 'email', maxLength: 255 },
        website: { type: 'string', maxLength: 255 },
        // ... other fields
      }
    }
  },
  config: {
    rateLimit: {
      max: 3,              // Maximum 3 requests
      timeWindow: '1 hour' // Per hour per user
    }
  }
})
```

#### Request Handler Logic

```typescript
async (request, reply) => {
  const currentUser = request.user
  
  // 1. Verify authentication
  if (!currentUser || typeof currentUser.id !== 'number') {
    throw new AuthorizationError('Authentication required')
  }
  
  // 2. Fetch fresh user data
  const freshUser = await userModel.findById(currentUser.id)
  if (!freshUser) {
    throw new AuthorizationError('User not found')
  }
  
  // 3. Check if user is blocked
  if (freshUser.is_blocked) {
    throw new AuthorizationError('Account is blocked')
  }
  
  // 4. Check if user already has a company (belt)
  if (freshUser.company_id !== null) {
    throw new ConflictError('User already has a company')
  }
  
  // 5. Double-check: verify no company exists (suspenders)
  const existingCompany = await companyModel.findByOwnerUserId(currentUser.id)
  if (existingCompany) {
    throw new ConflictError('User already owns a company')
  }
  
  // 6. Start database transaction
  const connection = await fastify.mysql.getConnection()
  
  try {
    await connection.beginTransaction()
    
    // 7. Create company
    const createdCompany = await companyModel.create({
      name: trimmedName,
      owner_user_id: currentUser.id,
      phone_number: companyPhone?.trim() ?? null,
      contact_email: contactEmail?.trim() ?? null,
      website: website?.trim() ?? null,
      country: country?.trim() ?? null,
      city: city?.trim() ?? null,
      state: state?.trim() ?? null,
      description: description?.trim() ?? null,
      established_year: establishedYear ?? null,
      services: services ?? null,
      base_price: basePrice ?? 0,
      price_per_mile: pricePerMile ?? 0,
      customs_fee: customsFee ?? 0,
      service_fee: serviceFee ?? 0,
      broker_fee: brokerFee ?? 0,
    })
    
    // 8. Update user: set role='company' and company_id
    await userModel.update(currentUser.id, {
      role: 'company',
      company_id: createdCompany.id,
    })
    
    // 9. Commit transaction
    await connection.commit()
    
    // 10. Invalidate user cache
    await invalidateUserCache(fastify, currentUser.id)
    
    // 11. Return response
    return reply.code(201).send({
      company: { /* company data */ },
      user: { /* updated user data */ }
    })
    
  } catch (error) {
    // Rollback on error
    await connection.rollback()
    
    // Handle duplicate key error (race condition)
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('User already owns a company')
    }
    
    throw error
  } finally {
    connection.release()
  }
}
```

---

## Database Interactions (SQL)

### CompanyModel.create()

**Location:** `server/src/models/CompanyModel.ts` (lines 45-117)

```typescript
async create(companyData: CompanyCreate): Promise<Company> {
  // 1. Generate slug from name
  const baseSlug = (slug ?? name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const computedSlug = baseSlug || `company-${Date.now()}`
  
  // 2. Calculate cheapest_score for sorting
  const cheapestScore =
    (base_price ?? 0) +
    (customs_fee ?? 0) +
    (service_fee ?? 0) +
    (broker_fee ?? 0)
  
  // 3. Execute INSERT query
  const result = await this.executeCommand(
    `INSERT INTO companies (
      owner_user_id, name, slug, base_price, price_per_mile,
      customs_fee, service_fee, broker_fee, insurance,
      cheapest_score, final_formula, description, country,
      city, state, services, phone_number, contact_email,
      website, established_year, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      owner_user_id,
      name,
      computedSlug,
      base_price,
      price_per_mile,
      customs_fee,
      service_fee,
      broker_fee,
      insurance,
      cheapestScore,
      final_formula ? JSON.stringify(final_formula) : null,
      description,
      country,
      city,
      state,
      services ? JSON.stringify(services) : null,
      phone_number,
      contact_email,
      website,
      established_year,
    ]
  )
  
  // 4. Fetch and return created company
  const companyId = result.insertId
  const company = await this.findById(companyId)
  if (!company) {
    throw new DatabaseError('Failed to retrieve created company')
  }
  return company
}
```

**SQL Query:**
```sql
INSERT INTO companies (
  owner_user_id, name, slug, base_price, price_per_mile,
  customs_fee, service_fee, broker_fee, insurance,
  cheapest_score, final_formula, description, country,
  city, state, services, phone_number, contact_email,
  website, established_year, created_at, updated_at
) VALUES (
  1,                    -- owner_user_id
  'Acme Logistics',     -- name
  'acme-logistics',     -- slug
  100.00,               -- base_price
  1.50,                 -- price_per_mile
  50.00,                -- customs_fee
  25.00,                -- service_fee
  30.00,                -- broker_fee
  NULL,                 -- insurance
  205.00,               -- cheapest_score (calculated)
  NULL,                 -- final_formula
  'We ship vehicles',   -- description
  'USA',                -- country
  'Los Angeles',        -- city
  'California',         -- state
  '["Shipping","Customs"]', -- services (JSON)
  '+1-555-1234',        -- phone_number
  'info@acme.com',      -- contact_email
  'https://acme.com',   -- website
  2015,                 -- established_year
  NOW(),                -- created_at
  NOW()                 -- updated_at
);
```

### UserModel.update()

**Updates user role and company_id:**

```sql
UPDATE users
SET
  role = 'company',
  company_id = 42,
  updated_at = NOW()
WHERE id = 1;
```

---

## Authentication & Authorization

### Cookie-Based Authentication

**Flow:**
1. User logs in via `POST /auth/login`
2. Server generates JWT and sets it as HttpOnly cookie
3. Client automatically sends cookie with subsequent requests
4. Server validates JWT in `authenticateCookie` middleware

**Cookie Details:**
- Name: `access_token`
- HttpOnly: `true` (prevents XSS)
- Secure: `true` (HTTPS only in production)
- SameSite: `Strict` (prevents CSRF)

### CSRF Protection

**Flow:**
1. Client fetches CSRF token from `GET /auth/csrf-token`
2. Client includes token in `X-CSRF-Token` header
3. Server validates token in `csrfProtection` middleware

**Example Request:**
```http
POST /companies/onboard HTTP/1.1
Host: api.example.com
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-CSRF-Token: a3f8b2c1-4d5e-6f7g-8h9i-0j1k2l3m4n5o
Content-Type: application/json

{
  "name": "Acme Logistics",
  "basePrice": 100,
  ...
}
```

### Rate Limiting

**Configuration:**
- **Max:** 3 requests per hour per user
- **Key:** User ID (from JWT)
- **Storage:** Redis
- **Response:** 429 Too Many Requests

---

## Error Handling

### Client-Side Error Handling

```typescript
try {
  const result = await onboardCompany(payload)
  // Success
} catch (err) {
  const onboardError = err as OnboardError
  
  switch (onboardError.type) {
    case 'unauthorized':
      toast.error('Please log in to continue')
      navigate('/login', { replace: true })
      break
      
    case 'conflict':
      toast.error('You already have a company')
      await refreshProfile()
      navigate('/dashboard', { replace: true })
      break
      
    case 'rate_limit':
      toast.error('Too many attempts. Please try again later.')
      break
      
    case 'validation':
      toast.error(onboardError.message)
      // Display field-specific errors from onboardError.details
      break
      
    default:
      toast.error(onboardError.message)
  }
}
```

### Server-Side Error Responses

**401 Unauthorized:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Please log in to create a company."
}
```

**403 Forbidden:**
```json
{
  "error": "FORBIDDEN",
  "message": "Your account is blocked. Please contact support."
}
```

**409 Conflict:**
```json
{
  "error": "CONFLICT",
  "message": "User already has a company"
}
```

**422 Validation Error:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Please check your input and try again.",
  "details": {
    "name": ["Company name is required"],
    "contactEmail": ["Invalid email address"]
  }
}
```

**429 Rate Limit:**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many attempts. Please try again later."
}
```

---

## Post-Onboarding Actions

### Logo Upload

**Endpoint:** `POST /companies/:id/logo`

```typescript
// Client-side
const formData = new FormData()
formData.append('logo', logoFile)

await apiClient.post(`/companies/${companyId}/logo`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

**Server-side:**
- Validates file type (JPEG, PNG, WEBP only)
- Validates file size (max 2MB)
- Verifies magic bytes (prevents polyglots)
- Sanitizes image via sharp (strips metadata, re-encodes)
- Stores in `uploads/companies/{slug}/logo.webp`

### Social Links Creation

**Endpoint:** `POST /companies/:id/social-links`

```typescript
// Client-side
await createMultipleSocialLinks(companyId, [
  'https://acme.com',
  'https://facebook.com/acme',
  'https://twitter.com/acme'
])
```

**Server-side:**
```sql
INSERT INTO company_social_links (company_id, url)
VALUES
  (42, 'https://acme.com'),
  (42, 'https://facebook.com/acme'),
  (42, 'https://twitter.com/acme');
```

---

## Company Management APIs

### Update Company: `PUT /companies/:id`

**Purpose:** Update an existing company's information

**Authorization:**
- **Admin:** Can update any company
- **Company Owner:** Can only update their own company (`user.company_id === company.id`)

**Endpoint:** `PUT /companies/:id`

**Request:**
```http
PUT /companies/42 HTTP/1.1
Host: api.example.com
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-CSRF-Token: a3f8b2c1-4d5e-6f7g-8h9i-0j1k2l3m4n5o
Content-Type: application/json

{
  "name": "Acme Logistics Updated",
  "description": "Updated description",
  "phone_number": "+1-555-9999",
  "contact_email": "new@acme.com",
  "website": "https://newacme.com",
  "country": "USA",
  "city": "San Francisco",
  "state": "California",
  "established_year": 2016,
  "services": ["Shipping", "Customs", "Warehousing"],
  "base_price": 120.00,
  "price_per_mile": 1.75,
  "customs_fee": 60.00,
  "service_fee": 30.00,
  "broker_fee": 35.00
}
```

**Response (200 OK):**
```json
{
  "id": 42,
  "owner_user_id": 1,
  "is_active": true,
  "name": "Acme Logistics Updated",
  "slug": "acme-logistics",
  "phone_number": "+1-555-9999",
  "contact_email": "new@acme.com",
  "website": "https://newacme.com",
  "country": "USA",
  "city": "San Francisco",
  "state": "California",
  "description": "Updated description",
  "established_year": 2016,
  "services": ["Shipping", "Customs", "Warehousing"],
  "base_price": 120.00,
  "price_per_mile": 1.75,
  "customs_fee": 60.00,
  "service_fee": 30.00,
  "broker_fee": 35.00,
  "cheapest_score": 245.00,
  "rating": 4.5,
  "is_vip": false,
  "subscription_free": true,
  "subscription_ends_at": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-12-25T12:39:00Z"
}
```

**Server-Side Logic:**

```typescript
// Route handler (server/src/routes/company.ts)
fastify.put('/companies/:id', {
  preHandler: [
    fastify.authenticateCookie,
    fastify.csrfProtection,
    requireCompanyMembership()
  ],
  schema: {
    params: idParamsSchema,
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        phone_number: { type: ['string', 'null'], maxLength: 50 },
        contact_email: { type: ['string', 'null'], format: 'email', maxLength: 255 },
        website: { type: ['string', 'null'], maxLength: 255 },
        country: { type: ['string', 'null'], maxLength: 100 },
        city: { type: ['string', 'null'], maxLength: 100 },
        state: { type: ['string', 'null'], maxLength: 100 },
        description: { type: ['string', 'null'], maxLength: 5000 },
        established_year: { type: ['integer', 'null'], minimum: 1900, maximum: 2100 },
        services: { type: ['array', 'null'], items: { type: 'string' }, maxItems: 20 },
        base_price: { type: 'number', minimum: 0 },
        price_per_mile: { type: 'number', minimum: 0 },
        customs_fee: { type: 'number', minimum: 0 },
        service_fee: { type: 'number', minimum: 0 },
        broker_fee: { type: 'number', minimum: 0 },
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params
  
  // Authorization check
  const isAdmin = request.user.role === 'admin'
  const isCompanyOwner = 
    request.user.role === 'company' &&
    request.user.company_id === id
  
  if (!isAdmin && !isCompanyOwner) {
    throw new AuthorizationError('Not authorized to update this company')
  }
  
  // Update company
  const updates = request.body as CompanyUpdate
  const updated = await controller.updateCompany(id, updates)
  
  // Invalidate cache
  await incrementCacheVersion(fastify, 'companies')
  
  return reply.send(updated)
})
```

**SQL Query (CompanyModel.update):**

```sql
UPDATE companies
SET
  name = 'Acme Logistics Updated',
  phone_number = '+1-555-9999',
  contact_email = 'new@acme.com',
  website = 'https://newacme.com',
  country = 'USA',
  city = 'San Francisco',
  state = 'California',
  description = 'Updated description',
  established_year = 2016,
  services = '["Shipping","Customs","Warehousing"]',
  base_price = 120.00,
  price_per_mile = 1.75,
  customs_fee = 60.00,
  service_fee = 30.00,
  broker_fee = 35.00,
  cheapest_score = COALESCE(base_price, 0) + COALESCE(customs_fee, 0) + COALESCE(service_fee, 0) + COALESCE(broker_fee, 0),
  updated_at = NOW()
WHERE id = 42;
```

**Error Responses:**

- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not authorized to update this company
- **404 Not Found:** Company does not exist
- **422 Validation Error:** Invalid input data

---

### Delete Company: `DELETE /companies/:id`

**Purpose:** Permanently delete a company and all related data

**Authorization:**
- **Admin:** Can delete any company
- **Company Owner:** Can only delete their own company (`user.company_id === company.id`)

**Endpoint:** `DELETE /companies/:id`

**Request:**
```http
DELETE /companies/42 HTTP/1.1
Host: api.example.com
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-CSRF-Token: a3f8b2c1-4d5e-6f7g-8h9i-0j1k2l3m4n5o
```

**Response (204 No Content):**
```http
HTTP/1.1 204 No Content
```

**Server-Side Logic:**

```typescript
// Route handler (server/src/routes/company.ts)
fastify.delete('/companies/:id', {
  preHandler: [fastify.authenticateCookie, fastify.csrfProtection],
  schema: {
    params: idParamsSchema
  }
}, async (request, reply) => {
  const { id } = request.params
  
  // Authorization check
  const isAdmin = request.user.role === 'admin'
  const isCompanyOwner = 
    request.user.role === 'company' &&
    request.user.company_id === id
  
  if (!isAdmin && !isCompanyOwner) {
    throw new AuthorizationError('Not authorized to delete this company')
  }
  
  // Delete company (cascades to related tables)
  await controller.deleteCompany(id)
  
  // Invalidate cache
  await incrementCacheVersion(fastify, 'companies')
  
  return reply.code(204).send()
})
```

**Cascade Deletion Logic (CompanyController.deleteCompany):**

```typescript
async deleteCompany(id: number): Promise<void> {
  // 1. Fetch company details BEFORE deletion (for slug/owner_user_id)
  const company = await this.companyModel.findById(id)
  if (!company) {
    throw new NotFoundError('Company')
  }
  
  const ownerUserId = company.owner_user_id
  
  // 2. Delete from database (hard delete with cascading)
  const deleted = await this.companyModel.delete(id)
  if (!deleted) {
    throw new NotFoundError('Company')
  }
  
  // 3. Revert owner user's role from 'company' back to 'user'
  if (ownerUserId) {
    try {
      await this.userModel.update(ownerUserId, {
        role: 'user',
        company_id: null,
      })
      this.fastify.log.info({ companyId: id, userId: ownerUserId }, 
        'User role reverted from company to user')
    } catch (error) {
      // Log error but don't fail the deletion
      this.fastify.log.error({ companyId: id, userId: ownerUserId, error }, 
        'Failed to revert user role - manual update may be required')
    }
  }
  
  // 4. Clean up uploaded assets (logo, etc.)
  if (company.slug) {
    try {
      const { deleteCompanyAssets } = await import('../utils/fs.js')
      const assetsDeleted = await deleteCompanyAssets(company.slug)
      if (assetsDeleted) {
        this.fastify.log.info({ companyId: id, slug: company.slug }, 
          'Company assets deleted successfully')
      }
    } catch (error) {
      // Log error but don't fail the deletion
      this.fastify.log.error({ companyId: id, slug: company.slug, error }, 
        'Failed to delete company assets - manual cleanup may be required')
    }
  }
}
```

**SQL Queries (CompanyModel.delete):**

```sql
-- 1. Delete related quotes (cascade)
DELETE FROM company_quotes WHERE company_id = 42;

-- 2. Delete related social links (cascade)
DELETE FROM company_social_links WHERE company_id = 42;

-- 3. Delete company
DELETE FROM companies WHERE id = 42;

-- 4. Revert user role (separate operation)
UPDATE users
SET
  role = 'user',
  company_id = NULL,
  updated_at = NOW()
WHERE id = 1;
```

**Cascade Behavior:**

| Table | Action | Notes |
|-------|--------|-------|
| `companies` | **DELETE** | Main record deleted |
| `company_quotes` | **CASCADE DELETE** | All quotes for this company deleted |
| `company_social_links` | **CASCADE DELETE** | All social links deleted |
| `company_reviews` | **PRESERVED** | Reviews remain (for historical data) |
| `users` (owner) | **UPDATE** | `role` → 'user', `company_id` → NULL |
| File system | **DELETE** | Logo and assets deleted from `uploads/companies/{slug}/` |

**Post-Deletion State:**

After deletion, the owner user:
- Can log in normally
- Has `role: 'user'` (reverted from 'company')
- Has `company_id: null`
- Can create a new company via `/companies/onboard`

**Error Responses:**

- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not authorized to delete this company
- **404 Not Found:** Company does not exist

---

## Cache Invalidation

### User Cache

**After onboarding:**
```typescript
await invalidateUserCache(fastify, currentUser.id)
```

**Effect:**
- Clears Redis cache for user profile
- Next `GET /auth/me` fetches fresh data from database
- Client receives updated `role: 'company'` and `company_id`

### Company Cache

**After company creation:**
```typescript
await incrementCacheVersion(fastify, 'companies')
```

**Effect:**
- Bumps cache version number in Redis
- Invalidates all company-related caches
- Next `GET /companies` fetches fresh data

---

## Security Considerations

### 1. Race Condition Prevention

**Problem:** Two simultaneous requests could create duplicate companies

**Solution:** Database UNIQUE constraint + transaction + error handling

```typescript
// Database constraint
UNIQUE KEY unique_owner (owner_user_id)

// Error handling
if (error?.code === 'ER_DUP_ENTRY') {
  throw new ConflictError('User already owns a company')
}
```

### 2. SQL Injection Prevention

**All queries use parameterized statements:**
```typescript
await this.executeCommand(
  'INSERT INTO companies (name, owner_user_id) VALUES (?, ?)',
  [name, userId] // Parameters are escaped
)
```

### 3. XSS Prevention

**Client-side:**
- React automatically escapes JSX content
- User input is sanitized before display

**Server-side:**
- Input validation via JSON schema
- Output encoding in responses

### 4. CSRF Prevention

**Dual-token pattern:**
- Cookie: HttpOnly access token (can't be read by JS)
- Header: CSRF token (must be explicitly set by client)
- Attacker can't forge both in cross-origin request

---

## Testing Checklist

### Happy Path
- [ ] User can create company with minimal data (name only)
- [ ] User can create company with full data
- [ ] User role changes from 'user' to 'company'
- [ ] User company_id is set correctly
- [ ] Logo uploads successfully
- [ ] Social links are created
- [ ] User is redirected to company page

### Error Cases
- [ ] Unauthenticated user gets 401
- [ ] Blocked user gets 403
- [ ] User with existing company gets 409
- [ ] Invalid input gets 422
- [ ] Rate limit exceeded gets 429
- [ ] Network error is handled gracefully

### Edge Cases
- [ ] Concurrent requests don't create duplicate companies
- [ ] Transaction rollback on error
- [ ] Cache invalidation works correctly
- [ ] Logo upload with invalid file type fails
- [ ] Logo upload exceeding size limit fails
- [ ] Empty services array is handled
- [ ] NULL optional fields are handled

---

## Summary for AI

**Key Points:**

1. **2-Step Registration:** User account first, company profile second
2. **Database Transaction:** Company creation + user update are atomic
3. **Authentication:** Cookie-based JWT + CSRF token
4. **Authorization:** User must be authenticated, not blocked, and not have existing company
5. **SQL Interaction:** Parameterized queries via CompanyModel
6. **API Communication:** REST API with JSON payloads
7. **Error Handling:** Typed errors with specific HTTP status codes
8. **Security:** Rate limiting, input validation, SQL injection prevention, XSS prevention, CSRF protection
9. **Cache Management:** User and company caches are invalidated after onboarding
10. **Post-Onboarding:** Logo upload and social links creation are separate API calls

**Data Flow:**
```
Client Form → companyOnboardService → POST /companies/onboard →
authenticateCookie → csrfProtection → Rate Limit Check →
Fetch User → Validate User → Check Existing Company →
Transaction Start → CompanyModel.create() → UserModel.update() →
Transaction Commit → Invalidate Cache → Return Response →
Client: Upload Logo → Create Social Links → Refresh Auth → Redirect
```
