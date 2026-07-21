# Payment Architecture

## Shared Payment Finalization
Browser verification (`/api/payments/verify`) and Provider Webhooks (`/api/payments/webhook`) execute one shared, idempotent server database finalization operation.

**Whichever event arrives first will execute a transaction to:**
1. Lock the booking and payment records (`SELECT FOR UPDATE`).
2. Verify provider order, amount (`paise`), and currency.
3. Verify hold ownership and validity.
4. Attempt to acquire an `active`, `confirmed_booking` inventory reservation.
5. Allow the PostgreSQL Exclusion Constraint to reject a conflict (ensuring concurrency safety).
6. Confirm the booking ONLY when inventory acquisition succeeds.
7. Mark payment `captured`.
8. Create audit events and queue notifications.

**The later callback will:**
- Return idempotent success (`200 OK`) without repeating writes or triggering duplicate notifications.

## Expired-Hold Payment Recovery
If a verified payment arrives AFTER the `temporary_hold` expired:
- The shared finalization operation attempts the transaction.
- If the inventory is still available (acquisition succeeds), the booking is confirmed normally.
- If the inventory was taken by another user (acquisition fails via exclusion constraint), the transaction rolls back, marks the payment as `refund_pending`, fails the booking, and alerts administrators.
- Automated reconciliation/retry mechanisms handle provider-success/database-failure edge cases, leaving manual reconciliation as the absolute final fallback.

## Manual Payment Fallback (KYC Delay)
If Razorpay KYC is delayed, users see a UPI QR/Payment Link.
- Hold duration for manual payments is a separate configuration (Initial setting: **30 minutes**).
- Status becomes `payment_pending`.
- Requires manual admin verification in the dashboard (collecting transaction references).
- If unverified by expiry time, the hold drops, customer is notified, and inventory is released.
- Late manual payments follow the same refund recovery workflows as automated payments.

## Implementation Clarification

### Payment Conflict Recovery

When verified payment succeeds but inventory confirmation fails:
1. The inventory-confirmation transaction rolls back or uses a savepoint.
2. A separate successful recovery transaction updates the payment to `refund_pending` / `reconciliation_required`.
3. An audit event is recorded.
4. Administrators are alerted.
5. Automated reconciliation is attempted before manual intervention.
