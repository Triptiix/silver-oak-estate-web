# Phase 6 Production Readiness

## Purpose

This runbook prepares Silver Oak Estate for a controlled staging rehearsal and a later production launch. It does not itself authorize a hosted Supabase data initialization, new migration, Vercel environment change, DNS change, Razorpay activation, administrator provisioning or real customer transaction.

The previous target launch date of 25 July 2026 has passed. Select a new launch date only after every required gate in issue #18 is complete.

## Current deployment posture

A Vercel production-target deployment exists for controlled online testing. It is not an approved public launch, and online checkout must remain disabled until the complete booking stack and hosted data are verified.

The public marketing website operates with the core Supabase browser configuration. `/availability` may display the read-only calendar whenever the public availability capability is configured. While online checkout is disabled, selecting a date leads to an assisted WhatsApp request. `/book`, hold creation and payment-order creation remain unavailable until `ONLINE_BOOKING_ENABLED=true` and the complete booking capability is configured.

Hosted Supabase migration history includes the public monthly-availability RPC grant and `20260728160000_initialize_canonical_launch_data`. Supabase's GitHub production deployment automatically applied the canonical launch-data migration after PR #29 merged on 28 July 2026. The resulting active `silver-oak-estate` property, weekday/weekend pricing and public availability API behavior were verified successfully; `/api/availability` for that active canonical property no longer returns `PROPERTY_NOT_FOUND`, while inactive or unknown properties remain unavailable. No administrator membership exists.

This was a process-control discovery, not a database failure. Supabase GitHub `Deploy to production` automatically applies pending `supabase/migrations` files when the production Git branch changes. The setting was disabled after this application. Future migration PRs must follow the controlled workflow in the Phase 6B.2 runbook; merging a migration PR is production-application authorization only while that setting is enabled.

## Capacity and booking contract

- Standard daytime bookings: up to 40 total guests.
- Indoor gatherings: up to 20 people as separate operational guidance.
- Overnight stays: up to 10 guests.
- Overnight guests must not exceed total guests.
- Events above 40 require prior written approval after operational and safety review and remain outside self-service booking.
- Standard slot: 11:00 AM check-in and 10:00 AM checkout the following day.
- Weekday rate: INR 15,000.
- Weekend rate: INR 20,000.
- Booking advance: INR 5,000.

## Non-negotiable gates

### Gate 1: legal and business approval

Do not launch payment acceptance until the final legal pack identifies the contracting party, invoicing authority, cancellation/refund rules, damage/security-deposit rules, house rules, privacy/cookie terms, liability terms, dispute resolution, jurisdiction, tax/GST wording, and the person authorized to approve those terms.

Varun Yadav is the property owner and Arpit Chaudhary manages operations. This repository must not infer legal contracting, invoicing, tax or merchant authority from those operational facts.

### Gate 2: production environment ownership

Every environment variable must have an accountable owner and an approved rotation procedure. Production values belong in the hosting/provider secret stores, never in GitHub, documentation, screenshots, issue comments, test fixtures or shared shell history.

Required integration ownership includes:

- Supabase project and service-role access
- Vercel project and domain configuration
- Cloudflare Turnstile keys and domain allowlist
- Razorpay account, KYC, API keys and webhook secret
- Transactional email provider and verified sender
- Booking-token, iCal and cron secrets
- Error monitoring and launch observability

### Gate 3: hosted database and launch-data verification

Current verified state:

- Hosted migration history includes the Phase 5A/5B, capacity-alignment, public availability RPC and canonical launch-data changes.
- The public availability function grants only `anon` and `service_role` execution; `authenticated` remains denied.
- `public.properties` contains one active `silver-oak-estate` row; `public.pricing_rules` contains one active weekday and one active weekend general rule with the canonical 1,500,000/2,000,000-paise prices and 500,000-paise advance.
- No administrator membership exists.

Before any further hosted mutation:

1. Record the exact target project and current migration/data state without publishing credentials.
2. Capture backup/restore evidence appropriate to the project plan. The current Free-plan project has no managed scheduled backups; do not treat the dashboard as backup evidence until suitable coverage is recorded.
3. Review the exact forward-only migration or repeatable non-sensitive data statement.
4. Assign the mutation approver, migration operator, recovery owner and verification owner.
5. Use the repository-pinned CLI, `npx --no-install supabase` (currently 2.109.1), to run `npx --no-install supabase db push --linked --dry-run`; obtain explicit application authorization before `npx --no-install supabase db push --linked`.
6. Verify constraints, RLS, grants, functions, capacity settings, pricing and inventory behavior.
7. Provision the first administrator only after explicit approval for the exact hosted project and environment, through the named authorized process; never seed credentials.
8. Run Supabase security and performance advisors and document intentional findings and follow-ups.

### Gate 4: staging rehearsal

A production-shaped staging environment must prove:

- Availability, hold creation, hold release and expiry
- Razorpay test order, verification and webhook finalization
- Exact 40/10 acceptance and deterministic above-limit rejection
- Overnight less-than-or-equal-to-total enforcement
- Administrator login and role-gated operations
- Manual bookings, owner/maintenance blocks and manual-payment verification
- Email/notification audit behavior
- Cron expiry and any implemented iCal access
- Mobile, accessibility, privacy and failure states
- Rate/abuse behavior appropriate to the enabled public endpoints

Only after this rehearsal passes may `ONLINE_BOOKING_ENABLED=true` be used in the intended environment.

### Gate 5: production rollout

Production rollout requires a recorded go/no-go decision, exact deployed commit, migration and launch-data evidence, rollback criteria, administrator verification, payment/webhook verification and post-launch monitoring. Automatic refunds, automatic reconciliation and PMS/channel-manager synchronization remain deferred.

## Automated capability preflight

The preflight reads the current process environment, checks names and relationships, and prints only field names and diagnostic messages. It never prints environment values.

### Core website

```bash
npm run preflight:production -- --profile=core
```

Confirms the public site URL, Supabase browser configuration, application environment and Asia/Kolkata timezone. Payment and email variables are intentionally excluded.

### Booking test

```bash
npm run preflight:production -- --profile=booking-test
```

Requires `APP_ENV=staging`, `PAYMENT_MODE=test`, `ONLINE_BOOKING_ENABLED=true`, a Razorpay test key and the complete Supabase service-role, Turnstile, booking-token and payment/webhook configuration. Transactional email is assessed separately.

The legacy staging command remains an alias:

```bash
npm run preflight:production -- --target=staging
```

### Transactional email

```bash
npm run preflight:production -- --profile=email
```

Checks the email API key, provider-verified sender and administrator recipient list without requiring booking or Supabase service-role credentials.

### Production live

```bash
npm run preflight:production -- --profile=production-live
```

Requires the canonical production URL, `APP_ENV=production`, `PAYMENT_MODE=live`, a Razorpay live key, enabled online booking, email delivery, operational secrets and an error-monitoring DSN.

The legacy production command remains an alias:

```bash
npm run preflight:production -- --target=production
```

A passing preflight is necessary but not sufficient. It cannot verify legal approval, provider ownership, KYC, domain control, hosted data, backup quality, live webhook delivery, administrator identity or rollback readiness.

## Expected output

A successful check reports `Status: PASS`. A blocked check reports only the affected variable name and reason. No secret value is printed.

## Rollback boundary

Repository remediation is reversible through Git. Every hosted migration, launch-data initialization, administrator provision, provider activation and domain change requires a separately documented rollback or recovery boundary before execution.

## Evidence required before launch

- Approved legal pack and approver record
- Redacted production environment matrix
- Hosted migration, launch-data and backup evidence
- First-administrator provisioning evidence
- Staging rehearsal report
- Required CI and review results for the deployed commit
- DNS/TLS and production health evidence
- Payment and webhook verification evidence
- Post-launch monitoring record

Track the complete launch sequence in GitHub issue #18, environment capability work in issue #20, calendar remediation in issue #22 and audit remediation in issue #25.
