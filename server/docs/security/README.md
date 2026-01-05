# Security Documentation

This directory contains security-related documentation for the Project-X backend API.

## Documents

| Document                                                     | Description                                              |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| [SQL_INJECTION_PREVENTION.md](./SQL_INJECTION_PREVENTION.md) | Comprehensive guide to SQL injection prevention measures |

## Security Overview

The Project-X backend implements multiple security layers:

### Input Validation

- **PreValidation hooks** - Early rejection of malicious input
- **JSON Schema validation** - Strict type checking via Fastify/AJV
- **Zod schemas** - Runtime validation for complex queries
- **Whitelist validation** - Enum parameters only accept predefined values

### Authentication & Authorization

- **JWT tokens** - Stateless authentication
- **Role-based access control** - User, Dealer, Company, Admin roles
- **Route-level authorization** - `preHandler` hooks for protected routes

### Rate Limiting

- **Global rate limiting** - 300 requests per minute per IP
- **Login rate limiting** - 10 attempts per 5 minutes
- **Per-route limits** - Configurable limits for sensitive endpoints

### Error Handling

- **Error masking** - Database errors never expose internal details
- **Structured responses** - Consistent error format with codes
- **Security logging** - All security events logged for monitoring

### HTTP Security Headers

- **Helmet.js** - Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** - Configurable cross-origin resource sharing
- **Cookie security** - HttpOnly, Secure, SameSite attributes

## Security Testing

### OWASP ZAP

Run OWASP ZAP Active Scan to test for vulnerabilities:

```bash
# Disable rate limiting for testing (set high limits)
# Run ZAP against http://localhost:3000
# Check for High/Critical alerts
```

### Manual Testing

```bash
# Test SQL injection
curl "http://localhost:3000/companies/10%27"

# Test path traversal
curl "http://localhost:3000/companies/../admin"

# Test XSS (if applicable)
curl "http://localhost:3000/search?q=<script>alert(1)</script>"
```

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do not** open a public GitHub issue
2. Email the security team directly
3. Include detailed reproduction steps
4. Allow time for a fix before public disclosure

## Compliance

This API is designed with the following security standards in mind:

- **OWASP Top 10** - Protection against common web vulnerabilities
- **PCI DSS** - Secure handling of payment-related data
- **GDPR** - Data protection and privacy compliance

---

_Last updated: 2025-12-10_
