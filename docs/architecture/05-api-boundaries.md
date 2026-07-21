# API Boundaries

All integrations must use Next.js Route Handlers.

## Endpoints

### `GET /api/availability`
- **Auth:** Public.
- **Input Schema:** `month` (YYYY-MM).
- **Output Schema:** Array of unavailable date ranges (`start_at`, `end_at`).
- **Cache Policy:** `no-store`.
- **Validation:** Server ensures format.
- **Rate Limiting:** IP-based strict limits.

### `POST /api/bookings/hold`
- **Auth:** Public (requires Captcha/Turnstile token).
- **Input Schema:** Guest count, Check-in/out, Customer details.
- **Validation:** Server calculates overlap.
- **Transaction Requirement:** Yes. Creates `temporary_hold` and `draft` booking transactionally.
- **Sensitive Data:** Customer PII (requires sanitization).

### `POST /api/bookings/release`
- **Auth:** Public (requires hold token/session).
- **Idempotency:** Strictly idempotent. Releasing an already released hold returns success.
- **Transaction Requirement:** Updates reservation status to `released`.

### `GET /api/bookings/confirmation/[token]`
- **Auth:** Public via opaque token.
- **Input:** Uses the `public_confirmation_token` (cryptographically random), NOT the human-readable `booking_reference`.
- **Cache Policy:** `no-store`.
- **Sensitive Data:** Redacts PII, shows only redacted booking summary and status.

### `POST /api/payments/order`
- **Auth:** Public (requires active hold session).
- **Input Schema:** Hold ID/Booking ID. *Must NOT trust browser price.*
- **Validation:** Server verifies the hold is active, valid, and owned by the session. Retrieves pricing strictly from server logic/database.
- **Transaction Requirement:** Creates `payment` record as `order_created`.

### `POST /api/payments/verify` (Browser Return) & `POST /api/payments/webhook`
- **Auth:** Signature verification required.
- **Idempotency:** Strict idempotency via `provider_event_id`.
- **Transaction Requirement:** Browser verification and webhooks BOTH use the same Shared Finalization operation (see Payment Architecture).

### `GET /api/calendar/ical`
- **Auth:** Secret URL token (`ICAL_FEED_SECRET`).
- **Cache Policy:** Revalidate every 5 mins.
