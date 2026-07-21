# State Machines

Booking, payment, and inventory reservation states are strictly separated. 

## 1. Booking States (`bookings.booking_status`)
- **Meaning & Actor:** Represents the business lifecycle of a booking. Mutated by Server (via hooks) or Admins.
- **States:**
  - `draft`: Initial entry. Allowed next: `held`.
  - `held`: Hold acquired. Allowed next: `payment_pending`, `confirmed`, `expired`.
  - `payment_pending`: Manual fallback hold. Allowed next: `confirmed`, `expired`, `cancelled`.
  - `confirmed`: Payment verified. Allowed next: `checked_in`, `cancelled`.
  - `checked_in`: Guest arrived. Allowed next: `completed`.
  - `completed`: Check-out complete. Allowed next: None.
  - `cancelled`: Admin/User voided. Allowed next: None.
  - `expired`: Time-limit lapsed without payment. Allowed next: None.

## 2. Payment States (`payments.status`)
- **Meaning & Actor:** Financial state of a transaction. Mutated by Webhooks (Server).
- **States:**
  - `not_started`: Order requested. Next: `order_created`, `failed`.
  - `order_created`: Provider acknowledged. Next: `pending`, `failed`.
  - `pending`: User checking out. Next: `authorized`, `captured`, `failed`.
  - `authorized`: Funds held (if provider supports 2-step). Next: `captured`, `failed`.
  - `captured`: Funds settled. Next: `refund_pending`.
  - `failed`: Denied/timeout. Next: None.
  - `refund_pending`: Initiated. Next: `partially_refunded`, `refunded`.
  - `partially_refunded`: Partial return. Next: `refunded`.
  - `refunded`: Full return to source. Next: None.

## 3. Inventory Reservation Types & Statuses (`inventory_reservations`)

**Types (`reservation_type`):**
- `temporary_hold`, `confirmed_booking`, `manual_booking`, `ota_booking`, `owner_block`, `maintenance_block`

**Statuses (`status`):**
- `active`: Enforced by Exclusion Constraint.
- `released`: Manually removed block.
- `expired`: Hold lapsed.
- `cancelled`: Booking cancelled.

**Transitions (e.g., successful payment):**
- Original: `type = temporary_hold`, `status = active`.
- Payment Success: `type` converts to `confirmed_booking`. `status` **REMAINS** `active`. 
*(Note: `confirmed_booking` is a type, not a status. The record stays `active` to continue blocking dates).*

## Implementation Clarification

### Expired Holds

The exclusion constraint does not automatically ignore an active hold merely because expires_at is in the past. The hold creation transaction must first change stale active holds to expired.
