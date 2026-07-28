# Silver Oak Estate — Codex Agent Guide

## Project

Silver Oak Estate is a premium farmhouse booking website for one complete
3 BHK property in Sector 135, Noida.

Technology:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL and Auth
- Vercel
- Razorpay test-mode booking/payment architecture implemented behind an explicit disabled-by-default capability gate; hosted provider configuration and rehearsal remain pending

## Read before editing

- PROJECT_CONTEXT.md
- README.md
- docs/architecture/01-system-architecture.md
- docs/architecture/02-launch-scope.md
- docs/architecture/03-database-blueprint.md
- docs/architecture/04-booking-state-machine.md
- docs/architecture/05-api-boundaries.md
- docs/architecture/06-security-model.md
- docs/architecture/07-payment-architecture.md
- docs/architecture/08-calendar-and-ota-strategy.md
- docs/architecture/09-deployment-plan.md
- docs/architecture/10-implementation-sequence.md
- docs/architecture/11-risk-register.md
- docs/architecture/12-open-decisions.md
- docs/architecture/13-environment-variables.md
- docs/architecture/14-testing-strategy.md
- docs/deployment/phase-6-production-readiness.md

## Mandatory business rules

- Inventory is one complete property.
- Never support independent room bookings.
- Standard daytime events support up to 40 people.
- Indoor gatherings support up to 20 people.
- Overnight stays support up to 10 guests.
- Events above 40 people require prior written approval after an operational and safety review and must not enter the standard self-service booking flow.
- Check-in is 11:00 AM Asia/Kolkata.
- Checkout is 10:00 AM Asia/Kolkata the following day.
- Monday–Friday price is 1,500,000 paise.
- Saturday–Sunday price is 2,000,000 paise.
- Booking advance is 500,000 paise.
- Public-holiday pricing is deferred.
- Store timestamps as timestamptz.
- Store monetary amounts as integer paise.
- All inventory blocking uses inventory_reservations.
- PostgreSQL must reject overlapping active reservations.
- Never trust browser-calculated prices.
- Never expose customer PII publicly.
- Never expose Supabase service-role credentials.
- No public administrator registration.
- Do not invent unresolved policies, contracting authority, tax status or merchant ownership.
- Varun Yadav owns the property; Arpit Chaudhary manages operations. Neither fact resolves the legal contracting, invoicing or merchant entity.

## Current hosted boundary

- Hosted schema migrations are present through the public monthly-availability RPC grant.
- Hosted canonical property/pricing launch data and administrator membership are not present.
- `/availability` may show the read-only calendar with assisted date requests while online checkout is disabled.
- `/book`, hold creation and payment-order creation remain behind `ONLINE_BOOKING_ENABLED` and the full capability configuration.
- Never apply seed data, migrations, create administrators, change Vercel settings, enable payments or connect domains without explicit target-specific approval.

## Working method

1. Inspect existing files before editing.
2. Present an implementation plan before high-risk changes.
3. Implement only the requested phase.
4. Apply migrations in dependency order.
5. Replay migrations from a clean local database.
6. Run tests and inspect the complete diff.
7. Report assumptions rather than inventing business rules.
8. Stop when the requested phase is complete.

## Migration rules

- Use gen_random_uuid() with pgcrypto.
- Use btree_gist for inventory overlap protection.
- Use timestamptz for instants.
- Use date or time only for business dates and wall-clock values.
- Never edit a migration already applied to production.
- Prefer forward corrective migrations.
- Set safe search_path values on SECURITY DEFINER functions.
- Revoke unnecessary function execution privileges.
- Never target production automatically.

## Git rules

- Work only on the current feature branch.
- Never push directly to main.
- Never rewrite Git history.
- Do not commit credentials, tokens, passwords or .env.local.
- Do not modify unrelated files.

## Required commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
npm run test:concurrency
npm run check
```

For launch-readiness work, also run the relevant profile:

```bash
npm run preflight:production -- --profile=core
npm run preflight:production -- --profile=booking-test
npm run preflight:production -- --profile=email
npm run preflight:production -- --profile=production-live
```
