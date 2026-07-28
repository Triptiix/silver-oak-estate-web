alter table public.bookings
  add column actor_identity_hash text;

alter table public.bookings
  add constraint bookings_actor_identity_hash_format
  check (
    actor_identity_hash is null
    or actor_identity_hash ~ '^[a-f0-9]{64}$'
  );

create index bookings_active_actor_identity_idx
  on public.bookings (property_id, actor_identity_hash)
  where booking_status = 'held'
    and actor_identity_hash is not null;

create function private.create_booking_hold_v3_internal(
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
  p_actor_identity_hash text,
  p_fallback_hold_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_property public.properties%rowtype;
  v_dates record;
  v_price record;
  v_existing public.bookings%rowtype;
  v_customer_id uuid;
  v_booking_id uuid;
  v_booking_reference text;
  v_expires_at timestamptz;
  v_hold_minutes integer;
begin
  if p_hold_request_id is null or p_hold_token_nonce is null
    or p_request_fingerprint_hash is null or btrim(p_request_fingerprint_hash) = '' then
    raise exception using errcode = '22023', message = 'invalid_hold_request';
  end if;

  if p_actor_identity_hash is null or p_actor_identity_hash !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'invalid_actor_identity';
  end if;

  -- Serialize duplicate request IDs and abuse identities in strict order.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_hold_request_id::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_fingerprint_hash, 1));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_customer_phone, 2));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor_identity_hash, 3));

  select * into v_property from public.properties
  where slug = p_property_slug and is_active
  for share;
  if not found then
    raise exception using errcode = 'P0002', message = 'property_not_found';
  end if;

  select * into v_existing from public.bookings where hold_request_id = p_hold_request_id;
  if found then
    if v_existing.request_fingerprint_hash is distinct from p_request_fingerprint_hash
      or v_existing.actor_identity_hash is distinct from p_actor_identity_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    if v_existing.booking_status <> 'held' or not exists (
      select 1 from public.inventory_reservations
      where booking_id = v_existing.id and reservation_type = 'temporary_hold'
        and status = 'active' and expires_at > now()
    ) then
      raise exception using errcode = 'P0001', message = 'idempotency_expired';
    end if;
    return jsonb_build_object(
      'created', false, 'bookingId', v_existing.id,
      'bookingReference', v_existing.booking_reference,
      'checkInAt', v_existing.check_in_at, 'checkOutAt', v_existing.check_out_at,
      'holdExpiresAt', (select expires_at from public.inventory_reservations where booking_id = v_existing.id and status = 'active' limit 1),
      'priceAmountPaise', v_existing.total_amount_paise,
      'advanceAmountPaise', v_existing.advance_amount_paise,
      'balanceAmountPaise', v_existing.balance_amount_paise,
      'currency', 'INR', 'holdTokenNonce', v_existing.hold_token_nonce
    );
  end if;

  perform public.expire_stale_holds(v_property.id);

  select * into v_dates from public.resolve_booking_dates(v_property.id, p_check_in_date);
  if not found then raise exception using errcode = '22023', message = 'invalid_booking_date'; end if;
  if p_guest_count < 1 or p_guest_count > v_property.max_event_guests
    or coalesce(p_overnight_guest_count, 0) < 0
    or coalesce(p_overnight_guest_count, 0) > v_property.max_overnight_guests
    or coalesce(p_overnight_guest_count, 0) > p_guest_count then
    raise exception using errcode = '22023', message = 'capacity_exceeded';
  end if;

  select * into v_price from public.resolve_booking_price(v_property.id, p_check_in_date);
  if not found then raise exception using errcode = 'P0001', message = 'pricing_unavailable'; end if;

  if exists (
    select 1
    from public.bookings as booking
    join public.inventory_reservations as reservation on reservation.booking_id = booking.id
    where booking.property_id = v_property.id
      and booking.booking_status = 'held'
      and reservation.reservation_type = 'temporary_hold'
      and reservation.status = 'active' and reservation.expires_at > now()
      and (booking.request_fingerprint_hash = p_request_fingerprint_hash
        or booking.customer_phone_snapshot = p_customer_phone
        or booking.actor_identity_hash = p_actor_identity_hash)
  ) then
    raise exception using errcode = 'P0001', message = 'hold_abuse_limit';
  end if;

  select case
    when jsonb_typeof(setting_value) = 'number' then (setting_value #>> '{}')::integer
    else null
  end into v_hold_minutes
  from public.site_settings where setting_key = 'booking_hold_minutes' and not is_sensitive;
  v_hold_minutes := coalesce(v_hold_minutes, p_fallback_hold_minutes);
  if v_hold_minutes is null or v_hold_minutes < 1 or v_hold_minutes > 60 then
    raise exception using errcode = '22023', message = 'invalid_hold_duration';
  end if;
  v_expires_at := now() + make_interval(mins => v_hold_minutes);

  select id into v_customer_id from public.customers where phone = p_customer_phone order by created_at limit 1 for update;
  if v_customer_id is null then
    insert into public.customers (name, email, phone, whatsapp)
    values (p_customer_name, p_customer_email, p_customer_phone, p_whatsapp)
    returning id into v_customer_id;
  else
    update public.customers set name = p_customer_name,
      email = coalesce(p_customer_email, email), whatsapp = coalesce(p_whatsapp, whatsapp)
    where id = v_customer_id;
  end if;

  v_booking_reference := 'SOE-' || to_char(p_check_in_date, 'YYYYMMDD') || '-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 8));
  insert into public.bookings (
    booking_reference, public_confirmation_token, property_id, customer_id,
    customer_name_snapshot, customer_email_snapshot, customer_phone_snapshot,
    source, booking_type, check_in_at, check_out_at, guest_count, overnight_guest_count,
    total_amount_paise, advance_amount_paise, balance_amount_paise, booking_status,
    special_requests, hold_request_id, hold_token_nonce, request_fingerprint_hash,
    actor_identity_hash
  ) values (
    v_booking_reference, encode(extensions.gen_random_bytes(32), 'hex'), v_property.id, v_customer_id,
    p_customer_name, p_customer_email, p_customer_phone, 'public_web', 'public_one_night',
    v_dates.check_in_at, v_dates.check_out_at, p_guest_count, coalesce(p_overnight_guest_count, 0),
    v_price.price_amount_paise, v_price.advance_amount_paise, v_price.balance_amount_paise,
    'held', p_special_requests, p_hold_request_id, p_hold_token_nonce, p_request_fingerprint_hash,
    p_actor_identity_hash
  ) returning id into v_booking_id;

  insert into public.inventory_reservations (
    property_id, booking_id, reservation_type, status, start_at, end_at, expires_at, source
  ) values (
    v_property.id, v_booking_id, 'temporary_hold', 'active',
    v_dates.check_in_at, v_dates.check_out_at, v_expires_at, 'public_web'
  );
  insert into public.booking_events (booking_id, event_type, actor_type, previous_state, new_state, metadata)
  values
    (v_booking_id, 'booking_intent_created', 'public', null, 'draft', '{}'::jsonb),
    (v_booking_id, 'hold_acquired', 'public', 'draft', 'held', jsonb_build_object('pricingRuleId', v_price.pricing_rule_id));

  return jsonb_build_object(
    'created', true, 'bookingId', v_booking_id, 'bookingReference', v_booking_reference,
    'checkInAt', v_dates.check_in_at, 'checkOutAt', v_dates.check_out_at,
    'holdExpiresAt', v_expires_at, 'priceAmountPaise', v_price.price_amount_paise,
    'advanceAmountPaise', v_price.advance_amount_paise, 'balanceAmountPaise', v_price.balance_amount_paise,
    'currency', v_price.currency, 'holdTokenNonce', p_hold_token_nonce
  );
exception
  when foreign_key_violation then
    raise exception using errcode = 'P0002', message = 'property_not_found';
  when unique_violation then
    if sqlerrm like '%bookings_hold_request_id_key%' then
      raise exception using errcode = 'P0001', message = 'idempotency_retry';
    end if;
    raise;
end;
$$;

revoke all on function private.create_booking_hold_v3_internal(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, text, integer
) from public, anon, authenticated, service_role;

comment on function private.create_booking_hold_v3_internal(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, text, integer
) is 'Private internal hold creation engine hardened with anonymous actor identity.';

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
  p_actor_identity_hash text,
  p_fallback_hold_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_customer_phone text;
  v_whatsapp text;
begin
  if p_customer_phone is null then
    raise exception using errcode = '22023', message = 'invalid_phone';
  end if;

  v_customer_phone := private.normalize_customer_phone(p_customer_phone);
  v_whatsapp := case
    when p_whatsapp is null then null
    else private.normalize_customer_phone(p_whatsapp)
  end;

  return private.create_booking_hold_v3_internal(
    p_property_slug,
    p_check_in_date,
    p_customer_name,
    p_customer_email,
    v_customer_phone,
    v_whatsapp,
    p_guest_count,
    p_overnight_guest_count,
    p_special_requests,
    p_hold_request_id,
    p_hold_token_nonce,
    p_request_fingerprint_hash,
    p_actor_identity_hash,
    p_fallback_hold_minutes
  );
exception
  when deadlock_detected then
    raise exception using errcode = 'P0001', message = 'date_unavailable';
end;
$$;

revoke all on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, text, integer
) from public, anon, authenticated, service_role;

grant execute on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, text, integer
) to service_role;

comment on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, text, integer
) is 'Service-only public hold boundary; canonicalizes phone identity before privileged booking creation.';

revoke all on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) from public, anon, authenticated, service_role;

drop function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
);

drop function private.create_booking_hold_v2_internal(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
);
