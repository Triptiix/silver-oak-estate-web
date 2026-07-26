create type public.admin_manual_booking_result as (
  result text,
  booking_reference text,
  booking_status public.booking_status,
  reservation_status public.reservation_status,
  payment_provider text,
  check_in_at timestamptz,
  check_out_at timestamptz,
  total_amount_paise bigint,
  advance_amount_paise bigint,
  balance_amount_paise bigint,
  currency text,
  hold_expires_at timestamptz,
  applied boolean
);

create function private.expire_stale_manual_bookings_internal(
  p_batch_limit integer,
  p_reference_instant timestamptz
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_candidate record;
  v_booking public.bookings%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_payment public.payments%rowtype;
  v_count integer := 0;
begin
  if p_batch_limit is null or p_batch_limit < 1 or p_batch_limit > 200
    or p_reference_instant is null then
    raise exception using errcode = '22023', message = 'invalid_expiry_request';
  end if;

  for v_candidate in
    select reservation.booking_id
    from public.inventory_reservations as reservation
    where reservation.reservation_type = 'manual_booking'
      and reservation.status = 'active'
      and reservation.expires_at <= p_reference_instant
      and reservation.booking_id is not null
    order by reservation.expires_at, reservation.id
    limit p_batch_limit
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_candidate.booking_id::text, 0)
    );

    select * into v_booking
    from public.bookings
    where id = v_candidate.booking_id
    for update;
    if not found or v_booking.booking_status <> 'payment_pending' then
      continue;
    end if;

    select * into v_reservation
    from public.inventory_reservations
    where booking_id = v_booking.id
      and reservation_type = 'manual_booking'
      and status = 'active'
    order by created_at desc
    limit 1
    for update;
    if not found
      or v_reservation.expires_at is null
      or v_reservation.expires_at > p_reference_instant then
      continue;
    end if;

    select * into v_payment
    from public.payments
    where booking_id = v_booking.id
      and provider in ('manual_upi', 'payment_link')
      and status = 'pending'
    order by created_at desc
    limit 1
    for update;
    if not found then
      continue;
    end if;

    update public.inventory_reservations
    set status = 'expired',
        updated_at = p_reference_instant
    where id = v_reservation.id
      and status = 'active';
    if not found then
      continue;
    end if;

    update public.bookings
    set booking_status = 'expired',
        updated_at = p_reference_instant
    where id = v_booking.id
      and booking_status = 'payment_pending';
    if not found then
      raise exception using errcode = 'P0001', message = 'manual_expiry_state_changed';
    end if;

    update public.payments
    set status = 'expired',
        updated_at = p_reference_instant
    where id = v_payment.id
      and status = 'pending';
    if not found then
      raise exception using errcode = 'P0001', message = 'manual_expiry_state_changed';
    end if;

    insert into public.booking_events (
      booking_id,
      event_type,
      actor_type,
      actor_id,
      previous_state,
      new_state,
      metadata
    ) values (
      v_booking.id,
      'manual_booking_expired',
      'system',
      null,
      'payment_pending',
      'expired',
      '{}'::jsonb
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.expire_stale_holds(
  p_property_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_reference_instant timestamptz := transaction_timestamp();
  v_temporary_count integer;
  v_manual_count integer;
begin
  with stale as (
    select reservation.id, reservation.booking_id
    from public.inventory_reservations as reservation
    where reservation.reservation_type = 'temporary_hold'
      and reservation.status = 'active'
      and reservation.expires_at <= v_reference_instant
      and (p_property_id is null or reservation.property_id = p_property_id)
    for update
  ), expired_reservations as (
    update public.inventory_reservations as reservation
    set status = 'expired', updated_at = v_reference_instant
    from stale
    where reservation.id = stale.id
    returning stale.booking_id
  ), expired_bookings as (
    update public.bookings as booking
    set booking_status = 'expired', updated_at = v_reference_instant
    where booking.id in (
      select booking_id
      from expired_reservations
      where booking_id is not null
    )
      and booking.booking_status = 'held'
    returning booking.id
  ), events as (
    insert into public.booking_events (
      booking_id, event_type, actor_type, previous_state, new_state, metadata
    )
    select id, 'hold_expired', 'system', 'held', 'expired', '{}'::jsonb
    from expired_bookings
    returning id
  )
  select count(*)::integer into v_temporary_count
  from expired_reservations;

  select private.expire_stale_manual_bookings_internal(
    100,
    v_reference_instant
  ) into v_manual_count;

  return v_temporary_count + v_manual_count;
end;
$$;

create function public.create_admin_manual_booking(
  p_check_in_date date,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_guest_count integer,
  p_overnight_guest_count integer,
  p_special_requests text,
  p_manual_provider text,
  p_request_id uuid
)
returns public.admin_manual_booking_result
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_admin public.admins%rowtype;
  v_property public.properties%rowtype;
  v_property_count integer;
  v_dates record;
  v_price record;
  v_name text := btrim(p_customer_name);
  v_phone text;
  v_email text := nullif(lower(btrim(p_customer_email)), '');
  v_special_requests text := nullif(btrim(p_special_requests), '');
  v_provider text := lower(btrim(p_manual_provider));
  v_overnight integer := coalesce(p_overnight_guest_count, 0);
  v_hold_text text;
  v_hold_minutes integer;
  v_reference_instant timestamptz := transaction_timestamp();
  v_expires_at timestamptz;
  v_fingerprint text;
  v_existing public.admin_operation_events%rowtype;
  v_existing_booking public.bookings%rowtype;
  v_existing_reservation public.inventory_reservations%rowtype;
  v_existing_payment public.payments%rowtype;
  v_customer_id uuid;
  v_booking_id uuid;
  v_reservation_id uuid;
  v_payment_id uuid;
  v_booking_reference text;
  v_confirmation_token text;
  v_payment_idempotency text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'admin_unauthorized';
  end if;

  select * into v_admin
  from public.admins
  where auth_user_id = auth.uid()
    and is_active
    and role in ('operations', 'admin', 'super_admin');
  if not found then
    raise exception using errcode = '42501', message = 'admin_unauthorized';
  end if;

  v_phone := pg_catalog.regexp_replace(
    btrim(p_customer_phone),
    '[^0-9+]',
    '',
    'g'
  );

  if p_request_id is null
    or p_check_in_date is null
    or v_name is null
    or v_name = ''
    or char_length(v_name) > 120
    or v_name ~ '[[:cntrl:]]'
    or v_phone !~ '^\+?[0-9]{7,15}$'
    or v_email is not null and (
      char_length(v_email) > 254
      or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      or v_email ~ '[[:cntrl:]]'
    )
    or v_special_requests is not null and (
      char_length(v_special_requests) > 1000
      or v_special_requests ~ '[[:cntrl:]]'
    ) then
    raise exception using errcode = '22023', message = 'invalid_manual_booking_request';
  end if;

  if v_provider not in ('manual_upi', 'payment_link') then
    raise exception using errcode = '22023', message = 'invalid_manual_provider';
  end if;

  select count(*)::integer into v_property_count
  from public.properties
  where is_active;
  if v_property_count <> 1 then
    raise exception using errcode = 'P0001', message = 'property_configuration_invalid';
  end if;
  select * into strict v_property
  from public.properties
  where is_active;

  if p_guest_count is null
    or p_guest_count < 1
    or p_guest_count > v_property.max_event_guests
    or v_overnight < 0
    or v_overnight > v_property.max_overnight_guests
    or v_overnight > p_guest_count then
    raise exception using errcode = '22023', message = 'capacity_exceeded';
  end if;

  if not coalesce(public.is_current_or_future_business_date(
    v_property.id,
    p_check_in_date,
    v_reference_instant
  ), false) then
    raise exception using errcode = '22023', message = 'past_booking_date';
  end if;

  select * into strict v_dates
  from public.resolve_booking_dates(v_property.id, p_check_in_date);
  select * into strict v_price
  from public.resolve_booking_price(v_property.id, p_check_in_date);

  select btrim(setting_value #>> '{}') into v_hold_text
  from public.site_settings
  where setting_key = 'manual_payment_hold_minutes'
    and not is_sensitive;
  if v_hold_text is null or v_hold_text !~ '^[0-9]+$' then
    raise exception using errcode = 'P0001', message = 'manual_hold_configuration_invalid';
  end if;
  begin
    v_hold_minutes := v_hold_text::integer;
  exception
    when numeric_value_out_of_range then
      raise exception using errcode = 'P0001', message = 'manual_hold_configuration_invalid';
  end;
  if v_hold_minutes < 1 or v_hold_minutes > 60 then
    raise exception using errcode = 'P0001', message = 'manual_hold_configuration_invalid';
  end if;
  v_expires_at := v_reference_instant
    + pg_catalog.make_interval(mins => v_hold_minutes);

  v_fingerprint := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_array(
          v_admin.id::text,
          'manual_booking_created',
          v_property.id::text,
          v_dates.check_in_at::text,
          v_dates.check_out_at::text,
          v_name,
          v_phone,
          v_email,
          p_guest_count,
          v_overnight,
          v_special_requests,
          v_provider,
          v_price.price_amount_paise,
          v_price.advance_amount_paise,
          v_price.balance_amount_paise,
          v_price.currency,
          v_hold_minutes
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_admin.id::text || ':manual_booking_created:' || p_request_id::text,
      0
    )
  );

  select * into v_existing
  from public.admin_operation_events
  where actor_admin_id = v_admin.id
    and action_type = 'manual_booking_created'
    and request_id = p_request_id
  for update;
  if found then
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    select * into strict v_existing_booking
    from public.bookings where id = v_existing.booking_id;
    select * into strict v_existing_reservation
    from public.inventory_reservations
    where id = v_existing.inventory_reservation_id;
    select * into strict v_existing_payment
    from public.payments where id = v_existing.payment_id;
    return (
      'manual_booking_created',
      v_existing_booking.booking_reference,
      v_existing_booking.booking_status,
      v_existing_reservation.status,
      v_existing_payment.provider,
      v_existing_booking.check_in_at,
      v_existing_booking.check_out_at,
      v_existing_booking.total_amount_paise,
      v_existing_booking.advance_amount_paise,
      v_existing_booking.balance_amount_paise,
      v_existing_payment.currency,
      v_existing_reservation.expires_at,
      false
    )::public.admin_manual_booking_result;
  end if;

  perform public.expire_stale_holds(v_property.id);
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_property.id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_phone, 2)
  );

  select id into v_customer_id
  from public.customers
  where phone = v_phone
  order by created_at
  limit 1
  for update;
  if v_customer_id is null then
    insert into public.customers (name, email, phone)
    values (v_name, v_email, v_phone)
    returning id into v_customer_id;
  else
    update public.customers
    set name = v_name,
        email = coalesce(v_email, email)
    where id = v_customer_id;
  end if;

  v_booking_reference := 'SOE-'
    || to_char(p_check_in_date, 'YYYYMMDD')
    || '-'
    || upper(substr(
      pg_catalog.encode(extensions.gen_random_bytes(4), 'hex'),
      1,
      8
    ));
  v_confirmation_token := pg_catalog.encode(
    extensions.gen_random_bytes(32),
    'hex'
  );

  insert into public.bookings (
    booking_reference,
    public_confirmation_token,
    property_id,
    customer_id,
    customer_name_snapshot,
    customer_email_snapshot,
    customer_phone_snapshot,
    source,
    booking_type,
    check_in_at,
    check_out_at,
    guest_count,
    overnight_guest_count,
    total_amount_paise,
    advance_amount_paise,
    balance_amount_paise,
    booking_status,
    special_requests
  ) values (
    v_booking_reference,
    v_confirmation_token,
    v_property.id,
    v_customer_id,
    v_name,
    v_email,
    v_phone,
    'admin_manual',
    'manual_one_night',
    v_dates.check_in_at,
    v_dates.check_out_at,
    p_guest_count,
    v_overnight,
    v_price.price_amount_paise,
    v_price.advance_amount_paise,
    v_price.balance_amount_paise,
    'payment_pending',
    v_special_requests
  ) returning id into v_booking_id;

  insert into public.inventory_reservations (
    property_id,
    booking_id,
    reservation_type,
    status,
    start_at,
    end_at,
    expires_at,
    source
  ) values (
    v_property.id,
    v_booking_id,
    'manual_booking',
    'active',
    v_dates.check_in_at,
    v_dates.check_out_at,
    v_expires_at,
    'admin_manual'
  ) returning id into v_reservation_id;

  v_payment_id := gen_random_uuid();
  v_payment_idempotency := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        'manual:' || v_booking_id::text || ':' || v_provider,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
  insert into public.payments (
    id,
    booking_id,
    provider,
    idempotency_key,
    amount_paise,
    currency,
    status,
    signature_verified,
    attempt_expires_at
  ) values (
    v_payment_id,
    v_booking_id,
    v_provider,
    v_payment_idempotency,
    v_price.advance_amount_paise,
    v_price.currency,
    'pending',
    false,
    v_expires_at
  );

  insert into public.booking_events (
    booking_id,
    event_type,
    actor_type,
    actor_id,
    previous_state,
    new_state,
    metadata
  ) values (
    v_booking_id,
    'manual_booking_created',
    'admin',
    v_admin.id,
    null,
    'payment_pending',
    '{}'::jsonb
  );

  insert into public.admin_operation_events (
    actor_admin_id,
    action_type,
    request_id,
    request_fingerprint,
    booking_id,
    inventory_reservation_id,
    payment_id,
    previous_state,
    resulting_state,
    reason_category
  ) values (
    v_admin.id,
    'manual_booking_created',
    p_request_id,
    v_fingerprint,
    v_booking_id,
    v_reservation_id,
    v_payment_id,
    null,
    'payment_pending',
    'manual_booking'
  );

  return (
    'manual_booking_created',
    v_booking_reference,
    'payment_pending'::public.booking_status,
    'active'::public.reservation_status,
    v_provider,
    v_dates.check_in_at,
    v_dates.check_out_at,
    v_price.price_amount_paise,
    v_price.advance_amount_paise,
    v_price.balance_amount_paise,
    v_price.currency,
    v_expires_at,
    true
  )::public.admin_manual_booking_result;
exception
  when exclusion_violation then
    raise exception using errcode = 'P0001', message = 'date_unavailable';
end;
$$;

revoke all on function private.expire_stale_manual_bookings_internal(integer, timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.create_admin_manual_booking(
  date, text, text, text, integer, integer, text, text, uuid
) from public, anon, authenticated;

grant usage on type public.admin_manual_booking_result to authenticated, service_role;
grant execute on function public.create_admin_manual_booking(
  date, text, text, text, integer, integer, text, text, uuid
) to authenticated;

comment on function public.create_admin_manual_booking(
  date, text, text, text, integer, integer, text, text, uuid
) is
  'Creates one idempotent payment-pending manual booking with server-owned dates, pricing, expiry, and pending payment facts.';
comment on function public.expire_stale_holds(uuid) is
  'Service-only combined housekeeping for stale public holds and bounded stale unpaid manual bookings.';
