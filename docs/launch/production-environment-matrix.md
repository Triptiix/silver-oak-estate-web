# Production environment matrix — Silver Oak Estate

Variable **names** and rules only. **No values appear in this file.** Rows marked
`present by name: unverified` could not be confirmed because the local checkout is
not linked to the Vercel project and `vercel link` was intentionally not run
(it would create local `.vercel` state). Confirm names in the Vercel dashboard or
via `vercel env ls` inside a linked checkout during Phase 7D.3B.

Last updated: 2026-07-30 · Phase 7D.3A

## 1. Assisted production (this launch) — `preflight:assisted`

### Required

| Variable | Public/secret | Scope | Validation | Source / owner | Present by name | Required now |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Production | must equal `https://silveroakestate.online`, HTTPS, no localhost | Owner | unverified | yes |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Production | HTTPS, no localhost, non-placeholder | Supabase | unverified | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public (anon, RLS-protected) | Production | non-placeholder | Supabase | unverified | yes |
| `APP_ENV` | public | Production | must equal `production` | Ops | unverified | yes |
| `APP_TIMEZONE` | public | Production | must equal `Asia/Kolkata` | Ops | unverified | yes |
| `ONLINE_BOOKING_ENABLED` | public | Production | must equal `false` | Ops | unverified | yes |

### Optional / warning-level

| Variable | Public/secret | Scope | Validation | Owner | Present by name | Required now |
| --- | --- | --- | --- | --- | --- | --- |
| `ERROR_MONITORING_DSN` | secret | Production | HTTPS when set; warning when absent | Ops | unverified | no (warning only) |
| `VERCEL` | runtime | Production | set to `1` by Vercel automatically | Vercel | n/a | run preflight in Vercel |

Notably **not required** for assisted launch: any Razorpay key, `PAYMENT_PROVIDER*`,
`BOOKING_TOKEN_SECRET`, Turnstile keys, or email-provider variables. The public
path uses only the two public Supabase fields plus user-initiated
`mailto:` / WhatsApp / `tel:` links.

## 2. Future booking rehearsal (staging) — existing `booking-test` profile

Documented, not enabled. Required names (see `scripts/production-preflight.mjs`):
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`APP_ENV=staging`, `APP_TIMEZONE`, `ONLINE_BOOKING_ENABLED=true`,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `RAZORPAY_KEY_ID` (`rzp_test_`),
`PAYMENT_PROVIDER=razorpay`, `PAYMENT_PROVIDER_MODE=test`, `BOOKING_HOLD_MINUTES`,
`SUPABASE_SERVICE_ROLE_KEY` (secret), `RAZORPAY_KEY_SECRET` (secret),
`RAZORPAY_WEBHOOK_SECRET` (secret), `TURNSTILE_SECRET_KEY` (secret),
`BOOKING_TOKEN_SECRET` (secret). Secrets require rotation on exposure.

## 3. Future live online booking (Phase 8) — existing `production-live` profile

Documented, not enabled and **intentionally still blocked** by the preflight
(live payment activation is out of scope). Adds, over the staging set:
`MANUAL_PAYMENT_HOLD_MINUTES`, `DATABASE_CRON_ENABLED`, `ICAL_FEED_SECRET` (secret),
`EMAIL_API_KEY` (secret), `EMAIL_SENDER`, `ADMIN_NOTIFICATION_RECIPIENTS`,
`CRON_SECRET` (secret), `ERROR_MONITORING_DSN`, and requires `APP_ENV=production`
with the canonical site URL. Enabling this is a separate authorised phase with
its own legal, payment and operational prerequisites.

## Rotation and classification notes

- Public `NEXT_PUBLIC_*` values ship to the browser by design; the Supabase anon
  key is safe to expose because Row Level Security governs access.
- Every variable in the `SECRET_FIELDS` set of the preflight script must never be
  printed, logged or committed, and must be rotated if disclosed.
- No value in this repository or these documents is a real credential.
