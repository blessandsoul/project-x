# Inquiry System Testing Guide

Complete testing pattern for the User ↔ Company inquiry/messaging system.

---

## 8.1 Database Setup Checks

### Verify Tables Created

```sql
-- Check tables exist
SHOW TABLES LIKE 'inquir%';

-- Expected output:
-- inquiries
-- inquiry_messages
-- inquiry_participants
```

### Verify Table Structure

```sql
-- Inquiries table
DESCRIBE inquiries;

-- Key columns to verify:
-- id BIGINT UNSIGNED AUTO_INCREMENT
-- user_id BIGINT UNSIGNED
-- company_id BIGINT UNSIGNED
-- vehicle_id BIGINT UNSIGNED
-- status ENUM('pending','active','accepted','declined','expired','cancelled')
-- is_open TINYINT UNSIGNED (generated column)
```

```sql
-- Inquiry messages table
DESCRIBE inquiry_messages;

-- Key columns:
-- id BIGINT UNSIGNED AUTO_INCREMENT
-- inquiry_id BIGINT UNSIGNED
-- sender_id BIGINT UNSIGNED
-- message_type ENUM('text','offer','system')
-- message TEXT
-- attachments JSON
```

```sql
-- Inquiry participants table
DESCRIBE inquiry_participants;

-- Key columns:
-- id BIGINT UNSIGNED AUTO_INCREMENT
-- inquiry_id BIGINT UNSIGNED
-- user_id BIGINT UNSIGNED
-- role ENUM('user','company')
-- last_read_message_id BIGINT UNSIGNED
```

### Verify Indexes

```sql
SHOW INDEX FROM inquiries;
SHOW INDEX FROM inquiry_messages;
SHOW INDEX FROM inquiry_participants;

-- Key indexes to verify:
-- inquiries: idx_inquiries_user_created, idx_inquiries_company_created, idx_inquiries_status_updated
-- inquiry_messages: idx_inquiry_messages_inquiry_id
-- inquiry_participants: uq_inquiry_participants_unique (UNIQUE)
```

### Verify Generated Column and Unique Constraint

```sql
-- Check is_open generated column
SELECT
  COLUMN_NAME,
  GENERATION_EXPRESSION,
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'inquiries' AND COLUMN_NAME = 'is_open';

-- Check unique constraint on open inquiries
SELECT
  CONSTRAINT_NAME,
  COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'inquiries' AND CONSTRAINT_NAME = 'uq_inquiries_open_unique';
```

### Test Unique Constraint Works

```sql
-- Insert test data (replace with valid IDs from your DB)
INSERT INTO inquiries (user_id, company_id, vehicle_id, status) VALUES (1, 1, 1, 'pending');

-- This should FAIL with duplicate key error:
INSERT INTO inquiries (user_id, company_id, vehicle_id, status) VALUES (1, 1, 1, 'active');

-- This should SUCCEED (different vehicle):
INSERT INTO inquiries (user_id, company_id, vehicle_id, status) VALUES (1, 1, 2, 'pending');

-- This should SUCCEED (closed status allows duplicates):
UPDATE inquiries SET status = 'cancelled' WHERE user_id = 1 AND company_id = 1 AND vehicle_id = 1 LIMIT 1;
INSERT INTO inquiries (user_id, company_id, vehicle_id, status) VALUES (1, 1, 1, 'pending');

-- Cleanup
DELETE FROM inquiries WHERE user_id = 1 AND company_id = 1;
```

---

## 8.2 API Manual Tests (curl)

### Prerequisites

```bash
# Create cookie jar file
touch cookies.txt

# Set base URL
BASE_URL="http://localhost:3000"
```

### Step 1: Login as User

```bash
# Login as a regular user
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "identifier": "testuser@example.com",
    "password": "password123"
  }'

# Expected: 200 OK with user info, cookies set
```

### Step 2: Get CSRF Token

```bash
# Fetch CSRF token (required for POST/PUT/PATCH/DELETE)
CSRF_TOKEN=$(curl -s "$BASE_URL/auth/csrf" \
  -c cookies.txt -b cookies.txt | jq -r '.csrfToken')

echo "CSRF Token: $CSRF_TOKEN"
```

### Step 3: Create Inquiry (User)

```bash
# Create inquiry with idempotency key
curl -X POST "$BASE_URL/inquiries" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Idempotency-Key: test-inquiry-$(date +%s)" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "company_id": 1,
    "vehicle_id": 1,
    "message": "Hi, I am interested in shipping this vehicle. What is your best price?",
    "subject": "Shipping inquiry for BMW X5",
    "quoted_total_price": 2500.00,
    "quoted_currency": "USD"
  }'

# Expected: 201 Created with inquiry object
# Save the inquiry ID for later tests
INQUIRY_ID=<returned_id>
```

### Step 4: List User Inquiries

```bash
curl -X GET "$BASE_URL/inquiries?limit=10&offset=0" \
  -c cookies.txt -b cookies.txt

# Expected: 200 OK with paginated list of inquiries
```

### Step 5: Get Single Inquiry

```bash
curl -X GET "$BASE_URL/inquiries/$INQUIRY_ID" \
  -c cookies.txt -b cookies.txt

# Expected: 200 OK with inquiry details including unread_count
```

### Step 6: Login as Company User

```bash
# Clear cookies and login as company user
rm cookies.txt && touch cookies.txt

curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "identifier": "company@example.com",
    "password": "password123"
  }'

# Get new CSRF token
CSRF_TOKEN=$(curl -s "$BASE_URL/auth/csrf" \
  -c cookies.txt -b cookies.txt | jq -r '.csrfToken')
```

### Step 7: List Company Inquiries (Filter by Status)

```bash
curl -X GET "$BASE_URL/company/inquiries?status=pending" \
  -c cookies.txt -b cookies.txt

# Expected: 200 OK with pending inquiries for this company
```

### Step 8: Company Reply (Auto Status Change)

```bash
# Company replies - this should auto-change status from 'pending' to 'active'
curl -X POST "$BASE_URL/company/inquiries/$INQUIRY_ID/messages" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "message": "Hello! Thank you for your interest. We can ship this vehicle for $2,300. Delivery time is 14 days."
  }'

# Expected: 201 Created with message object
# Verify inquiry status changed to 'active'
```

### Step 9: Company Set Final Price

```bash
curl -X PATCH "$BASE_URL/company/inquiries/$INQUIRY_ID" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "final_price": 2300.00,
    "final_currency": "USD"
  }'

# Expected: 200 OK with updated inquiry
```

### Step 10: Get Company Stats

```bash
curl -X GET "$BASE_URL/company/inquiries/stats" \
  -c cookies.txt -b cookies.txt

# Expected: 200 OK with stats object:
# { "pending": 0, "active": 1, "accepted": 0, "declined": 0, "expired": 0, "cancelled": 0, "total_unread": 0 }
```

### Step 11: User Reply

```bash
# Switch back to user
rm cookies.txt && touch cookies.txt

curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "identifier": "testuser@example.com",
    "password": "password123"
  }'

CSRF_TOKEN=$(curl -s "$BASE_URL/auth/csrf" \
  -c cookies.txt -b cookies.txt | jq -r '.csrfToken')

# User replies
curl -X POST "$BASE_URL/inquiries/$INQUIRY_ID/messages" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "message": "That sounds good! Can you do $2,200?"
  }'

# Expected: 201 Created
```

### Step 12: Check Unread Count (Company Side)

```bash
# Login as company
rm cookies.txt && touch cookies.txt

curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "identifier": "company@example.com",
    "password": "password123"
  }'

# Check unread count
curl -X GET "$BASE_URL/inquiries/$INQUIRY_ID/unread-count" \
  -c cookies.txt -b cookies.txt

# Expected: { "unread_count": 1 }
```

### Step 13: Mark as Read

```bash
CSRF_TOKEN=$(curl -s "$BASE_URL/auth/csrf" \
  -c cookies.txt -b cookies.txt | jq -r '.csrfToken')

curl -X POST "$BASE_URL/company/inquiries/$INQUIRY_ID/mark-read" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -c cookies.txt -b cookies.txt

# Expected: { "success": true }

# Verify unread is now 0
curl -X GET "$BASE_URL/inquiries/$INQUIRY_ID/unread-count" \
  -c cookies.txt -b cookies.txt

# Expected: { "unread_count": 0 }
```

### Step 14: User Accept

```bash
# Login as user
rm cookies.txt && touch cookies.txt

curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "identifier": "testuser@example.com",
    "password": "password123"
  }'

CSRF_TOKEN=$(curl -s "$BASE_URL/auth/csrf" \
  -c cookies.txt -b cookies.txt | jq -r '.csrfToken')

curl -X PATCH "$BASE_URL/inquiries/$INQUIRY_ID" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "status": "accepted"
  }'

# Expected: 200 OK with status: "accepted"
```

### Step 15: Verify Terminal Status Blocks Updates

```bash
# Try to cancel an already accepted inquiry (should fail)
curl -X PATCH "$BASE_URL/inquiries/$INQUIRY_ID" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "status": "cancelled"
  }'

# Expected: 400 Bad Request
# { "statusCode": 400, "error": "Bad Request", "message": "Cannot update inquiry in terminal status: accepted" }
```

### Step 16: Verify Duplicate Open Inquiry Blocked

```bash
# Try to create another inquiry for same company+vehicle (should fail)
curl -X POST "$BASE_URL/inquiries" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Idempotency-Key: test-duplicate-$(date +%s)" \
  -c cookies.txt -b cookies.txt \
  -d '{
    "company_id": 1,
    "vehicle_id": 1,
    "message": "Another inquiry"
  }'

# Expected: 409 Conflict (if previous inquiry was still open)
# OR 201 Created (if previous was accepted/terminal - new open allowed)
```

---

## 8.3 Automated Tests

### Test File: `server/src/__tests__/inquiry.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import { InquiryService } from "../services/InquiryService.js";
import { InquiryModel } from "../models/InquiryModel.js";

describe("Inquiry System", () => {
  let fastify: any;
  let service: InquiryService;
  let testUserId: number;
  let testCompanyId: number;
  let testCompanyUserId: number;
  let testVehicleId: number;

  beforeAll(async () => {
    // Setup test database connection
    // ... your test setup
  });

  afterAll(async () => {
    // Cleanup
    await fastify.close();
  });

  describe("Unique Open Inquiry Constraint", () => {
    it("should not allow two open inquiries for same user-company-vehicle", async () => {
      // Create first inquiry
      const inquiry1 = await service.createInquiry(testUserId, {
        user_id: testUserId,
        company_id: testCompanyId,
        vehicle_id: testVehicleId,
        message: "First inquiry",
      });

      expect(inquiry1.id).toBeDefined();
      expect(inquiry1.status).toBe("pending");

      // Try to create second inquiry - should fail
      await expect(
        service.createInquiry(testUserId, {
          user_id: testUserId,
          company_id: testCompanyId,
          vehicle_id: testVehicleId,
          message: "Second inquiry",
        })
      ).rejects.toThrow("already have an open inquiry");
    });

    it("should allow new inquiry after previous is closed", async () => {
      // Cancel the first inquiry
      await service.updateInquiryByUser(inquiry1.id, testUserId, "cancelled");

      // Now creating a new one should work
      const inquiry2 = await service.createInquiry(testUserId, {
        user_id: testUserId,
        company_id: testCompanyId,
        vehicle_id: testVehicleId,
        message: "New inquiry after cancel",
      });

      expect(inquiry2.id).toBeDefined();
    });
  });

  describe("Authorization", () => {
    it("user cannot access other user inquiry", async () => {
      const otherUserId = 9999;

      await expect(
        service.getUserInquiry(inquiry1.id, otherUserId)
      ).rejects.toThrow("do not have access");
    });

    it("company cannot access other company inquiry", async () => {
      const otherCompanyId = 9999;

      await expect(
        service.getCompanyInquiry(
          inquiry1.id,
          otherCompanyId,
          testCompanyUserId
        )
      ).rejects.toThrow("do not have access");
    });
  });

  describe("Unread Count", () => {
    it("should track unread messages correctly", async () => {
      // User sends message
      await service.sendMessage(inquiry1.id, testUserId, "user", {
        message: "User message",
      });

      // Company should have 1 unread
      const companyUnread = await service.getUnreadCount(
        inquiry1.id,
        testCompanyUserId
      );
      expect(companyUnread).toBe(1);

      // Mark as read
      await service.markAsRead(inquiry1.id, testCompanyUserId);

      // Now should be 0
      const afterRead = await service.getUnreadCount(
        inquiry1.id,
        testCompanyUserId
      );
      expect(afterRead).toBe(0);
    });
  });

  describe("Status Transitions", () => {
    it("should enforce valid status transitions", async () => {
      // pending -> active (via company reply)
      await service.sendMessage(inquiry1.id, testCompanyUserId, "company", {
        message: "Company reply",
      });

      const updated = await service.getUserInquiry(inquiry1.id, testUserId);
      expect(updated.status).toBe("active");

      // active -> accepted (user)
      const accepted = await service.updateInquiryByUser(
        inquiry1.id,
        testUserId,
        "accepted"
      );
      expect(accepted.status).toBe("accepted");

      // accepted -> cancelled (should fail - terminal)
      await expect(
        service.updateInquiryByUser(inquiry1.id, testUserId, "cancelled")
      ).rejects.toThrow("terminal status");
    });

    it("should not allow invalid transitions", async () => {
      // Create new inquiry
      const inquiry = await service.createInquiry(testUserId, {
        user_id: testUserId,
        company_id: testCompanyId,
        vehicle_id: testVehicleId + 1,
        message: "Test",
      });

      // pending -> accepted (invalid - must go through active first)
      await expect(
        service.updateInquiryByUser(inquiry.id, testUserId, "accepted")
      ).rejects.toThrow("Cannot transition");
    });
  });
});
```

### Running Tests

```bash
# If using Vitest
npm run test -- --grep "Inquiry"

# If using Jest
npm test -- --testPathPattern="inquiry"
```

---

## Summary

### Files Created

| File                                    | Description                         |
| --------------------------------------- | ----------------------------------- |
| `migrations/create_inquiries.sql`       | Database migration for all 3 tables |
| `src/types/inquiry.ts`                  | TypeScript interfaces and types     |
| `src/models/InquiryModel.ts`            | Inquiry database operations         |
| `src/models/InquiryMessageModel.ts`     | Message database operations         |
| `src/models/InquiryParticipantModel.ts` | Participant/read tracking           |
| `src/services/InquiryService.ts`        | Business logic with transactions    |
| `src/controllers/InquiryController.ts`  | HTTP request handling               |
| `src/routes/inquiry.ts`                 | User-facing endpoints               |
| `src/routes/companyInquiry.ts`          | Company-facing endpoints            |

### Endpoints Summary

**User Endpoints:**

- `POST /inquiries` - Create inquiry
- `GET /inquiries` - List inquiries
- `GET /inquiries/:id` - Get inquiry
- `PATCH /inquiries/:id` - Accept/Cancel
- `GET /inquiries/:id/messages` - Get messages
- `POST /inquiries/:id/messages` - Send message
- `GET /inquiries/:id/unread-count` - Unread count
- `POST /inquiries/:id/mark-read` - Mark read

**Company Endpoints:**

- `GET /company/inquiries` - List inquiries
- `GET /company/inquiries/stats` - Dashboard stats
- `GET /company/inquiries/:id` - Get inquiry
- `PATCH /company/inquiries/:id` - Update status/price
- `GET /company/inquiries/:id/messages` - Get messages
- `POST /company/inquiries/:id/messages` - Send message
- `POST /company/inquiries/:id/mark-read` - Mark read
