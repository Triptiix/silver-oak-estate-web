# Phase 6B.2 Canonical Launch Data

## Purpose and safety boundary

Migration `20260728160000_initialize_canonical_launch_data.sql` initializes only
the approved, non-sensitive Silver Oak Estate property and its general weekday
and weekend pricing rules. It does not create customers, bookings, payments,
reservations, notifications or administrators. It does not change RLS, grants,
environment variables, provider configuration or online-booking capability.

This runbook does not authorize a hosted change. A named mutation approver must
separately approve the exact target, commit and migration application.

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
9. A dry run showing that
   `20260728160000_initialize_canonical_launch_data.sql` is the only pending
   migration. Stop if any other migration is pending.

## Application

From the approved clean checkout, authenticate the Supabase CLI through the
operator's normal secure process and link only the approved target. Do not put
credentials in shell arguments, documentation or logs.

First inspect the pending plan:

```bash
npx supabase db push --linked --dry-run
```

Proceed only when the output identifies exactly one pending migration:

```text
20260728160000_initialize_canonical_launch_data.sql
```

After the named approver confirms the target, backup evidence and dry-run
output, apply the pending migration:

```bash
npx supabase db push --linked
```

This command is intentionally documented but must not be executed as part of
the repository implementation task.

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
