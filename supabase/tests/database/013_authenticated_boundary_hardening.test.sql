begin;

select plan(43);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('d0000000-0000-4000-8000-000000000001', 'boundary-nonadmin@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('d0000000-0000-4000-8000-000000000002', 'boundary-operations@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('d0000000-0000-4000-8000-000000000003', 'boundary-admin@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('d0000000-0000-4000-8000-000000000004', 'boundary-super@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('d0000000-0000-4000-8000-000000000005', 'boundary-inactive@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.admins (auth_user_id, role, name, email, is_active)
values
  ('d0000000-0000-4000-8000-000000000002', 'operations', 'Boundary Operations', 'boundary-operations@example.test', true),
  ('d0000000-0000-4000-8000-000000000003', 'admin', 'Boundary Admin', 'boundary-admin@example.test', true),
  ('d0000000-0000-4000-8000-000000000004', 'super_admin', 'Boundary Super', 'boundary-super@example.test', true),
  ('d0000000-0000-4000-8000-000000000005', 'admin', 'Boundary Inactive', 'boundary-inactive@example.test', false);

create temporary table boundary_tables (table_name text primary key);
insert into boundary_tables (table_name) values
  ('properties'),
  ('customers'),
  ('bookings'),
  ('inventory_reservations'),
  ('pricing_rules'),
  ('payments'),
  ('webhook_events'),
  ('booking_events'),
  ('notification_events'),
  ('site_settings'),
  ('admin_operation_events');

set local role anon;

select throws_ok(
  $$select id, auth_user_id, role, name, email, is_active from public.admins$$,
  '42501',
  null,
  'unauthenticated callers cannot read administrator membership'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = 'd0000000-0000-4000-8000-000000000002';

select results_eq(
  $$select auth_user_id from public.admins$$,
  array['d0000000-0000-4000-8000-000000000002'::uuid],
  'operations reads only its own membership row'
);

set local "request.jwt.claim.sub" = 'd0000000-0000-4000-8000-000000000003';
select results_eq(
  $$select auth_user_id from public.admins$$,
  array['d0000000-0000-4000-8000-000000000003'::uuid],
  'admin reads only its own membership row'
);

set local "request.jwt.claim.sub" = 'd0000000-0000-4000-8000-000000000004';
select results_eq(
  $$select auth_user_id from public.admins$$,
  array['d0000000-0000-4000-8000-000000000004'::uuid],
  'super-admin reads only its own membership row'
);

select results_eq(
  $$select count(*)::bigint from public.admins where auth_user_id = 'd0000000-0000-4000-8000-000000000003'$$,
  array[0::bigint],
  'one administrator cannot read another membership row'
);

set local "request.jwt.claim.sub" = 'd0000000-0000-4000-8000-000000000005';
select is(public.is_active_admin(), false, 'inactive membership is not operationally authorized');

reset role;

select is(
  (
    select string_agg(column_name::text, ',' order by column_name::text)
    from information_schema.column_privileges
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name = 'admins'
      and privilege_type = 'SELECT'
  ),
  'auth_user_id,email,id,is_active,name,role'::text,
  'authenticated receives exactly the six administrator membership columns'
);

select is(has_table_privilege('authenticated', 'public.admins', 'INSERT'), false, 'authenticated cannot insert administrators');
select is(has_table_privilege('authenticated', 'public.admins', 'UPDATE'), false, 'authenticated cannot update administrators');
select is(has_table_privilege('authenticated', 'public.admins', 'DELETE'), false, 'authenticated cannot delete administrators');

select results_eq(
  $$
    select count(*)::bigint
    from boundary_tables
    where has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT')
  $$,
  array[0::bigint],
  'authenticated has no table-level SELECT on protected operational tables'
);

select results_eq(
  $$
    select count(*)::bigint
    from information_schema.column_privileges
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name in (select table_name from boundary_tables)
      and privilege_type = 'SELECT'
  $$,
  array[0::bigint],
  'authenticated has no column-level SELECT on protected operational tables'
);

select results_eq(
  $$
    select count(*)::bigint
    from boundary_tables
    where has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT')
  $$,
  array[0::bigint],
  'authenticated has no INSERT on protected operational tables'
);

select results_eq(
  $$
    select count(*)::bigint
    from boundary_tables
    where has_table_privilege('authenticated', format('public.%I', table_name), 'UPDATE')
  $$,
  array[0::bigint],
  'authenticated has no UPDATE on protected operational tables'
);

select results_eq(
  $$
    select count(*)::bigint
    from boundary_tables
    where has_table_privilege('authenticated', format('public.%I', table_name), 'DELETE')
  $$,
  array[0::bigint],
  'authenticated has no DELETE on protected operational tables'
);

set local role authenticated;
set local "request.jwt.claim.sub" = 'd0000000-0000-4000-8000-000000000002';

select throws_ok($$select * from public.properties$$, '42501', null, 'active admin cannot directly read properties');
select throws_ok($$select * from public.customers$$, '42501', null, 'active admin cannot directly read customer PII');
select throws_ok($$select * from public.bookings$$, '42501', null, 'active admin cannot directly read booking internals');
select throws_ok($$select * from public.inventory_reservations$$, '42501', null, 'active admin cannot directly read reservation internals');
select throws_ok($$select * from public.pricing_rules$$, '42501', null, 'active admin cannot directly read pricing rules');
select throws_ok($$select * from public.payments$$, '42501', null, 'active admin cannot directly read payment internals');
select throws_ok($$select * from public.webhook_events$$, '42501', null, 'active admin cannot directly read webhook receipts');
select throws_ok($$select * from public.booking_events$$, '42501', null, 'active admin cannot directly read booking events');
select throws_ok($$select * from public.notification_events$$, '42501', null, 'active admin cannot directly read notification internals');
select throws_ok($$select * from public.site_settings$$, '42501', null, 'active admin cannot directly read site settings');
select throws_ok($$select * from public.admin_operation_events$$, '42501', null, 'active admin cannot directly read immutable operation receipts');

reset role;
set local role anon;

select results_eq(
  $$select count(*)::bigint from public.properties where is_active$$,
  array[1::bigint],
  'anonymous callers retain active-property access'
);

select results_eq(
  $$select count(*)::bigint from public.properties where not is_active$$,
  array[0::bigint],
  'inactive properties remain hidden from anonymous callers'
);

reset role;

select results_eq(
  $$
    select count(*)::bigint
    from boundary_tables
    where has_table_privilege('service_role', format('public.%I', table_name), 'SELECT')
  $$,
  array[11::bigint],
  'service role retains operational read access'
);

set local role authenticated;
set local "request.jwt.claim.sub" = 'd0000000-0000-4000-8000-000000000002';
select results_eq(
  $$
    select id, auth_user_id, role, name, email, is_active
    from public.admins
    where auth_user_id = 'd0000000-0000-4000-8000-000000000002'
      and is_active
  $$,
  $$
    values (
      (select id from public.admins where auth_user_id = 'd0000000-0000-4000-8000-000000000002'),
      'd0000000-0000-4000-8000-000000000002'::uuid,
      'operations'::public.admin_role,
      'Boundary Operations'::text,
      'boundary-operations@example.test'::text,
      true
    )
  $$,
  'own membership lookup works with the exact application columns'
);

reset role;

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array[
      'public.create_admin_owner_block(date,date,uuid,text,text)',
      'public.create_admin_maintenance_block(date,date,uuid,text,text)',
      'public.release_admin_owner_block(uuid,uuid,text,text)',
      'public.release_admin_maintenance_block(uuid,uuid,text,text)',
      'public.create_admin_manual_booking(date,text,text,text,integer,integer,text,text,uuid)',
      'public.verify_admin_manual_payment(text,text,bigint,text,uuid,text,text)'
    ]) as rpc(signature)
    where has_function_privilege('authenticated', signature, 'EXECUTE')
  $$,
  array[6::bigint],
  'authenticated retains execute on all six Phase 5B RPCs'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array[
      'public.create_admin_owner_block(date,date,uuid,text,text)',
      'public.create_admin_maintenance_block(date,date,uuid,text,text)',
      'public.release_admin_owner_block(uuid,uuid,text,text)',
      'public.release_admin_maintenance_block(uuid,uuid,text,text)',
      'public.create_admin_manual_booking(date,text,text,text,integer,integer,text,text,uuid)',
      'public.verify_admin_manual_payment(text,text,bigint,text,uuid,text,text)'
    ]) as rpc(signature)
    where has_function_privilege('anon', signature, 'EXECUTE')
  $$,
  array[0::bigint],
  'anonymous execution remains denied for all six Phase 5B RPCs'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array[
      'private.create_admin_inventory_block_internal(reservation_type,admin_operation_action,admin_role[],date,date,uuid,text,text)',
      'private.release_admin_inventory_block_internal(reservation_type,admin_operation_action,admin_role[],uuid,uuid,text,text)',
      'private.expire_stale_manual_bookings_internal(integer,timestamptz)'
    ]) as helper(signature)
    where has_function_privilege('authenticated', signature, 'EXECUTE')
  $$,
  array[0::bigint],
  'authenticated cannot execute private Phase 5B helpers'
);

select ok(
  not exists (
    select 1
    from pg_proc
    where oid = to_regprocedure('public.rls_auto_enable()')
      and has_function_privilege('public', oid, 'EXECUTE')
  ),
  'PUBLIC cannot execute rls_auto_enable when installed'
);
select ok(
  not exists (
    select 1
    from pg_proc
    where oid = to_regprocedure('public.rls_auto_enable()')
      and has_function_privilege('anon', oid, 'EXECUTE')
  ),
  'anon cannot execute rls_auto_enable when installed'
);
select ok(
  not exists (
    select 1
    from pg_proc
    where oid = to_regprocedure('public.rls_auto_enable()')
      and has_function_privilege('authenticated', oid, 'EXECUTE')
  ),
  'authenticated cannot execute rls_auto_enable when installed'
);
select ok(
  not exists (
    select 1
    from pg_proc
    where oid = to_regprocedure('public.rls_auto_enable()')
      and has_function_privilege('service_role', oid, 'EXECUTE')
  ),
  'service role cannot execute rls_auto_enable when installed'
);
select ok(
  to_regprocedure('public.rls_auto_enable()') is null
    or exists (
      select 1
      from pg_proc
      where oid = to_regprocedure('public.rls_auto_enable()')
        and prosecdef
    ),
  'rls_auto_enable remains SECURITY DEFINER when installed'
);
select ok(
  to_regprocedure('public.rls_auto_enable()') is null
    or exists (
      select 1
      from pg_proc
      where oid = to_regprocedure('public.rls_auto_enable()')
        and 'search_path=pg_catalog' = any(proconfig)
    ),
  'rls_auto_enable keeps its fixed pg_catalog search path when installed'
);
select ok(
  to_regprocedure('public.rls_auto_enable()') is null
    or exists (
      select 1
      from pg_event_trigger
      where evtname = 'ensure_rls'
        and evtenabled <> 'D'
        and evtfoid = to_regprocedure('public.rls_auto_enable()')
    ),
  'ensure_rls remains enabled and points to rls_auto_enable when installed'
);

select is(
  (
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admins'
      and policyname = 'admins_read_own_membership'
  ),
  1::bigint,
  'own-membership policy remains'
);

select is(
  (
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'properties'
      and policyname = 'properties_public_read_active'
  ),
  1::bigint,
  'anonymous active-property policy remains'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and 'authenticated' = any(roles)
      and not (
        tablename = 'admins'
        and policyname = 'admins_read_own_membership'
      )
  $$,
  array[0::bigint],
  'no authenticated operational table policy remains'
);

select * from finish();
rollback;
