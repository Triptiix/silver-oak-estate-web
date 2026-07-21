begin;

select plan(50);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('20000000-0000-0000-0000-000000000001', 'settings-nonadmin@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('20000000-0000-0000-0000-000000000002', 'settings-operations@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('20000000-0000-0000-0000-000000000003', 'settings-admin@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('20000000-0000-0000-0000-000000000004', 'settings-inactive@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('20000000-0000-0000-0000-000000000005', 'settings-super@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('20000000-0000-0000-0000-000000000006', 'settings-forge@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.admins (auth_user_id, role, name, email, is_active)
values
  ('20000000-0000-0000-0000-000000000002', 'operations', 'Settings Operations', 'settings-operations@example.test', true),
  ('20000000-0000-0000-0000-000000000003', 'admin', 'Settings Admin', 'settings-admin@example.test', true),
  ('20000000-0000-0000-0000-000000000004', 'admin', 'Settings Inactive', 'settings-inactive@example.test', false),
  ('20000000-0000-0000-0000-000000000005', 'super_admin', 'Settings Super', 'settings-super@example.test', true),
  ('20000000-0000-0000-0000-000000000006', 'admin', 'Settings Forge Target', 'settings-forge@example.test', true);

insert into public.site_settings (
  setting_key,
  setting_value,
  description,
  is_sensitive,
  updated_by
)
values (
  'sensitive_test',
  '"initial-secret"'::jsonb,
  'Sensitive test fixture',
  true,
  null
);

select is(
  has_table_privilege('authenticated', 'public.site_settings', 'INSERT'),
  false,
  'authenticated users have no direct settings insert privilege'
);

select is(
  has_table_privilege('authenticated', 'public.site_settings', 'UPDATE'),
  false,
  'authenticated users have no direct settings update privilege'
);

select is(
  has_table_privilege('authenticated', 'public.site_settings', 'DELETE'),
  false,
  'authenticated users have no direct settings delete privilege'
);

select is(
  has_function_privilege(
    'anon',
    'public.upsert_non_sensitive_setting(text,jsonb,text)',
    'EXECUTE'
  ),
  false,
  'anonymous users cannot execute settings mutation functions'
);

select is(
  has_function_privilege(
    'anon',
    'public.upsert_sensitive_setting(text,jsonb,text)',
    'EXECUTE'
  ),
  false,
  'anonymous users cannot execute the sensitive settings function'
);

select is(
  has_function_privilege('anon', 'public.delete_setting(text)', 'EXECUTE'),
  false,
  'anonymous users cannot execute the settings delete function'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.upsert_non_sensitive_setting(text,jsonb,text)'::regprocedure
  ),
  'non-sensitive settings mutation function is SECURITY DEFINER'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.upsert_sensitive_setting(text,jsonb,text)'::regprocedure
  ),
  'sensitive settings mutation function is SECURITY DEFINER'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.delete_setting(text)'::regprocedure
  ),
  'settings delete function is SECURITY DEFINER'
);

select is(
  (
    select proconfig[1]
    from pg_proc
    where oid = 'public.upsert_non_sensitive_setting(text,jsonb,text)'::regprocedure
  ),
  'search_path=pg_catalog',
  'non-sensitive settings function has a fixed safe search_path'
);

select is(
  (
    select proconfig[1]
    from pg_proc
    where oid = 'public.upsert_sensitive_setting(text,jsonb,text)'::regprocedure
  ),
  'search_path=pg_catalog',
  'sensitive settings function has a fixed safe search_path'
);

select is(
  (
    select proconfig[1]
    from pg_proc
    where oid = 'public.delete_setting(text)'::regprocedure
  ),
  'search_path=pg_catalog',
  'settings delete function has a fixed safe search_path'
);

select is(
  (
    select count(*)::bigint
    from pg_constraint as constraint_definition
    cross join unnest(constraint_definition.confkey) as referenced_key(attnum)
    join pg_attribute as referenced_attribute
      on referenced_attribute.attrelid = constraint_definition.confrelid
      and referenced_attribute.attnum = referenced_key.attnum
    where constraint_definition.conrelid = 'public.site_settings'::regclass
      and constraint_definition.conname = 'site_settings_updated_by_fkey'
      and referenced_attribute.attname = 'auth_user_id'
  ),
  1::bigint,
  'updated_by references the unique administrator Auth user UUID'
);

set local role anon;

select throws_ok(
  $$select * from public.site_settings$$,
  '42501',
  null,
  'anonymous users cannot read settings'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000001';

select results_eq(
  $$select count(*)::bigint from public.site_settings$$,
  array[0::bigint],
  'authenticated non-admin users cannot read settings'
);

set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000004';

select results_eq(
  $$select count(*)::bigint from public.site_settings$$,
  array[0::bigint],
  'inactive administrators cannot read settings'
);

set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000002';

select results_eq(
  $$select count(*)::bigint from public.site_settings where not is_sensitive$$,
  array[5::bigint],
  'operations can read non-sensitive settings'
);

select results_eq(
  $$select count(*)::bigint from public.site_settings where is_sensitive$$,
  array[0::bigint],
  'operations cannot read sensitive settings'
);

select results_eq(
  $$select count(*)::bigint from (select * from public.site_settings) as visible where is_sensitive$$,
  array[0::bigint],
  'operations SELECT star cannot expose sensitive rows'
);

select throws_ok(
  $$insert into public.site_settings (setting_key, setting_value) values ('operations_insert', '1'::jsonb)$$,
  '42501',
  null,
  'operations cannot insert settings directly'
);

select throws_ok(
  $$update public.site_settings set setting_value = '2'::jsonb where setting_key = 'currency'$$,
  '42501',
  null,
  'operations cannot update settings directly'
);

select throws_ok(
  $$delete from public.site_settings where setting_key = 'currency'$$,
  '42501',
  null,
  'operations cannot delete settings directly'
);

select throws_ok(
  $$select public.upsert_non_sensitive_setting('operations_rpc', '1'::jsonb, null)$$,
  '42501',
  null,
  'operations cannot mutate settings through controlled functions'
);

set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000003';

select results_eq(
  $$select count(*)::bigint from public.site_settings where not is_sensitive$$,
  array[5::bigint],
  'admin can read non-sensitive settings'
);

select results_eq(
  $$select count(*)::bigint from public.site_settings where is_sensitive$$,
  array[0::bigint],
  'admin cannot read sensitive settings'
);

select results_eq(
  $$select count(*)::bigint from (select * from public.site_settings) as visible where is_sensitive$$,
  array[0::bigint],
  'admin SELECT star cannot expose sensitive rows'
);

select lives_ok(
  $$select public.upsert_non_sensitive_setting('admin_setting', '"created"'::jsonb, 'Admin-created setting')$$,
  'admin can create a non-sensitive setting'
);

select results_eq(
  $$select updated_by from public.site_settings where setting_key = 'admin_setting'$$,
  array['20000000-0000-0000-0000-000000000003'::uuid],
  'admin create binds updated_by to auth.uid()'
);

select lives_ok(
  $$select public.upsert_non_sensitive_setting('admin_setting', '"updated"'::jsonb, 'Admin-updated setting')$$,
  'admin can update a non-sensitive setting'
);

select results_eq(
  $$select setting_value::text from public.site_settings where setting_key = 'admin_setting'$$,
  array['"updated"'::text],
  'admin non-sensitive update changes the value'
);

select results_eq(
  $$select updated_by from public.site_settings where setting_key = 'admin_setting'$$,
  array['20000000-0000-0000-0000-000000000003'::uuid],
  'admin update binds updated_by to auth.uid()'
);

select throws_ok(
  $$insert into public.site_settings (setting_key, setting_value, is_sensitive) values ('admin_direct_sensitive', '"forbidden"'::jsonb, true)$$,
  '42501',
  null,
  'admin cannot create a sensitive setting directly'
);

select throws_ok(
  $$select public.upsert_sensitive_setting('admin_sensitive_rpc', '"forbidden"'::jsonb, null)$$,
  '42501',
  null,
  'admin cannot create a sensitive setting through the super-admin function'
);

select throws_ok(
  $$select public.upsert_non_sensitive_setting('sensitive_test', '"downgraded"'::jsonb, null)$$,
  '42501',
  null,
  'admin cannot update or downgrade an existing sensitive setting'
);

select throws_ok(
  $$update public.site_settings set is_sensitive = false where setting_key = 'sensitive_test'$$,
  '42501',
  null,
  'admin cannot change a sensitive row to non-sensitive directly'
);

select throws_ok(
  $$update public.site_settings set setting_key = 'renamed_sensitive' where setting_key = 'sensitive_test'$$,
  '42501',
  null,
  'admin cannot rename a sensitive setting'
);

select throws_ok(
  $$delete from public.site_settings where setting_key = 'sensitive_test'$$,
  '42501',
  null,
  'admin cannot delete a sensitive setting directly'
);

select throws_ok(
  $$select public.delete_setting('sensitive_test')$$,
  '42501',
  null,
  'admin cannot delete a sensitive setting through the controlled function'
);

select throws_ok(
  $$
    update public.site_settings
    set updated_by = '20000000-0000-0000-0000-000000000006'
    where setting_key = 'admin_setting'
  $$,
  '42501',
  null,
  'caller cannot forge another administrator in updated_by'
);

select throws_ok(
  $$update public.site_settings set updated_by = null where setting_key = 'admin_setting'$$,
  '42501',
  null,
  'caller cannot clear updated_by'
);

reset role;

select results_eq(
  $$
    select concat_ws(
      '|',
      setting_key,
      setting_value::text,
      is_sensitive::text,
      coalesce(updated_by::text, 'null')
    )
    from public.site_settings
    where setting_key = 'sensitive_test'
  $$,
  array['sensitive_test|"initial-secret"|true|null'::text],
  'failed admin mutations leave the sensitive row unchanged'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000005';

select results_eq(
  $$select count(*)::bigint from public.site_settings$$,
  array[7::bigint],
  'super-admin can read both sensitive and non-sensitive settings'
);

select results_eq(
  $$select count(*)::bigint from public.site_settings where is_sensitive$$,
  array[1::bigint],
  'super-admin can read sensitive settings'
);

select lives_ok(
  $$select public.upsert_sensitive_setting('sensitive_test', '"rotated-secret"'::jsonb, 'Rotated by super-admin')$$,
  'super-admin can update a sensitive setting'
);

select results_eq(
  $$select updated_by from public.site_settings where setting_key = 'sensitive_test'$$,
  array['20000000-0000-0000-0000-000000000005'::uuid],
  'super-admin update binds updated_by to auth.uid()'
);

select results_eq(
  $$select setting_value::text from public.site_settings where setting_key = 'sensitive_test'$$,
  array['"rotated-secret"'::text],
  'super-admin can replace a sensitive value'
);

select lives_ok(
  $$select public.upsert_sensitive_setting('super_created_sensitive', '"super-secret"'::jsonb, 'Created by super-admin')$$,
  'super-admin can create a sensitive setting'
);

select results_eq(
  $$select updated_by from public.site_settings where setting_key = 'super_created_sensitive'$$,
  array['20000000-0000-0000-0000-000000000005'::uuid],
  'super-admin create binds updated_by to auth.uid()'
);

select results_eq(
  $$select public.delete_setting('sensitive_test')$$,
  array[true],
  'super-admin can delete a sensitive setting'
);

select results_eq(
  $$select count(*)::bigint from public.site_settings where setting_key = 'sensitive_test'$$,
  array[0::bigint],
  'deleted sensitive setting is removed'
);

select * from finish();
rollback;
