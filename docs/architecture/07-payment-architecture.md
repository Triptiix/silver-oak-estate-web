# Payment Architecture

## Shared Payment Finalization
Browser verification (`/api/payments/verify`) and Provider Webhooks (`/api/payments/webhook`) execute one shared, idempotent server database finalization operation.

**Whichever event arrives first will execute a transaction to:**
1. Lock the booking and payment records (`SELECT FOR UPDATE`).
2. Verify provider order, amount (`paise`), and currency.
3. Verify the temporary hold remains active, unexpired, and unreleased.
4. Verify the authoritative temporary inventory reservation is still active.
5. Convert that reservation to `confirmed_booking` without reacquiring inventory.
6. Confirm the booking ONLY while the original hold remains eligible.
7. Mark the payment verified/captured as appropriate.
8. Create audit events and queue notifications.

**The later callback will:**
- Return idempotent success (`200 OK`) without repeating writes or triggering duplicate notifications.

## Expired-Hold Payment Recovery
If a verified payment arrives AFTER the `temporary_hold` expired:
- The original booking is permanently ineligible for confirmation.
- The payment is recorded as verified and moved to `refund_pending` or
  `reconciliation_required` through a separate durable recovery transaction.
- The booking remains unconfirmed and inventory is not reacquired.
- Inventory availability does not restore eligibility. A customer who still
  wishes to book must start a new availability and hold flow after payment
  recovery is resolved.
- Administrators are alerted for manual reconciliation. Automatic refunds are
  not performed until the exact policy and provider workflow are approved.

## Manual Payment Fallback (KYC Delay)
If Razorpay KYC is delayed, users see a UPI QR/Payment Link.
- Hold duration for manual payments is a separate configuration (Initial setting: **30 minutes**).
- Status becomes `payment_pending`.
- Requires manual admin verification in the dashboard (collecting transaction references).
- If unverified by expiry time, the hold drops, customer is notified, and inventory is released.
- A payment received before the manual hold expires may be eligible for
  administrator verification and confirmation.
- A payment received after expiry or release becomes `refund_pending` /
  `reconciliation_required`; no late manual payment may revive the booking.

## Implementation Clarification

### Payment Conflict Recovery

When verified payment succeeds but the original hold is expired, released, or
otherwise ineligible for confirmation:
1. The inventory-confirmation transaction rolls back or uses a savepoint.
2. A separate successful recovery transaction updates the payment to `refund_pending` / `reconciliation_required`.
3. An audit event is recorded.
4. Administrators are alerted.
5. Inventory is never reacquired for the old booking attempt.
6. Manual reconciliation remains required until an approved refund workflow exists.
