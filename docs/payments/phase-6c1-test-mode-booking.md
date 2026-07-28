# Phase 6C.1 Test-Mode Booking and Razorpay

## Scope

Phase 6C.1 uses the existing Supabase booking and payment lifecycle for a
Razorpay **Test Mode** rehearsal only. It creates no database migration, makes
no hosted configuration change, and does not accept real payments. Production
remains assisted-only: the capability is disabled whenever `APP_ENV=production`.

## Request flow

1. Availability returns database-owned dates, price and advance information.
2. `POST /api/bookings/hold` validates and normalizes booking details, creates a
   server request fingerprint and nonce, and calls `create_booking_hold`.
3. The route returns safe hold data and stores an expiry-bound HMAC-signed
   HttpOnly cookie. The token contains no customer data.
4. `POST /api/payments/order` verifies that cookie, calls
   `prepare_payment_order`, creates or reuses the Razorpay test order, attaches
   it with `attach_provider_order`, and records `mark_payment_checkout_started`.
   Combining the idempotent checkout-start transition with order preparation
   avoids an extra public mutation endpoint while preserving observability.
5. Checkout returns only the test key ID, provider order ID and database-owned
   checkout values. The browser never provides the authoritative amount,
   currency or booking state.
6. Browser verification verifies Razorpay's checkout signature, fetches the
   payment server-to-server, and calls `finalize_verified_payment` only after
   order, amount, currency and payment status match.
7. The webhook verifies the exact raw body before parsing, records a SHA-256
   hash plus redacted identifiers through `begin_payment_webhook`, and uses the
   same finalizer or `mark_provider_payment_failed`. It completes its durable
   receipt with `complete_payment_webhook`.

## Idempotency and recovery

Holds use a server-generated request ID and nonce. Payment preparation reuses
the open attempt and attached provider order. Webhook receipts deduplicate
provider event IDs, while the database finalizer locks the payment, booking and
inventory reservation. A late or released hold is never revived: a verified
financial success becomes recovery-required/refund-pending for human handling.
No automatic refund or notification delivery exists.

## Test-mode configuration

All values are configured only in the intended staging environment:

- `ONLINE_BOOKING_ENABLED=true`
- `PAYMENT_PROVIDER=razorpay`
- `PAYMENT_PROVIDER_MODE=test`
- `RAZORPAY_KEY_ID=rzp_test_...`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `BOOKING_TOKEN_SECRET`

The key ID is server-only configuration and is returned only by the safe order
response. Secrets never reach the browser. A Live Mode value, a live key, or
production application environment fails closed during this phase.

## Deferred activation gates

The Phase 6B.3 hosted foreign-key-index migration remains pending. The targeted
hold-abuse improvement, merchant/legal identity, staging Test Mode E2E,
failure/recovery rehearsal, live account activation and live webhook approval
are all required before any production booking activation.
