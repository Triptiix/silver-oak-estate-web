# Environment Variables

*Note: DO NOT expose actual secrets here. Use explicit placeholders for development.
Environment fields are validated lazily when the capability that uses them runs;
missing configuration therefore fails that capability without breaking unrelated
routes or imports.*

## Public Variables (Exposed to Browser)
- `NEXT_PUBLIC_SITE_URL` = `https://silveroakestate.online` (Required in production; use the local origin during development)
- `NEXT_PUBLIC_SUPABASE_URL` = `<YOUR_SUPABASE_URL>` (Required, Test/Live)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<YOUR_SUPABASE_ANON_KEY>` (Required, Test/Live)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = `<YOUR_TURNSTILE_SITE_KEY>` (Required, Test/Live)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` = `rzp_test_<YOUR_KEY_ID>` (Required, test mode in Phase 4)

## Server-Only Variables (NEVER Exposed)
- `APP_ENV` = `<development|staging|production>` (Required, Test/Live)
- `APP_TIMEZONE` = `"Asia/Kolkata"` (Required, Test/Live)
- `PAYMENT_PROVIDER` = `"razorpay"` (Required, Test/Live)
- `PAYMENT_MODE` = `"test"` (Phase 4; live mode is not approved)
- `BOOKING_HOLD_MINUTES` = `"10"` (Required, Test/Live)
- `MANUAL_PAYMENT_HOLD_MINUTES` = `"30"` (Future/deferred — unused until the manual-payment workflow is approved)
- `DATABASE_CRON_ENABLED` = `"true"` (Required, Test/Live)
- `SUPABASE_SERVICE_ROLE_KEY` = `<YOUR_SUPABASE_SERVICE_ROLE_KEY>` (Required, Test/Live, **Sensitive**)
- `RAZORPAY_KEY_SECRET` = `<RAZORPAY_KEY_SECRET>` (Required, Test/Live, **Sensitive**)
- `PAYMENT_WEBHOOK_SECRET` = `<YOUR_WEBHOOK_SECRET>` (Required, Test/Live, **Sensitive**)
- `TURNSTILE_SECRET_KEY` = `<YOUR_TURNSTILE_SECRET_KEY>` (Required, Test/Live, **Sensitive**)
- `BOOKING_TOKEN_SECRET` = `<YOUR_BOOKING_TOKEN_SECRET>` (Required, Test/Live, **Sensitive**)
- `ICAL_FEED_SECRET` = `<YOUR_ICAL_FEED_SECRET>` (Required, Test/Live, **Sensitive**)
- `EMAIL_API_KEY` = `<YOUR_EMAIL_API_KEY>` (Required, Test/Live, **Sensitive**)
- `EMAIL_SENDER` = `<VERIFIED_TRANSACTIONAL_SENDER>` (Required only when transactional email is invoked; do not assume the contact mailbox is provider-verified)
- `ADMIN_NOTIFICATION_RECIPIENTS` = `"contact@silveroakestate.online"` (Professional contact mailbox; notification delivery remains deferred)
- `CRON_SECRET` = `<YOUR_CRON_SECRET>` (Required, Test/Live, **Sensitive**)
- `ERROR_MONITORING_DSN` = `<YOUR_SENTRY_DSN>` (Optional but Recommended, Test/Live)
- `WHATSAPP_API_KEY` = `<YOUR_WHATSAPP_API_KEY>` (Optional, Test/Live, **Sensitive**)
- `PMS_API_KEY` = `<YOUR_PMS_API_KEY>` (Optional, Test/Live, **Sensitive**)

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

Deferred email, WhatsApp, PMS and iCalendar settings do not affect unrelated
application capabilities. If a deferred feature is later invoked, its required
configuration must be validated at that boundary and fail closed.
