begin;

select plan(17);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('10000000-0000-0000-0000-000000000001', 'nonadmin@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'operations@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'inactive@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'super@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'provision@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.admins (auth_user_id, role, name, email, is_active)
values
  ('10000000-0000-0000-0000-000000000002', 'operations', 'Operations Test', 'operations@example.test', true),
  ('10000000-0000-0000-0000-000000000003', 'admin', 'Inactive Test', 'inactive@example.test', false),
  ('10000000-0000-0000-0000-000000000004', 'super_admin', 'Super Test', 'super@example.test', true);

insert into public.customers (name, phone)
values ('Private Customer', '+910000000001');

select results_eq(
  $$
    select count(*)::bigint
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relkind = 'r'
      and relrowsecurity
  $$,
  array[12::bigint],
  'RLS is enabled on every Phase 1 application table'
);

set local role anon;

select results_eq(
  $$select count(*)::bigint from public.properties$$,
  array[1::bigint],
  'anonymous users see only the active seeded property'
);

select throws_ok(
  $$select * from public.bookings$$,
  '42501',
  null,
  'anonymous users cannot read bookings'
);

select throws_ok(
  $$insert into public.bookings default values$$,
  '42501',
  null,
  'anonymous users cannot insert bookings directly'
);

select throws_ok(
  $$select * from public.site_settings$$,
  '42501',
  null,
  'site settings are not anonymous-readable'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';

select results_eq(
  $$select count(*)::bigint from public.admins$$,
  array[0::bigint],
  'an authenticated non-admin cannot read administrator rows'
);

select results_eq(
  $$select count(*)::bigint from public.customers$$,
  array[0::bigint],
  'an authenticated non-admin cannot read customer data'
);

select is(public.is_active_admin(), false, 'non-admin helper result is false');

select results_eq(
  $$
    with changed as (
      update public.admins set role = 'super_admin'
      returning id
    )
    select count(*)::bigint from changed
  $$,
  array[0::bigint],
  'a non-admin cannot elevate administrator roles'
);

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000002';

select is(public.is_active_admin(), true, 'active administrator helper result is true');
select is(
  public.has_admin_role(array['operations']::public.admin_role[]),
  true,
  'role helper uses the current authenticated administrator'
);

select results_eq(
  $$select count(*)::bigint from public.customers$$,
  array[1::bigint],
  'active operations administrator receives intended private read access'
);

select results_eq(
  $$
    with changed as (
      update public.admins set role = 'super_admin'
      where auth_user_id = '10000000-0000-0000-0000-000000000002'
      returning id
    )
    select count(*)::bigint from changed
  $$,
  array[0::bigint],
  'operations cannot assign the super-admin role'
);

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000003';

select is(public.is_active_admin(), false, 'inactive administrator is denied');
select results_eq(
  $$select count(*)::bigint from public.site_settings$$,
  array[0::bigint],
  'inactive administrator cannot read site settings'
);

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000004';

select lives_ok(
  $$
    insert into public.admins (auth_user_id, role, name, email)
    values (
      '10000000-0000-0000-0000-000000000005',
      'admin',
      'Provisioned Test',
      'provision@example.test'
    )
  $$,
  'super-admin can provision an administrator membership'
);

select results_eq(
  $$select count(*)::bigint from public.site_settings$$,
  array[5::bigint],
  'active super-admin can read private site settings'
);

select * from finish();
rollback;
