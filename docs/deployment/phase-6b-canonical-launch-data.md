# Phase 6B.2 Canonical Launch Data

## Purpose and safety boundary

Migration `20260728160000_initialize_canonical_launch_data.sql` initializes only
the approved, non-sensitive Silver Oak Estate property and its general weekday
and weekend pricing rules. It does not create customers, bookings, payments,
reservations, notifications or administrators. It does not change RLS, grants,
environment variables, provider configuration or online-booking capability.

This runbook originally required a separately approved hosted application. The
Supabase GitHub production deployment automatically applied this migration at
`2026-07-28T12:34:27Z`, 37 seconds after PR #29 merged. No manual non-dry-run
`supabase db push` was executed. The application is correct and isolated: it
created the canonical property and two pricing rules, while customers,
bookings, payments, reservations, administrators and notifications remain at
zero.

This was a deployment-control discovery, not a database failure. Supabase
GitHub `Deploy to production` automatically applies pending
`supabase/migrations` files when the production Git branch changes. The setting
was disabled after this event. Future migration applications require the
controlled workflow below.

## Verified hosted application record

- Migration history includes `20260728095325_grant_public_availability_rpc`
  and `20260728160000_initialize_canonical_launch_data`; no repository
  migration is pending at this baseline.
- One active `silver-oak-estate` property exists with `Asia/Kolkata`, 11:00
  check-in, 10:00 checkout, a 60-minute cleaning buffer, 40 daytime guests and
  10 overnight guests.
- One active weekday rule is 1,500,000 paise and one active weekend rule is
  2,000,000 paise; each has a 500,000-paise advance and priority 0.
- Counts are: properties 1, pricing rules 2, customers 0, bookings 0,
  payments 0, inventory reservations 0, administrators 0 and notification
  events 0.
- `/api/availability?month=2040-01` returned HTTP 200 with 31 canonical-priced
  dates; `/availability` returned HTTP 200; `/book` remains assisted-only with
  no online payment collection; and `/admin/dashboard` resolves to protected
  Admin Login.

Production auto-deployment setting: **Disabled** (independently confirmed in
the Supabase dashboard on 28 July 2026). The project is on the Free plan, so
the dashboard reports no managed scheduled backups; future mutations require
separately recorded backup or restore-point evidence.

## Preconditions

Record all of the following in the authorized change record:

1. The exact 40-character commit SHA approved for deployment. Confirm the
   checkout with `git rev-parse HEAD`; do not apply from another revision.
2. Clean required CI for that commit.
3. The named mutation approver and operator.
4. The exact Supabase project and environment. Confirm it is the intended
   hosted target without copying project secrets into the record.
5. Timestamped backup or restore-point evidence and the tested recovery owner.
6. The current hosted migration list.
7. Current row counts for `properties`, `pricing_rules`, `customers`,
   `bookings`, `payments`, `inventory_reservations`, `admins` and
   `notification_events`.
8. Confirmation that no real customer, booking, payment or reservation row
   will be changed by this migration.
9. For this historical application, a dry run showed that
   `20260728160000_initialize_canonical_launch_data.sql` was the only pending
   migration. For every future change record, identify the exact approved
   migration and stop if the dry run shows any other pending migration.

## Historical application procedure and required future workflow

Use this procedure for future migrations only. From the approved clean
checkout, authenticate the Supabase CLI through the operator's normal secure
process and link only the approved target. Do not put credentials in shell
arguments, documentation or logs.

When Supabase GitHub `Deploy to production` is disabled, merge the reviewed
repository migration, verify hosted migration alignment, record backup or
restore-point evidence and the named owners, then obtain explicit application
authorization. Before that authorization, inspect the pending plan with the
repository-pinned CLI (`npx --no-install supabase`, currently 2.109.1):

```bash
npx --no-install supabase db push --linked --dry-run
```

Proceed only when the output identifies exactly the migration named in the
approved change record and no other pending migration:

```text
<approved-migration-version_and_name>.sql
```

Only after those gates may the named operator apply the pending migration:

```bash
npx --no-install supabase db push --linked
```

When automatic production deployment is enabled, merging a migration PR is
itself production-application authorization. Before merge, complete the exact
target check, backup or restore-point evidence, named mutation approver,
migration operator, recovery owner and verification owner, the dry run, and
explicit application authorization. After merge, only verify hosted migration
alignment and post-application state; do not run a manual `db push` for that
auto-deployment path.

## Non-destructive verification

Run these queries in the approved hosted SQL interface. They return canonical
configuration or aggregate counts only; they do not expose customer data.

```sql
select
  name,
  slug,
  timezone,
  check_in_time,
  check_out_time,
  cleaning_buffer_minutes,
  max_event_guests,
  max_overnight_guests,
  is_active
from public.properties
where slug = 'silver-oak-estate';

select
  rule_type,
  price_amount_paise,
  advance_amount_paise,
  priority,
  is_active
from public.pricing_rules
where property_id = (
  select id
  from public.properties
  where slug = 'silver-oak-estate'
)
  and rule_type in ('weekday', 'weekend')
  and specific_date is null
  and effective_from is null
  and effective_until is null
order by rule_type;

select
  count(*) filter (
    where slug = 'silver-oak-estate' and is_active
  ) as active_canonical_properties,
  count(*) filter (
    where slug = 'silver-oak-estate'
  ) as all_canonical_properties
from public.properties;

select
  rule_type,
  count(*) as general_rule_count
from public.pricing_rules
where property_id = (
  select id
  from public.properties
  where slug = 'silver-oak-estate'
)
  and rule_type in ('weekday', 'weekend')
  and specific_date is null
  and effective_from is null
  and effective_until is null
group by rule_type
order by rule_type;

select
  (select count(*) from public.customers) as customers,
  (select count(*) from public.bookings) as bookings,
  (select count(*) from public.payments) as payments,
  (select count(*) from public.inventory_reservations) as reservations,
  (select count(*) from public.admins) as administrators,
  (select count(*) from public.notification_events) as notifications;
```

Expected canonical values:

- One active `silver-oak-estate` property.
- `Asia/Kolkata`, `11:00`, `10:00`, 60-minute cleaning buffer, 40 standard
  daytime guests and 10 overnight guests.
- One general weekday rule at 1,500,000 paise with a 500,000-paise advance.
- One general weekend rule at 2,000,000 paise with a 500,000-paise advance.
- Operational-table counts exactly match the recorded pre-migration counts.

Any missing, duplicate or conflicting result is a failed application. Do not
repair it with manual updates.

## Runtime verification

After the separately authorized application:

1. Confirm `/api/availability` no longer returns `PROPERTY_NOT_FOUND`.
2. Confirm `/availability` renders real calendar data.
3. Confirm Monday-Friday dates show INR 15,000 and Saturday-Sunday dates show
   INR 20,000.
4. Select a date and confirm the assisted-booking action is shown.
5. Confirm the WhatsApp/contact copy contains the selected date.
6. Confirm `/book` remains unavailable or assisted while checkout is disabled.
7. Confirm hold creation remains disabled.
8. Confirm payment-order creation remains disabled.
9. As an anonymous caller, confirm direct reads of bookings, reservations,
   customers and payments remain denied.

Do not enable `ONLINE_BOOKING_ENABLED` to perform these checks.

## Rollback and correction

### Before any real booking or reservation references the property

A separately reviewed forward corrective migration may remove only the
canonical pricing records and property inserted by this migration, after
rechecking all foreign-key references and aggregate operational counts. Do not
run ad hoc deletes.

### After any booking or reservation references the property

Do not delete the property or pricing records. Use property deactivation where
supported, a forward corrective migration, or restore from the approved backup
under the incident plan.

Never edit migration history, mark the migration rolled back manually, truncate
tables or manually delete referenced production rows.
