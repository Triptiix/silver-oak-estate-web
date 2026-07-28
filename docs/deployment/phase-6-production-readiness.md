# Phase 6 Production Readiness

## Purpose

This runbook prepares Silver Oak Estate for a controlled staging rehearsal and a later production launch. It does not authorize or perform a hosted Supabase migration, Vercel deployment, DNS change, Razorpay live-mode activation, administrator provisioning, or real customer transaction.

The previous target launch date of 25 July 2026 has passed. Select a new launch date only after every required gate in issue #18 is complete.

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

Varun Yadav is the property owner and Arpit Chaudhary manages operations. This repository must not infer legal contracting or invoicing authority from those operational facts.

### Gate 2: production environment ownership

Every environment variable must have an accountable owner and an approved rotation procedure. Production values belong in the hosting/provider secret stores, never in GitHub, documentation, screenshots, issue comments, test fixtures, or local shell history shared with others.

Required integration ownership includes:

- Supabase project and service-role access
- Vercel project and domain configuration
- Cloudflare Turnstile production keys and domain allowlist
- Razorpay live account, KYC, API keys and webhook secret
- Transactional email provider and verified sender
- Booking-token, iCal and cron secrets
- Error monitoring and launch observability

### Gate 3: hosted database migration

Before any hosted mutation:

1. Record the hosted Supabase project identifier, region and current migration state without publishing credentials.
2. Capture backup/restore evidence appropriate to the project plan.
3. Compare hosted migrations with `supabase/migrations/`.
4. Review the exact forward-only deployment sequence.
5. Apply migrations only after a separate explicit approval.
6. Verify constraints, RLS, grants, functions, capacity settings and inventory behavior.
7. Provision the first administrator through an authorized process; never seed credentials.

The repository currently proves migrations only against the isolated local Supabase stack in CI.

### Gate 4: staging rehearsal

A production-shaped staging environment must prove:

- Availability, hold creation, hold release and expiry
- Razorpay test order, verification and webhook finalization
- Exact 40/10 acceptance and deterministic above-limit rejection
- Overnight guest clamping and overnight less-than-or-equal-to-total enforcement
- Administrator login and role-gated operations
- Manual bookings, owner/maintenance blocks and manual-payment verification
- Email/notification audit behavior
- Cron expiry and iCal access
- Mobile, accessibility, privacy and failure states

### Gate 5: production rollout

Production rollout requires a recorded go/no-go decision, exact deployed commit, migration evidence, rollback criteria, administrator verification, payment/webhook verification and post-launch monitoring. Automatic refunds, automatic reconciliation and PMS/channel-manager synchronization remain deferred.

## Automated environment preflight

The preflight reads the current process environment, checks names and relationships, and prints only field names and diagnostic messages. It never prints environment values.

### Staging

```bash
npm run preflight:production -- --target=staging
```

The staging gate requires:

- `APP_ENV=staging`
- `PAYMENT_MODE=test`
- HTTPS non-local site and Supabase URLs
- Required variables present without example/placeholder values
- Valid positive hold durations and notification email addresses

### Production

```bash
npm run preflight:production -- --target=production
```

The production gate additionally requires:

- `APP_ENV=production`
- `NEXT_PUBLIC_SITE_URL=https://silveroakestate.online`
- `PAYMENT_MODE=live`
- A Razorpay key ID beginning with `rzp_live_`

A passing environment preflight is necessary but not sufficient. It cannot verify legal approval, provider ownership, KYC, domain control, hosted migration state, backup quality, live webhook delivery, administrator identity or rollback readiness.

## Expected output

A successful check reports `Status: PASS`. A blocked check reports only the affected variable name and reason. Missing error monitoring or execution outside Vercel is reported as a warning rather than exposing any value.

## Rollback boundary

This repository-only phase changes no hosted service. Rollback is limited to reverting the documentation, command and tests before merge. Hosted rollback procedures must be written and approved separately before Gate 3.

## Evidence required before launch

- Approved legal pack and approver record
- Redacted production environment matrix
- Hosted migration and backup evidence
- First-administrator provisioning evidence
- Staging rehearsal report
- Required CI and review results for the deployed commit
- DNS/TLS and production health evidence
- Payment and webhook verification evidence
- Post-launch monitoring record

Track the complete launch sequence in GitHub issue #18.
