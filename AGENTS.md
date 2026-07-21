# Silver Oak Estate Agent Guide

## Project

Silver Oak Estate is a premium farmhouse booking website for one complete
3 BHK property in Sector 135, Noida.

The project uses:

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
- docs/architecture/09-deployment-plan.md
- docs/architecture/10-implementation-sequence.md
- docs/architecture/14-testing-strategy.md

## Mandatory business rules

- Inventory is one complete property.
- Do not support separate room bookings.
- Maximum event capacity is 30.
- Maximum overnight capacity is 8.
- Check-in is 11:00 AM Asia/Kolkata.
- Checkout is 10:00 AM Asia/Kolkata the following day.
- Monday–Friday price is 1,500,000 paise.
- Saturday–Sunday price is 2,000,000 paise.
- Booking advance is 500,000 paise.
- Public-holiday pricing is deferred.
- Store timestamps as timestamptz.
- Store money as integer paise.
- All inventory blocking uses inventory_reservations.
- Overlapping active reservations must be rejected by PostgreSQL.
- Never trust browser-calculated prices.
- Never expose customer PII publicly.
- Never expose the Supabase service-role key.
- No public admin registration.
- Do not invent unresolved business policies.

## Development rules

- Inspect existing code before editing.
- Do not modify unrelated files.
- Do not push directly to main.
- Do not apply migrations to production without explicit approval.
- Prefer forward corrective migrations.
- Every migration must replay from a clean database.
- Do not edit an already-applied production migration.
- Use least-privilege RLS.
- Use server-side authorization for admin operations.
- Stop after the requested phase.

## Required checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
```
