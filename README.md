# Silver Oak Estate

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Architecture Documentation

Please review the extensive architecture documentation before contributing:
- [System Architecture](docs/architecture/01-system-architecture.md)
- [Project Context](PROJECT_CONTEXT.md)

**Current Implementation Status:** Phase 1 database and administrator authentication foundation.
**IMPORTANT:** Public booking logic, payment integrations, and production deployment are **NOT** implemented. This codebase is not production-ready.

**Next Development Phase:** Phase 1: Database & Auth Foundation (Supabase SQL Migrations & Admin Auth setup).

## Getting Started

### Development Prerequisites
- Node.js (v20.9.0+)
- npm
- Docker Desktop or another Docker-compatible local container runtime
- The project-pinned Supabase CLI (`npm install` installs it as a dev dependency)

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
2. Fill in local-development values only. Never use production Supabase URLs,
   keys, passwords, or service-role credentials on a developer machine.

### Local Supabase Database

Start and inspect the local stack:

```bash
npm run db:start
npm run db:status
```

Replay all migrations from an empty local database and apply `supabase/seed.sql`:

```bash
npm run db:reset
```

Run database lint and pgTAP tests:

```bash
npm run db:lint
npm run db:test
```

Regenerate the checked-in TypeScript schema types from the local database:

```bash
npm run db:types
```

Stop the local stack when finished:

```bash
npm run db:stop
```

All database scripts target the local Supabase stack by default. Do not add
`--linked`, a project ID, a production database URL, or production credentials
to these scripts.

### Migration and Seed Workflow

1. Create a focused, timestamped forward migration under `supabase/migrations/`.
2. Run `npm run db:reset` to replay every migration and the seed from scratch.
3. Run `npm run db:lint` and `npm run db:test`.
4. Run `npm run db:types` whenever the public schema changes.
5. Run `npm run check` and `npm run build` before review.

The seed is repeatable and contains only the confirmed Silver Oak Estate
property, weekday/weekend prices, booking advance, and non-sensitive settings.
It never creates customers, bookings, payments, or administrator credentials.

### Initial Administrator Provisioning

There is no public administrator registration and no administrator password in
the seed. Provision the first administrator manually:

1. Create the Auth user securely with the Supabase Dashboard or trusted admin tooling.
2. Retrieve that Auth user's UUID.
3. Through an authorized server/admin process, insert a matching row in
   `public.admins` with the required role and `is_active = true`.
4. Never store or commit the user's password, session, or service-role key.

For local development, use only the local Supabase Studio and local test users.
Production provisioning requires a separate reviewed and explicitly approved
operational procedure.

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
- Phase 1 includes the database schema, RLS policies, local database tests,
  generated types, and database-backed administrator sign-in/authorization.
- See [Phase 1 Database & Auth](docs/database/phase-1-database-auth.md) for the
  migration inventory, RLS matrix, security model, and deferred scope.

## Available Commands

- **Development Server:** `npm run dev`
- **Production Build:** `npm run build`
- **Start Production Server:** `npm run start`
- **Linting:** `npm run lint`
- **Type Checking:** `npm run typecheck`
- **Run Tests:** `npm run test`
- **Watch Tests:** `npm run test:watch`
- **Run All Checks:** `npm run check` (Runs typecheck, lint, and tests)
- **Start Local Supabase:** `npm run db:start`
- **Reset Local Database:** `npm run db:reset`
- **Lint Local Database:** `npm run db:lint`
- **Test Local Database:** `npm run db:test`
- **Generate Database Types:** `npm run db:types`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
