# Phase 5A Admin Booking and Payment Operations

## Scope

Phase 5A adds authenticated, read-only operational visibility over bookings,
inventory reservations, payment attempts, recovery states, booking audit
events, webhook linkage, and notification-outbox records.

It does not implement cancellation, refunds, reconciliation actions, manual
confirmation, payment overrides, notification delivery, live Razorpay,
production credentials, hosted webhooks, or deployment.

## Authorization and data flow

Every page is under the protected administrator layout and also requires one
of `operations`, `admin`, or `super_admin` on the server. Every `/api/admin/*`
GET route independently verifies the authenticated Supabase user and matching
active `public.admins` membership before accessing data.

After authorization, a server-only module uses the existing service-role client
with explicit column projections. Privileged tables are never queried from the
browser. API responses are non-cacheable, use generic errors, and expose no
mutation methods.

## PII exposure matrix

| Data | List | Detail | API | Notes |
| --- | --- | --- | --- | --- |
| Booking reference | Full | Full | Full | Public operational identifier used in URLs |
| Customer name | Masked | Masked | Masked | Search runs only on the server |
| Customer email | Masked | Masked | Masked | Domain retained for diagnosis |
| Customer phone | Last four digits | Last four digits | Last four digits | Full value never leaves server data access |
| Provider order/payment IDs | Operational views | Operational views | Operational views | Required for payment diagnosis |
| Hold nonce | Never | Never | Never | Not selected |
| Request fingerprint | Never | Never | Never | Not selected |
| Public confirmation token | Never | Never | Never | Not selected |
| Webhook raw body/signature/hash | Never | Never | Never | Not selected |
| Service-role or provider secrets | Never | Never | Never | Server-only configuration |

## Read-only recovery invariant

The recovery queue contains only `refund_pending` and
`reconciliation_required` attempts. It links to the booking detail timeline for
context, but provides no POST, PUT, PATCH, DELETE, server action, or button that
can change payment, booking, or reservation state.

The Phase 4 no-revival invariant remains unchanged.

## Notification terminology

- `pending`: queued; delivery is not implemented in Phase 5A;
- `sent`: delivered according to the persisted provider result;
- `failed`: a delivery attempt failed.

An outbox row alone is never presented as proof of delivery.
