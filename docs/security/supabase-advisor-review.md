# Supabase Advisor Review

Reviewed against the hosted Silver Oak Estate project on 28 July 2026. Advisor output is evidence for review, not an instruction to weaken established database boundaries.

## Accepted intentional security findings

### Public monthly availability RPC

Advisor: `anon_security_definer_function_executable`

`public.get_monthly_availability(text, text)` is intentionally executable by `anon` because it is the public calendar projection. The function:

- validates a bounded `YYYY-MM` input and property slug;
- reads only active public property configuration, pricing and inventory overlap state;
- returns property timing, integer-paise prices and per-date availability booleans;
- returns no customer, booking, payment, reservation or internal identifier records;
- uses `SECURITY DEFINER` with `search_path=pg_catalog`;
- has execution revoked from `public` and `authenticated` and granted only to `anon` and `service_role`;
- is covered by application isolation tests and pgTAP privilege tests.

This warning is accepted while the public calendar architecture remains in use. Any expansion of the return payload or grants requires a new security review.

### Authenticated administrator RPCs

Advisor: `authenticated_security_definer_function_executable`

Administrator helper and mutation functions are intentionally callable by the `authenticated` database role, but authentication alone is not authorization. The functions bind authorization to `auth.uid()`, require an active row in `public.admins`, enforce the specific allowed role, use a safe search path, and are reached through Server Actions that independently verify same-origin and active role membership.

Accepted functions must continue to satisfy all of these controls:

1. No caller-supplied user identifier is trusted for authorization.
2. `auth.uid()` is non-null and maps to an active administrator.
3. The operation-specific role is enforced inside PostgreSQL.
4. `search_path` is fixed to `pg_catalog`.
5. Direct table privileges remain least-privilege.
6. Inputs and outputs remain schema-validated at the application boundary.
7. Idempotency and operation receipts remain intact for state-changing operations.

A new authenticated RPC must not be added to the allow-list without pgTAP privilege, role and negative-path coverage.

### RLS enabled with no policy

Advisor: `rls_enabled_no_policy`

Several internal tables intentionally have RLS enabled with no direct client policy. This is deny-by-default defense in depth: browser roles do not receive mutation privileges, and trusted server/RPC paths own access. Do not add permissive policies merely to silence this informational finding.

## Open performance follow-ups

The hosted advisor identified two foreign keys without covering indexes:

- `public.payments.verified_by_admin_id`
- `public.site_settings.updated_by`

A forward migration and pgTAP contract have been prepared in
`20260728170000_add_foreign_key_indexes.sql` for both foreign keys. Hosted
application remains pending and requires the controlled production migration
process. Do not mark either hosted advisor finding fixed until the migration is
separately approved, manually applied and the hosted advisor is rerun.

Do not remove currently unused booking/inventory indexes based on an empty
pre-launch database; usage statistics are not representative until realistic
staging traffic exists.

## Review cadence

Run security and performance advisors:

- after every hosted DDL change;
- before enabling online booking;
- after the staging rehearsal;
- after the first representative production-traffic window.

Record new warnings as accepted-with-evidence, fixed, or blocked. Never suppress them without a traceable rationale.
