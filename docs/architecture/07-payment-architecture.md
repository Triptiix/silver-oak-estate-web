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
8. Create audit events and pending `notification_events` outbox records.
   Phase 4 does not deliver those notifications.

**The later callback will:**
- Return idempotent success (`200 OK`) without repeating writes or creating
  duplicate outbox records.

## Expired-Hold Payment Recovery
If a verified payment arrives AFTER the `temporary_hold` expired:
- The original booking is permanently ineligible for confirmation.
- The payment is recorded as verified and moved to `refund_pending` or
  `reconciliation_required` through a separate durable recovery transaction.
- The booking remains unconfirmed and inventory is not reacquired.
- Inventory availability does not restore eligibility. A customer who still
  wishes to book must start a new availability and hold flow after payment
  recovery is resolved.
- A pending internal recovery outbox record is written for future administrator
  alert delivery. Phase 4 does not deliver the alert. Automatic refunds are not
  performed until the exact policy and provider workflow are approved.

## Future Manual Payment Fallback

Manual UPI QR and payment-link workflows are not implemented in Phase 4.

Any future manual-payment flow will require separately approved:

- hold duration;
- proof and transaction-reference requirements;
- administrator verification process;
- notification process;
- late-payment recovery;
- refund and reconciliation ownership.

A late manual payment must never revive an expired or released booking.

## Implementation Clarification

### Payment Conflict Recovery

When verified payment succeeds but the original hold is expired, released, or
otherwise ineligible for confirmation:
1. The inventory-confirmation transaction rolls back or uses a savepoint.
2. A separate successful recovery transaction updates the payment to `refund_pending` / `reconciliation_required`.
3. An audit event is recorded.
4. A pending internal recovery outbox record is written; alert delivery is not
   implemented in Phase 4.
5. Inventory is never reacquired for the old booking attempt.
6. Manual reconciliation remains required until an approved refund workflow exists.
