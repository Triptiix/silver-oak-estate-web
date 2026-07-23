begin;
select plan(14);

create temporary table business_date_context as
select id as property_id from public.properties where slug = 'silver-oak-estate';

select is(public.is_current_or_future_business_date((select property_id from business_date_context), '2026-07-20', '2026-07-20 18:29:59+00'), true, 'date remains current immediately before the IST midnight boundary');
select is(public.is_current_or_future_business_date((select property_id from business_date_context), '2026-07-20', '2026-07-20 18:30:00+00'), false, 'same date becomes past at IST midnight');
select is(public.is_current_or_future_business_date((select property_id from business_date_context), '2026-07-21', '2026-07-20 18:30:00+00'), true, 'new IST business date is current at the UTC boundary');
select is(public.is_current_or_future_business_date((select property_id from business_date_context), '2026-07-22', '2026-07-20 18:30:00+00'), true, 'future IST business date is allowed');

select is(
  (
    select (entry->>'available')::boolean
    from jsonb_array_elements(public.get_monthly_availability(
      'silver-oak-estate',
      to_char((now() at time zone 'Asia/Kolkata')::date - 1, 'YYYY-MM')
    )->'dates') as entry
    where entry->>'date' = to_char((now() at time zone 'Asia/Kolkata')::date - 1, 'YYYY-MM-DD')
  ),
  false,
  'availability never advertises yesterday in Asia/Kolkata as bookable'
);

select is(
  (
    select (entry->>'available')::boolean
    from jsonb_array_elements(public.get_monthly_availability(
      'silver-oak-estate',
      to_char((now() at time zone 'Asia/Kolkata')::date, 'YYYY-MM')
    )->'dates') as entry
    where entry->>'date' = to_char((now() at time zone 'Asia/Kolkata')::date, 'YYYY-MM-DD')
  ),
  true,
  'current Asia/Kolkata business date follows normal availability rules'
);

select throws_ok(
  format(
    $$select public.create_booking_hold(
      'silver-oak-estate', %L::date, 'Past Date', null, '+919977000001', null,
      2, 0, null, '41000000-0000-4000-8000-000000000001',
      '42000000-0000-4000-8000-000000000001', 'past-date-fingerprint', 10
    )$$,
    (now() at time zone 'Asia/Kolkata')::date - 1
  ),
  '22023',
  'past_booking_date',
  'public hold creation rejects a past Asia/Kolkata arrival date'
);

select lives_ok(
  format(
    $$select public.create_booking_hold(
      'silver-oak-estate', %L::date, 'Current Date', null, '+919977000002', null,
      2, 0, null, '41000000-0000-4000-8000-000000000002',
      '42000000-0000-4000-8000-000000000002', 'current-date-fingerprint', 10
    )$$,
    (now() at time zone 'Asia/Kolkata')::date
  ),
  'current Asia/Kolkata business date remains allowed when available'
);

select lives_ok(
  format(
    $$select public.create_booking_hold(
      'silver-oak-estate', %L::date, 'Future Date', null, '+919977000003', null,
      2, 0, null, '41000000-0000-4000-8000-000000000003',
      '42000000-0000-4000-8000-000000000003', 'future-date-fingerprint', 10
    )$$,
    (now() at time zone 'Asia/Kolkata')::date + 1
  ),
  'future business date remains allowed when available'
);

select is(has_function_privilege('anon', 'public.is_current_or_future_business_date(uuid,date,timestamptz)', 'EXECUTE'), false, 'anon cannot execute business-date helper');
select is(has_function_privilege('authenticated', 'public.is_current_or_future_business_date(uuid,date,timestamptz)', 'EXECUTE'), false, 'authenticated cannot execute business-date helper');
select is(has_function_privilege('service_role', 'public.is_current_or_future_business_date(uuid,date,timestamptz)', 'EXECUTE'), true, 'service role can execute business-date helper');
select is((select proconfig[1] from pg_proc where oid = 'public.is_current_or_future_business_date(uuid,date,timestamptz)'::regprocedure), 'search_path=pg_catalog', 'business-date helper has a fixed safe search path');
select is((select proconfig[1] from pg_proc where oid = 'public.enforce_public_booking_business_date()'::regprocedure), 'search_path=pg_catalog', 'business-date trigger has a fixed safe search path');

select * from finish();
rollback;
