# Environment Variables

*Note: DO NOT expose actual secrets here. Use explicit placeholders for development.
Environment fields are validated lazily when the capability that uses them runs;
missing configuration therefore fails that capability without breaking unrelated
routes or imports.*

## Core website

These values are sufficient for the public marketing website and Supabase-backed
middleware. They do not enable online booking or payment.

### Public variables

- `NEXT_PUBLIC_SITE_URL` = `https://silveroakestate.online` (Required in production; use the local or Vercel testing origin before launch)
- `NEXT_PUBLIC_SUPABASE_URL` = `<YOUR_SUPABASE_URL>` (Required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<YOUR_SUPABASE_ANON_KEY>` (Required)

### Server configuration

- `APP_ENV` = `<development|staging|production>` (Required)
- `APP_TIMEZONE` = `"Asia/Kolkata"` (Required)
- `ONLINE_BOOKING_ENABLED` = `"false"` by default

`ONLINE_BOOKING_ENABLED` is the explicit booking kill switch. Keep it `false`
until hosted migrations, administrator operations, Turnstile, booking-token
signing, Razorpay and the staging rehearsal are verified together. Phase 6C.1
also rejects all payment operations when `APP_ENV=production`; missing or invalid
booking providers must show the assisted phone/WhatsApp fallback instead of a
partially working form.

## Online booking and payment capability

The following values are required before setting `ONLINE_BOOKING_ENABLED=true`:

### Public variables

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = `<YOUR_TURNSTILE_SITE_KEY>`

### Server-only variables

- `PAYMENT_PROVIDER` = `"razorpay"`
- `PAYMENT_PROVIDER_MODE` = `"test"` for staging rehearsal
- `BOOKING_HOLD_MINUTES` = `"10"`
- `SUPABASE_SERVICE_ROLE_KEY` = `<YOUR_SUPABASE_SERVICE_ROLE_KEY>` (**Sensitive**)
- `RAZORPAY_KEY_ID` = `rzp_test_<YOUR_KEY_ID>` (server-only; returned only by the order endpoint)
- `RAZORPAY_KEY_SECRET` = `<RAZORPAY_KEY_SECRET>` (**Sensitive**)
- `RAZORPAY_WEBHOOK_SECRET` = `<YOUR_WEBHOOK_SECRET>` (**Sensitive**)
- `TURNSTILE_SECRET_KEY` = `<YOUR_TURNSTILE_SECRET_KEY>` (**Sensitive**)
- `BOOKING_TOKEN_SECRET` = `<YOUR_BOOKING_TOKEN_SECRET>` (**Sensitive**)

The capability gate requires the complete set. It reports only missing variable
names and never reports values.

## Administrator and operational configuration

- `MANUAL_PAYMENT_HOLD_MINUTES` = `"30"`
- `DATABASE_CRON_ENABLED` = `"true"`
- `ICAL_FEED_SECRET` = `<YOUR_ICAL_FEED_SECRET>` (**Sensitive**)
- `CRON_SECRET` = `<YOUR_CRON_SECRET>` (**Sensitive**)

## Transactional email capability

Email is assessed separately and does not block the core website or booking-test
preflight.

- `EMAIL_API_KEY` = `<YOUR_EMAIL_API_KEY>` (**Sensitive**)
- `EMAIL_SENDER` = `<VERIFIED_TRANSACTIONAL_SENDER>`
- `ADMIN_NOTIFICATION_RECIPIENTS` = `"contact@silveroakestate.online"`

`EMAIL_SENDER` must be a provider-verified plain email address. Notification
delivery remains unavailable until the provider is configured and tested.

## Observability and deferred integrations

- `ERROR_MONITORING_DSN` = `<YOUR_SENTRY_DSN>` (Optional for core and booking-test; required for production-live readiness)
- `WHATSAPP_API_KEY` = `<YOUR_WHATSAPP_API_KEY>` (Optional, **Sensitive**)
- `PMS_API_KEY` = `<YOUR_PMS_API_KEY>` (Optional, **Sensitive**)

## Runtime-provided platform attestation

- `VERCEL=1` is set by Vercel when system environment variables are enabled. It
  is not an application secret and must not be set manually for local
  development.
- Only an attested Vercel runtime trusts `x-vercel-forwarded-for`, with
  `x-forwarded-for` retained as a Vercel-only fallback. The first value must be
  a syntactically valid IPv4 or IPv6 address.
- Local and other non-Vercel runtimes ignore forwarding headers and use
  `"unknown"` for the address component of the phone-inclusive request
  fingerprint.
- Keep Vercel system environment variables enabled for Preview and Production
  deployments.

## Readiness commands

```bash
npm run preflight:production -- --profile=core
npm run preflight:production -- --profile=booking-test
npm run preflight:production -- --profile=email
npm run preflight:production -- --profile=production-live
```

The earlier commands remain supported as aliases:

```bash
npm run preflight:production -- --target=staging
npm run preflight:production -- --target=production
```

They map to `booking-test` and `production-live` respectively.
