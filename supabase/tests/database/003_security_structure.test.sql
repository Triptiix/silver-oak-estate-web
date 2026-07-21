begin;

select plan(6);

select function_returns(
  'public',
  'is_active_admin',
  array[]::text[],
  'boolean',
  'is_active_admin returns boolean'
);

select function_returns(
  'public',
  'has_admin_role',
  array['admin_role[]'],
  'boolean',
  'has_admin_role returns boolean'
);

select ok(
  (select prosecdef from pg_proc where oid = 'public.is_active_admin()'::regprocedure),
  'is_active_admin is SECURITY DEFINER'
);

select ok(
  (select prosecdef from pg_proc where oid = 'public.has_admin_role(public.admin_role[])'::regprocedure),
  'has_admin_role is SECURITY DEFINER'
);

select is(
  (select proconfig[1] from pg_proc where oid = 'public.is_active_admin()'::regprocedure),
  'search_path=pg_catalog',
  'is_active_admin has a fixed safe search_path'
);

select is(
  has_function_privilege('anon', 'public.is_active_admin()', 'EXECUTE'),
  false,
  'anonymous role cannot execute administrator authorization helpers'
);

select * from finish();
rollback;
