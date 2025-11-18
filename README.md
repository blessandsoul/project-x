# TrustedImporters.Ge – US Car Import Platform for Georgia

A trusted platform for discovering and comparing car import companies that bring vehicles from the USA to Georgia.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running in Development](#running-in-development)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development & Quality](#development--quality)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

TrustedImporters.Ge is a full-stack demo platform that helps users in Georgia discover and compare car import services from the USA.

The application provides:

- A modern, responsive frontend where users can browse and filter import companies.
- A backend API for user management and VIN decoding, ready to be connected to a real database and production infrastructure.
- Clear separation between frontend and backend so each can be developed and deployed independently.

### Who this platform is for

- **Car buyers in Georgia** who want to import a vehicle from the USA but are unsure which intermediary to trust and how much the total process will really cost.
- **Small and mid-size car import companies** that want to present transparent pricing and win trust by showing clear, comparable offers instead of manual Excel quotes and Telegram messages.
- **Product and engineering teams** who need a realistic, end-to-end example of an aggregator platform (frontend + backend + pricing logic) for learning, prototyping, or internal tools.

### Problems it solves

- **No single place to compare importers.** Today people jump between separate sites, Facebook groups, and Telegram chats; TrustedImporters.Ge aggregates companies and normalizes their pricing model.
- **Hard to understand the real total cost.** The platform brings together auction price, shipping, customs, service and broker fees into a single quote so users see an end-to-end estimate in USD or GEL.
- **Lack of transparency and trust.** Ratings, reviews, VIP badges and clear fee breakdowns help distinguish serious, reliable companies from one-person operations with no history.
- **Confusing vehicle and VIN data.** Integrated VIN decoding and auction vehicle search turn raw VIN codes and lot numbers into structured, human-readable data.
- **Slow, manual communication.** Instead of waiting for a manager to “calculate and call back”, users can quickly shortlist companies and vehicles, save favorites, and come back later with preserved filters.

## Key Features

- **Company search & catalog** – Filter import companies by geography, services, price range, rating, and VIP status.
- **Company profiles** – Detailed pages with services, contact information, ratings, and other metadata.
- **VIN decoding** – Integration with the NHTSA VPIC API to decode Vehicle Identification Numbers and show structured vehicle data.
- **User accounts** – Registration, login, profile management, and secure JWT-based authentication.
- **Mock data friendly** – Frontend is driven by mock data (via `@faker-js/faker`) and can be wired to real APIs later.
- **Responsive UI & accessibility** – Layout optimized for desktop and mobile with attention to accessibility best practices.

## Tech Stack

### Frontend

- React + TypeScript + Vite
- Tailwind CSS (v4) for styling
- shadcn/ui and Radix primitives for reusable, accessible components
- React Router for client-side routing
- `@faker-js/faker` for realistic mock data

### Backend

- Fastify (Node.js) for the HTTP API
- MySQL2 for database connectivity
- JWT-based authentication for protected endpoints
- VIN decoding service integrating the NHTSA VPIC API

### Tooling

- TypeScript across client and server
- ESLint for static analysis
- Testing Library & Jest DOM (ready for UI tests)

## Architecture

The project is organized as a simple full-stack monorepo:

```text
[Browser SPA]
    ↓
[client (React + Vite)]
    ↓              ↘
[Fastify API (server)] → [MySQL]
          ↘
           [NHTSA VPIC VIN API]
```

- `client/` contains the React single-page application.
- `server/` contains the Fastify backend that exposes RESTful APIs for user management and VIN decoding.
- Communication between client and server is done over HTTP (JSON), making it straightforward to deploy independently or behind a reverse proxy.

## Getting Started

### Prerequisites

- Node.js **v20+**
- npm (comes with Node.js)
- Running MySQL instance (for a fully wired backend)

### Installation

Clone the repository and install dependencies for both client and server:

```bash
# Clone the repository
git clone <your-repo-url> projectx
cd projectx

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

Before running the backend in a real environment, configure the required environment variables for:

- Database connection (host, port, user, password, database name)
- JWT secret and any other security-related values

Use values that match your local or production setup.

### Running in Development

From the repository root on Windows, you can use the helper script:

```bash
start-dev.bat
```

This script is intended to start both the client and the server in development mode.

Alternatively, you can run client and server separately:

```bash
# Start the backend API
cd server
npm run dev

# In a separate terminal, start the frontend
cd client
npm run dev
```

By default, the services run on:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## API Documentation

This repository contains detailed API documentation in separate Markdown files.

- **User API** – Authentication, registration, profile management, and account deletion.
  - File: `USER_API_DOCUMENTATION.md`
- **VIN API** – VIN decoding and service health checks.
  - File: `VIN_API_DOCUMENTATION.md`

Each document includes request/response schemas, error codes, and curl examples to make integration straightforward.

## Project Structure

High-level structure:

```text
projectx/
├─ client/                  # React + TypeScript + Vite frontend
│  ├─ src/                  # Application source code
│  ├─ public/               # Static assets
│  └─ README.md             # Vite template README (frontend-specific)
│
├─ server/                  # Fastify backend
│  ├─ src/                  # Server source (routes, handlers, services)
│  └─ package.json          # Backend scripts and dependencies
│
├─ USER_API_DOCUMENTATION.md
├─ VIN_API_DOCUMENTATION.md
├─ CHANGELOG.md             # High-level change log
├─ fx-handoff.md            # Agent hand-off history
├─ start-dev.bat            # Convenience script to start dev services
└─ README.md                # This file (root project overview)
```

## Development & Quality

### Linting

The frontend is configured with ESLint.

```bash
cd client
npm run lint
```

### Type Checking

The backend uses TypeScript and includes a type-check script:

```bash
cd server
npm run type-check
```

You can also run `npm run build` in both `client/` and `server/` to ensure production builds succeed before deploying.

## Screenshots

You can add screenshots or GIFs of key flows here, for example:

- Home page with search and key benefits
- Company catalog with filters
- Company profile page
- VIN decoding workflow

When adding images, store them in the repository (e.g., under `docs/` or `client/public/`) and reference them here with meaningful alt text, for example:

```md
![Search page showing filters for car import companies](./docs/screenshots/search-page.png)
```

## Roadmap

Planned improvements and next steps:

- Replace frontend mock data with real API responses from the Fastify backend.
- Implement full CRUD and admin flows for managing import companies.
- Add authentication flows to the UI (login, registration, profile management).
- Add deployment configuration (Docker, CI/CD pipeline, production-ready configs).
- Extend analytics and logging for better observability in production.

## License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this code in accordance with the terms of the MIT license.
