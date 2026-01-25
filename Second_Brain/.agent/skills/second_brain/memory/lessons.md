# Lessons Learned

> Track what worked and what didn't. Updated via `/bug` workflow.

---

## Lessons

### 2025-11-21 - Dialog Animation Centering
**Situation:** shadcn Dialog component not centering properly with animations.
**What worked:** Standard shadcn Dialog without custom animation overrides.
**What didn't work:** Custom Framer Motion on Dialog caused positioning issues.
**Lesson:** Never override shadcn component internals. Use pre-defined animations from `lib/animations.js` only.

---

### 2026-01-19 - Redis Connection Closed Errors
**Situation:** `Connection is closed` errors from @fastify/rate-limit after deployment.
**What worked:** Proper Redis connection handling with reconnection strategy.
**What didn't work:** Default ioredis config in production environment.
**Lesson:** Always configure Redis with explicit reconnection options for production.

---

### 2026-01-19 - SPA Routing 404s
**Situation:** Direct URL access to `/known-drivers` returned 404 in production.
**What worked:** Fastify static plugin with wildcard fallback to index.html.
**What didn't work:** Default static file serving without SPA awareness.
**Lesson:** SPA deployments MUST have server-side fallback routing configured.

---

### 2026-01-20 - Multiple Image Upload
**Situation:** Server not receiving multiple images from FormData.
**What worked:** Correct field naming with array notation (`images[]`).
**What didn't work:** Sending multiple files with same field name without brackets.
**Lesson:** For multiple file uploads, use array notation in FormData field names.

---

### 2026-01-21 - Company Ratings SQL Error
**Situation:** `Unknown column 'c.review_count'` in UPDATE query.
**What worked:** Verify column exists before running UPDATE.
**What didn't work:** Assuming column structure from memory.
**Lesson:** Always check actual schema with DESCRIBE before writing UPDATE queries.

---

## Template

### [Date] - [Lesson Title]
**Situation:** [What happened?]
**What worked:** [What went well?]
**What didn't work:** [What failed?]
**Lesson:** [What to do differently next time?]
