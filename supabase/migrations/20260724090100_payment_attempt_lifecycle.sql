alter table public.payments
  add column provider_receipt text,
  add column attempt_expires_at timestamptz,
  add column order_created_at timestamptz,
  add column checkout_started_at timestamptz,
  add column authorized_at timestamptz,
  add column captured_at timestamptz,
  add column verified_at timestamptz,
  add column failed_at timestamptz,
  add column recovery_required_at timestamptz,
  add column verification_source text,
  add column recovery_reason text,
  add column last_provider_event_id text;

alter table public.payments
  add constraint payments_amount_positive check (amount_paise > 0),
  add constraint payments_currency_iso check (currency ~ '^[A-Z]{3}$'),
  add constraint payments_provider_receipt_not_blank
    check (provider_receipt is null or btrim(provider_receipt) <> ''),
  add constraint payments_verification_source_valid
    check (verification_source is null or verification_source in ('browser', 'webhook', 'administrator'));

create unique index payments_provider_receipt_unique
  on public.payments (provider, provider_receipt)
  where provider_receipt is not null;

create unique index payments_one_open_attempt_per_booking_provider
  on public.payments (booking_id, provider)
  where status in (
    'not_started', 'order_created', 'checkout_started', 'pending',
    'authorized', 'captured', 'verified', 'refund_pending',
    'reconciliation_required'
  );

create or replace function public.enforce_payment_status_transition()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'not_started' and new.status in ('order_created', 'failed', 'expired'))
    or (old.status = 'order_created' and new.status in (
      'checkout_started', 'pending', 'authorized', 'captured', 'verified', 'failed', 'expired'
    ))
    or (old.status = 'checkout_started' and new.status in (
      'pending', 'authorized', 'captured', 'verified', 'failed', 'expired'
    ))
    or (old.status = 'pending' and new.status in (
      'authorized', 'captured', 'verified', 'failed', 'expired'
    ))
    or (old.status = 'authorized' and new.status in (
      'captured', 'verified', 'failed', 'refund_pending', 'reconciliation_required'
    ))
    or (old.status = 'captured' and new.status in (
      'verified', 'refund_pending', 'reconciliation_required'
    ))
    or (old.status = 'verified' and new.status in (
      'refund_pending', 'reconciliation_required'
    ))
    or (old.status = 'failed' and new.status in (
      'authorized', 'captured', 'verified', 'refund_pending', 'reconciliation_required'
    ))
    or (old.status = 'expired' and new.status in (
      'authorized', 'captured', 'verified', 'refund_pending', 'reconciliation_required'
    ))
    or (old.status = 'refund_pending' and new.status in (
      'partially_refunded', 'refunded', 'reconciliation_required'
    ))
    or (old.status = 'reconciliation_required' and new.status in (
      'refund_pending', 'partially_refunded', 'refunded'
    ))
    or (old.status = 'partially_refunded' and new.status = 'refunded')
  ) then
    raise exception using errcode = 'P0001', message = 'invalid_payment_status_transition';
  end if;

  return new;
end;
$$;

create trigger payments_enforce_status_transition
before update of status on public.payments
for each row execute function public.enforce_payment_status_transition();

create or replace function public.prepare_payment_order(
  p_booking_id uuid,
  p_hold_token_nonce uuid,
  p_provider text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_booking public.bookings%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_payment public.payments%rowtype;
  v_payment_id uuid;
  v_receipt text;
  v_currency text := 'INR';
begin
  if p_booking_id is null or p_hold_token_nonce is null
    or p_provider is null or btrim(p_provider) = '' then
    raise exception using errcode = '22023', message = 'invalid_payment_request';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_booking_id::text, 0));

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found
    or v_booking.hold_token_nonce is distinct from p_hold_token_nonce
    or v_booking.booking_status <> 'held' then
    raise exception using errcode = 'P0001', message = 'payment_hold_ineligible';
  end if;

  select * into v_reservation
  from public.inventory_reservations
  where booking_id = p_booking_id
    and reservation_type = 'temporary_hold'
    and status = 'active'
  order by created_at desc
  limit 1
  for update;

  if not found or v_reservation.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'payment_hold_ineligible';
  end if;

  select case
    when jsonb_typeof(setting_value) = 'string' then upper(setting_value #>> '{}')
    else null
  end into v_currency
  from public.site_settings
  where setting_key = 'currency' and not is_sensitive;
  v_currency := coalesce(v_currency, 'INR');

  select * into v_payment
  from public.payments
  where booking_id = p_booking_id
    and provider = p_provider
    and status in (
      'not_started', 'order_created', 'checkout_started', 'pending',
      'authorized', 'captured', 'verified', 'refund_pending',
      'reconciliation_required'
    )
  order by created_at desc
  limit 1
  for update;

  if found then
    if v_payment.amount_paise <> v_booking.advance_amount_paise
      or v_payment.currency <> v_currency then
      raise exception using errcode = 'P0001', message = 'payment_attempt_mismatch';
    end if;
    if v_payment.status in ('refund_pending', 'reconciliation_required') then
      raise exception using errcode = 'P0001', message = 'payment_recovery_required';
    end if;
    return jsonb_build_object(
      'paymentId', v_payment.id,
      'providerReceipt', v_payment.provider_receipt,
      'providerOrderId', v_payment.provider_order_id,
      'bookingReference', v_booking.booking_reference,
      'amountPaise', v_payment.amount_paise,
      'currency', v_payment.currency,
      'holdExpiresAt', v_reservation.expires_at,
      'reused', true
    );
  end if;

  v_payment_id := gen_random_uuid();
  v_receipt := 'SOE-' || replace(v_payment_id::text, '-', '');

  insert into public.payments (
    id, booking_id, provider, provider_receipt, idempotency_key,
    amount_paise, currency, status, attempt_expires_at
  ) values (
    v_payment_id, p_booking_id, p_provider, v_receipt,
    encode(extensions.gen_random_bytes(24), 'hex'),
    v_booking.advance_amount_paise, v_currency, 'not_started',
    v_reservation.expires_at
  ) returning * into v_payment;

  insert into public.booking_events (
    booking_id, event_type, actor_type, previous_state, new_state, metadata
  ) values (
    p_booking_id, 'payment_attempt_created', 'system',
    v_booking.booking_status::text, v_booking.booking_status::text,
    jsonb_build_object('provider', p_provider)
  );

  return jsonb_build_object(
    'paymentId', v_payment.id,
    'providerReceipt', v_payment.provider_receipt,
    'providerOrderId', null,
    'bookingReference', v_booking.booking_reference,
    'amountPaise', v_payment.amount_paise,
    'currency', v_payment.currency,
    'holdExpiresAt', v_reservation.expires_at,
    'reused', false
  );
end;
$$;

create or replace function public.attach_provider_order(
  p_payment_id uuid,
  p_provider_order_id text,
  p_amount_paise bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
  v_reference text;
begin
  if p_payment_id is null or p_provider_order_id is null
    or btrim(p_provider_order_id) = ''
    or p_amount_paise is null or p_amount_paise <= 0
    or p_currency is null or upper(p_currency) !~ '^[A-Z]{3}$' then
    raise exception using errcode = '22023', message = 'invalid_provider_order';
  end if;

  select * into v_payment from public.payments
  where id = p_payment_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'payment_attempt_not_found';
  end if;
  if v_payment.amount_paise <> p_amount_paise or v_payment.currency <> upper(p_currency) then
    raise exception using errcode = 'P0001', message = 'provider_order_mismatch';
  end if;
  if v_payment.provider_order_id is not null then
    if v_payment.provider_order_id <> p_provider_order_id then
      raise exception using errcode = 'P0001', message = 'provider_order_conflict';
    end if;
  elsif v_payment.status = 'not_started' then
    update public.payments
    set provider_order_id = p_provider_order_id,
        status = 'order_created',
        order_created_at = now(),
        updated_at = now()
    where id = p_payment_id
    returning * into v_payment;
  else
    raise exception using errcode = 'P0001', message = 'payment_attempt_not_attachable';
  end if;

  select booking_reference into v_reference
  from public.bookings where id = v_payment.booking_id;

  return jsonb_build_object(
    'paymentId', v_payment.id,
    'providerOrderId', v_payment.provider_order_id,
    'bookingReference', v_reference,
    'amountPaise', v_payment.amount_paise,
    'currency', v_payment.currency,
    'holdExpiresAt', v_payment.attempt_expires_at
  );
end;
$$;

create or replace function public.mark_payment_checkout_started(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  update public.payments
  set status = case when status = 'order_created' then 'checkout_started' else status end,
      checkout_started_at = coalesce(checkout_started_at, now()),
      updated_at = now()
  where id = p_payment_id
    and status in ('order_created', 'checkout_started');
  if not found then
    raise exception using errcode = 'P0001', message = 'payment_checkout_unavailable';
  end if;
end;
$$;

create or replace function public.mark_payment_order_failed(
  p_payment_id uuid,
  p_failure_category text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_booking_id uuid;
begin
  update public.payments
  set status = 'failed',
      failure_code = left(coalesce(nullif(btrim(p_failure_category), ''), 'provider_error'), 64),
      failure_reason = null,
      failed_at = now(),
      updated_at = now()
  where id = p_payment_id and status in ('not_started', 'order_created')
  returning booking_id into v_booking_id;

  if v_booking_id is not null then
    insert into public.booking_events (
      booking_id, event_type, actor_type, previous_state, new_state, metadata
    ) values (
      v_booking_id, 'payment_order_failed', 'system', null, null,
      jsonb_build_object('category', left(coalesce(nullif(btrim(p_failure_category), ''), 'provider_error'), 64))
    );
  end if;
end;
$$;

revoke all on function public.enforce_payment_status_transition() from public, anon, authenticated;
revoke all on function public.prepare_payment_order(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.attach_provider_order(uuid,text,bigint,text) from public, anon, authenticated;
revoke all on function public.mark_payment_checkout_started(uuid) from public, anon, authenticated;
revoke all on function public.mark_payment_order_failed(uuid,text) from public, anon, authenticated;

grant execute on function public.prepare_payment_order(uuid,uuid,text) to service_role;
grant execute on function public.attach_provider_order(uuid,text,bigint,text) to service_role;
grant execute on function public.mark_payment_checkout_started(uuid) to service_role;
grant execute on function public.mark_payment_order_failed(uuid,text) to service_role;

comment on table public.payments is
  'Server-owned Razorpay payment attempts. Amount, currency, state, and recovery disposition are authoritative.';
