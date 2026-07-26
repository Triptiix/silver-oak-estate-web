begin;

select plan(84);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('a0000000-0000-4000-8000-000000000001', 'blocks-operations@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('a0000000-0000-4000-8000-000000000002', 'blocks-admin@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('a0000000-0000-4000-8000-000000000003', 'blocks-super@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('a0000000-0000-4000-8000-000000000004', 'blocks-inactive@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.admins (id, auth_user_id, role, name, email, is_active)
values
  ('a0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'operations', 'Blocks Operations', 'blocks-operations@example.test', true),
  ('a0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'admin', 'Blocks Admin', 'blocks-admin@example.test', true),
  ('a0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', 'super_admin', 'Blocks Super', 'blocks-super@example.test', true),
  ('a0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000004', 'admin', 'Blocks Inactive', 'blocks-inactive@example.test', false);

create temporary table block_test_context as
select
  id as property_id,
  (now() at time zone timezone)::date as today
from public.properties
where slug = 'silver-oak-estate';

grant select on block_test_context to authenticated;

select is(
  has_function_privilege('public', 'public.create_admin_owner_block(date,date,uuid,text,text)', 'EXECUTE'),
  false,
  'public cannot execute owner-block creation'
);
select is(
  has_function_privilege('anon', 'public.create_admin_maintenance_block(date,date,uuid,text,text)', 'EXECUTE'),
  false,
  'anonymous callers cannot execute maintenance-block creation'
);
select is(
  has_function_privilege('authenticated', 'public.create_admin_owner_block(date,date,uuid,text,text)', 'EXECUTE'),
  true,
  'authenticated callers receive only the narrow owner create RPC'
);
select is(
  has_function_privilege('authenticated', 'public.create_admin_maintenance_block(date,date,uuid,text,text)', 'EXECUTE'),
  true,
  'authenticated callers receive the narrow maintenance create RPC'
);
select is(
  has_function_privilege('authenticated', 'public.release_admin_owner_block(uuid,uuid,text,text)', 'EXECUTE'),
  true,
  'authenticated callers receive the narrow owner release RPC'
);
select is(
  has_function_privilege('authenticated', 'public.release_admin_maintenance_block(uuid,uuid,text,text)', 'EXECUTE'),
  true,
  'authenticated callers receive the narrow maintenance release RPC'
);
select is(
  has_function_privilege(
    'authenticated',
    'private.create_admin_inventory_block_internal(reservation_type,admin_operation_action,admin_role[],date,date,uuid,text,text)',
    'EXECUTE'
  ),
  false,
  'authenticated callers cannot execute the private creation helper'
);
select is(
  has_function_privilege(
    'authenticated',
    'private.release_admin_inventory_block_internal(reservation_type,admin_operation_action,admin_role[],uuid,uuid,text,text)',
    'EXECUTE'
  ),
  false,
  'authenticated callers cannot execute the private release helper'
);
select results_eq(
  $$
    select count(*)::integer
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname like '%admin%block%'
  $$,
  array[4::integer],
  'only four narrow public inventory-block functions exist'
);
select results_eq(
  $$
    select count(*)::integer
    from pg_proc
    where oid in (
      'public.create_admin_owner_block(date,date,uuid,text,text)'::regprocedure,
      'public.create_admin_maintenance_block(date,date,uuid,text,text)'::regprocedure,
      'public.release_admin_owner_block(uuid,uuid,text,text)'::regprocedure,
      'public.release_admin_maintenance_block(uuid,uuid,text,text)'::regprocedure,
      'private.create_admin_inventory_block_internal(reservation_type,admin_operation_action,admin_role[],date,date,uuid,text,text)'::regprocedure,
      'private.release_admin_inventory_block_internal(reservation_type,admin_operation_action,admin_role[],uuid,uuid,text,text)'::regprocedure
    )
      and prosecdef
      and proconfig[1] = 'search_path=pg_catalog'
  $$,
  array[6::integer],
  'all public and private block functions are security definer with fixed search paths'
);

-- Test-only visibility for inspecting receipts produced by SECURITY DEFINER
-- functions. Both the grant and policy roll back with this pgTAP transaction.
grant select on public.admin_operation_events to authenticated;
create policy phase5b_test_receipt_read
on public.admin_operation_events
for select
to authenticated
using (true);

set local role authenticated;

select throws_ok(
  format(
    $$select public.create_admin_maintenance_block(%L::date,%L::date,%L::uuid,'maintenance',null)$$,
    (select today + 10 from block_test_context),
    (select today + 10 from block_test_context),
    'a0000000-0000-4000-8000-000000000101'
  ),
  '42501',
  'admin_unauthorized',
  'an unauthenticated database session is denied'
);

set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000004';
select throws_ok(
  format(
    $$select public.create_admin_maintenance_block(%L::date,%L::date,%L::uuid,'maintenance',null)$$,
    (select today + 10 from block_test_context),
    (select today + 10 from block_test_context),
    'a0000000-0000-4000-8000-000000000102'
  ),
  '42501',
  'admin_unauthorized',
  'an inactive administrator is denied'
);

set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000001';
select is(
  (
    public.create_admin_maintenance_block(
      (select today + 10 from block_test_context),
      (select today + 10 from block_test_context),
      'a0000000-0000-4000-8000-000000000103',
      'maintenance',
      '  '
    )
  ).applied,
  true,
  'operations can create a maintenance block'
);
select is(
  (
    select (end_at at time zone property.timezone)::date
      - (start_at at time zone property.timezone)::date
    from public.inventory_reservations as reservation
    join public.properties as property on property.id = reservation.property_id
    where reservation.source = 'admin_manual'
      and reservation.reservation_type = 'maintenance_block'
      and (reservation.start_at at time zone property.timezone)::date
        = (select today + 10 from block_test_context)
  ),
  1,
  'same-day inclusive creation blocks exactly one night'
);
select is(
  (
    select internal_note
    from public.admin_operation_events
    where request_id = 'a0000000-0000-4000-8000-000000000103'
  ),
  null,
  'empty trimmed notes normalize to null'
);
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'owner_use',null)$$,
    (select today + 12 from block_test_context),
    (select today + 12 from block_test_context),
    'a0000000-0000-4000-8000-000000000104'
  ),
  '42501',
  'admin_unauthorized',
  'operations cannot create owner blocks'
);

select throws_ok(
  format(
    $$select public.release_admin_owner_block(%L::uuid,%L::uuid,'corrected',null)$$,
    (
      select id from public.inventory_reservations
      where reservation_type = 'maintenance_block' and source = 'admin_manual'
      limit 1
    ),
    'a0000000-0000-4000-8000-000000000105'
  ),
  '42501',
  'admin_unauthorized',
  'operations cannot release owner blocks'
);

select is(
  (
    public.release_admin_maintenance_block(
      (
        select id from public.inventory_reservations
        where reservation_type = 'maintenance_block' and source = 'admin_manual'
        limit 1
      ),
      'a0000000-0000-4000-8000-000000000106',
      'no_longer_needed',
      null
    )
  ).status,
  'released'::public.reservation_status,
  'operations can release a maintenance block'
);

set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000002';
select is(
  (
    public.create_admin_owner_block(
      (select today + 20 from block_test_context),
      (select today + 22 from block_test_context),
      'a0000000-0000-4000-8000-000000000110',
      'owner_use',
      '  approved owner stay  '
    )
  ).reservation_type,
  'owner_block'::public.reservation_type,
  'admin can create an owner block'
);
select is(
  (
    select (end_at at time zone property.timezone)::date
      - (start_at at time zone property.timezone)::date
    from public.inventory_reservations as reservation
    join public.properties as property on property.id = reservation.property_id
    where reservation.reservation_type = 'owner_block'
      and reservation.source = 'admin_manual'
      and (reservation.start_at at time zone property.timezone)::date
        = (select today + 20 from block_test_context)
  ),
  3,
  'multi-night inclusive creation uses the final checkout boundary'
);
select results_eq(
  $$
    select count(*)::integer
    from public.inventory_reservations
    where reservation_type = 'owner_block'
      and source = 'admin_manual'
      and booking_id is null
      and external_reservation_id is null
      and expires_at is null
  $$,
  array[1::integer],
  'owner creation writes one structurally isolated active reservation'
);
select is(
  (
    select internal_note from public.admin_operation_events
    where request_id = 'a0000000-0000-4000-8000-000000000110'
  ),
  'approved owner stay',
  'creation notes are trimmed in the immutable receipt'
);
select is(
  (
    public.create_admin_owner_block(
      (select today + 20 from block_test_context),
      (select today + 22 from block_test_context),
      'a0000000-0000-4000-8000-000000000110',
      'owner_use',
      'approved owner stay'
    )
  ).applied,
  false,
  'an exact create retry returns a replay result'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events where request_id = 'a0000000-0000-4000-8000-000000000110'$$,
  array[1::integer],
  'an exact create retry creates no duplicate receipt'
);
select results_eq(
  $$
    select count(*)::integer
    from public.inventory_reservations as reservation
    join public.properties as property on property.id = reservation.property_id
    where reservation.reservation_type = 'owner_block'
      and (reservation.start_at at time zone property.timezone)::date
        = (select today + 20 from block_test_context)
  $$,
  array[1::integer],
  'an exact create retry creates no duplicate reservation'
);
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'owner_use','approved owner stay')$$,
    (select today + 20 from block_test_context),
    (select today + 23 from block_test_context),
    'a0000000-0000-4000-8000-000000000110'
  ),
  'P0001',
  'idempotency_conflict',
  'reusing a create request ID with different dates is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'other','approved owner stay')$$,
    (select today + 20 from block_test_context),
    (select today + 22 from block_test_context),
    'a0000000-0000-4000-8000-000000000110'
  ),
  'P0001',
  'idempotency_conflict',
  'reusing a create request ID with a different reason is rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'owner_use',null)$$,
    (select today - 1 from block_test_context),
    (select today - 1 from block_test_context),
    'a0000000-0000-4000-8000-000000000111'
  ),
  '22023',
  'past_block_date',
  'past first dates are rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'owner_use',null)$$,
    (select today + 30 from block_test_context),
    (select today + 29 from block_test_context),
    'a0000000-0000-4000-8000-000000000112'
  ),
  '22023',
  'invalid_block_request',
  'reversed date ranges are rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'owner_use',null)$$,
    (select today + 30 from block_test_context),
    (select today + 61 from block_test_context),
    'a0000000-0000-4000-8000-000000000113'
  ),
  '22023',
  'invalid_block_request',
  'ranges above 31 nights are rejected'
);
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'maintenance',null)$$,
    (select today + 30 from block_test_context),
    (select today + 30 from block_test_context),
    'a0000000-0000-4000-8000-000000000114'
  ),
  '22023',
  'invalid_block_reason',
  'owner creation rejects maintenance reasons'
);
select throws_ok(
  format(
    $$select public.create_admin_maintenance_block(%L::date,%L::date,%L::uuid,'owner_use',null)$$,
    (select today + 30 from block_test_context),
    (select today + 30 from block_test_context),
    'a0000000-0000-4000-8000-000000000115'
  ),
  '22023',
  'invalid_block_reason',
  'maintenance creation rejects owner reasons'
);
select throws_ok(
  format(
    $$select public.create_admin_maintenance_block(%L::date,%L::date,%L::uuid,'repair',repeat('x',501))$$,
    (select today + 30 from block_test_context),
    (select today + 30 from block_test_context),
    'a0000000-0000-4000-8000-000000000116'
  ),
  '22023',
  'invalid_block_request',
  'oversized creation notes are rejected'
);

select throws_ok(
  format(
    $$select public.create_admin_maintenance_block(%L::date,%L::date,%L::uuid,'repair',null)$$,
    (select today + 21 from block_test_context),
    (select today + 21 from block_test_context),
    'a0000000-0000-4000-8000-000000000117'
  ),
  'P0001',
  'date_unavailable',
  'maintenance creation cannot overlap an active owner block'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events where request_id = 'a0000000-0000-4000-8000-000000000117'$$,
  array[0::integer],
  'overlap rejection creates no misleading receipt'
);

reset role;

insert into public.inventory_reservations (
  id, property_id, reservation_type, status, start_at, end_at, expires_at, source
)
select
  'a0000000-0000-4000-8000-000000000201',
  property_id,
  'temporary_hold',
  'active',
  now() - interval '20 minutes',
  now() + interval '20 minutes',
  now() - interval '1 minute',
  'test-stale-admin-block'
from block_test_context;

set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000002';
select is(
  (
    public.create_admin_maintenance_block(
      (select today + 32 from block_test_context),
      (select today + 32 from block_test_context),
      'a0000000-0000-4000-8000-000000000118',
      'inspection',
      null
    )
  ).applied,
  true,
  'valid block creation succeeds while transactionally cleaning stale holds'
);
select is(
  (
    select status from public.inventory_reservations
    where id = 'a0000000-0000-4000-8000-000000000201'
  ),
  'expired'::public.reservation_status,
  'block creation invokes canonical stale temporary-hold expiry'
);

select is(
  (
    public.release_admin_owner_block(
      (
        select reservation.id
        from public.inventory_reservations as reservation
        join public.properties as property on property.id = reservation.property_id
        where reservation.reservation_type = 'owner_block'
          and (reservation.start_at at time zone property.timezone)::date
            = (select today + 20 from block_test_context)
      ),
      'a0000000-0000-4000-8000-000000000120',
      'rescheduled',
      '  calendar changed  '
    )
  ).applied,
  true,
  'admin can release an active owner block'
);
select is(
  (
    select status
    from public.inventory_reservations as reservation
    join public.properties as property on property.id = reservation.property_id
    where reservation.reservation_type = 'owner_block'
      and (reservation.start_at at time zone property.timezone)::date
        = (select today + 20 from block_test_context)
  ),
  'released'::public.reservation_status,
  'release changes only the reservation status to released'
);
select is(
  (
    select internal_note from public.admin_operation_events
    where request_id = 'a0000000-0000-4000-8000-000000000120'
  ),
  'calendar changed',
  'release receipt stores the trimmed bounded note'
);
select is(
  (
    public.release_admin_owner_block(
      (
        select inventory_reservation_id from public.admin_operation_events
        where request_id = 'a0000000-0000-4000-8000-000000000120'
      ),
      'a0000000-0000-4000-8000-000000000120',
      'rescheduled',
      'calendar changed'
    )
  ).applied,
  false,
  'exact release retry returns the prior outcome'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events where request_id = 'a0000000-0000-4000-8000-000000000120'$$,
  array[1::integer],
  'exact release retry creates no duplicate receipt'
);
select throws_ok(
  format(
    $$select public.release_admin_owner_block(%L::uuid,%L::uuid,'other','calendar changed')$$,
    (
      select inventory_reservation_id from public.admin_operation_events
      where request_id = 'a0000000-0000-4000-8000-000000000120'
    ),
    'a0000000-0000-4000-8000-000000000120'
  ),
  'P0001',
  'idempotency_conflict',
  'changed release inputs conflict with the prior request'
);
select throws_ok(
  format(
    $$select public.release_admin_owner_block(%L::uuid,%L::uuid,'corrected',null)$$,
    (
      select id from public.inventory_reservations
      where reservation_type = 'maintenance_block' and status = 'active'
      limit 1
    ),
    'a0000000-0000-4000-8000-000000000121'
  ),
  'P0001',
  'wrong_block_type',
  'owner release rejects maintenance blocks'
);

select is(
  (
    public.create_admin_maintenance_block(
      (select today + 35 from block_test_context),
      (select today + 35 from block_test_context),
      'a0000000-0000-4000-8000-000000000122',
      'repair',
      null
    )
  ).applied,
  true,
  'admin can create a maintenance block'
);
select is(
  (
    public.release_admin_maintenance_block(
      (
        select reservation.id
        from public.inventory_reservations as reservation
        join public.properties as property on property.id = reservation.property_id
        where reservation.reservation_type = 'maintenance_block'
          and (reservation.start_at at time zone property.timezone)::date
            = (select today + 35 from block_test_context)
      ),
      'a0000000-0000-4000-8000-000000000123',
      'corrected',
      null
    )
  ).applied,
  true,
  'admin can release a maintenance block'
);
select throws_ok(
  format(
    $$select public.release_admin_maintenance_block(%L::uuid,%L::uuid,'corrected',null)$$,
    (
      select inventory_reservation_id from public.admin_operation_events
      where request_id = 'a0000000-0000-4000-8000-000000000120'
    ),
    'a0000000-0000-4000-8000-000000000124'
  ),
  'P0001',
  'wrong_block_type',
  'maintenance release rejects owner blocks'
);
select throws_ok(
  format(
    $$select public.release_admin_maintenance_block(%L::uuid,%L::uuid,'corrected',null)$$,
    (
      select inventory_reservation_id from public.admin_operation_events
      where request_id = 'a0000000-0000-4000-8000-000000000123'
    ),
    'a0000000-0000-4000-8000-000000000125'
  ),
  'P0001',
  'block_not_active',
  'a separately released reservation returns stale state'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events where request_id = 'a0000000-0000-4000-8000-000000000125'$$,
  array[0::integer],
  'stale release creates no success receipt'
);
select throws_ok(
  $$select public.release_admin_owner_block(gen_random_uuid(),'a0000000-0000-4000-8000-000000000126','other',null)$$,
  'P0002',
  'block_not_found',
  'release distinguishes a missing target'
);
select throws_ok(
  format(
    $$select public.release_admin_owner_block(%L::uuid,%L::uuid,'other',repeat('x',501))$$,
    (
      select inventory_reservation_id from public.admin_operation_events
      where request_id = 'a0000000-0000-4000-8000-000000000120'
    ),
    'a0000000-0000-4000-8000-000000000127'
  ),
  '22023',
  'invalid_release_request',
  'oversized release notes are rejected'
);

set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000003';
select is(
  (
    public.create_admin_owner_block(
      (select today + 40 from block_test_context),
      (select today + 40 from block_test_context),
      'a0000000-0000-4000-8000-000000000130',
      'private_event',
      null
    )
  ).applied,
  true,
  'super admin can create owner blocks'
);
select is(
  (
    public.create_admin_maintenance_block(
      (select today + 42 from block_test_context),
      (select today + 42 from block_test_context),
      'a0000000-0000-4000-8000-000000000131',
      'safety',
      null
    )
  ).applied,
  true,
  'super admin can create maintenance blocks'
);
select is(
  (
    public.release_admin_owner_block(
      (
        select reservation.id
        from public.inventory_reservations as reservation
        join public.properties as property on property.id = reservation.property_id
        where reservation.reservation_type = 'owner_block'
          and (reservation.start_at at time zone property.timezone)::date
            = (select today + 40 from block_test_context)
      ),
      'a0000000-0000-4000-8000-000000000132',
      'no_longer_needed',
      null
    )
  ).status,
  'released'::public.reservation_status,
  'super admin can release owner blocks'
);
select is(
  (
    public.release_admin_maintenance_block(
      (
        select reservation.id
        from public.inventory_reservations as reservation
        join public.properties as property on property.id = reservation.property_id
        where reservation.reservation_type = 'maintenance_block'
          and (reservation.start_at at time zone property.timezone)::date
            = (select today + 42 from block_test_context)
      ),
      'a0000000-0000-4000-8000-000000000133',
      'no_longer_needed',
      null
    )
  ).status,
  'released'::public.reservation_status,
  'super admin can release maintenance blocks'
);

select is(
  (
    select count(*)::integer
    from jsonb_object_keys(
      to_jsonb(public.create_admin_owner_block(
        (select today + 44 from block_test_context),
        (select today + 44 from block_test_context),
        'a0000000-0000-4000-8000-000000000134',
        'other',
        null
      ))
    ) as key
    where key in (
      'id', 'reservation_id', 'property_id', 'actor_admin_id',
      'request_fingerprint', 'booking_id', 'payment_id'
    )
  ),
  0,
  'create results contain no internal identifiers or fingerprint'
);
select is(
  (
    select count(*)::integer
    from jsonb_object_keys(
      to_jsonb(public.release_admin_owner_block(
        (
          select reservation.id
          from public.inventory_reservations as reservation
          join public.properties as property on property.id = reservation.property_id
          where reservation.reservation_type = 'owner_block'
            and (reservation.start_at at time zone property.timezone)::date
              = (select today + 44 from block_test_context)
        ),
        'a0000000-0000-4000-8000-000000000135',
        'other',
        null
      ))
    ) as key
    where key in (
      'id', 'reservation_id', 'property_id', 'actor_admin_id',
      'request_fingerprint', 'booking_id', 'payment_id'
    )
  ),
  0,
  'release results contain no internal identifiers or fingerprint'
);

reset role;

insert into public.bookings (
  id, booking_reference, public_confirmation_token, property_id,
  customer_name_snapshot, customer_phone_snapshot, source, booking_type,
  check_in_at, check_out_at, guest_count, overnight_guest_count,
  total_amount_paise, advance_amount_paise, balance_amount_paise, booking_status
)
select
  fixture.id,
  fixture.reference,
  fixture.token,
  context.property_id,
  'Inventory Fixture',
  '+919999999998',
  'test',
  fixture.booking_type,
  dates.check_in_at,
  dates.check_out_at,
  2,
  0,
  1500000,
  500000,
  1000000,
  fixture.status
from block_test_context as context
cross join (
  values
    (
      'a0000000-0000-4000-8000-000000000301'::uuid,
      'SOE-20990101-A0000301',
      'inventory-fixture-confirmed',
      'public_one_night',
      'confirmed'::public.booking_status,
      53
    ),
    (
      'a0000000-0000-4000-8000-000000000302'::uuid,
      'SOE-20990101-A0000302',
      'inventory-fixture-manual',
      'manual_one_night',
      'payment_pending'::public.booking_status,
      55
    )
) as fixture(id, reference, token, booking_type, status, day_offset)
cross join lateral public.resolve_booking_dates(
  context.property_id,
  context.today + fixture.day_offset
) as dates;

insert into public.inventory_reservations (
  id, property_id, booking_id, reservation_type, status,
  start_at, end_at, expires_at, source
)
select
  fixture.id,
  context.property_id,
  fixture.booking_id,
  fixture.reservation_type,
  fixture.status,
  dates.check_in_at,
  dates.check_out_at,
  fixture.expires_at,
  'test-release-eligibility'
from block_test_context as context
cross join (
  values
    (
      'a0000000-0000-4000-8000-000000000311'::uuid,
      null::uuid,
      'temporary_hold'::public.reservation_type,
      'active'::public.reservation_status,
      50,
      (now() + interval '400 days')::timestamptz
    ),
    (
      'a0000000-0000-4000-8000-000000000312'::uuid,
      'a0000000-0000-4000-8000-000000000301'::uuid,
      'confirmed_booking'::public.reservation_type,
      'active'::public.reservation_status,
      53,
      null::timestamptz
    ),
    (
      'a0000000-0000-4000-8000-000000000313'::uuid,
      'a0000000-0000-4000-8000-000000000302'::uuid,
      'manual_booking'::public.reservation_type,
      'active'::public.reservation_status,
      55,
      (now() + interval '400 days')::timestamptz
    ),
    (
      'a0000000-0000-4000-8000-000000000314'::uuid,
      null::uuid,
      'ota_booking'::public.reservation_type,
      'active'::public.reservation_status,
      57,
      null::timestamptz
    ),
    (
      'a0000000-0000-4000-8000-000000000315'::uuid,
      null::uuid,
      'owner_block'::public.reservation_type,
      'cancelled'::public.reservation_status,
      59,
      null::timestamptz
    )
) as fixture(id, booking_id, reservation_type, status, day_offset, expires_at)
cross join lateral public.resolve_booking_dates(
  context.property_id,
  context.today + fixture.day_offset
) as dates;

set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000002';

select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'other',null)$$,
    (select today + 50 from block_test_context),
    (select today + 50 from block_test_context),
    'a0000000-0000-4000-8000-000000000140'
  ),
  'P0001',
  'date_unavailable',
  'owner creation rejects overlap with a valid active temporary hold'
);
select throws_ok(
  format(
    $$select public.create_admin_maintenance_block(%L::date,%L::date,%L::uuid,'repair',null)$$,
    (select today + 50 from block_test_context),
    (select today + 50 from block_test_context),
    'a0000000-0000-4000-8000-000000000141'
  ),
  'P0001',
  'date_unavailable',
  'maintenance creation rejects overlap with a valid active temporary hold'
);
select is(
  (
    select status
    from public.inventory_reservations
    where id = 'a0000000-0000-4000-8000-000000000311'
  ),
  'active'::public.reservation_status,
  'valid unexpired temporary holds remain untouched'
);
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'other',null)$$,
    (select today + 53 from block_test_context),
    (select today + 53 from block_test_context),
    'a0000000-0000-4000-8000-000000000142'
  ),
  'P0001',
  'date_unavailable',
  'owner creation rejects overlap with confirmed booking inventory'
);

select throws_ok(
  $$select public.release_admin_owner_block('a0000000-0000-4000-8000-000000000311','a0000000-0000-4000-8000-000000000143','other',null)$$,
  'P0001',
  'wrong_block_type',
  'owner release rejects temporary holds'
);
select throws_ok(
  $$select public.release_admin_owner_block('a0000000-0000-4000-8000-000000000312','a0000000-0000-4000-8000-000000000144','other',null)$$,
  'P0001',
  'wrong_block_type',
  'owner release rejects confirmed bookings'
);
select throws_ok(
  $$select public.release_admin_owner_block('a0000000-0000-4000-8000-000000000313','a0000000-0000-4000-8000-000000000145','other',null)$$,
  'P0001',
  'wrong_block_type',
  'owner release rejects manual bookings'
);
select throws_ok(
  $$select public.release_admin_owner_block('a0000000-0000-4000-8000-000000000314','a0000000-0000-4000-8000-000000000146','other',null)$$,
  'P0001',
  'wrong_block_type',
  'owner release rejects OTA bookings'
);
select throws_ok(
  $$select public.release_admin_owner_block('a0000000-0000-4000-8000-000000000315','a0000000-0000-4000-8000-000000000147','other',null)$$,
  'P0001',
  'block_not_active',
  'owner release rejects cancelled owner blocks'
);

select is(
  (
    public.create_admin_owner_block(
      (select today + 62 from block_test_context),
      (select today + 62 from block_test_context),
      'a0000000-0000-4000-8000-000000000148',
      'other',
      null
    )
  ).applied,
  true,
  'first adjacent administrator block succeeds'
);
select is(
  (
    public.create_admin_maintenance_block(
      (select today + 63 from block_test_context),
      (select today + 63 from block_test_context),
      'a0000000-0000-4000-8000-000000000149',
      'inspection',
      null
    )
  ).applied,
  true,
  'adjacent half-open administrator block succeeds'
);

select is(
  (
    public.create_admin_owner_block(
      (select today + 65 from block_test_context),
      (select today + 65 from block_test_context),
      'a0000000-0000-4000-8000-000000000150',
      'other',
      null
    )
  ).applied,
  true,
  'first administrator may use a new request UUID'
);
set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000003';
select is(
  (
    public.create_admin_owner_block(
      (select today + 67 from block_test_context),
      (select today + 67 from block_test_context),
      'a0000000-0000-4000-8000-000000000150',
      'other',
      null
    )
  ).applied,
  true,
  'a separate administrator may independently reuse the request UUID'
);

set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000002';
select is(
  (
    public.create_admin_maintenance_block(
      (select today + 70 from block_test_context),
      (select today + 70 from block_test_context),
      'a0000000-0000-4000-8000-000000000151',
      'maintenance',
      null
    )
  ).applied,
  true,
  'first overlapping administrator attempt wins'
);
set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000003';
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'other',null)$$,
    (select today + 70 from block_test_context),
    (select today + 70 from block_test_context),
    'a0000000-0000-4000-8000-000000000152'
  ),
  'P0001',
  'date_unavailable',
  'second overlapping administrator attempt loses safely'
);
select results_eq(
  $$
    select count(*)::integer
    from public.admin_operation_events
    where request_id = 'a0000000-0000-4000-8000-000000000152'
  $$,
  array[0::integer],
  'losing overlapping attempt creates no receipt'
);

reset role;

update public.properties set is_active = false;
set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000002';
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'other',null)$$,
    (select today + 46 from block_test_context),
    (select today + 46 from block_test_context),
    'a0000000-0000-4000-8000-000000000136'
  ),
  'P0001',
  'property_configuration_invalid',
  'no active property fails closed'
);
reset role;
update public.properties set is_active = true where slug = 'silver-oak-estate';
insert into public.properties (
  name, slug, timezone, check_in_time, check_out_time,
  cleaning_buffer_minutes, max_event_guests, max_overnight_guests, is_active
) values (
  'Second Active Property', 'second-active-property', 'Asia/Kolkata',
  '11:00', '10:00', 60, 30, 8, true
);
set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-4000-8000-000000000002';
select throws_ok(
  format(
    $$select public.create_admin_owner_block(%L::date,%L::date,%L::uuid,'other',null)$$,
    (select today + 46 from block_test_context),
    (select today + 46 from block_test_context),
    'a0000000-0000-4000-8000-000000000137'
  ),
  'P0001',
  'property_configuration_invalid',
  'multiple active properties fail closed'
);

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select property_id, 'owner_block', 'active',
      now() + interval '300 days', now() + interval '301 days', 'direct-browser-write'
    from block_test_context
  $$,
  '42501',
  null,
  'authenticated callers still cannot write inventory directly'
);

reset role;

select results_eq(
  $$
    select count(*)::integer
    from public.admin_operation_events
    where action_type in (
      'owner_block_created',
      'maintenance_block_created',
      'owner_block_released',
      'maintenance_block_released'
    )
      and request_fingerprint ~ '^[a-f0-9]{64}$'
  $$,
  $$
    select count(*)::integer
    from public.admin_operation_events
    where action_type in (
      'owner_block_created',
      'maintenance_block_created',
      'owner_block_released',
      'maintenance_block_released'
    )
  $$,
  'every successful block operation stores an internal SHA-256 fingerprint'
);
select results_eq(
  $$
    select count(*)::integer
    from public.admin_operation_events
    where booking_id is not null
      or payment_id is not null
  $$,
  array[0::integer],
  'block receipts contain no booking or payment relationship'
);
select results_eq(
  $$
    select count(*)::integer
    from public.inventory_reservations
    where source = 'admin_manual'
      and (
        booking_id is not null
        or external_reservation_id is not null
        or expires_at is not null
      )
  $$,
  array[0::integer],
  'administrator blocks contain no booking external or expiry relationship'
);
select results_eq(
  $$
    select count(*)::integer
    from public.admin_operation_events
    where reason_category is null
      or resulting_state not in ('active', 'released')
  $$,
  array[0::integer],
  'block receipts contain only approved operational state and reasons'
);
select is(
  (
    select count(*)::integer
    from public.inventory_reservations
    where source = 'admin_manual'
  ) > 0,
  true,
  'successful block operations preserve reservation history rather than deleting rows'
);
select is(
  (
    select count(*)::integer
    from public.inventory_reservations
    where source = 'admin_manual' and status = 'released'
  ) > 0,
  true,
  'released block rows remain present for audit history'
);
select is(
  (
    select count(*)::integer
    from public.inventory_reservations
    where source = 'admin_manual'
      and status in ('expired', 'cancelled')
  ),
  0,
  'block functions do not introduce unrelated terminal states'
);
select is(
  (
    select count(*)::integer
    from public.admin_operation_events
    where request_id in (
      'a0000000-0000-4000-8000-000000000104',
      'a0000000-0000-4000-8000-000000000111',
      'a0000000-0000-4000-8000-000000000117',
      'a0000000-0000-4000-8000-000000000125'
    )
  ),
  0,
  'authorization validation overlap and stale failures create no success receipts'
);

select * from finish();
rollback;
