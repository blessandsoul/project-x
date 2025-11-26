# Health API

Provides application and database health check endpoints for monitoring and deployment systems.

Routes defined in: `src/routes/health.ts`

---

## GET `/health`

**Description**

Comprehensive health check that verifies:

- App uptime and memory usage
- Database connectivity
- Redis cache connectivity (optional)
- VIN decoder service health

**Method:** `GET`

**Request:**

- No query/body required.

**Response 200 (all services healthy)**

```jsonc
{
  "status": "ok", // or "degraded" if any critical service unhealthy
  "timestamp": "2025-01-01T12:34:56.789Z",
  "uptime": 1234.567, // process uptime in seconds
  "memory": {
    "heapUsed": "45 MB",
    "heapTotal": "65 MB",
    "rss": "95 MB"
  },
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 1733168762930
    },
    "redis": {
      "status": "healthy" // or "disabled" if Redis not configured
    },
    "vinDecoder": {
      "status": "healthy",
      "responseTime": 120, // ms (approx)
      "error": null
    }
  }
}
```

**Response 503 (one or more critical services unhealthy)**

```jsonc
{
  "status": "degraded",
  "timestamp": "2025-01-01T12:34:56.789Z",
  "uptime": 1234.567,
  "memory": {
    "heapUsed": "45 MB",
    "heapTotal": "65 MB",
    "rss": "95 MB"
  },
  "services": {
    "database": {
      "status": "unhealthy",
      "error": "Database connection failed"
    },
    "redis": {
      "status": "unhealthy",
      "error": "Redis check failed"
    },
    "vinDecoder": {
      "status": "unhealthy",
      "error": "VIN service check failed"
    }
  }
}
```

**Notes**

- Redis is optional; its failure does not mark the overall status as "degraded".
- Database and VIN decoder failures will mark status as "degraded".
- Memory metrics help identify memory leaks or high usage.

---

## GET `/health/db`

**Description**

Simple database connectivity health check.

**Method:** `GET`

**Request:**

- No query/body required.

**Response 200**

```jsonc
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-01T12:34:56.789Z"
}
```

**Response 500**

```jsonc
{
  "status": "error",
  "database": "disconnected",
  "error": "Database connection failed",
  "timestamp": "2025-01-01T12:34:56.789Z"
}
```

**Notes**

- This is the quickest endpoint for DB-only health checks.
- `/health` should be used when you need to verify external dependencies too (VIN API).
