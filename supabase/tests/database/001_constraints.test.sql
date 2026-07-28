begin;

select plan(15);

create temporary table test_context as
select id as property_id
from public.properties
where slug = 'silver-oak-estate';

insert into public.inventory_reservations (
  property_id, reservation_type, status, start_at, end_at, source
)
select property_id, 'owner_block', 'active', '2026-08-01 05:30+00', '2026-08-02 04:30+00', 'test'
from test_context;

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select property_id, 'maintenance_block', 'active',
      '2026-08-01 12:00+00', '2026-08-01 13:00+00', 'test'
    from test_context
  $$,
  '23P01',
  null,
  'overlapping active reservations for one property are rejected'
);

select lives_ok(
  $$
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select property_id, 'owner_block', 'active',
      '2026-08-02 04:30+00', '2026-08-03 04:30+00', 'test'
    from test_context
  $$,
  'consecutive half-open reservations are allowed'
);

select lives_ok(
  $$
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select property_id, 'owner_block', 'released',
      '2026-08-01 12:00+00', '2026-08-01 13:00+00', 'test'
    from test_context
  $$,
  'an overlapping released reservation does not block inventory'
);

insert into public.inventory_reservations (
  property_id, reservation_type, status, start_at, end_at, expires_at, source
)
select property_id, 'temporary_hold', 'active',
  '2026-08-04 05:30+00', '2026-08-05 04:30+00', '2026-08-04 05:40+00', 'test'
from test_context;

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select property_id, 'maintenance_block', 'active',
      '2026-08-04 12:00+00', '2026-08-04 13:00+00', 'test'
    from test_context
  $$,
  '23P01',
  null,
  'an active temporary hold blocks inventory'
);

insert into public.inventory_reservations (
  property_id, reservation_type, status, start_at, end_at, expires_at, source
)
select property_id, 'temporary_hold', 'active',
  '2000-01-01 00:00+00', '2000-01-02 00:00+00', '2000-01-01 01:00+00', 'test-stale'
from test_context;

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select property_id, 'owner_block', 'active',
      '2000-01-01 12:00+00', '2000-01-01 13:00+00', 'test'
    from test_context
  $$,
  '23P01',
  null,
  'a past expires_at still blocks while status remains active'
);

select lives_ok(
  $$
    update public.inventory_reservations
      set status = 'expired'
      where source = 'test-stale';
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select property_id, 'owner_block', 'active',
      '2000-01-01 12:00+00', '2000-01-01 13:00+00', 'test'
    from test_context
  $$,
  'explicitly expiring a stale hold releases its inventory'
);

insert into public.bookings (
  booking_reference,
  public_confirmation_token,
  property_id,
  customer_name_snapshot,
  customer_phone_snapshot,
  source,
  booking_type,
  check_in_at,
  check_out_at,
  guest_count,
  overnight_guest_count,
  total_amount_paise,
  advance_amount_paise,
  balance_amount_paise
)
select
  'SOE-TEST-001',
  'opaque-test-token-001',
  property_id,
  'Constraint Test',
  '+910000000000',
  'test',
  'stay',
  '2026-09-01 05:30+00',
  '2026-09-02 04:30+00',
  8,
  4,
  1500000,
  500000,
  1000000
from test_context;

select throws_ok(
  $$update public.bookings set guest_count = 41 where booking_reference = 'SOE-TEST-001'$$,
  '23514',
  null,
  'guest count above 40 is rejected'
);

select throws_ok(
  $$update public.bookings set overnight_guest_count = 11 where booking_reference = 'SOE-TEST-001'$$,
  '23514',
  null,
  'overnight guest count above 10 is rejected'
);

select throws_ok(
  $$update public.bookings set total_amount_paise = -1 where booking_reference = 'SOE-TEST-001'$$,
  '23514',
  null,
  'negative booking monetary values are rejected'
);

select throws_ok(
  $$update public.bookings set check_out_at = check_in_at where booking_reference = 'SOE-TEST-001'$$,
  '23514',
  null,
  'invalid booking intervals are rejected'
);

select throws_ok(
  $$update public.bookings set balance_amount_paise = 1 where booking_reference = 'SOE-TEST-001'$$,
  '23514',
  null,
  'incorrect booking balances are rejected'
);

select throws_ok(
  $$
    insert into public.pricing_rules (
      property_id, rule_type, price_amount_paise, advance_amount_paise
    )
    select property_id, 'special_date', 2500000, 500000 from test_context
  $$,
  '23514',
  null,
  'special-date pricing requires a specific date'
);

select throws_ok(
  $$
    insert into public.pricing_rules (
      property_id, rule_type, effective_from, effective_until,
      price_amount_paise, advance_amount_paise
    )
    select property_id, 'weekday', '2026-10-02', '2026-10-01', 1500000, 500000
    from test_context
  $$,
  '23514',
  null,
  'pricing effective_until cannot precede effective_from'
);

select throws_ok(
  $$
    insert into public.pricing_rules (
      property_id, rule_type, price_amount_paise, advance_amount_paise
    )
    select property_id, 'weekday', -1, 0 from test_context
  $$,
  '23514',
  null,
  'negative prices are rejected'
);

select throws_ok(
  $$
    insert into public.pricing_rules (
      property_id, rule_type, price_amount_paise, advance_amount_paise
    )
    select property_id, 'weekend', 2000000, 2000001 from test_context
  $$,
  '23514',
  null,
  'pricing advance cannot exceed the total price'
);

select * from finish();
rollback;
