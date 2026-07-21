# Phase 1 Database and Administrator Authentication

## Scope

Phase 1 establishes the local Supabase project, launch-critical PostgreSQL
schema, authoritative inventory protection, RLS, administrator membership,
minimal email/password administrator sign-in, generated database types, and
automated tests.

It does not implement public availability, booking holds, booking checkout,
Razorpay, payment routes or webhooks, calendar feeds, OTA/PMS synchronization,
refund workflows, final booking-management UI, or production deployment.

## Local Prerequisites and Safety

- Node.js 20.9 or newer and npm
- Docker Desktop or a Docker-compatible runtime
- Project-pinned Supabase CLI installed by `npm install`

Use `npm run db:start`, `npm run db:reset`, `npm run db:lint`,
`npm run db:test`, and `npm run db:types`. These scripts target only the local
stack. Never add `--linked`, a hosted project reference, or production
credentials to them.

## Migration Inventory

| Migration | Responsibility |
| --- | --- |
| `20260721090000_extensions_and_enums.sql` | `pgcrypto`, `btree_gist`, and approved enums |
| `20260721090100_core_property_customer_admin.sql` | Properties, customers, and Auth-linked administrators |
| `20260721090200_booking_reservation_pricing.sql` | Bookings, authoritative reservations, and pricing rules |
| `20260721090300_payments_events_settings.sql` | Payment ledger foundation, audit/event tables, and settings |
| `20260721090400_functions_constraints_indexes.sql` | Updated-at trigger, admin helpers, exclusion constraint, and indexes |
| `20260721090500_row_level_security.sql` | Explicit grants, RLS enablement, and policies |

Dependency order is properties/customers/admins, then bookings, then inventory
and pricing, then payments/events/settings. Migrations are forward-only and
replay from an empty local database.

## Tables and Key Constraints

| Table | Purpose | Important enforcement |
| --- | --- | --- |
| `properties` | Complete-property configuration | Active flag, maximum 30 event and 8 overnight guests |
| `customers` | Private CRM record | Nonblank name and phone; indexed lookup without assuming one global format |
| `admins` | Auth user to application-role mapping | Unique Auth UUID, active flag, `admin_role` enum |
| `bookings` | Booking intent and customer snapshots | Capacity, time ordering, integer-paise arithmetic, distinct reference/token |
| `inventory_reservations` | Sole inventory blocking authority | Active `[)` GiST exclusion constraint per property |
| `pricing_rules` | Weekday, weekend, and future special-date rules | Valid dates and nonnegative integer-paise amounts |
| `payments` | Provider-neutral ledger foundation | Idempotency and partial provider identifier uniqueness |
| `webhook_events` | Redacted webhook receipt log | Provider event uniqueness; no required raw payload |
| `booking_events` | Booking audit events | Append-oriented metadata records |
| `notification_events` | Delivery audit events | Hashed/masked recipients and nonnegative attempts |
| `site_settings` | Private typed JSON configuration | Unique key and sensitivity marker |

`btree_gist` supplies GiST equality support for UUID property IDs. The partial
exclusion constraint compares `property_id` with equality and
`tstzrange(start_at, end_at, '[)')` with overlap, only where status is active.
Consecutive reservations are therefore allowed. `expires_at` is deliberately
absent from the predicate: an expired timestamp still blocks until trusted
server logic explicitly changes the status.

All money uses integer paise. Instants use `timestamptz`; business dates and
wall-clock check-in/out values use `date` and `time`.

Pricing resolution is: applicable active rules, highest priority first, then a
special-date rule before a general weekday/weekend rule on a tie. Business-day
classification uses Asia/Kolkata.

## Row Level Security Matrix

RLS is enabled on every application table. The service role is reserved for
trusted server-only code and never enters browser bundles.

| Entity | Anonymous | Authenticated non-admin | Active operations | Active admin/super-admin | Service role |
| --- | --- | --- | --- | --- | --- |
| Active safe properties | Read | Denied | Read | Read | Read/write |
| Inactive properties | Denied | Denied | Read | Read/write | Read/write |
| Own `admins` membership | Denied | Empty unless membership exists | Read own | Read own; super-admin reads all | Read/write |
| Admin membership management | Denied | Denied | Denied | Super-admin only | Read/write |
| Customers | Denied | Denied | Read/insert/update | Read/insert/update | Read/write |
| Bookings | Denied | Denied | Read | Read | Read/write |
| Inventory reservations | Denied | Denied | Read | Read | Read/write |
| Pricing rules | Denied | Denied | Read | Admin/super-admin insert/update | Read/write |
| Payment status columns | Denied | Denied | Limited-column read | Limited-column read | Read/write |
| Webhook/booking/notification events | Denied | Denied | Read | Read | Read/write |
| Site settings | Denied | Denied | Read | Admin/super-admin insert/update | Read/write |

No private table has a permissive `USING (true)` policy. Booking, reservation,
payment, and event mutations remain server-only in Phase 1. No authenticated
user gains operational access merely by having a valid Supabase session.

## Database Authorization Helpers

`is_active_admin()` and `has_admin_role(admin_role[])` derive identity only from
`auth.uid()`. Both are `SECURITY DEFINER`, have the fixed
`search_path = pg_catalog`, schema-qualify referenced objects, revoke execution
from `public` and `anon`, and grant execution only to `authenticated` and
`service_role`. The browser cannot provide an arbitrary user ID.

A single invoker trigger function maintains `updated_at` on mutable tables.
Append-oriented event tables do not receive that trigger.

## Application Authorization Flow

1. Proxy refreshes/validates the Supabase session and redirects unauthenticated
   protected requests to `/admin/login`.
2. The protected administrator layout calls `requireAdmin()` on the server.
3. `requireAdmin()` calls Supabase `getUser()` and queries the caller-visible,
   active `admins` membership row under RLS.
4. Missing or inactive membership is denied even when the Auth session exists.
5. `requireAdminRole()` applies narrower application-role checks when needed.

The login action accepts email/password, uses a generic safe failure message,
checks active membership after sign-in, clears an unauthorized session, and
redirects an authorized administrator to `/admin/dashboard`. No registration
route or link exists. Logout calls Supabase `signOut()` on the server.

## Seed Data

`supabase/seed.sql` is repeatable and includes only:

- Silver Oak Estate, Asia/Kolkata, 11:00 check-in and 10:00 checkout
- 60-minute cleaning buffer, 30 event guests, 8 overnight guests
- Weekday price 1,500,000 paise and weekend price 2,000,000 paise
- Advance 500,000 paise
- Hold settings 10 and 30 minutes, INR, and confirmed capacities

It does not contain an administrator, password, customer, booking, payment,
fake availability, public-holiday price, or unresolved policy.

## Initial Administrator Provisioning

1. Securely create the Supabase Auth user through trusted Dashboard/admin tooling.
2. Retrieve the Auth user UUID.
3. Insert the matching `public.admins` row through an authorized server/admin process.
4. Assign only the required role and keep `is_active = true` only while access is needed.

Never place passwords or service-role keys in SQL, source control, logs, or the seed.

## Verification

```bash
npm run db:start
npm run db:status
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
```

The pgTAP suites cover overlap concurrency enforcement, half-open boundaries,
released/stale holds, booking and pricing checks, RLS roles, administrator
helpers, privilege boundaries, and safe function configuration. Application
tests cover the login UI, lack of registration, Proxy redirect, membership and
role decisions, logout, public smoke routes, and server-only import boundaries.

## Architecture Clarifications

- Phase 1 uses `gen_random_uuid()` with `pgcrypto`; the older conceptual
  `uuid_generate_v4()` reference is not implemented and `uuid-ossp` is not enabled.
- A stale active hold remains authoritative until its status changes. The Phase
  2 transactional stale-hold cleanup and public hold API are intentionally absent.
- Proxy session presence is necessary but not sufficient; database membership
  is the source of administrator authorization.

## Deferred to Phase 2 and Later

Public availability, pricing calculation APIs, transactional hold creation and
cleanup, customer booking forms, checkout, Razorpay, payment finalization and
webhooks, refunds, iCal/OTA/PMS, notifications, operational booking-management
screens, and production deployment remain deferred.
