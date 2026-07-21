# Silver Oak Estate

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Architecture Documentation

Please review the extensive architecture documentation before contributing:
- [System Architecture](docs/architecture/01-system-architecture.md)
- [Project Context](PROJECT_CONTEXT.md)

**Current Implementation Status:** Foundation Phase.
**IMPORTANT:** Booking logic, payment integrations, and production database migrations are **NOT** implemented yet. This codebase is not production-ready.

**Next Development Phase:** Phase 1: Database & Auth Foundation (Supabase SQL Migrations & Admin Auth setup).

## Getting Started

### Development Prerequisites
- Node.js (v20.9.0+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
```bash
npm install
```

### Environment Setup
1. Copy the example environment variables:
```bash
cp .env.example .env
```
2. Fill in the required local development variables (contact the team lead for test credentials).

### Folder Structure
- `src/app`: Next.js App Router (Public marketing routes and Admin dashboard foundation)
- `src/components`: UI components, shared layouts, and domain-specific components
- `src/lib`: Utilities, environment validation (client/server boundaries), and Supabase configurations
- `src/config`: Application configurations and constants
- `test`: Vitest setup and unit tests
- `docs/architecture`: Complete technical blueprint

### Supabase Setup Status
- Foundational clients (browser, server, service-role) are created in `src/lib/supabase`.
- The Next.js middleware is configured for session refreshing and basic admin route protection.
- *Pending:* Admin table creation, Row Level Security (RLS) policies, and actual authentication flow.

## Available Commands

- **Development Server:** `npm run dev`
- **Production Build:** `npm run build`
- **Start Production Server:** `npm run start`
- **Linting:** `npm run lint`
- **Type Checking:** `npm run typecheck`
- **Run Tests:** `npm run test`
- **Watch Tests:** `npm run test:watch`
- **Run All Checks:** `npm run check` (Runs typecheck, lint, and tests)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
