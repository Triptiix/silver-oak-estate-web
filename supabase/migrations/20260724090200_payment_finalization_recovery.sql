create or replace function public.finalize_verified_payment(
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_paise bigint,
  p_currency text,
  p_financial_status text,
  p_verification_source text,
  p_provider_event_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_recovery_reason text;
  v_booking_id uuid;
begin
  if p_provider is null or btrim(p_provider) = ''
    or p_provider_order_id is null or btrim(p_provider_order_id) = ''
    or p_provider_payment_id is null or btrim(p_provider_payment_id) = ''
    or p_amount_paise is null or p_amount_paise <= 0
    or p_currency is null or upper(p_currency) !~ '^[A-Z]{3}$'
    or p_financial_status not in ('authorized', 'captured')
    or p_verification_source not in ('browser', 'webhook', 'administrator') then
    raise exception using errcode = '22023', message = 'invalid_payment_verification';
  end if;

  select booking_id into v_booking_id
  from public.payments
  where provider = p_provider and provider_order_id = p_provider_order_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'payment_attempt_not_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_booking_id::text, 0));

  select * into v_booking
  from public.bookings
  where id = v_booking_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'booking_not_found';
  end if;

  select * into v_payment
  from public.payments
  where provider = p_provider
    and provider_order_id = p_provider_order_id
    and booking_id = v_booking_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'payment_attempt_not_found';
  end if;
  if v_payment.provider_payment_id is not null
    and v_payment.provider_payment_id <> p_provider_payment_id then
    raise exception using errcode = 'P0001', message = 'provider_payment_conflict';
  end if;

  update public.payments
  set provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
      signature_verified = true,
      verification_source = coalesce(verification_source, p_verification_source),
      last_provider_event_id = coalesce(p_provider_event_id, last_provider_event_id),
      verified_at = coalesce(verified_at, now()),
      updated_at = now()
  where id = v_payment.id
  returning * into v_payment;

  if v_payment.status in ('refund_pending', 'reconciliation_required') then
    return jsonb_build_object(
      'result', 'recovery_required',
      'bookingReference', v_booking.booking_reference
    );
  end if;

  if p_financial_status = 'authorized' then
    if v_payment.status not in ('authorized', 'captured', 'verified') then
      update public.payments
      set status = 'authorized',
          authorized_at = coalesce(authorized_at, now()),
          updated_at = now()
      where id = v_payment.id
      returning * into v_payment;
    end if;
  else
    if v_payment.status not in ('captured', 'verified') then
      update public.payments
      set status = 'captured',
          captured_at = coalesce(captured_at, now()),
          updated_at = now()
      where id = v_payment.id
      returning * into v_payment;
    end if;
  end if;

  if v_payment.amount_paise <> p_amount_paise then
    v_recovery_reason := 'amount_mismatch';
  elsif v_payment.currency <> upper(p_currency) then
    v_recovery_reason := 'currency_mismatch';
  end if;

  if p_financial_status = 'authorized' and v_recovery_reason is null then
    return jsonb_build_object(
      'result', 'payment_pending',
      'bookingReference', v_booking.booking_reference
    );
  end if;

  if v_booking.booking_status = 'confirmed' and v_recovery_reason is null then
    if v_payment.status = 'captured' then
      update public.payments set status = 'verified', updated_at = now()
      where id = v_payment.id;
    end if;
    return jsonb_build_object(
      'result', 'confirmed',
      'bookingReference', v_booking.booking_reference
    );
  end if;

  select * into v_reservation
  from public.inventory_reservations
  where booking_id = v_booking.id
  order by created_at desc
  limit 1
  for update;

  if v_recovery_reason is null then
    if not found then
      v_recovery_reason := 'reservation_missing';
    elsif v_booking.booking_status <> 'held' then
      v_recovery_reason := case
        when v_reservation.status = 'released' then 'hold_released'
        when v_reservation.status = 'expired' then 'hold_expired'
        else 'booking_ineligible'
      end;
    elsif v_reservation.reservation_type <> 'temporary_hold'
      or v_reservation.status <> 'active' then
      v_recovery_reason := case
        when v_reservation.status = 'released' then 'hold_released'
        when v_reservation.status = 'expired' then 'hold_expired'
        else 'reservation_ineligible'
      end;
    elsif v_reservation.expires_at is null or v_reservation.expires_at <= now() then
      v_recovery_reason := 'hold_expired';
    end if;
  end if;

  if v_recovery_reason is not null then
    if found and v_reservation.reservation_type = 'temporary_hold'
      and v_reservation.status = 'active'
      and v_reservation.expires_at <= now() then
      update public.inventory_reservations
      set status = 'expired', updated_at = now()
      where id = v_reservation.id;
      if v_booking.booking_status = 'held' then
        update public.bookings
        set booking_status = 'expired', updated_at = now()
        where id = v_booking.id;
      end if;
    end if;

    update public.payments
    set status = 'refund_pending',
        recovery_reason = v_recovery_reason,
        recovery_required_at = coalesce(recovery_required_at, now()),
        failure_reason = null,
        updated_at = now()
    where id = v_payment.id;

    insert into public.booking_events (
      booking_id, event_type, actor_type, previous_state, new_state, metadata
    ) values (
      v_booking.id, 'payment_recovery_required', 'system',
      v_booking.booking_status::text, v_booking.booking_status::text,
      jsonb_build_object('reason', v_recovery_reason)
    );

    insert into public.notification_events (
      booking_id, channel, template_key, recipient_hash, recipient_masked
    ) values (
      v_booking.id, 'internal', 'payment_recovery_required',
      encode(extensions.digest('administrator_payment_recovery', 'sha256'), 'hex'),
      'administrator'
    );

    return jsonb_build_object(
      'result', 'recovery_required',
      'bookingReference', v_booking.booking_reference
    );
  end if;

  begin
    update public.inventory_reservations
    set reservation_type = 'confirmed_booking',
        expires_at = null,
        updated_at = now()
    where id = v_reservation.id
      and reservation_type = 'temporary_hold'
      and status = 'active'
      and expires_at > now();
    if not found then
      raise exception using errcode = 'P0001', message = 'hold_lost_during_confirmation';
    end if;

    update public.bookings
    set booking_status = 'confirmed',
        hold_token_nonce = null,
        request_fingerprint_hash = null,
        updated_at = now()
    where id = v_booking.id and booking_status = 'held';
    if not found then
      raise exception using errcode = 'P0001', message = 'booking_lost_during_confirmation';
    end if;

    update public.payments
    set status = 'verified',
        recovery_reason = null,
        updated_at = now()
    where id = v_payment.id;

    insert into public.booking_events (
      booking_id, event_type, actor_type, previous_state, new_state, metadata
    ) values
      (
        v_booking.id, 'payment_verified', 'system',
        v_payment.status::text, 'verified',
        jsonb_build_object('source', p_verification_source)
      ),
      (
        v_booking.id, 'booking_confirmed', 'system',
        'held', 'confirmed', '{}'::jsonb
      );

    insert into public.notification_events (
      booking_id, channel, template_key, recipient_hash, recipient_masked
    ) values (
      v_booking.id, 'sms', 'booking_confirmed',
      encode(extensions.digest(v_booking.customer_phone_snapshot, 'sha256'), 'hex'),
      '***' || right(v_booking.customer_phone_snapshot, 4)
    );
  exception
    when others then
      update public.payments
      set status = 'refund_pending',
          recovery_reason = 'confirmation_failed',
          recovery_required_at = coalesce(recovery_required_at, now()),
          failure_reason = null,
          updated_at = now()
      where id = v_payment.id;

      insert into public.booking_events (
        booking_id, event_type, actor_type, previous_state, new_state, metadata
      ) values (
        v_booking.id, 'payment_recovery_required', 'system',
        v_booking.booking_status::text, v_booking.booking_status::text,
        jsonb_build_object('reason', 'confirmation_failed')
      );

      insert into public.notification_events (
        booking_id, channel, template_key, recipient_hash, recipient_masked
      ) values (
        v_booking.id, 'internal', 'payment_recovery_required',
        encode(extensions.digest('administrator_payment_recovery', 'sha256'), 'hex'),
        'administrator'
      );

      return jsonb_build_object(
        'result', 'recovery_required',
        'bookingReference', v_booking.booking_reference
      );
  end;

  return jsonb_build_object(
    'result', 'confirmed',
    'bookingReference', v_booking.booking_reference
  );
end;
$$;

create or replace function public.mark_provider_payment_failed(
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_provider_event_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
begin
  select * into v_payment
  from public.payments
  where provider = p_provider and provider_order_id = p_provider_order_id
  for update;
  if not found then
    return false;
  end if;
  if v_payment.provider_payment_id is not null
    and v_payment.provider_payment_id <> p_provider_payment_id then
    raise exception using errcode = 'P0001', message = 'provider_payment_conflict';
  end if;
  if v_payment.status in ('captured', 'verified', 'refund_pending', 'reconciliation_required', 'refunded') then
    return true;
  end if;

  update public.payments
  set provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
      status = 'failed',
      failure_code = 'provider_payment_failed',
      failure_reason = null,
      failed_at = coalesce(failed_at, now()),
      last_provider_event_id = coalesce(p_provider_event_id, last_provider_event_id),
      updated_at = now()
  where id = v_payment.id;
  return true;
end;
$$;

revoke all on function public.finalize_verified_payment(text,text,text,bigint,text,text,text,text)
  from public, anon, authenticated;
revoke all on function public.mark_provider_payment_failed(text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.finalize_verified_payment(text,text,text,bigint,text,text,text,text)
  to service_role;
grant execute on function public.mark_provider_payment_failed(text,text,text,text)
  to service_role;

comment on function public.finalize_verified_payment(text,text,text,bigint,text,text,text,text) is
  'Shared idempotent browser/webhook finalizer. Never reacquires inventory and routes late verified payments to durable recovery.';
