begin;

select plan(16);

create temporary table capacity_test_context as
select
  id as property_id,
  (now() at time zone timezone)::date as today
from public.properties
where slug = 'silver-oak-estate';

grant select on capacity_test_context to authenticated;

select is(
  (
    select max_event_guests
    from public.properties
    where slug = 'silver-oak-estate'
  ),
  40,
  'property configuration uses the 40-person standard daytime limit'
);
select is(
  (
    select max_overnight_guests
    from public.properties
    where slug = 'silver-oak-estate'
  ),
  10,
  'property configuration uses the 10-person overnight limit'
);
select is(
  (
    select setting_value #>> '{}'
    from public.site_settings
    where setting_key = 'max_event_guests'
  ),
  '40',
  'event-capacity site setting matches the property configuration'
);
select is(
  (
    select setting_value #>> '{}'
    from public.site_settings
    where setting_key = 'max_overnight_guests'
  ),
  '10',
  'overnight-capacity site setting matches the property configuration'
);
select matches(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_event_capacity'
  ),
  '40',
  'property event-capacity constraint permits values through 40'
);
select matches(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_overnight_capacity'
  ),
  '10',
  'property overnight-capacity constraint permits values through 10'
);
select matches(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'bookings_guest_capacity'
  ),
  '40',
  'persisted booking guest-capacity constraint permits values through 40'
);
select matches(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'bookings_overnight_capacity'
  ),
  '10',
  'persisted booking overnight-capacity constraint permits values through 10'
);

select lives_ok(
  format(
    $$select public.create_booking_hold(
      'silver-oak-estate',%L::date,'Public Capacity Guest',null,
      '+919911000001',null,40,10,null,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'capacity-public-40-10',
      '1111111111111111111111111111111111111111111111111111111111111111',10
    )$$,
    (select today + 60 from capacity_test_context)
  ),
  'public booking hold accepts the exact 40/10 boundary'
);
select throws_ok(
  format(
    $$select public.create_booking_hold(
      'silver-oak-estate',%L::date,'Public Capacity Guest',null,
      '+919911000002',null,41,10,null,
      'c0000000-0000-4000-8000-000000000003'::uuid,
      'c0000000-0000-4000-8000-000000000004'::uuid,
      'capacity-public-41-10',
      '2222222222222222222222222222222222222222222222222222222222222222',10
    )$$,
    (select today + 61 from capacity_test_context)
  ),
  '22023',
  'capacity_exceeded',
  'public booking hold rejects total guests above 40'
);
select throws_ok(
  format(
    $$select public.create_booking_hold(
      'silver-oak-estate',%L::date,'Public Capacity Guest',null,
      '+919911000003',null,40,11,null,
      'c0000000-0000-4000-8000-000000000005'::uuid,
      'c0000000-0000-4000-8000-000000000006'::uuid,
      'capacity-public-40-11',
      '3333333333333333333333333333333333333333333333333333333333333333',10
    )$$,
    (select today + 62 from capacity_test_context)
  ),
  '22023',
  'capacity_exceeded',
  'public booking hold rejects overnight guests above 10'
);
select throws_ok(
  format(
    $$select public.create_booking_hold(
      'silver-oak-estate',%L::date,'Public Capacity Guest',null,
      '+919911000004',null,5,6,null,
      'c0000000-0000-4000-8000-000000000007'::uuid,
      'c0000000-0000-4000-8000-000000000008'::uuid,
      'capacity-public-5-6',
      '4444444444444444444444444444444444444444444444444444444444444444',10
    )$$,
    (select today + 63 from capacity_test_context)
  ),
  '22023',
  'capacity_exceeded',
  'public booking hold preserves overnight less-than-or-equal-to-total'
);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'c0000000-0000-4000-8000-000000000010',
  'capacity-operations@example.test',
  '',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);
insert into public.admins (
  id, auth_user_id, role, name, email, is_active
) values (
  'c0000000-0000-4000-8000-000000000011',
  'c0000000-0000-4000-8000-000000000010',
  'operations',
  'Capacity Operations',
  'capacity-operations@example.test',
  true
);

set local role authenticated;
set local "request.jwt.claim.sub" = 'c0000000-0000-4000-8000-000000000010';

select lives_ok(
  format(
    $$select public.create_admin_manual_booking(
      %L::date,'Admin Capacity Guest','+919911000010',null,
      40,10,null,'manual_upi',
      'c0000000-0000-4000-8000-000000000020'::uuid
    )$$,
    (select today + 70 from capacity_test_context)
  ),
  'administrator manual booking accepts the exact 40/10 boundary'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(
      %L::date,'Admin Capacity Guest','+919911000011',null,
      41,10,null,'manual_upi',
      'c0000000-0000-4000-8000-000000000021'::uuid
    )$$,
    (select today + 71 from capacity_test_context)
  ),
  '22023',
  'capacity_exceeded',
  'administrator manual booking rejects total guests above 40'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(
      %L::date,'Admin Capacity Guest','+919911000012',null,
      40,11,null,'manual_upi',
      'c0000000-0000-4000-8000-000000000022'::uuid
    )$$,
    (select today + 72 from capacity_test_context)
  ),
  '22023',
  'capacity_exceeded',
  'administrator manual booking rejects overnight guests above 10'
);
select throws_ok(
  format(
    $$select public.create_admin_manual_booking(
      %L::date,'Admin Capacity Guest','+919911000013',null,
      5,6,null,'manual_upi',
      'c0000000-0000-4000-8000-000000000023'::uuid
    )$$,
    (select today + 73 from capacity_test_context)
  ),
  '22023',
  'capacity_exceeded',
  'administrator manual booking preserves overnight less-than-or-equal-to-total'
);

select * from finish();
rollback;
