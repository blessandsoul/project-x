# Security Protocol

## Never Do

❌ Hardcode passwords, API keys, or secrets
❌ Trust user input without validation
❌ Use eval() or similar dangerous functions
❌ Expose sensitive data in logs
❌ Ignore authentication/authorization

## Always Do

✅ Use environment variables for secrets
✅ Validate and sanitize all inputs
✅ Use parameterized queries (prevent SQL injection)
✅ Implement proper authentication
✅ Follow principle of least privilege

## Input Validation

```javascript
// BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD
const query = `SELECT * FROM users WHERE id = ?`;
db.execute(query, [userId]);
```

## Secret Management

```javascript
// BAD
const apiKey = "sk-1234567890";

// GOOD
const apiKey = process.env.API_KEY;
```

## Common Vulnerabilities to Prevent

1. **SQL Injection** — Use parameterized queries
2. **XSS** — Escape output, use CSP
3. **CSRF** — Use tokens
4. **Auth Bypass** — Validate on every request
