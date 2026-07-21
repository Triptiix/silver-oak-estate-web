# Implementation Sequence

The development phase will strictly adhere to the following sequence to prioritize launch-critical functionality. All phases must clear their acceptance gates before merging to main.

## 1. Database & Auth Foundation
- **Objective:** Establish the secure data layer.
- **Dependencies:** None.
- **Major tasks:** Create Supabase project, execute SQL migrations (including `inventory_reservations`, `pricing_rules`), setup Admin auth.
- **Acceptance criteria:** Database spins up locally. Schema validates. Exclusion constraints prevent overlapping `active` reservations.
- **Security gate:** Row Level Security (RLS) policies correctly block public access and allow authenticated admins.
- **Blocks:** Phases 2, 3, 4, 5.
- **Can run in parallel with:** Public Marketing UI (Design).
- **Scope:** MVP.

## 2. Server Utilities & Core Domain
- **Objective:** Build the business logic APIs.
- **Dependencies:** Phase 1.
- **Major tasks:** Availability checker, price calculator, hold creator, transactional logic.
- **Acceptance criteria:** Pricing logic correctly applies 1,500,000 paise (weekday) / 2,000,000 paise (weekend) logic. Concurrent booking attempts correctly trigger the exclusion constraint failure. Hold expiry functions correctly via transactional checks (even if cron sweeps are delayed).
- **Security gate:** API routes enforce bot protection and rate limits.
- **Blocks:** Phase 4.
- **Can run in parallel with:** Phase 3, 5.
- **Scope:** MVP.

## 3. Public Marketing UI
- **Objective:** Build the customer-facing website.
- **Dependencies:** Approved copy and verified media.
- **Major tasks:** Home, Estate, Experiences, Gallery, Policies. Mobile-responsive Tailwind CSS components.
- **Acceptance criteria:** Mobile usability verified via Lighthouse. No stock imagery used.
- **Security gate:** Output encoding prevents XSS.
- **Blocks:** Phase 6.
- **Can run in parallel with:** Phase 1, 2, 5.
- **Scope:** MVP.

## 4. Booking Checkout Flow
- **Objective:** Enable customer transactions.
- **Dependencies:** Phase 2, Approved Cancellation Policy, Verified Payment Provider Credentials.
- **Major tasks:** Date picker, Guest details, Razorpay integration, Shared Finalization logic, Opaque token confirmation page.
- **Acceptance criteria:** Payment idempotency verified for out-of-order webhooks. Opaque tokens correctly obscure PII on confirmation screens.
- **Security gate:** Price is verified solely on the server.
- **Blocks:** Phase 6.
- **Can run in parallel with:** Phase 3, 5.
- **Scope:** MVP.

## 5. Admin Dashboard
- **Objective:** Provide operational control to staff.
- **Dependencies:** Phase 1.
- **Major tasks:** Protected routes, Booking table, Manual block creation, Fallback payment confirmation UI.
- **Acceptance criteria:** Manual bookings correctly block inventory. Admin access is strictly enforced via JWT claims.
- **Security gate:** CSRF protection on mutations.
- **Blocks:** Phase 6.
- **Can run in parallel with:** Phase 2, 3, 4.
- **Scope:** MVP.

## 6. Pre-Launch QA & Infrastructure
- **Objective:** Harden the system for launch.
- **Dependencies:** Phases 1-5.
- **Major tasks:** Vercel deployment, Cron setup, Notifications, Analytics.
- **Acceptance criteria:** Notifications (Email/WhatsApp) deliver successfully. Analytics fire correctly on payment capture. Production rollback process documented and tested.
- **Security gate:** Secrets audited. Production database isolated.
- **Blocks:** Launch.
- **Can run in parallel with:** N/A.
- **Scope:** MVP.
