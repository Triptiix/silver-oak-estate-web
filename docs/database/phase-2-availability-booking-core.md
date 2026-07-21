# Phase 2 Availability and Booking-Hold Core

## Scope

Phase 2 adds local-only public availability and temporary one-night booking
holds. It does not add payment, confirmation after payment, OTA/PMS/iCal,
operational booking screens, production cron configuration, deployment, or
production database access.

## Migrations and Schema

`20260721170000_booking_date_pricing_availability.sql` adds documented nullable
hold request, token nonce, and fingerprint hash columns to `bookings`, a unique
idempotency constraint, and focused hold/date/expiry indexes. It also replaces
the Phase 1 expiry-versus-arrival check: hold expiry is an acquisition deadline,
not an inventory-start timestamp.

`20260721170100_booking_hold_lifecycle.sql` adds stale cleanup, atomic hold
creation, and idempotent release. Existing Phase 1 migrations are unchanged.

## Booking Date and Pricing Model

`resolve_booking_dates` combines a business `date` with property wall-clock
times and `Asia/Kolkata`; it does not parse UTC midnight in the browser. The
one-night interval is 11:00 on arrival through 10:00 the following date.

`resolve_booking_price` selects active/effective rules by descending priority,
then gives `special_date` precedence on a tie. Monday-Friday resolves to
1,500,000 paise and Saturday-Sunday to 2,000,000 paise from seeded rules. The
500,000-paise advance and balance are calculated in PostgreSQL. Public holiday
rules remain unseeded and deferred.

## Availability

`get_monthly_availability` is service-only and returns the property slug, month,
timezone, wall-clock times, generation timestamp, and daily availability/price
fields. It exposes no IDs, reservation classifications, block reasons, customer
data, fingerprints, or administrative data. Active authoritative reservations
block `[)` ranges. Stale temporary holds are shown available, but remain
database-blocking until trusted cleanup updates their status. The API is always
`no-store`.

## Hold Lifecycle and Concurrency

`create_booking_hold` resolves the active property, dates, capacities, stale
holds, price, customer, snapshots, reference, opaque confirmation token,
booking, inventory row, and audit events in one transaction. The exclusion
constraint is the final race control. A caught exclusion violation rolls back
all partial state and becomes `date_unavailable`.

`hold_request_id` makes exact retries return the existing valid hold without
new rows or events. A mismatched or terminal request ID is rejected. A live hold
with the same server HMAC fingerprint or normalized phone must be released or
expire before another can be created; this maps to HTTP 429.

Cleanup locks stale rows, expires only active `temporary_hold` reservations,
expires associated `held` bookings, and writes one audit event per transition.
Release changes an unpaid temporary reservation to `released`, uses terminal
booking state `expired`, records an event, and is idempotent. Confirmed, manual,
OTA, owner, and maintenance reservations are not releasable through this path.

## Token, Turnstile, and Privacy

The `soe_booking_hold` cookie contains an HMAC-SHA256 signed, base64url payload
with only version, booking ID, nonce, and expiry. The database stores the nonce,
not the signed token. Verification uses constant-time signature comparison.
The cookie is HttpOnly, SameSite=Lax, production-Secure, scoped to booking APIs,
and expires with the hold.

Hold creation verifies Turnstile server-side with a five-second timeout. Local
work uses official provider test credentials; there is no environment bypass.
The fingerprint is an HMAC over trusted proxy address metadata plus normalized
phone. Only the non-reversible digest is stored; raw IP addresses and raw
fingerprint material are not persisted or returned.

## API Contracts and Errors

- `GET /api/availability`: `400` invalid month, `404` inactive/missing property, generic `500`.
- `POST /api/bookings/hold`: `201` created, `200` exact retry, `400` validation, `403` origin/Turnstile, `409` inventory/idempotency, `429` active-hold limit.
- `POST /api/bookings/release`: verifies and clears the hold cookie; returns no PII.
- `POST /api/internal/cron/expire-holds`: constant-time bearer-secret check and safe count only.

Shared browser contracts contain only public request/response fields. Internal
booking IDs, customer IDs, confirmation tokens, nonce, signed cookie, reservation
ID, credentials, and provider details are excluded from hold responses.

## Database Privileges

All six Phase 2 functions are `SECURITY DEFINER` with
`search_path = pg_catalog`, schema-qualified objects, revoked default/public
execution, and `service_role`-only execution. Anonymous and ordinary
authenticated roles retain no direct booking, inventory, or function path.
RLS is not weakened.

## Local Verification

```bash
npm run db:start
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
npm run test:concurrency
npm run check
npm run build
npm run db:stop
```

The concurrency harness runs three simultaneous same-date races and requires
one winner each, then requires two non-overlapping concurrent holds to both
succeed. It also checks reservation, booking, and event counts for partial-state
regressions. It accepts only the loopback local Supabase URL.

## Known Limitations and Deferred Work

The public pages are intentionally restrained integration proofs. Availability
has no final calendar design. Holds do not take payment and are never presented
as confirmed. Payment orders, verification, webhooks, refund/reconciliation,
confirmation, production cleanup scheduling, OTA/PMS/iCal, and operational
booking management remain deferred to later approved phases.
