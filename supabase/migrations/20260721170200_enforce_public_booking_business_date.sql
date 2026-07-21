create or replace function public.is_current_or_future_business_date(
  p_property_id uuid,
  p_business_date date,
  p_reference_instant timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p_business_date >= (p_reference_instant at time zone property.timezone)::date
  from public.properties as property
  where property.id = p_property_id
    and p_business_date is not null
    and p_reference_instant is not null;
$$;

create or replace function public.enforce_public_booking_business_date()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_timezone text;
  v_business_date date;
begin
  if new.booking_type <> 'public_one_night' then
    return new;
  end if;

  select property.timezone into v_timezone
  from public.properties as property
  where property.id = new.property_id;

  if v_timezone is null then
    raise exception using errcode = 'P0002', message = 'property_not_found';
  end if;

  v_business_date := (new.check_in_at at time zone v_timezone)::date;
  if not coalesce(public.is_current_or_future_business_date(
    new.property_id,
    v_business_date,
    now()
  ), false) then
    raise exception using errcode = '22023', message = 'past_booking_date';
  end if;

  return new;
end;
$$;

create trigger bookings_enforce_public_business_date
before insert or update of property_id, booking_type, check_in_at
on public.bookings
for each row execute function public.enforce_public_booking_business_date();

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
      'available',
        public.is_current_or_future_business_date(v_property.id, day.business_date, now())
        and not exists (
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

revoke all on function public.is_current_or_future_business_date(uuid, date, timestamptz)
  from public, anon, authenticated;
revoke all on function public.enforce_public_booking_business_date()
  from public, anon, authenticated, service_role;
grant execute on function public.is_current_or_future_business_date(uuid, date, timestamptz)
  to service_role;

comment on function public.is_current_or_future_business_date(uuid, date, timestamptz) is
  'Compares an arrival business date with the property-local date at a trusted reference instant.';
comment on function public.enforce_public_booking_business_date() is
  'Rejects past public one-night booking arrivals using the property timezone.';

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

alter function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) set schema private;
alter function private.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) rename to create_booking_hold_v2_internal;

revoke all on function private.create_booking_hold_v2_internal(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) from public, anon, authenticated, service_role;

create function public.create_booking_hold(
  p_property_slug text,
  p_check_in_date date,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_whatsapp text,
  p_guest_count integer,
  p_overnight_guest_count integer,
  p_special_requests text,
  p_hold_request_id uuid,
  p_hold_token_nonce uuid,
  p_request_fingerprint_hash text,
  p_fallback_hold_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  return private.create_booking_hold_v2_internal(
    p_property_slug,
    p_check_in_date,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_whatsapp,
    p_guest_count,
    p_overnight_guest_count,
    p_special_requests,
    p_hold_request_id,
    p_hold_token_nonce,
    p_request_fingerprint_hash,
    p_fallback_hold_minutes
  );
exception
  when deadlock_detected then
    raise exception using errcode = 'P0001', message = 'date_unavailable';
end;
$$;

revoke all on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) from public, anon, authenticated;
grant execute on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) to service_role;

comment on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) is 'Service-only public hold boundary; maps concurrent deadlock losers to a controlled unavailable result.';
