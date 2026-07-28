begin;

select plan(62);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('b0000000-0000-4000-8000-000000000001', 'manual-operations@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('b0000000-0000-4000-8000-000000000002', 'manual-admin@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('b0000000-0000-4000-8000-000000000003', 'manual-super@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('b0000000-0000-4000-8000-000000000004', 'manual-inactive@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.admins (id, auth_user_id, role, name, email, is_active)
values
  ('b0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', 'operations', 'Manual Operations', 'manual-operations@example.test', true),
  ('b0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000002', 'admin', 'Manual Admin', 'manual-admin@example.test', true),
  ('b0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000003', 'super_admin', 'Manual Super', 'manual-super@example.test', true),
  ('b0000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000004', 'admin', 'Manual Inactive', 'manual-inactive@example.test', false);

create temporary table manual_test_context as
select
  id as property_id,
  timezone,
  (now() at time zone timezone)::date as today,
  (
    select day::date
    from generate_series(
      (now() at time zone timezone)::date + 10,
      (now() at time zone timezone)::date + 20,
      interval '1 day'
    ) as day
    where extract(isodow from day) between 1 and 5
    limit 1
  ) as weekday_date,
  (
    select day::date
    from generate_series(
      (now() at time zone timezone)::date + 21,
      (now() at time zone timezone)::date + 30,
      interval '1 day'
    ) as day
    where extract(isodow from day) in (6, 7)
    limit 1
  ) as weekend_date
from public.properties
where slug = 'silver-oak-estate';

grant select on manual_test_context to authenticated;

select is(
  has_function_privilege(
    'public',
    'public.create_admin_manual_booking(date,text,text,text,integer,integer,text,text,uuid)',
    'EXECUTE'
  ),
  false,
  'public cannot execute manual booking creation'
);
select is(
  has_function_privilege(
    'anon',
    'public.create_admin_manual_booking(date,text,text,text,integer,integer,text,text,uuid)',
    'EXECUTE'
  ),
  false,
  'anonymous callers cannot execute manual booking creation'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.create_admin_manual_booking(date,text,text,text,integer,integer,text,text,uuid)',
    'EXECUTE'
  ),
  true,
  'authenticated callers receive only the narrow creation RPC'
);
select is(
  has_function_privilege('authenticated', 'public.expire_stale_holds(uuid)', 'EXECUTE'),
  false,
  'authenticated administrators cannot execute housekeeping'
);
select is(
  has_function_privilege('service_role', 'public.expire_stale_holds(uuid)', 'EXECUTE'),
  true,
  'service role retains the combined housekeeping entrypoint'
);
select is(
  has_function_privilege(
    'authenticated',
    'private.expire_stale_manual_bookings_internal(integer,timestamptz)',
    'EXECUTE'
  ),
  false,
  'authenticated callers cannot execute the private expiry helper'
);
select results_eq(
  $$
    select count(*)::integer
    from pg_proc
    where oid in (
      'public.create_admin_manual_booking(date,text,text,text,integer,integer,text,text,uuid)'::regprocedure,
      'public.expire_stale_holds(uuid)'::regprocedure,
      'private.expire_stale_manual_bookings_internal(integer,timestamptz)'::regprocedure
    )
      and prosecdef
      and proconfig[1] = 'search_path=pg_catalog'
  $$,
  array[3::integer],
  'creation and expiry functions are security definer with fixed search paths'
);
select results_eq(
  $$
    select count(*)::integer
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname like '%admin%manual%booking%'
  $$,
  array[1::integer],
  'no generic manual booking status function is exposed'
);

-- Test-only receipt visibility; rolled back with this transaction.
grant select on public.admin_operation_events, public.bookings,
  public.customers, public.inventory_reservations, public.payments,
  public.booking_events, public.properties
to authenticated;
create policy phase5b_manual_test_receipt_read
on public.admin_operation_events for select to authenticated using (true);
create policy phase5b_manual_test_booking_read
on public.bookings for select to authenticated using (true);
create policy phase5b_manual_test_customer_read
on public.customers for select to authenticated using (true);
create policy phase5b_manual_test_reservation_read
on public.inventory_reservations for select to authenticated using (true);
create policy phase5b_manual_test_payment_read
on public.payments for select to authenticated using (true);
create policy phase5b_manual_test_booking_event_read
on public.booking_events for select to authenticated using (true);
create policy phase5b_manual_test_property_read
on public.properties for select to authenticated using (true);

set local role authenticated;
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000001',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select weekday_date from manual_test_context),
    'b0000000-0000-4000-8000-000000000101'
  ),
  '42501',
  'admin_unauthorized',
  'unauthenticated callers are denied'
);
set local "request.jwt.claim.sub" = 'b0000000-0000-4000-8000-000000000004';
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000001',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select weekday_date from manual_test_context),
    'b0000000-0000-4000-8000-000000000102'
  ),
  '42501',
  'admin_unauthorized',
  'inactive administrators are denied'
);

set local "request.jwt.claim.sub" = 'b0000000-0000-4000-8000-000000000001';
select is(
  (
    public.create_admin_manual_booking(
      (select weekday_date from manual_test_context),
      '  Operations Guest  ',
      '+91 99000 00001',
      '  OPS@example.test ',
      4,
      2,
      '  ',
      'manual_upi',
      'b0000000-0000-4000-8000-000000000103'
    )
  ).applied,
  true,
  'operations can create a manual booking'
);
select is(
  (
    select booking_status from public.bookings
    where customer_phone_snapshot = '+919900000001'
  ),
  'payment_pending'::public.booking_status,
  'manual booking starts payment pending'
);
select is(
  (
    select source || ':' || booking_type from public.bookings
    where customer_phone_snapshot = '+919900000001'
  ),
  'admin_manual:manual_one_night',
  'booking source and type are database owned'
);
select matches(
  (
    select booking_reference from public.bookings
    where customer_phone_snapshot = '+919900000001'
  ),
  '^SOE-[0-9]{8}-[A-F0-9]{8}$',
  'manual booking reference uses the canonical format'
);
select is(
  (
    select customer_email_snapshot from public.bookings
    where customer_phone_snapshot = '+919900000001'
  ),
  'ops@example.test',
  'email is trimmed and normalized'
);
select is(
  (
    select special_requests from public.bookings
    where customer_phone_snapshot = '+919900000001'
  ),
  null,
  'empty special requests normalize to null'
);
select results_eq(
  $$
    select count(*)::integer
    from public.inventory_reservations as reservation
    join public.bookings as booking on booking.id = reservation.booking_id
    where booking.customer_phone_snapshot = '+919900000001'
      and reservation.reservation_type = 'manual_booking'
      and reservation.status = 'active'
      and reservation.expires_at is not null
  $$,
  array[1::integer],
  'creation inserts one active expiring manual reservation'
);
select results_eq(
  $$
    select count(*)::integer
    from public.payments as payment
    join public.bookings as booking on booking.id = payment.booking_id
    where booking.customer_phone_snapshot = '+919900000001'
      and payment.provider = 'manual_upi'
      and payment.status = 'pending'
      and not payment.signature_verified
      and payment.manual_reference is null
      and payment.verified_by_admin_id is null
      and payment.manual_verified_at is null
      and payment.provider_order_id is null
      and payment.provider_payment_id is null
      and payment.last_provider_event_id is null
  $$,
  array[1::integer],
  'creation inserts one unverified pending manual payment attempt'
);
select is(
  (
    select reservation.expires_at = payment.attempt_expires_at
    from public.bookings as booking
    join public.inventory_reservations as reservation on reservation.booking_id = booking.id
    join public.payments as payment on payment.booking_id = booking.id
    where booking.customer_phone_snapshot = '+919900000001'
  ),
  true,
  'reservation and payment use one expiry instant'
);
select is(
  (
    select payment.amount_paise = booking.advance_amount_paise
      and payment.currency = 'INR'
      and booking.balance_amount_paise
        = booking.total_amount_paise - booking.advance_amount_paise
    from public.bookings as booking
    join public.payments as payment on payment.booking_id = booking.id
    where booking.customer_phone_snapshot = '+919900000001'
  ),
  true,
  'payment and booking amounts are server-owned and internally consistent'
);
select results_eq(
  $$
    select count(*)::integer
    from public.booking_events as event
    join public.bookings as booking on booking.id = event.booking_id
    where booking.customer_phone_snapshot = '+919900000001'
      and event.event_type = 'manual_booking_created'
      and event.actor_type = 'admin'
      and event.actor_id = 'b0000000-0000-4000-8000-000000000011'
      and event.metadata = '{}'::jsonb
  $$,
  array[1::integer],
  'creation writes one minimal administrator-authored booking event'
);
select results_eq(
  $$
    select count(*)::integer
    from public.admin_operation_events as event
    join public.bookings as booking on booking.id = event.booking_id
    where booking.customer_phone_snapshot = '+919900000001'
      and event.action_type = 'manual_booking_created'
      and event.inventory_reservation_id is not null
      and event.payment_id is not null
      and event.request_fingerprint ~ '^[a-f0-9]{64}$'
      and event.internal_note is null
  $$,
  array[1::integer],
  'creation writes one complete immutable idempotency receipt'
);

select is(
  (
    public.create_admin_manual_booking(
      (select weekday_date from manual_test_context),
      'Operations Guest',
      '+919900000001',
      'ops@example.test',
      4, 2, null, 'manual_upi',
      'b0000000-0000-4000-8000-000000000103'
    )
  ).applied,
  false,
  'exact retry returns replay'
);
select results_eq(
  $$select count(*)::integer from public.bookings where customer_phone_snapshot = '+919900000001'$$,
  array[1::integer],
  'exact retry creates no duplicate booking'
);
select results_eq(
  $$select count(*)::integer from public.customers where phone = '+919900000001'$$,
  array[1::integer],
  'exact retry creates no duplicate customer'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Changed Guest','+919900000001','ops@example.test',4,2,null,'manual_upi',%L::uuid)$$,
    (select weekday_date from manual_test_context),
    'b0000000-0000-4000-8000-000000000103'
  ),
  'P0001', 'idempotency_conflict',
  'changed customer input conflicts with the request fingerprint'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Operations Guest','+919900000001','ops@example.test',4,2,null,'payment_link',%L::uuid)$$,
    (select weekday_date from manual_test_context),
    'b0000000-0000-4000-8000-000000000103'
  ),
  'P0001', 'idempotency_conflict',
  'changed provider conflicts with the request fingerprint'
);

select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000009',null,2,0,null,'cash',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000109'
  ),
  '22023', 'invalid_manual_provider',
  'invalid manual provider is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'','+919900000009',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000110'
  ),
  '22023', 'invalid_manual_booking_request',
  'empty customer name is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,repeat('x',121),'+919900000009',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000111'
  ),
  '22023', 'invalid_manual_booking_request',
  'oversized customer name is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','123',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000112'
  ),
  '22023', 'invalid_manual_booking_request',
  'invalid phone is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000009','bad-email',2,0,null,'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000113'
  ),
  '22023', 'invalid_manual_booking_request',
  'invalid email is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000009',null,0,0,null,'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000114'
  ),
  '22023', 'capacity_exceeded',
  'guest count below minimum is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000009',null,41,0,null,'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000115'
  ),
  '22023', 'capacity_exceeded',
  'event capacity excess is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000009',null,11,11,null,'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000116'
  ),
  '22023', 'capacity_exceeded',
  'overnight capacity excess is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000009',null,2,3,null,'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000117'
  ),
  '22023', 'capacity_exceeded',
  'overnight count above total is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000009',null,2,0,repeat('x',1001),'manual_upi',%L::uuid)$$,
    (select today + 40 from manual_test_context),
    'b0000000-0000-4000-8000-000000000118'
  ),
  '22023', 'invalid_manual_booking_request',
  'oversized special requests are rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Guest','+919900000009',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select today - 1 from manual_test_context),
    'b0000000-0000-4000-8000-000000000119'
  ),
  '22023', 'past_booking_date',
  'past booking date is rejected'
);

set local "request.jwt.claim.sub" = 'b0000000-0000-4000-8000-000000000002';
select is(
  (
    public.create_admin_manual_booking(
      (select weekend_date from manual_test_context),
      'Admin Guest', '+919900000002', '', 2, null, null,
      'payment_link', 'b0000000-0000-4000-8000-000000000120'
    )
  ).total_amount_paise,
  2000000::bigint,
  'admin can create and weekend price is server resolved'
);
select is(
  (
    select customer_email_snapshot from public.bookings
    where customer_phone_snapshot = '+919900000002'
  ),
  null,
  'empty email normalizes to null'
);
select is(
  (
    select extract(epoch from reservation.expires_at - reservation.created_at)
      between 1799 and 1801
    from public.inventory_reservations as reservation
    join public.bookings as booking on booking.id = reservation.booking_id
    where booking.customer_phone_snapshot = '+919900000002'
  ),
  true,
  'seeded 30-minute manual hold is applied'
);
select is(
  (
    select extract(hour from booking.check_in_at at time zone property.timezone) = 11
      and extract(hour from booking.check_out_at at time zone property.timezone) = 10
      and (booking.check_out_at at time zone property.timezone)::date
        = (booking.check_in_at at time zone property.timezone)::date + 1
    from public.bookings as booking
    join public.properties as property on property.id = booking.property_id
    where booking.customer_phone_snapshot = '+919900000002'
  ),
  true,
  'manual booking uses configured local times for exactly one night'
);

set local "request.jwt.claim.sub" = 'b0000000-0000-4000-8000-000000000003';
select is(
  (
    public.create_admin_manual_booking(
      (select today + 35 from manual_test_context),
      'Super Guest', '+919900000003', null, 2, 0, null,
      'manual_upi', 'b0000000-0000-4000-8000-000000000120'
    )
  ).applied,
  true,
  'super admin can create and independently reuse another actor request UUID'
);

reset role;

update public.site_settings
set setting_value = '"not-an-integer"'::jsonb
where setting_key = 'manual_payment_hold_minutes';
set local role authenticated;
set local "request.jwt.claim.sub" = 'b0000000-0000-4000-8000-000000000002';
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Config Guest','+919900000004',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select today + 42 from manual_test_context),
    'b0000000-0000-4000-8000-000000000121'
  ),
  'P0001', 'manual_hold_configuration_invalid',
  'malformed hold configuration fails closed'
);
reset role;
update public.site_settings set setting_value = '0'::jsonb
where setting_key = 'manual_payment_hold_minutes';
set local role authenticated;
set local "request.jwt.claim.sub" = 'b0000000-0000-4000-8000-000000000002';
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Config Guest','+919900000004',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select today + 42 from manual_test_context),
    'b0000000-0000-4000-8000-000000000122'
  ),
  'P0001', 'manual_hold_configuration_invalid',
  'zero hold configuration fails closed'
);
reset role;
update public.site_settings set setting_value = '61'::jsonb
where setting_key = 'manual_payment_hold_minutes';
set local role authenticated;
set local "request.jwt.claim.sub" = 'b0000000-0000-4000-8000-000000000002';
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Config Guest','+919900000004',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select today + 42 from manual_test_context),
    'b0000000-0000-4000-8000-000000000123'
  ),
  'P0001', 'manual_hold_configuration_invalid',
  'hold configuration above 60 fails closed'
);
reset role;
delete from public.site_settings where setting_key = 'manual_payment_hold_minutes';
set local role authenticated;
set local "request.jwt.claim.sub" = 'b0000000-0000-4000-8000-000000000002';
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(%L::date,'Config Guest','+919900000004',null,2,0,null,'manual_upi',%L::uuid)$$,
    (select today + 42 from manual_test_context),
    'b0000000-0000-4000-8000-000000000124'
  ),
  'P0001', 'manual_hold_configuration_invalid',
  'missing hold configuration fails closed'
);
select results_eq(
  $$select count(*)::integer from public.customers where phone = '+919900000004'$$,
  array[0::integer],
  'configuration failures leave no partial customer'
);
reset role;
insert into public.site_settings (
  setting_key, setting_value, description, is_sensitive
) values (
  'manual_payment_hold_minutes', '30'::jsonb,
  'Manual payment fallback hold duration.', false
);

-- Expire one unpaid manual booking and verify system attribution.
update public.inventory_reservations
set expires_at = now() - interval '1 minute'
where booking_id = (
  select id from public.bookings where customer_phone_snapshot = '+919900000003'
);
update public.payments
set attempt_expires_at = now() - interval '1 minute'
where booking_id = (
  select id from public.bookings where customer_phone_snapshot = '+919900000003'
);
select is(public.expire_stale_holds(null) >= 1, true, 'combined housekeeping expires stale manual bookings');
select is(
  (select booking_status from public.bookings where customer_phone_snapshot = '+919900000003'),
  'expired'::public.booking_status,
  'stale manual booking becomes expired'
);
select is(
  (
    select status from public.inventory_reservations
    where booking_id = (
      select id from public.bookings where customer_phone_snapshot = '+919900000003'
    )
  ),
  'expired'::public.reservation_status,
  'stale manual reservation becomes expired'
);
select is(
  (
    select status from public.payments
    where booking_id = (
      select id from public.bookings where customer_phone_snapshot = '+919900000003'
    )
  ),
  'expired'::public.payment_status,
  'stale pending manual payment becomes expired'
);
select results_eq(
  $$
    select count(*)::integer
    from public.booking_events
    where booking_id = (
      select id from public.bookings where customer_phone_snapshot = '+919900000003'
    )
      and event_type = 'manual_booking_expired'
      and actor_type = 'system'
      and actor_id is null
      and metadata = '{}'::jsonb
  $$,
  array[1::integer],
  'automatic expiry writes exactly one system event'
);
select results_eq(
  $$
    select count(*)::integer
    from public.admin_operation_events
    where action_type = 'manual_booking_expired'
  $$,
  array[0::integer],
  'automatic expiry creates no administrator receipt'
);
select is(public.expire_stale_holds(null), 0, 'repeated housekeeping is idempotent');
select results_eq(
  $$
    select count(*)::integer
    from public.booking_events
    where event_type = 'manual_booking_expired'
  $$,
  array[1::integer],
  'repeated housekeeping creates no duplicate expiry event'
);

-- Recovery state is deliberately excluded from unpaid expiry.
update public.inventory_reservations
set expires_at = now() - interval '1 minute'
where booking_id = (
  select id from public.bookings where customer_phone_snapshot = '+919900000002'
);
update public.payments
set status = 'reconciliation_required'
where booking_id = (
  select id from public.bookings where customer_phone_snapshot = '+919900000002'
);
select is(public.expire_stale_holds(null), 0, 'recovery-state manual payment is excluded from ordinary expiry');
select is(
  (select booking_status from public.bookings where customer_phone_snapshot = '+919900000002'),
  'payment_pending'::public.booking_status,
  'excluded financial state leaves booking unchanged'
);
select is(
  (
    select status from public.inventory_reservations
    where booking_id = (
      select id from public.bookings where customer_phone_snapshot = '+919900000002'
    )
  ),
  'active'::public.reservation_status,
  'excluded financial state leaves inventory active'
);

select is(
  (
    select count(*)::integer
    from jsonb_object_keys(to_jsonb(public.create_admin_manual_booking(
      (select today + 46 from manual_test_context),
      'Safe Result', '+919900000005', null, 2, 0, null,
      'payment_link', 'b0000000-0000-4000-8000-000000000125'
    ))) as key
    where key in (
      'booking_id', 'customer_id', 'reservation_id', 'payment_id',
      'property_id', 'actor_admin_id', 'public_confirmation_token',
      'request_fingerprint', 'idempotency_key', 'customer_phone',
      'customer_email'
    )
  ),
  0,
  'creation result excludes internal IDs secrets fingerprints and raw PII'
);
select results_eq(
  $$
    select count(*)::integer
    from public.booking_events
    where metadata::text ~* 'guest|example|99000|token|fingerprint|special'
  $$,
  array[0::integer],
  'booking event metadata contains no PII token or request data'
);
select results_eq(
  $$
    select count(*)::integer
    from public.admin_operation_events
    where internal_note is not null
       or reason_category <> 'manual_booking'
  $$,
  array[0::integer],
  'manual booking receipts contain only fixed operational reason data'
);

select * from finish();
rollback;
