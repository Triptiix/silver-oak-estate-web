# Silver Oak Estate - Project Context

## Project Overview

Silver Oak Estate is a premium, private farmhouse-based hospitality and event property located in Sector 135, Noida. It caters to family stays, small celebrations, and corporate experiences.

## The Objective

Build a luxury web application serving as a direct booking platform. The website can display live availability independently of online checkout. OTA, phone, WhatsApp and assisted date requests remain manually reconciled until the full hosted booking stack and a future PMS/channel manager are active.

## Verified ownership and operations

- Varun Yadav owns the property.
- Arpit Chaudhary manages operations, maintenance and on-ground organization.
- The legal contracting party, invoicing authority and payment-gateway merchant entity remain unresolved and must not be inferred from ownership or operational responsibility.

## Key Constraints

- **Launch Date:** The previous 25 July 2026 target has passed. A new public launch date must be selected only after Phase 6 readiness gates pass.
- **Property:** Single full-property rental with 3 bedrooms, pool, lawn and hall.
- **Verified operational capacities:** Up to 10 overnight guests, up to 20 people indoors, and up to 40 people for standard daytime events.
- **Larger events:** Events above 40 people require prior written approval after an operational and safety review and are outside the standard self-service booking flow.
- **Strict Booking Model:** 11:00 AM check-in, 10:00 AM checkout the following day, forming a standard 23-hour slot.
- **Commercial:** INR 15,000 (Mon-Fri) / INR 20,000 (Sat-Sun), with INR 5,000 advance.

## Repository Rules

This repository contains the Next.js/Supabase source code for the public website and internal admin dashboard. OTA integrations beyond the planned private iCal boundary are deferred to post-launch stages.

## Completed Phase 5B backend

- Owner inventory blocks
- Maintenance inventory blocks
- Release of owner blocks
- Release of maintenance blocks
- Manual bookings
- Expiring manual-booking reservations
- Audited manual-payment verification
- Administrator mutation receipts
- Role enforcement
- Same-origin protection
- Strict input and output validation
- Least-privilege authenticated database boundary
- Canonical phone identity
- Bounded request bodies
- Capability-scoped environment validation
- Vercel-attested client-address handling
- Repository and hosted schema migrations aligned to 40 standard daytime and 10 overnight guests

## Completed Phase 5B UI

- `/admin/operations`
- Manual booking form
- Inventory block creation
- Active-block list
- Block-release forms
- Booking-level manual-payment verification
- Role-gated controls
- Idempotent request-ID lifecycle
- Exact INR-to-paise parsing
- Persistent results across `router.refresh()`
- Accessible results and validation
- UI and validation sources aligned to 40-person standard daytime and 10-person overnight limits

## Phase 6 status

- A Vercel production-target deployment exists for controlled online testing, but it is not an approved public launch.
- The custom domain and live payment activation remain outside the current gate.
- Hosted Supabase migration history includes the public availability RPC grant and `20260728160000_initialize_canonical_launch_data`.
- Supabase's GitHub production deployment automatically applied the canonical launch-data migration after PR #29 merged on 28 July 2026. This was a deployment-control discovery, not a database failure: one active `silver-oak-estate` property and its weekday/weekend pricing are present and verified.
- The live availability API resolves canonical data rather than returning `PROPERTY_NOT_FOUND`.
- Supabase GitHub `Deploy to production` is disabled. Future production migrations require the controlled manual approval and application workflow in the Phase 6B.2 runbook.
- The public marketing site operates with the core Supabase browser configuration.
- `ONLINE_BOOKING_ENABLED` defaults to `false` and must remain disabled until the complete hosted booking stack passes staging rehearsal.
- `/availability` displays the read-only calendar whenever the public Supabase capability is configured. With checkout disabled, a selected date leads to an assisted WhatsApp request rather than a payment flow.
- `/book`, hold creation and payment-order creation remain disabled or unavailable until the full booking capability is explicitly enabled and configured.
- Readiness checks are separated into core, booking-test, email and production-live profiles.

## Current limitations

- Hosted Supabase has no administrator membership
- No demo username or password exists
- The Vercel deployment is not production-approved for public launch
- Online checkout remains intentionally disabled until hosted data, external providers and end-to-end staging are verified
- Turnstile and Razorpay test-mode provider configuration have not completed a hosted rehearsal
- Live Razorpay is not configured
- Transactional email delivery and error monitoring are not configured
- Privacy, terms, cancellation/refund, liability, contracting, invoicing and jurisdiction documents are not final
- Refund execution is not implemented
- Automatic reconciliation is not implemented
- Notification delivery is not implemented
- Recovery remains diagnosis-only

The authoritative Phase 5B reference is [`docs/admin/phase-5b-manual-operations.md`](docs/admin/phase-5b-manual-operations.md).
The authoritative Phase 6 reference is [`docs/deployment/phase-6-production-readiness.md`](docs/deployment/phase-6-production-readiness.md).

*See the `docs/architecture/` folder for complete technical blueprints.*
