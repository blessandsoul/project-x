# Decisions Log

> Track major decisions and their outcomes.

---

## Log

### 2025-11-14 - Platform Architecture
**Context:** Starting new car import comparison platform.
**Options:** Next.js vs Vite+React, Express vs Fastify, PostgreSQL vs MySQL.
**Decision:** React+Vite (client), Fastify (server), MySQL (database).
**Reasoning:** Faster dev iteration with Vite, Fastify performance, MySQL familiarity.
**Outcome:** ✅ Stack working well, deployed to Coolify.

---

### 2025-11-21 - i18n Implementation
**Context:** Need multilingual support for Georgian market.
**Options:** i18next, react-intl, custom solution.
**Decision:** react-i18next with namespace-based keys.
**Reasoning:** Best React integration, community support, namespace organization.
**Outcome:** ✅ Full support for KA, EN, RU implemented.

---

### 2026-01-19 - Static File Serving
**Context:** SPA routing returning 404 on direct URL access.
**Options:** Nginx config, Fastify static plugin, separate static server.
**Decision:** Fastify @fastify/static with SPA fallback.
**Reasoning:** Single server deployment, simpler Coolify config.
**Outcome:** ✅ SPA routing working in production.

---

### 2026-01-21 - Agent System Structure
**Context:** Need AI assistance that maintains context across sessions.
**Options:** Single mega-prompt, file-based memory, external memory service.
**Decision:** File-based Second Brain system with specialized sub-agents.
**Reasoning:** Persistent, version-controlled, no external dependencies.
**Outcome:** 🔄 In progress — building memory infrastructure.

---

## Template

### [Date] - [Decision Title]
**Context:** [What was the situation?]
**Options:** [What were the choices?]
**Decision:** [What was decided?]
**Reasoning:** [Why?]
**Outcome:** [What happened?]
