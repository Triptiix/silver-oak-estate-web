begin;

select plan(21);

select is(
  (
    select count(*)::integer
    from public.properties
    where slug = 'silver-oak-estate'
  ),
  1,
  'migration chain creates the canonical property without seed data'
);

select is(
  (
    select count(*)::integer
    from public.properties
    where slug = 'silver-oak-estate'
      and is_active
  ),
  1,
  'exactly one active canonical property exists'
);

select is(
  (select timezone from public.properties where slug = 'silver-oak-estate'),
  'Asia/Kolkata',
  'canonical property uses Asia/Kolkata'
);

select is(
  (select check_in_time from public.properties where slug = 'silver-oak-estate'),
  '11:00'::time,
  'canonical check-in is 11:00'
);

select is(
  (select check_out_time from public.properties where slug = 'silver-oak-estate'),
  '10:00'::time,
  'canonical checkout is 10:00 on the following day'
);

select is(
  (
    select extract(epoch from (dates.check_out_at - dates.check_in_at))::integer
    from public.properties as property
    cross join lateral public.resolve_booking_dates(
      property.id,
      '2040-01-02'::date
    ) as dates
    where property.slug = 'silver-oak-estate'
  ),
  82800,
  'canonical booking slot is 23 hours'
);

select is(
  (select max_event_guests from public.properties where slug = 'silver-oak-estate'),
  40,
  'canonical standard daytime capacity is 40'
);

select is(
  (select max_overnight_guests from public.properties where slug = 'silver-oak-estate'),
  10,
  'canonical overnight capacity is 10'
);

select is(
  (
    select count(*)::integer
    from public.pricing_rules as rule
    join public.properties as property on property.id = rule.property_id
    where property.slug = 'silver-oak-estate'
      and rule.rule_type in ('weekday', 'weekend')
      and rule.specific_date is null
      and rule.effective_from is null
      and rule.effective_until is null
  ),
  2,
  'exactly two canonical general pricing rules exist'
);

select is(
  (
    select rule.price_amount_paise
    from public.pricing_rules as rule
    join public.properties as property on property.id = rule.property_id
    where property.slug = 'silver-oak-estate'
      and rule.rule_type = 'weekday'
      and rule.specific_date is null
      and rule.effective_from is null
      and rule.effective_until is null
  ),
  1500000::bigint,
  'weekday price is 1,500,000 paise'
);

select is(
  (
    select rule.price_amount_paise
    from public.pricing_rules as rule
    join public.properties as property on property.id = rule.property_id
    where property.slug = 'silver-oak-estate'
      and rule.rule_type = 'weekend'
      and rule.specific_date is null
      and rule.effective_from is null
      and rule.effective_until is null
  ),
  2000000::bigint,
  'weekend price is 2,000,000 paise'
);

select is(
  (
    select rule.advance_amount_paise
    from public.pricing_rules as rule
    join public.properties as property on property.id = rule.property_id
    where property.slug = 'silver-oak-estate'
      and rule.rule_type = 'weekday'
      and rule.specific_date is null
      and rule.effective_from is null
      and rule.effective_until is null
  ),
  500000::bigint,
  'weekday advance is 500,000 paise'
);

select is(
  (
    select rule.advance_amount_paise
    from public.pricing_rules as rule
    join public.properties as property on property.id = rule.property_id
    where property.slug = 'silver-oak-estate'
      and rule.rule_type = 'weekend'
      and rule.specific_date is null
      and rule.effective_from is null
      and rule.effective_until is null
  ),
  500000::bigint,
  'weekend advance is 500,000 paise'
);

select is(
  public.get_monthly_availability(
    'silver-oak-estate',
    '2040-01'
  ) ->> 'propertySlug',
  'silver-oak-estate',
  'availability RPC resolves the canonical property'
);

select ok(
  jsonb_array_length(
    public.get_monthly_availability(
      'silver-oak-estate',
      '2040-01'
    ) -> 'dates'
  ) > 0,
  'availability RPC returns priced calendar dates'
);

select is((select count(*)::integer from public.customers), 0, 'migration creates no customers');
select is((select count(*)::integer from public.bookings), 0, 'migration creates no bookings');
select is((select count(*)::integer from public.payments), 0, 'migration creates no payments');
select is((select count(*)::integer from public.inventory_reservations), 0, 'migration creates no reservations');
select is((select count(*)::integer from public.admins), 0, 'migration creates no administrators');
select is((select count(*)::integer from public.notification_events), 0, 'migration creates no notifications');

select * from finish();

rollback;
