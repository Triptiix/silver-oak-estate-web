# System Architecture

## Core Technology Stack
- **Frontend & Full-Stack Application:** Next.js App Router, TypeScript, Tailwind CSS
- **Backend/Database:** Supabase PostgreSQL & Auth
- **Hosting:** Vercel
- **Payments:** Razorpay (primary) behind a provider abstraction

## Performance and Scalability
The proposed stack provides sufficient capacity for a single-property hospitality booking system, subject to correct indexing, connection management (via Supabase pooling), cache rules, media optimization, and third-party API provider limits.

## Server Boundaries & API Design
The architecture clearly separates Server Actions from API Route Handlers.

**Use Route Handlers/API Endpoints for:**
- Public availability queries
- Payment order creation
- Payment verification
- Payment webhooks
- OTA/PMS callbacks
- Calendar feeds (iCal)
- Machine-to-machine integrations

**Use Server Actions for:**
- Authenticated admin mutations (e.g., manually blocking dates, updating booking statuses, managing CRM data).

## Public Availability Caching
Public availability must be explicitly dynamic and non-cacheable (`no-store`). Server-side validation must occur before a hold is granted, and transactionally validated again during payment confirmation. Clients should refresh data actively after booking state changes.

## Inventory Overlap Prevention (PostgreSQL Exclusion Constraint)
The core architecture prevents double bookings exclusively at the database layer using one authoritative `inventory_reservations` table.

**Requirements:**
- PostgreSQL `btree_gist` extension.
- `tstzrange(start_at, end_at, '[)')` representing the booking span.
- `property_id` equality comparison.
- Partial exclusion constraint applying ONLY to `status = 'active'`.

**Representative Blueprint SQL (Conceptual):**
```sql
ALTER TABLE inventory_reservations
ADD CONSTRAINT prevent_active_overlap
EXCLUDE USING gist (
  property_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (status = 'active');
```
*Note: The exclusion predicate cannot depend on `expires_at > now()` because PostgreSQL constraints must be immutable.*

**Transaction Flow for New Holds:**
Before inserting a new hold, a transaction or function MUST:
1. Find active `temporary_hold` reservations for the property where `expires_at` is in the past.
2. Mark them as `status = 'expired'`.
3. Record booking/inventory audit events.
4. Insert the new active reservation (`temporary_hold`).
5. Allow the exclusion constraint to reject any genuine overlap (e.g., race conditions).

*A scheduled cron cleanup should also run periodically to expire stale holds, but the transactional flow ensures absolute correctness.*
