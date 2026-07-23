alter table public.bookings
  add column hold_request_id uuid,
  add column hold_token_nonce uuid,
  add column request_fingerprint_hash text;

alter table public.bookings
  add constraint bookings_hold_request_id_unique unique (hold_request_id),
  add constraint bookings_hold_fields_for_public_hold check (
    booking_status not in ('held', 'expired')
    or booking_type <> 'public_one_night'
    or (hold_request_id is not null and hold_token_nonce is not null and request_fingerprint_hash is not null)
  );

alter table public.inventory_reservations
  drop constraint inventory_reservations_active_hold_expiry_after_start;

comment on column public.bookings.hold_request_id is
  'Caller-generated UUID used only for idempotent booking-hold requests.';
comment on column public.bookings.hold_token_nonce is
  'Random nonce bound to the signed HttpOnly hold token; the raw token is never stored.';
comment on column public.bookings.request_fingerprint_hash is
  'Non-reversible server HMAC used to limit simultaneous public holds; no raw IP or browser fingerprint is stored.';

create index bookings_active_held_idx
  on public.bookings (property_id, check_in_at, check_out_at)
  where booking_status = 'held';
create index bookings_request_fingerprint_idx
  on public.bookings (request_fingerprint_hash)
  where request_fingerprint_hash is not null;
create index inventory_reservations_property_active_dates_idx
  on public.inventory_reservations (property_id, start_at, end_at)
  where status = 'active';
create index inventory_reservations_stale_temporary_idx
  on public.inventory_reservations (property_id, expires_at, booking_id)
  where reservation_type = 'temporary_hold' and status = 'active';

create or replace function public.resolve_booking_dates(
  p_property_id uuid,
  p_check_in_date date
)
returns table (
  business_date date,
  check_in_at timestamptz,
  check_out_at timestamptz,
  timezone text,
  check_in_time time,
  check_out_time time
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    p_check_in_date,
    (p_check_in_date + property.check_in_time) at time zone property.timezone,
    ((p_check_in_date + 1) + property.check_out_time) at time zone property.timezone,
    property.timezone,
    property.check_in_time,
    property.check_out_time
  from public.properties as property
  where property.id = p_property_id
    and property.is_active
    and p_check_in_date is not null
    and (((p_check_in_date + 1) + property.check_out_time) at time zone property.timezone)
      > ((p_check_in_date + property.check_in_time) at time zone property.timezone);
$$;

create or replace function public.resolve_booking_price(
  p_property_id uuid,
  p_business_date date
)
returns table (
  price_amount_paise bigint,
  advance_amount_paise bigint,
  balance_amount_paise bigint,
  pricing_rule_id uuid,
  rule_type public.pricing_rule_type,
  business_date date,
  currency text
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    rule.price_amount_paise,
    rule.advance_amount_paise,
    rule.price_amount_paise - rule.advance_amount_paise,
    rule.id,
    rule.rule_type,
    p_business_date,
    'INR'::text
  from public.pricing_rules as rule
  where rule.property_id = p_property_id
    and rule.is_active
    and (rule.effective_from is null or rule.effective_from <= p_business_date)
    and (rule.effective_until is null or rule.effective_until >= p_business_date)
    and (
      (rule.rule_type = 'special_date' and rule.specific_date = p_business_date)
      or (rule.rule_type = 'weekday' and extract(isodow from p_business_date) between 1 and 5)
      or (rule.rule_type = 'weekend' and extract(isodow from p_business_date) between 6 and 7)
    )
  order by rule.priority desc, (rule.rule_type = 'special_date') desc, rule.created_at, rule.id
  limit 1;
$$;

create or replace function public.get_monthly_availability(
  p_property_slug text,
  p_month text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  v_property public.properties%rowtype;
  v_month_start date;
  v_result jsonb;
begin
  if p_month is null or p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception using errcode = '22023', message = 'invalid_month';
  end if;
  v_month_start := (p_month || '-01')::date;

  select * into v_property
  from public.properties
  where slug = p_property_slug and is_active;
  if not found then
    raise exception using errcode = 'P0002', message = 'property_not_found';
  end if;

  select jsonb_build_object(
    'propertySlug', v_property.slug,
    'month', p_month,
    'timezone', v_property.timezone,
    'checkInTime', to_char(v_property.check_in_time, 'HH24:MI'),
    'checkOutTime', to_char(v_property.check_out_time, 'HH24:MI'),
    'generatedAt', now(),
    'dates', coalesce(jsonb_agg(jsonb_build_object(
      'date', day.business_date,
      'available', not exists (
        select 1
        from public.inventory_reservations as reservation
        where reservation.property_id = v_property.id
          and reservation.status = 'active'
          and not (
            reservation.reservation_type = 'temporary_hold'
            and reservation.expires_at <= now()
          )
          and tstzrange(reservation.start_at, reservation.end_at, '[)')
            && tstzrange(dates.check_in_at, dates.check_out_at, '[)')
      ),
      'priceAmountPaise', price.price_amount_paise,
      'advanceAmountPaise', price.advance_amount_paise
    ) order by day.business_date), '[]'::jsonb)
  ) into v_result
  from generate_series(
    v_month_start,
    (v_month_start + interval '1 month - 1 day')::date,
    interval '1 day'
  ) as series(value)
  cross join lateral (select series.value::date as business_date) as day
  cross join lateral public.resolve_booking_dates(v_property.id, day.business_date) as dates
  cross join lateral public.resolve_booking_price(v_property.id, day.business_date) as price;

  return v_result;
end;
$$;

revoke all on function public.resolve_booking_dates(uuid, date) from public, anon, authenticated;
revoke all on function public.resolve_booking_price(uuid, date) from public, anon, authenticated;
revoke all on function public.get_monthly_availability(text, text) from public, anon, authenticated;
grant execute on function public.resolve_booking_dates(uuid, date) to service_role;
grant execute on function public.resolve_booking_price(uuid, date) to service_role;
grant execute on function public.get_monthly_availability(text, text) to service_role;
