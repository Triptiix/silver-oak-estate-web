# Silver Oak Estate - Project Context

## Project Overview

Silver Oak Estate is a premium, private farmhouse-based hospitality and event property located in Sector 135, Noida. It caters to family stays, small celebrations, and corporate experiences.

## The Objective

To build a luxury web application serving as a direct booking platform. The direct website booking flow replaces manual availability checks for direct online customers. OTA, phone, and WhatsApp bookings remain manually reconciled until the PMS/channel manager is active.

## Key Constraints

- **Launch Date:** Target 25 July 2026.
- **Property:** Single full-property rental with 3 bedrooms, pool, lawn and hall.
- **Verified operational capacities:** Up to 10 overnight guests, up to 20 people indoors, and up to 40 people for standard daytime events.
- **Larger events:** Events above 40 people require prior written approval after an operational and safety review and are outside the standard self-service booking flow.
- **Strict Booking Model:** 11:00 AM check-in, 10:00 AM checkout the following day, forming a standard 23-hour slot.
- **Commercial:** INR 15,000 (Mon-Fri) / INR 20,000 (Sat-Sun), with INR 5,000 advance.

## Repository Rules

This repository strictly contains the Next.js/Supabase source code for the public website and internal admin dashboard. OTA integrations (beyond basic iCal feeds) are deferred to post-launch stages.

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
- Repository database and application code aligned to 40 standard daytime and 10 overnight; hosted enforcement requires a separate migration deployment

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
- Repository UI and validation sources aligned to 40-person standard daytime and 10-person overnight limits

## Current limitations

- Hosted Phase 5A and Phase 5B migrations have not been deployed
- The capacity-alignment migration has not been applied to hosted Supabase
- Hosted Supabase has no administrator account
- No demo username or password exists
- Production deployment has not occurred
- Live Razorpay is not configured
- Refund execution is not implemented
- Automatic reconciliation is not implemented
- Notification delivery is not implemented
- Recovery remains diagnosis-only

The authoritative Phase 5B reference is [`docs/admin/phase-5b-manual-operations.md`](docs/admin/phase-5b-manual-operations.md).

*See the `docs/architecture/` folder for complete technical blueprints.*
