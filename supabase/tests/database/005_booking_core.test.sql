begin;
select plan(39);

create temporary table phase2_context as
select id as property_id from public.properties where slug = 'silver-oak-estate';

select is((select check_in_at from public.resolve_booking_dates((select property_id from phase2_context), '2026-07-31')), '2026-07-31 05:30:00+00'::timestamptz, 'check-in preserves the IST business date');
select is((select check_out_at from public.resolve_booking_dates((select property_id from phase2_context), '2026-07-31')), '2026-08-01 04:30:00+00'::timestamptz, 'checkout crosses a month boundary');
select is((select check_out_at from public.resolve_booking_dates((select property_id from phase2_context), '2026-12-31')), '2027-01-01 04:30:00+00'::timestamptz, 'checkout crosses a year boundary');
select is((select check_in_at from public.resolve_booking_dates((select property_id from phase2_context), '2028-02-29')), '2028-02-29 05:30:00+00'::timestamptz, 'leap date resolves correctly');
select ok((select check_out_at > check_in_at from public.resolve_booking_dates((select property_id from phase2_context), '2026-08-01')), 'checkout follows check-in');
select is((select timezone from public.resolve_booking_dates((select property_id from phase2_context), '2026-08-01')), 'Asia/Kolkata', 'property timezone is returned');

select is((select price_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-27')), 1500000::bigint, 'Monday uses weekday price');
select is((select price_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-31')), 1500000::bigint, 'Friday uses weekday price');
select is((select price_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-25')), 2000000::bigint, 'Saturday uses weekend price');
select is((select price_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-26')), 2000000::bigint, 'Sunday uses weekend price');
select is((select advance_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-27')), 500000::bigint, 'advance is server resolved');
select is((select balance_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-27')), 1000000::bigint, 'balance arithmetic is correct');

insert into public.pricing_rules (property_id, rule_type, specific_date, price_amount_paise, advance_amount_paise, priority)
select property_id, 'special_date', '2026-07-27', 2500000, 500000, 0 from phase2_context;
select is((select price_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-27')), 2500000::bigint, 'special date wins an equal-priority tie');
insert into public.pricing_rules (property_id, rule_type, price_amount_paise, advance_amount_paise, priority, effective_from, effective_until)
select property_id, 'weekday', 2600000, 500000, 5, '2026-07-27', '2026-07-27' from phase2_context;
select is((select price_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-27')), 2600000::bigint, 'higher priority wins');
select is((select price_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-28')), 1500000::bigint, 'effective period excludes other dates');
update public.pricing_rules set is_active = false where price_amount_paise in (2500000,2600000);
select is((select price_amount_paise from public.resolve_booking_price((select property_id from phase2_context), '2026-07-27')), 1500000::bigint, 'inactive rules are ignored');

select is(jsonb_array_length(public.get_monthly_availability('silver-oak-estate', '2026-08')->'dates'), 31, 'availability returns every day in the month');
select is((public.get_monthly_availability('silver-oak-estate', '2026-08')->'dates'->0->>'available')::boolean, true, 'empty date is available');

insert into public.inventory_reservations (property_id, reservation_type, status, start_at, end_at, source)
select property_id, 'owner_block', 'active', '2026-08-01 05:30+00', '2026-08-02 04:30+00', 'phase2-test' from phase2_context;
select is((public.get_monthly_availability('silver-oak-estate', '2026-08')->'dates'->0->>'available')::boolean, false, 'active owner block is unavailable');
update public.inventory_reservations set status = 'released' where source = 'phase2-test';
select is((public.get_monthly_availability('silver-oak-estate', '2026-08')->'dates'->0->>'available')::boolean, true, 'released reservation is available');

insert into public.inventory_reservations (property_id, reservation_type, status, start_at, end_at, expires_at, source, created_at)
select property_id, 'temporary_hold', 'active', '2026-08-03 05:30+00', '2026-08-04 04:30+00', now() - interval '1 minute', 'phase2-stale', now() - interval '20 minutes' from phase2_context;
select is((public.get_monthly_availability('silver-oak-estate', '2026-08')->'dates'->2->>'available')::boolean, true, 'stale active hold is omitted from public availability');
select is(public.expire_stale_holds((select property_id from phase2_context)), 1, 'cleanup expires one stale hold');
select is(public.expire_stale_holds((select property_id from phase2_context)), 0, 'cleanup is idempotent');

select lives_ok($$
  select public.create_booking_hold(
    'silver-oak-estate','2026-08-10','Test Guest',null,'+919999000001',null,8,4,null,
    '31000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001',
    'fingerprint-one',10
  )
$$, 'trusted operation creates a hold');
select is((select count(*)::integer from public.bookings where hold_request_id = '31000000-0000-0000-0000-000000000001'), 1, 'hold creates one booking');
select is((select count(*)::integer from public.inventory_reservations where booking_id = (select id from public.bookings where hold_request_id = '31000000-0000-0000-0000-000000000001')), 1, 'hold creates one reservation');
select is((select count(*)::integer from public.booking_events where booking_id = (select id from public.bookings where hold_request_id = '31000000-0000-0000-0000-000000000001')), 2, 'hold creates two lifecycle events');
select is((public.create_booking_hold('silver-oak-estate','2026-08-10','Test Guest',null,'+919999000001',null,8,4,null,'31000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000099','fingerprint-one',10)->>'created')::boolean, false, 'exact retry returns existing hold');
select is((select count(*)::integer from public.booking_events where booking_id = (select id from public.bookings where hold_request_id = '31000000-0000-0000-0000-000000000001')), 2, 'retry does not duplicate events');
select throws_ok($$select public.create_booking_hold('silver-oak-estate','2026-08-10','Other',null,'+919999000002',null,2,0,null,'31000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000002','different-fingerprint',10)$$, 'P0001', 'idempotency_conflict', 'mismatched retry is rejected');
select throws_ok($$select public.create_booking_hold('silver-oak-estate','2026-08-11','Test Guest',null,'+919999000001',null,2,0,null,'31000000-0000-0000-0000-000000000002','32000000-0000-0000-0000-000000000002','fingerprint-one',10)$$, 'P0001', 'hold_abuse_limit', 'identity cannot hoard another hold');
select throws_ok($$select public.create_booking_hold('silver-oak-estate','2026-08-10','Conflict',null,'+919999000003',null,2,0,null,'31000000-0000-0000-0000-000000000003','32000000-0000-0000-0000-000000000003','fingerprint-three',10)$$, 'P0001', 'date_unavailable', 'overlapping hold receives controlled conflict');
select is(public.release_booking_hold((select id from public.bookings where hold_request_id = '31000000-0000-0000-0000-000000000001'),'32000000-0000-0000-0000-000000000001'), true, 'valid hold releases');
select is(public.release_booking_hold((select id from public.bookings where hold_request_id = '31000000-0000-0000-0000-000000000001'),'32000000-0000-0000-0000-000000000001'), true, 'duplicate release is idempotent');
select is((select status from public.inventory_reservations where booking_id = (select id from public.bookings where hold_request_id = '31000000-0000-0000-0000-000000000001')), 'released'::public.reservation_status, 'release changes inventory status');
select is((select booking_status from public.bookings where hold_request_id = '31000000-0000-0000-0000-000000000001'), 'expired'::public.booking_status, 'release uses terminal expired booking state');

select is(has_function_privilege('anon','public.create_booking_hold(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,integer)','EXECUTE'), false, 'anon cannot execute hold creation');
select is(has_function_privilege('authenticated','public.create_booking_hold(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,integer)','EXECUTE'), false, 'authenticated cannot execute hold creation');
select is(has_function_privilege('service_role','public.create_booking_hold(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,integer)','EXECUTE'), true, 'service role can execute hold creation');

select * from finish();
rollback;
