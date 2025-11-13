# Fastify Server with MySQL2 and TypeScript

A modern Node.js server built with Fastify, MySQL2, and TypeScript using ES modules.

## Features

- 🚀 **Fastify** - High-performance web framework
- 🗄️ **MySQL2** - Fast MySQL driver with connection pooling
- 📘 **TypeScript** - Full type safety with strict configuration
- 📦 **ES Modules** - Modern JavaScript module system
- 🔄 **Hot Reload** - Development with automatic restart
- 🏥 **Health Checks** - Built-in health monitoring endpoints

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Create your MySQL database:
```sql
CREATE DATABASE myapp;
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will be available at `http://localhost:3000`

## Building for Production

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## API Endpoints

- `GET /health` - General health check
- `GET /health/db` - Database connection health check

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run clean` - Remove build artifacts
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `DB_HOST` | localhost | MySQL host |
| `DB_PORT` | 3306 | MySQL port |
| `DB_USER` | root | MySQL username |
| `DB_PASSWORD` | (empty) | MySQL password |
| `DB_NAME` | myapp | MySQL database name |
| `DB_CONNECTION_LIMIT` | 10 | Connection pool limit |

## Project Structure

```
src/
├── config/
│   └── database.ts    # MySQL connection configuration
├── routes/
│   └── health.ts      # Health check routes
└── server.ts          # Main server file
```

## Development Tips

- The server uses ES modules, so all imports must include file extensions
- TypeScript is configured with strict mode for maximum type safety
- The database connection pool automatically handles connection management
- Health checks are available to monitor server and database status
