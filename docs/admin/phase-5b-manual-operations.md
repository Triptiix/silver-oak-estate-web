# Phase 5B Administrator Manual Operations

## A. Scope

Phase 5B adds controlled administrator mutations on top of the Phase 5A
read-only operational visibility layer. Phase 5A remains the reading model;
Phase 5B adds six audited, idempotent write operations that are authorized
independently by the application and by PostgreSQL.

Implemented operations:

1. Create owner inventory block
2. Create maintenance inventory block
3. Release owner inventory block
4. Release maintenance inventory block
5. Create manual booking
6. Verify manual payment

Phase 5B does **not** implement:

- Automatic refunds
- Manual refund execution
- Automatic reconciliation
- Booking cancellation policy
- Notification delivery
- GST invoice generation
- OTA synchronization
- Live Razorpay configuration
- Hosted production deployment
- Administrator account-management UI

## B. Role matrix

### Operations

Can:

- Create maintenance blocks
- Release maintenance blocks
- Create manual bookings
- Access protected operational views

Cannot:

- Create owner blocks
- Release owner blocks
- Verify manual payments

### Admin

Can perform all six Phase 5B operations.

### Super admin

Can perform all six Phase 5B operations.

Administrator roles are identical for `admin` and `super_admin` within Phase 5B.
The distinction is reserved for later phases and is not a Phase 5B capability
boundary.

**UI visibility is not the authorization boundary.** Hiding a control only
removes an affordance. Every mutation is independently enforced twice:

- the Server Action passes an explicit allow-list to `authorizeAdminMutation`;
- the PostgreSQL function re-verifies the caller's active administrator
  membership and role inside the same transaction.

A caller that invokes a Server Action directly, with the control hidden or the
markup modified, is still rejected by both layers.

## C. Administrator routes

| Route | Purpose |
| --- | --- |
| `/admin/login` | Administrator sign-in. No public registration route exists. |
| `/admin/dashboard` | Operational summary landing page. |
| `/admin/operations` | Phase 5B manual operations: manual booking form, inventory block form, active-block list with release controls. |
| `/admin/bookings` | Paginated booking list with masked customer data. |
| `/admin/bookings/[bookingReference]` | Unified booking diagnosis: state facts, masked details, payment history, audit timeline, notification outbox, and the role-gated manual-payment verification panel. |
| `/admin/payments` | Payment-attempt visibility. |
| `/admin/recovery` | Diagnosis-only queue for `refund_pending` and `reconciliation_required`. |
| `/admin/notifications` | Notification-outbox records. |

- **Recovery remains diagnosis-only.** It exposes no route, control, or Server
  Action that confirms, revives, refunds, or financially overrides a booking or
  payment. Phase 5B did not add one.
- **Customer PII remains masked** in every administrator read.
- **Privileged reads remain server-only** through the service-role client with
  explicit column projections.
- **No operational table is queried directly by the browser.** There are no
  client-side `.from()` or `.rpc()` calls in administrator code.

## D. Mutation architecture

The six Server Actions, by exact exported name:

| Server Action | Roles allowed | PostgreSQL function |
| --- | --- | --- |
| `createOwnerBlockAction` | `admin`, `super_admin` | `create_admin_owner_block` |
| `createMaintenanceBlockAction` | `operations`, `admin`, `super_admin` | `create_admin_maintenance_block` |
| `releaseOwnerBlockAction` | `admin`, `super_admin` | `release_admin_owner_block` |
| `releaseMaintenanceBlockAction` | `operations`, `admin`, `super_admin` | `release_admin_maintenance_block` |
| `createManualBookingAction` | `operations`, `admin`, `super_admin` | `create_admin_manual_booking` |
| `verifyManualPaymentAction` | `admin`, `super_admin` | `verify_admin_manual_payment` |

Every mutation follows one flow:

```text
Protected administrator page
→ client form
→ existing Server Action
→ origin verification
→ authenticated active-admin role verification
→ strict Zod input validation
→ authenticated Supabase RPC
→ PostgreSQL role verification
→ transactional operation
→ strict output validation
→ safe result
```

Ordering matters: `authorizeAdminMutation` calls `assertAdminMutationOrigin`
**before** it resolves the administrator identity, so a cross-origin request is
rejected before any authorization work occurs.

There are **no parallel REST mutation endpoints**. The `/api/admin/*` routes are
GET-only read endpoints from Phase 5A. There are **no direct browser RPC calls**.
The browser never holds service-role credentials.

Results are returned as a discriminated `AdminMutationResult`, never as raw
database or provider errors. If an RPC returns a payload that fails strict
output validation, the result is converted to a generic `operation_failed`
rather than forwarded.

## E. Inventory blocks

**Owner versus maintenance.** Both remove the whole property from availability
for the requested calendar range; they differ in authorization and reason
vocabulary. Owner blocks are restricted to `admin` and `super_admin`.
Maintenance blocks are additionally available to `operations`.

**Reason categories**

- Owner block: `owner_use`, `private_event`, `operational_hold`, `other`
- Maintenance block: `maintenance`, `repair`, `inspection`, `deep_cleaning`,
  `safety`, `other`
- Release (both types): `no_longer_needed`, `corrected`, `rescheduled`,
  `created_in_error`, `other`

**Maximum date range.** The range must be ordered and span fewer than 31 days
between the first and last blocked date, giving a maximum 31-night block. Longer
periods must be entered as separate reviewed blocks.

**Complete-property inventory effect.** Silver Oak Estate is a single
full-property rental, so an active block removes the entire property for each
covered date. There is no partial or per-room blocking.

**Active-block server read model.** `/admin/operations` renders active owner and
maintenance blocks loaded on the server. Reservation UUIDs are required
internally to identify the row to release, and are passed in the mutation
payload, but are **never rendered into visible DOM content**.

**Safe release.** Releasing requires the reservation identifier, a reason
category, an explicit confirmation checkbox, and an optional internal note.

**Stale-state handling.** If the block is already gone or is not the expected
type, the database returns `block_not_found`, `block_not_active`, or
`wrong_block_type`. The UI surfaces this in the durable feedback region and
refreshes the list, so the administrator sees why the row vanished.

**No reactivation.** A released block is terminal. No Phase 5B operation
reactivates a released or expired reservation.

**Atomic overlap protection.** Overlap is prevented by a database exclusion
constraint over the reservation date range, not by application checks. Competing
concurrent block creations resolve to exactly one winner; the loser leaves no
partial row.

**Idempotent replay.** Each mutation carries a caller-generated request ID. An
identical retry returns the original outcome with `applied: false` instead of
performing a second mutation.

## F. Manual bookings

**Server-owned pricing.** The browser never supplies prices. Weekday and weekend
rates, the advance amount, and the balance are resolved server-side from stored
settings and returned in the validated result.

**Server-owned checkout calculation.** The administrator supplies only a
check-in date. Check-in and check-out instants are derived by the database from
the confirmed 11:00 check-in / 10:00 checkout business rule.

**Canonical customer phone handling.** Phone numbers are normalized to one
canonical identity through `normalizePhone` before reaching the database, and a
database-level identity constraint keeps a single canonical customer row.
Invalid numbers are rejected with a field error. There is **no silent
country-code inference** — an ambiguous number fails validation rather than
being guessed.

**Guest limits.** Total guests 1–40; overnight guests 0–10, defaulting to 0.
Overnight guests may not exceed total guests. The separate 20-person indoor
capacity remains operational guidance rather than the total booking limit.
Events above 40 require prior written approval and stay outside the standard
manual-booking flow.

**Manual providers.** `manual_upi` and `payment_link` only.

**Payment-pending initial state.** A manual booking is created as
`payment_pending` with an active `manual_booking` reservation. It is not a
confirmed booking.

**Expiring manual reservation.** The reservation carries a hold expiry. If the
manual booking is not verified before that expiry, the shared `expire_stale_holds`
housekeeping marks the reservation `expired` and the booking `expired`, and the
inventory returns to availability. This is the same expiry mechanism used by
public holds. A later payment observation against that booking cannot revive it
— see section G.

**No browser-supplied prices or status.** Booking status, reservation status,
and all money values are outputs, never inputs.

**Idempotent retry.** An identical retry with the same request ID returns the
original booking with `applied: false`.

## G. Manual-payment verification

Only `admin` and `super_admin` can verify. The `operations` role receives no
verification form and is rejected by the Server Action and by SQL.

Verification is offered only for an **eligible latest manual payment attempt**:
the most recent payment on the booking must use `manual_upi` or `payment_link`
and be in one of the supported states:

- `pending`
- `expired`

**Submitted facts**

| Field | Rule |
| --- | --- |
| External payment reference | Uppercased, `^[A-Z0-9][A-Z0-9._:/-]{2,127}$` |
| Observed amount | Exact integer paise, positive |
| Observed currency | Three-letter code; no conversion is performed |
| Operator note | Optional, max 500 characters |
| Evidence descriptor | Optional, max 200 characters, text only |
| Attestation | Required checkbox confirming independent verification |

**Exact integer-paise handling.** Rupee input is parsed to integer paise with
exact string handling. No floating-point arithmetic is used for money at any
point.

**No file uploads.** The form exposes no file or URL input. The evidence
descriptor rejects `http://`, `https://`, `data:` and `file:` payloads, so it
remains a short human description rather than an attachment channel.

**No currency conversion.** The observed currency is recorded as submitted and
compared; the system never converts between currencies.

### Outcome: confirmed

- The payment becomes `manually_verified`.
- The booking and reservation transition according to the database operation.
- An audit receipt and booking event are written exactly once.
- A `booking_confirmed` outbox row is enqueued. **No notification-delivery claim
  is made** — an outbox row is a queued record, not proof of delivery.

### Outcome: reconciliation required

- A mismatch, or an ineligible booking/payment relationship such as an already
  expired hold, is recorded safely as `reconciliation_required`.
- The observed external reference and amount are preserved for investigation.
- **No automatic refund occurs.**
- **No automatic reconciliation occurs.**
- No confirmation outbox row is enqueued.
- The recovery queue provides diagnosis only; it executes nothing.

**No-revival invariant.** If the reservation and payment already expired before
the observation arrives, verification records
`reconciliation_required` and leaves the booking `expired` and the reservation
`expired`. Late money never revives a booking or reacquires inventory. This
preserves the Phase 4 invariant unchanged.

**Reference uniqueness.** A normalized external reference cannot confirm two
different payments. Case and surrounding whitespace are normalized before the
uniqueness check, so ` race-ref-shared ` and `RACE-REF-SHARED` collide. The
losing attempt fails with `payment_reference_conflict` and leaves no partial
mutation.

## H. Idempotency

- **Caller-generated UUID request IDs.** Every mutation requires a `requestId`
  validated as a UUID.
- **IDs are retained across identical retries.** The client keeps the request ID
  in a ref keyed by the normalized payload, so pressing retry after an uncertain
  outcome reuses the same ID.
- **Network-uncertain retry is safe.** When a request fails without a known
  result, retrying the unchanged submission reuses the ID and cannot double-apply.
- **A changed normalized payload rotates the request ID**, so an edited
  submission is treated as a genuinely new intent rather than a replay.
- **Applied success clears the completed intent.**
- **Replayed success clears the completed intent.**
- **PostgreSQL operation receipts** are recorded in `admin_operation_events`,
  keyed by request ID, and are the authoritative idempotency record.
- **The same request ID submitted with different facts produces an idempotency
  conflict** rather than silently applying either version.
- **Request IDs are never logged or displayed.** They appear only in the
  mutation payload.
- **No PII is stored in browser storage.**

## I. Security boundaries

- **Same-origin mutation enforcement.** `assertAdminMutationOrigin` validates the
  request `Origin` header against the configured site origin and rejects
  everything else with `invalid_origin`.
- **Runtime site-origin validation.** The trusted origin is derived from
  validated runtime configuration, not from request-controlled headers.
- **Administrator session validation** and **active membership requirement.** A
  session alone is insufficient; a matching active `public.admins` row is
  required.
- **Role checks in application and database**, independently.
- **SECURITY DEFINER functions with bounded search path.**
- **Explicit RPC allow-listing** rather than blanket execution rights.
- **Strict input and output validation** with Zod strict objects; unknown keys
  are rejected on the way in, and unexpected shapes are rejected on the way out.
- **Least-privilege authenticated database grants.** The `authenticated` role has
  no direct operational table mutation rights; it may only invoke the
  allow-listed RPCs.
- **Service-role access restricted to server reads.**
- **Vercel-only forwarding-header trust** with an **unknown-address fallback**
  outside an attested Vercel runtime, so spoofed forwarding headers are ignored
  in other environments.
- **Lazy capability-scoped environment validation**, so an unrelated missing
  secret fails only the capability that needs it instead of breaking unrelated
  routes.
- **Bounded JSON request bodies** to cap untrusted payload size.
- **Generic safe error messages.** Error text names variables or failure
  categories, never values.
- **No secrets, tokens, request fingerprints or raw webhook payloads are
  exposed** to administrator surfaces.

## J. Privacy

- Customer name masked in administrator reads.
- Customer email masked.
- Customer phone reduced to a safe masked display.
- Search is performed server-side and accepts only a complete public booking
  reference.
- Full operational customer values never leave the server read layer.
- No request fingerprints, hold nonces, or public confirmation tokens are
  returned to any administrator surface.
- No customer data is written to `localStorage` or `sessionStorage`.
- No PII is logged, and request IDs are not logged.

## K. Result and accessibility behaviour

- **Applied and replayed outcomes are visibly distinct.** A replay is labelled as
  a replay and states that no second mutation occurred.
- **Results survive server refresh.** Durable feedback is owned by a stable
  parent that does not unmount when the underlying row changes.
- **Released rows may disappear while feedback remains.** Release feedback is
  owned by `ActiveInventoryBlocks`, above the list, so the outcome persists after
  the released row is removed by refreshed server props.
- **Payment forms may disappear when eligibility changes while feedback
  remains.** `ManualPaymentVerificationPanel` continues rendering a completed
  result after the candidate becomes `null`.
- **Results are booking-isolated.** The panel is keyed by booking reference, so a
  result cannot leak into another booking's page.
- **Validation errors are associated with fields** via `aria-invalid` and
  `aria-describedby`, and remain local to the row that produced them.
- **Pending controls prevent duplicate submissions**; forms disable while a
  mutation is in flight.
- **Failure alerts** use `role="alert"`.
- **Polite live regions** are used for non-failure results.
- **Programmatic focus** moves to the result region when an outcome appears, so
  the outcome is reachable even when the originating control unmounted.
- **Keyboard-accessible dismissal and controls** throughout; every result can be
  dismissed with a real button.

## L. Operational limitations

- Test mode only.
- No live Razorpay configuration.
- No refund execution, automatic or manual.
- No automated reconciliation.
- No notification delivery; the outbox records intent only.
- No hosted Phase 5 deployment yet.
- No hosted administrator user yet.
- No demo username or password is stored in this repository.
- No production credentials are stored in Git.

## M. Deployment prerequisites

These are future prerequisites. None has been performed.

1. Review and merge the Phase 5B pull request.
2. Provision a staging Supabase environment.
3. Apply migrations in order.
4. Run database verification (`db:lint`, `db:test`, generated-type check).
5. Configure required environment variables.
6. Enable Vercel system environment variables.
7. Configure the allowed site URL: `https://silveroakestate.online`.
8. Configure Razorpay test mode before considering live mode.
9. Configure the webhook secret and endpoint.
10. Create the first Supabase Auth administrator.
11. Insert the matching active `public.admins` membership.
12. Assign the minimum necessary role.
13. Test role boundaries.
14. Test manual operations with synthetic data.
15. Configure monitoring and operational alerts.
16. Obtain explicit approval before any production deployment.

`contact@silveroakestate.online` is the professional contact mailbox. It must
**not** automatically be treated as a verified transactional sender. Sending
transactional mail from it requires separate domain authentication (SPF, DKIM,
DMARC) and a reviewed provider configuration.

## N. Rollback boundary

- Application rollback can revert the deployment.
- Database migrations require an explicit reviewed rollback or forward-fix plan;
  redeploying older application code does not undo an applied migration.
- **Never delete operation receipts or audit evidence to "undo" an
  administrative action.** Correct forward with a new, audited operation.
- Released or expired reservations must not be reactivated.
- Production rollback must preserve financial and audit records.
