begin;

select plan(44);

select is(
  private.normalize_customer_phone(' +91 (98765) 43210 '),
  '+919876543210',
  'private normalizer removes presentation formatting'
);
select is(
  private.normalize_customer_phone('98765-43210'),
  '9876543210',
  'private normalizer preserves a phone without a leading plus'
);
select is(
  private.normalize_customer_phone('+91-98765-43210'),
  '+919876543210',
  'private normalizer removes dashes'
);
select is(
  private.normalize_customer_phone('+91 (98765) [43210]'),
  '+919876543210',
  'private normalizer removes brackets'
);
select throws_ok(
  $$select private.normalize_customer_phone('+91+9876543210')$$,
  '22023',
  'invalid_phone',
  'multiple plus signs are rejected'
);
select throws_ok(
  $$select private.normalize_customer_phone('91+9876543210')$$,
  '22023',
  'invalid_phone',
  'a misplaced plus sign is rejected'
);
select throws_ok(
  $$select private.normalize_customer_phone('phone')$$,
  '22023',
  'invalid_phone',
  'text without a valid phone identity is rejected'
);
select throws_ok(
  $$select private.normalize_customer_phone('123456')$$,
  '22023',
  'invalid_phone',
  'fewer than seven digits are rejected'
);
select throws_ok(
  $$select private.normalize_customer_phone('1234567890123456')$$,
  '22023',
  'invalid_phone',
  'more than fifteen digits are rejected'
);

select is(
  has_function_privilege('anon', 'private.normalize_customer_phone(text)', 'EXECUTE'),
  false,
  'anonymous callers cannot execute the private normalizer'
);
select is(
  has_function_privilege('authenticated', 'private.normalize_customer_phone(text)', 'EXECUTE'),
  false,
  'authenticated callers cannot execute the private normalizer'
);
select is(
  has_function_privilege('service_role', 'private.normalize_customer_phone(text)', 'EXECUTE'),
  false,
  'service role cannot execute the private normalizer directly'
);
select results_eq(
  $$
    select count(*)::integer
    from pg_proc
    where oid in (
      'private.normalize_customer_phone(text)'::regprocedure,
      'private.normalize_customer_phone_write()'::regprocedure
    )
      and prosecdef
      and proconfig = array['search_path=pg_catalog']
  $$,
  array[2::integer],
  'phone functions are security definer with a fixed search path'
);
select is(
  (
    select provolatile
    from pg_proc
    where oid = 'private.normalize_customer_phone(text)'::regprocedure
  ),
  'i',
  'the private normalizer is immutable'
);
select is(
  (
    select proisstrict
    from pg_proc
    where oid = 'private.normalize_customer_phone(text)'::regprocedure
  ),
  true,
  'the private normalizer is strict'
);

select is(
  (
    select contype
    from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'customers_phone_canonical'
  ),
  'c',
  'customers has a canonical phone check'
);
select is(
  (
    select contype
    from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'customers_phone_unique'
  ),
  'u',
  'customers has one canonical phone identity constraint'
);
select is(
  to_regclass('public.customers_phone_lookup_idx'),
  null,
  'the redundant non-unique phone lookup index is absent'
);
select is(
  (
    select p.oid::regprocedure::text
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.customers'::regclass
      and t.tgname = 'customers_normalize_phone'
      and not t.tgisinternal
  ),
  'private.normalize_customer_phone_write()',
  'customer writes use the canonical phone trigger'
);
select results_eq(
  $$select count(*)::integer from public.customers where phone !~ '^\+?[0-9]{7,15}$'$$,
  array[0::integer],
  'every stored customer phone matches the canonical syntax'
);

set local role service_role;
insert into public.customers (name, phone)
values ('Formatted Customer', '+91 (97777) 00001');
reset role;

select is(
  (
    select phone
    from public.customers
    where name = 'Formatted Customer'
  ),
  '+919777700001',
  'trusted direct inserts are canonicalized'
);

set local role service_role;
update public.customers
set phone = '+91 [97777] 00002'
where name = 'Formatted Customer';
reset role;

select is(
  (
    select phone
    from public.customers
    where name = 'Formatted Customer'
  ),
  '+919777700002',
  'trusted formatted updates are canonicalized'
);

set local role service_role;
select throws_ok(
  $$insert into public.customers (name, phone) values ('Duplicate Customer', '+91-97777-00002')$$,
  '23505',
  null,
  'formatted duplicates violate the canonical unique identity'
);
select throws_ok(
  $$insert into public.customers (name, phone) values ('Invalid Customer', '+91+9777700002')$$,
  '22023',
  'invalid_phone',
  'trusted direct writes reject malformed plus placement'
);
reset role;

select results_eq(
  $$select count(*)::integer from public.customers where name = 'Formatted Customer'$$,
  array[1::integer],
  'duplicate rejection neither merges nor deletes the existing customer'
);

set local role service_role;
select lives_ok(
  $$
    insert into public.customers (name, email, phone, whatsapp)
    values
      ('Shared Contact One', 'shared-contact@example.test', '+919777700003', '+919777799999'),
      ('Shared Contact Two', 'shared-contact@example.test', '+919777700004', '+919777799999')
  $$,
  'email and WhatsApp remain non-unique'
);
reset role;

select is(
  has_table_privilege('authenticated', 'public.customers', 'SELECT'),
  false,
  'authenticated cannot directly read customers'
);
select is(
  has_table_privilege('authenticated', 'public.customers', 'INSERT'),
  false,
  'authenticated cannot directly insert customers'
);
select is(
  has_table_privilege('authenticated', 'public.customers', 'UPDATE'),
  false,
  'authenticated cannot directly update customers'
);
select is(
  has_table_privilege('authenticated', 'public.customers', 'DELETE'),
  false,
  'authenticated cannot directly delete customers'
);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'e0000000-0000-4000-8000-000000000001',
  'phone-identity-admin@example.test',
  '',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);
insert into public.admins (auth_user_id, role, name, email, is_active)
values (
  'e0000000-0000-4000-8000-000000000001',
  'admin',
  'Phone Identity Admin',
  'phone-identity-admin@example.test',
  true
);

create temporary table phone_identity_context as
select
  (
    select day::date
    from generate_series(
      (now() at time zone timezone)::date + 40,
      (now() at time zone timezone)::date + 60,
      interval '1 day'
    ) day
    where extract(isodow from day) between 1 and 5
    limit 1
  ) public_date,
  (
    select day::date
    from generate_series(
      (now() at time zone timezone)::date + 70,
      (now() at time zone timezone)::date + 90,
      interval '1 day'
    ) day
    where extract(isodow from day) between 1 and 5
    limit 1
  ) manual_date
from public.properties
where slug = 'silver-oak-estate';

grant select on phone_identity_context to authenticated, service_role;

set local role service_role;
select lives_ok(
  format(
    $sql$
      select public.create_booking_hold(
        'silver-oak-estate', %L::date, 'Cross Workflow Customer', null,
        '+91 (96666) 00001', '+91 96666 00001', 2, 0, null,
        'e0000000-0000-4000-8000-000000000101'::uuid,
        'e0000000-0000-4000-8000-000000000102'::uuid,
        'phone-identity-public-fingerprint', 10
      )
    $sql$,
    (select public_date from phone_identity_context)
  ),
  'public booking canonicalizes phone and WhatsApp before creation'
);
select is(
  (
    select phone || ':' || whatsapp
    from public.customers
    where phone = '+919666600001'
  ),
  '+919666600001:+919666600001',
  'public booking stores canonical customer phone and WhatsApp'
);
select is(
  (
    select customer_phone_snapshot
    from public.bookings
    where hold_request_id = 'e0000000-0000-4000-8000-000000000101'
  ),
  '+919666600001',
  'public booking stores a canonical phone snapshot'
);
select is(
  (
    public.create_booking_hold(
      'silver-oak-estate',
      (select public_date from phone_identity_context),
      'Cross Workflow Customer',
      null,
      '+91 (96666) 00001',
      '+91 96666 00001',
      2,
      0,
      null,
      'e0000000-0000-4000-8000-000000000101',
      'e0000000-0000-4000-8000-000000000102',
      'phone-identity-public-fingerprint',
      10
    )->>'created'
  )::boolean,
  false,
  'public hold exact replay remains idempotent'
);
select throws_ok(
  format(
    $sql$
      select public.create_booking_hold(
        'silver-oak-estate', %L::date, 'Canonical Abuse', null,
        '+91-96666-00001', null, 2, 0, null,
        'e0000000-0000-4000-8000-000000000106'::uuid,
        'e0000000-0000-4000-8000-000000000107'::uuid,
        'canonical-abuse-fingerprint', 10
      )
    $sql$,
    (select public_date + 2 from phone_identity_context)
  ),
  'P0001',
  'hold_abuse_limit',
  'public hold abuse checks use canonical phone identity'
);
select throws_ok(
  $$
    select public.create_booking_hold(
      'missing-property', current_date + 100, 'Invalid Phone', null,
      '+91+9666600002', null, 2, 0, null,
      'e0000000-0000-4000-8000-000000000103'::uuid,
      'e0000000-0000-4000-8000-000000000104'::uuid,
      'invalid-phone-must-win', 10
    )
  $$,
  '22023',
  'invalid_phone',
  'public phone validation runs before privileged property lookup'
);
reset role;

set local role authenticated;
set local "request.jwt.claim.sub" = 'e0000000-0000-4000-8000-000000000001';
select lives_ok(
  format(
    $sql$
      select public.create_admin_manual_booking(
        %L::date, 'Cross Workflow Customer', '+91-96666-00001', null,
        2, 0, null, 'manual_upi',
        'e0000000-0000-4000-8000-000000000105'::uuid
      )
    $sql$,
    (select manual_date from phone_identity_context)
  ),
  'manual booking accepts the same canonical phone on non-overlapping inventory'
);
select throws_ok(
  format(
    $sql$
      select public.create_admin_manual_booking(
        %L::date, 'Invalid Manual Phone', '+91+9666600002', null,
        2, 0, null, 'manual_upi',
        'e0000000-0000-4000-8000-000000000108'::uuid
      )
    $sql$,
    (select manual_date + 2 from phone_identity_context)
  ),
  '22023',
  'invalid_manual_booking_request',
  'invalid manual phone remains rejected'
);
select is(
  (
    public.create_admin_manual_booking(
      (select manual_date from phone_identity_context),
      'Cross Workflow Customer',
      '+91-96666-00001',
      null,
      2,
      0,
      null,
      'manual_upi',
      'e0000000-0000-4000-8000-000000000105'
    )
  ).applied,
  false,
  'manual booking exact replay remains idempotent'
);
reset role;

select is(
  (
    select customer_phone_snapshot
    from public.bookings
    where source = 'admin_manual'
      and customer_phone_snapshot = '+919666600001'
  ),
  '+919666600001',
  'manual booking stores the same canonical phone snapshot'
);
select results_eq(
  $$
    select count(*)::integer
    from public.customers
    where phone = '+919666600001'
  $$,
  array[1::integer],
  'public and manual workflows reuse one canonical customer'
);
select results_eq(
  $$
    select count(*)::integer
    from public.bookings
    where customer_phone_snapshot = '+919666600001'
  $$,
  array[2::integer],
  'both workflow snapshots contain the canonical phone'
);
select results_eq(
  $$
    select count(distinct customer_id)::integer
    from public.bookings
    where customer_phone_snapshot = '+919666600001'
  $$,
  array[1::integer],
  'public and manual bookings reference the same customer ID'
);
select results_eq(
  $$
    select count(*)::integer
    from public.inventory_reservations reservation
    join public.bookings booking on booking.id = reservation.booking_id
    where booking.customer_phone_snapshot = '+919666600001'
      and reservation.status = 'active'
  $$,
  array[2::integer],
  'cross-workflow identity creation leaves no partial reservation rows'
);

select * from finish();
rollback;
