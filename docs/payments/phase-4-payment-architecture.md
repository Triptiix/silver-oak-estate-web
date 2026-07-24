# Phase 4 Payment and Confirmation Architecture

## Scope and status

Phase 4 provides a Razorpay test-mode foundation for server-created orders,
cryptographic payment verification, signed webhooks, atomic confirmation, and
durable payment recovery. It does not configure production credentials,
automatic refunds, tax handling, cancellation policy, or deployment.

The key safety invariant is:

> A verified payment received after the original hold expires or is released
> never confirms or revives that booking, even when the inventory is free.

The customer must begin a new availability and hold flow after the financial
recovery process is resolved.

## Trust boundaries

- The browser supplies only Razorpay order, payment, and signature identifiers
  returned by Checkout. It never supplies an authoritative amount, currency,
  payment state, or booking state.
- `POST /api/payments/order` resolves the booking from the signed HttpOnly hold
  cookie and reads the advance and currency from PostgreSQL.
- The public Razorpay key ID may reach the browser. The key secret, webhook
  secret, Supabase service-role key, hold token, nonce, internal booking ID,
  fingerprint, and raw gateway payloads must not.
- Browser verification fetches the payment entity from Razorpay server-to-server
  after validating the Checkout signature. Only the provider order/payment ID,
  amount, currency, and financial state are retained.
- Webhooks are authenticated over the exact raw request bytes before JSON is
  trusted. Stored webhook data is a SHA-256 hash and a minimal redacted
  identifier projection, not the raw payload.

## Payment state machine

The repository retains its original names and adds the Phase 4 states:

```text
not_started
  -> order_created
  -> checkout_started
  -> pending / authorized
  -> captured
  -> verified

not_started / order_created / checkout_started / pending
  -> failed or expired

authorized / captured / verified / failed / expired
  -> refund_pending or reconciliation_required

refund_pending / reconciliation_required
  -> partially_refunded or refunded
```

A database trigger rejects unapproved backward or lateral transitions.
`authorized` is not sufficient to confirm a booking; confirmation occurs only
for a captured, cryptographically verified payment.

## Database model

`public.payments` remains the durable attempt ledger. Phase 4 adds:

- provider receipt and attempt expiry;
- order, checkout, authorization, capture, verification, failure, and recovery
  timestamps;
- verification source;
- recovery category and last provider event ID;
- a unique provider receipt;
- one open attempt per booking/provider;
- explicit transition enforcement.

Existing unique provider order and payment indexes prevent identifier reuse.
`public.webhook_events` deduplicates `(provider, provider_event_id)` and stores
only a payload hash plus redacted provider identifiers.

Server-only functions:

- `prepare_payment_order` locks and validates the booking, hold nonce, and
  temporary reservation, then creates or reuses an attempt using the stored
  advance and currency.
- `attach_provider_order`, `mark_payment_checkout_started`, and
  `mark_payment_order_failed` record the server-side order lifecycle.
- `begin_payment_webhook` and `complete_payment_webhook` provide durable receipt
  deduplication.
- `finalize_verified_payment` is the shared browser/webhook finalizer.
- `mark_provider_payment_failed` reconciles signed failure events without
  overwriting financially successful states.

All mutation functions use a fixed `search_path` and grant execution only to
`service_role`.

## Order creation

`POST /api/payments/order`:

1. validates the request origin;
2. verifies the signed, unexpired `soe_booking_hold` cookie;
3. locks and validates the held booking and active temporary reservation;
4. obtains the stored advance and currency;
5. creates or reuses an open payment attempt;
6. creates the Razorpay order server-side;
7. verifies the provider response matches the stored values;
8. returns only the public key ID, provider order ID, booking reference, amount,
   currency, and hold expiry.

The endpoint accepts no price fields, never confirms a booking, is non-cacheable,
and safely reuses an already attached provider order.

## Checkout and browser verification

The client loads Razorpay Checkout only from the approved CSP origin. Public
states distinguish checkout creation, verification, confirmed booking, payment
failure, pending confirmation, hold expiry, and recovery.

`POST /api/payments/verify` validates the Checkout HMAC over the order and
payment IDs. It then fetches the provider payment server-to-server and validates
the stored order association, amount, currency, and captured/authorized state
before calling the shared finalizer. The UI cannot display “Booking confirmed”
until that finalizer returns `confirmed`.

The verification endpoint does not require the hold cookie. This is deliberate:
a genuine payment callback can arrive after the browser has discarded an
expired cookie, and the durable provider order mapping must still preserve the
money as recovery-required. Order creation always requires the cookie.

## Webhook processing

`POST /api/payments/webhook`:

- limits payload size;
- requires an event ID and signature;
- authenticates the exact raw body before parsing;
- stores a payload hash and redacted provider identifiers;
- deduplicates delivered events;
- handles `payment.authorized`, `payment.captured`, `order.paid`, and
  `payment.failed`;
- acknowledges unknown signed events without mutating payment state;
- calls the same finalizer used by browser verification.

Failed internal processing returns a generic retryable response and records only
a bounded error category. No raw payload or customer data is logged or stored.

## Atomic confirmation and race handling

`finalize_verified_payment` locks the payment, booking, and existing reservation.
It confirms only when:

- the provider order and payment identifiers match;
- amount and currency match the stored attempt;
- the payment is captured and cryptographically verified;
- the booking is still `held`;
- the temporary reservation is still `active`;
- its expiry is later than the transaction time.

The transaction converts that exact reservation to `confirmed_booking`, removes
its expiry, marks the booking `confirmed`, records audit events, and writes a
pending `notification_events` outbox row. Phase 4 does not deliver that
notification. It never inserts or reacquires inventory. Repeated browser and
webhook calls return the same safe result without duplicate confirmation events
or outbox rows.

## Recovery and `refund_pending`

If a verified financial success has an amount/currency anomaly, an expired or
released hold, a missing/ineligible reservation, or an internal confirmation
failure, the payment is preserved as `refund_pending`. Confirmation work occurs
inside a PL/pgSQL exception block, so failed confirmation writes roll back to a
savepoint before both the durable recovery update and a pending internal
recovery outbox record are written. Administrator alert delivery is not
implemented in Phase 4.

The booking remains unconfirmed. Released inventory remains released, stale
temporary inventory is expired, and no replacement reservation is created.
Automatic refund execution is intentionally absent.

The same eligibility rule applies to future manually verified UPI or
payment-link payments. A late manual payment requires recovery and cannot revive
the old booking.

## Environment variables

- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: public test key ID (`rzp_test_...`);
- `RAZORPAY_KEY_SECRET`: server-only key secret;
- `PAYMENT_WEBHOOK_SECRET`: server-only webhook HMAC secret;
- `PAYMENT_PROVIDER=razorpay`;
- `PAYMENT_MODE=test`.

The server rejects a non-test key in test mode and rejects live mode outside a
production application environment. Only placeholders are committed.

## Local and test-mode testing

Ordinary Vitest and pgTAP tests use adapters/mocks and never call Razorpay.

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
git diff --check

npm run db:start
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
git diff --exit-code -- src/types/database.types.ts
npm run test:concurrency
npm run db:stop
```

A later controlled integration test may use Razorpay test-mode credentials. It
must never use production credentials or make a real charge.

## Production-readiness blockers and unresolved decisions

- Merchant account ownership and KYC must be finalized.
- Capture configuration and authorized-payment expiry behaviour need an
  operational decision.
- Cancellation and refund eligibility/policy remain unresolved.
- Automatic refund approval, retries, reconciliation ownership, and service
  levels remain unresolved.
- Tax/GST invoice requirements and merchant descriptor/copy remain unresolved.
- Manual UPI/payment-link operator workflow and proof requirements remain
  unresolved.
- Webhook secret rotation and historical-delivery verification need an
  operational runbook.
- Administrator recovery tooling and tested notification delivery remain future
  work.
- Production credentials, hosted webhook configuration, monitoring, and
  deployment are not part of Phase 4.
