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
- Razorpay planned for a later phase

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

## Mandatory business rules

- Inventory is one complete property.
- Never support independent room bookings.
- Maximum event capacity is 30.
- Maximum overnight capacity is 8.
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
- Do not invent unresolved policies.

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
npm run check
```
