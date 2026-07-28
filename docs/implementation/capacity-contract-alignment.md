# Capacity Contract Alignment

The executable booking contract is aligned with the verified operational limits:

- Standard daytime bookings: up to 40 total guests
- Indoor gatherings: up to 20 people as a distinct operational-use limit
- Overnight stays: up to 10 guests
- Events above 40 people: prior written approval after operational and safety review, outside the standard self-service flow

## Enforcement layers

- `properties` check constraints and configured values
- Non-sensitive capacity site settings
- Public hold request schema and form
- Administrator manual-booking schema and form
- Public booking-hold RPC through property configuration
- Administrator manual-booking RPC through property configuration

## Migration approach

`20260728090000_align_capacity_contract.sql` is a forward corrective migration. Previously applied migrations remain unchanged. The migration broadens the property constraints, updates the Silver Oak Estate property row, and aligns the non-sensitive site settings.

## Verification

Focused application tests cover exact-boundary acceptance, above-boundary rejection, overnight-less-than-or-equal-to-total enforcement, and both form controls. Focused pgTAP tests cover the stored configuration, constraint definitions, public hold RPC, and administrator manual-booking RPC.

No hosted Supabase project or production deployment is mutated by this change.
