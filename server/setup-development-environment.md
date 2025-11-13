---
allowed-tools: Read, Write, Edit, Bash
argument-hint: [environment-type] | --local | --docker | --production
description: Setup Node.js server development environment with ES modules, Fastify, MySQL2, and TypeScript
---

# Setup Server Development Environment

Setup comprehensive Node.js server development environment with ES modules, Fastify, MySQL2, and TypeScript: **$ARGUMENTS**

## Current Environment State

- Operating system: !`uname -s` and architecture detection
- Node.js version: !`node --version 2>/dev/null || echo "Node.js not installed"`
- Package managers: !`which npm yarn pnpm 2>/dev/null | wc -l` managers available
- TypeScript: !`npx tsc --version 2>/dev/null || echo "TypeScript not available"`
- Module system: !`cat package.json 2>/dev/null | grep '"type"' | cut -d'"' -f4 || echo "commonjs"`

## Task

Configure complete server development environment with ES modules, Fastify, MySQL2, and TypeScript:

**Environment Type**: Use $ARGUMENTS to specify local development, Docker setup, or production environment

**Server Setup**:
1. **Runtime Configuration** - ES modules setup (`"type": "module"`), Node.js LTS
2. **Package Management** - npm/yarn/pnpm with module resolution
3. **Framework Setup** - Fastify framework installation and ESM-compatible configuration
4. **Database Integration** - MySQL2 driver setup with ES module imports, connection pooling, migrations
5. **TypeScript Configuration** - TypeScript compiler setup for ES modules, type definitions, strict mode
6. **Build System** - TypeScript compilation with ES module output, development scripts
7. **Testing Framework** - Jest/Vitest setup with ES module support, test database configuration
8. **Code Quality** - ESLint with ES module rules, Prettier, Husky pre-commit hooks
9. **Environment Configuration** - .env files with ES module loading, environment-specific configs
10. **Development Tools** - nodemon for hot reloading, tsx/ts-node for development

**Advanced Features**: API documentation (Fastify Swagger), authentication middleware, error handling, logging with Pino.

**Database Features**: Connection pooling, transactions, migrations with ES module database schema management.

**Automation**: Automated setup scripts, database seeding, development data generation with ES module exports.

**Output**: Complete server environment with API endpoints, database schema, environment configurations, and deployment-ready setup using modern ES modules.
