begin;
select plan(18);

select ok((select prosecdef from pg_proc where oid = 'public.resolve_booking_dates(uuid,date)'::regprocedure), 'date resolver is security definer');
select ok((select prosecdef from pg_proc where oid = 'public.resolve_booking_price(uuid,date)'::regprocedure), 'pricing resolver is security definer');
select ok((select prosecdef from pg_proc where oid = 'public.get_monthly_availability(text,text)'::regprocedure), 'availability resolver is security definer');
select ok((select prosecdef from pg_proc where oid = 'public.expire_stale_holds(uuid)'::regprocedure), 'cleanup is security definer');
select ok((select prosecdef from pg_proc where oid = 'public.release_booking_hold(uuid,uuid)'::regprocedure), 'release is security definer');

select is((select proconfig[1] from pg_proc where oid = 'public.resolve_booking_dates(uuid,date)'::regprocedure), 'search_path=pg_catalog', 'date resolver has safe search path');
select is((select proconfig[1] from pg_proc where oid = 'public.resolve_booking_price(uuid,date)'::regprocedure), 'search_path=pg_catalog', 'pricing resolver has safe search path');
select is((select proconfig[1] from pg_proc where oid = 'public.get_monthly_availability(text,text)'::regprocedure), 'search_path=pg_catalog', 'availability resolver has safe search path');
select is((select proconfig[1] from pg_proc where oid = 'public.expire_stale_holds(uuid)'::regprocedure), 'search_path=pg_catalog', 'cleanup has safe search path');
select is((select proconfig[1] from pg_proc where oid = 'public.create_booking_hold(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,integer)'::regprocedure), 'search_path=pg_catalog', 'hold creation has safe search path');
select is((select proconfig[1] from pg_proc where oid = 'public.release_booking_hold(uuid,uuid)'::regprocedure), 'search_path=pg_catalog', 'release has safe search path');

select is(has_function_privilege('anon','public.get_monthly_availability(text,text)','EXECUTE'), false, 'anon cannot execute availability resolver directly');
select is(has_function_privilege('authenticated','public.get_monthly_availability(text,text)','EXECUTE'), false, 'authenticated cannot execute availability resolver directly');
select is(has_function_privilege('service_role','public.get_monthly_availability(text,text)','EXECUTE'), true, 'service role can execute availability resolver');
select is(has_function_privilege('anon','public.expire_stale_holds(uuid)','EXECUTE'), false, 'anon cannot execute cleanup');
select is(has_function_privilege('authenticated','public.release_booking_hold(uuid,uuid)','EXECUTE'), false, 'authenticated cannot execute release');
select is(has_function_privilege('service_role','public.expire_stale_holds(uuid)','EXECUTE'), true, 'service role can execute cleanup');
select is(has_function_privilege('service_role','public.release_booking_hold(uuid,uuid)','EXECUTE'), true, 'service role can execute release');

select * from finish();
rollback;
