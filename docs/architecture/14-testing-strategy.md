# Testing Strategy

Prior to launch, the system will undergo rigorous automated and manual testing.

## Unit & Integration Tests

- **Database Constraint Tests:** Directly querying PostgreSQL to verify the `tstzrange` Exclusion Constraint blocks overlapping active records in `inventory_reservations`.
- **Concurrency Tests:** Firing simultaneous requests to `/api/bookings/hold` to ensure only one transaction succeeds per date range.
- **Payment Tests:** Mocking Razorpay API responses.
- **Webhook Idempotency Tests:** Simulating duplicate and out-of-order webhook deliveries to ensure only one write occurs.
- **RLS Tests:** Simulating public vs. authenticated admin queries against Supabase tables.
- **Admin Authorization Tests:** Verifying Server Actions block non-admins.

## Business Logic Tests

- **Pricing Tests:** Validating server-side calculations for total, advance, and balance.
- **Monday-Friday vs Saturday-Sunday Logic:** Verifying day-of-week rates apply correctly.
- **Asia/Kolkata and UTC Boundaries:** Testing date roll-overs across timezones.
- **Guest Capacity:** Ensuring the public and administrator flows accept 40 standard daytime and 10 overnight guests, reject values above those limits, and preserve overnight guests less than or equal to total guests.
- **Indoor Capacity:** Keeping the separate 20-person indoor operational limit distinct from the total daytime booking limit.

## Workflow Tests

- **Manual Bookings, Owner Blocks, Maintenance Blocks:** Verifying these block public calendar dates correctly via `inventory_reservations`.
- **Hold Expiry & Cron Failure:** Verifying that a lapsed hold allows a new booking even if cron fails to sweep it.
- **Manual UPI Fallback:** Testing the 30-minute expiry flow and manual admin confirmation.
- **Notification Failure:** Ensuring booking completes even if email API is down.
- **OTA/iCal Transition Tests:** Verifying UTC formatting on export.

## Client-Side & Smoke Tests

- **Mobile Tests:** Responsive testing.
- **Accessibility Tests:** Screen-reader and contrast checks.
- **SEO & Analytics Checks:** Event firing on payment success.
- **Deployment Smoke Tests & Rollback Tests:** CI/CD validation.
