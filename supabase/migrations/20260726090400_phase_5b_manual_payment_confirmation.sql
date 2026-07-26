alter table public.payments
  add column observed_amount_paise bigint,
  add column observed_currency text;

drop trigger payments_normalize_manual_facts on public.payments;

create or replace function public.normalize_manual_payment_facts()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.manual_reference is not null then
    new.manual_reference := upper(btrim(new.manual_reference));
  end if;
  if new.observed_currency is not null then
    new.observed_currency := upper(btrim(new.observed_currency));
  end if;
  if new.operator_note is not null then
    new.operator_note := nullif(btrim(new.operator_note), '');
  end if;
  if new.evidence_descriptor is not null then
    new.evidence_descriptor := nullif(btrim(new.evidence_descriptor), '');
  end if;
  return new;
end;
$$;

create trigger payments_normalize_manual_facts
before insert or update of
  manual_reference,
  observed_currency,
  operator_note,
  evidence_descriptor
on public.payments
for each row execute function public.normalize_manual_payment_facts();

alter table public.payments
  add constraint payments_observed_amount_positive
    check (observed_amount_paise is null or observed_amount_paise > 0),
  add constraint payments_observed_currency_iso
    check (observed_currency is null or observed_currency ~ '^[A-Z]{3}$'),
  add constraint payments_manual_observation_consistent
    check (
      (
        observed_amount_paise is null
        and observed_currency is null
      )
      or (
        provider in ('manual_upi', 'payment_link')
        and manual_reference is not null
        and observed_amount_paise is not null
        and observed_currency is not null
        and verified_by_admin_id is not null
        and manual_verified_at is not null
        and verification_source = 'administrator'
        and signature_verified = false
      )
    );

alter table public.admin_operation_events
  drop constraint admin_operation_events_required_targets,
  add constraint admin_operation_events_required_targets
    check (
      (
        action_type in (
          'owner_block_created',
          'maintenance_block_created',
          'owner_block_released',
          'maintenance_block_released'
        )
        and inventory_reservation_id is not null
        and booking_id is null
        and payment_id is null
      )
      or (
        action_type in ('manual_booking_created', 'manual_booking_expired')
        and booking_id is not null
        and inventory_reservation_id is not null
      )
      or (
        action_type = 'manual_payment_verified'
        and booking_id is not null
        and inventory_reservation_id is not null
        and payment_id is not null
      )
      or (
        action_type = 'manual_payment_reconciliation_required'
        and booking_id is not null
        and payment_id is not null
      )
    );

create type public.admin_manual_payment_result as (
  result text,
  booking_reference text,
  booking_status public.booking_status,
  reservation_type public.reservation_type,
  reservation_status public.reservation_status,
  payment_status public.payment_status,
  manual_provider text,
  expected_amount_paise bigint,
  observed_amount_paise bigint,
  currency text,
  applied boolean
);

create function public.verify_admin_manual_payment(
  p_booking_reference text,
  p_external_reference text,
  p_observed_amount_paise bigint,
  p_observed_currency text,
  p_request_id uuid,
  p_operator_note text default null,
  p_evidence_descriptor text default null
)
returns public.admin_manual_payment_result
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_admin public.admins%rowtype;
  v_booking public.bookings%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_payment public.payments%rowtype;
  v_existing public.admin_operation_events%rowtype;
  v_reference text := btrim(p_booking_reference);
  v_external_reference text := upper(btrim(p_external_reference));
  v_currency text := upper(btrim(p_observed_currency));
  v_operator_note text := nullif(btrim(p_operator_note), '');
  v_evidence_descriptor text := nullif(btrim(p_evidence_descriptor), '');
  v_reference_instant timestamptz := transaction_timestamp();
  v_fingerprint text;
  v_reason text;
  v_old_booking_status public.booking_status;
  v_result text;
  v_reservation_count integer;
  v_payment_count integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'admin_unauthorized';
  end if;

  select * into v_admin
  from public.admins
  where auth_user_id = auth.uid()
    and is_active
    and role in ('admin', 'super_admin');
  if not found then
    raise exception using errcode = '42501', message = 'admin_unauthorized';
  end if;

  if p_request_id is null then
    raise exception using errcode = '22023', message = 'invalid_manual_payment_request';
  end if;
  if v_reference is null
    or v_reference !~ '^SOE-[0-9]{8}-[A-F0-9]{8}$' then
    raise exception using errcode = '22023', message = 'invalid_booking_reference';
  end if;
  if v_external_reference is null
    or v_external_reference !~ '^[A-Z0-9][A-Z0-9._:/-]{2,127}$' then
    raise exception using errcode = '22023', message = 'invalid_external_reference';
  end if;
  if p_observed_amount_paise is null or p_observed_amount_paise <= 0 then
    raise exception using errcode = '22023', message = 'invalid_observed_amount';
  end if;
  if v_currency is null or v_currency !~ '^[A-Z]{3}$' then
    raise exception using errcode = '22023', message = 'invalid_observed_currency';
  end if;
  if v_operator_note is not null and (
      char_length(v_operator_note) > 500
      or v_operator_note ~ '[[:cntrl:]]'
    ) then
    raise exception using errcode = '22023', message = 'invalid_operator_note';
  end if;
  if v_evidence_descriptor is not null and (
      char_length(v_evidence_descriptor) > 200
      or v_evidence_descriptor ~ '[[:cntrl:]]'
      or v_evidence_descriptor ~* 'https?://'
    ) then
    raise exception using errcode = '22023', message = 'invalid_evidence_descriptor';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_admin.id::text || ':manual_payment_verification:' || p_request_id::text,
      0
    )
  );

  select * into v_existing
  from public.admin_operation_events
  where actor_admin_id = v_admin.id
    and request_id = p_request_id
    and action_type in (
      'manual_payment_verified',
      'manual_payment_reconciliation_required'
    )
  order by created_at
  limit 1
  for update;

  if found then
    select * into strict v_booking
    from public.bookings where id = v_existing.booking_id;
    select * into strict v_payment
    from public.payments where id = v_existing.payment_id;
    if v_existing.inventory_reservation_id is not null then
      select * into strict v_reservation
      from public.inventory_reservations
      where id = v_existing.inventory_reservation_id;
    end if;

    v_fingerprint := pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(
          pg_catalog.jsonb_build_array(
            v_admin.id::text,
            v_reference,
            v_payment.provider,
            v_external_reference,
            p_observed_amount_paise,
            v_currency,
            v_operator_note,
            v_evidence_descriptor
          )::text,
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    );
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return (
      case v_existing.action_type
        when 'manual_payment_verified' then 'confirmed'
        else 'reconciliation_required'
      end,
      v_booking.booking_reference,
      v_booking.booking_status,
      v_reservation.reservation_type,
      v_reservation.status,
      v_payment.status,
      v_payment.provider,
      v_payment.amount_paise,
      v_payment.observed_amount_paise,
      v_payment.observed_currency,
      false
    )::public.admin_manual_payment_result;
  end if;

  select * into v_booking
  from public.bookings
  where booking_reference = v_reference;
  if not found then
    raise exception using errcode = 'P0002', message = 'booking_not_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_booking.id::text, 0)
  );

  select * into strict v_booking
  from public.bookings
  where id = v_booking.id
  for update;

  select count(*)::integer into v_reservation_count
  from public.inventory_reservations
  where booking_id = v_booking.id;
  select * into v_reservation
  from public.inventory_reservations
  where booking_id = v_booking.id
  order by created_at desc, id
  limit 1
  for update;

  select count(*)::integer into v_payment_count
  from public.payments
  where booking_id = v_booking.id
    and provider in ('manual_upi', 'payment_link');
  select * into v_payment
  from public.payments
  where booking_id = v_booking.id
    and provider in ('manual_upi', 'payment_link')
  order by created_at desc, id
  limit 1
  for update;
  if not found or v_payment_count <> 1 then
    raise exception using errcode = 'P0001', message = 'invalid_manual_payment_relationship';
  end if;

  v_fingerprint := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_array(
          v_admin.id::text,
          v_reference,
          v_payment.provider,
          v_external_reference,
          p_observed_amount_paise,
          v_currency,
          v_operator_note,
          v_evidence_descriptor
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  if v_payment.status not in ('pending', 'expired')
    or v_payment.manual_reference is not null
    or v_payment.verified_by_admin_id is not null
    or v_payment.manual_verified_at is not null then
    raise exception using errcode = 'P0001', message = 'payment_already_processed';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_payment.provider || ':manual_reference:' || v_external_reference,
      1
    )
  );
  if exists (
    select 1
    from public.payments
    where provider = v_payment.provider
      and manual_reference = v_external_reference
      and id <> v_payment.id
  ) then
    raise exception using errcode = 'P0001', message = 'payment_reference_conflict';
  end if;

  v_old_booking_status := v_booking.booking_status;
  if v_booking.booking_status <> 'payment_pending' then
    v_reason := 'booking_ineligible';
  elsif v_reservation_count <> 1 or v_reservation.id is null then
    v_reason := 'reservation_relationship_invalid';
  elsif v_reservation.booking_id <> v_booking.id
    or v_reservation.property_id <> v_booking.property_id
    or v_reservation.start_at <> v_booking.check_in_at
    or v_reservation.end_at <> v_booking.check_out_at then
    v_reason := 'reservation_relationship_invalid';
  elsif v_reservation.reservation_type <> 'manual_booking'
    or v_reservation.status <> 'active' then
    v_reason := 'reservation_ineligible';
  elsif v_reservation.expires_at is null
    or v_reservation.expires_at <= v_reference_instant then
    v_reason := 'reservation_expired';
  elsif v_payment.status <> 'pending'
    or v_payment.booking_id <> v_booking.id
    or v_payment.provider not in ('manual_upi', 'payment_link')
    or v_payment.provider_order_id is not null
    or v_payment.provider_payment_id is not null
    or v_payment.provider_receipt is not null
    or v_payment.last_provider_event_id is not null
    or v_payment.signature_verified then
    v_reason := 'payment_ineligible';
  elsif v_payment.amount_paise <> v_booking.advance_amount_paise then
    v_reason := 'stored_amount_mismatch';
  elsif v_payment.currency <> 'INR'
    or v_payment.currency <> v_currency then
    v_reason := 'stored_currency_mismatch';
  elsif p_observed_amount_paise <> v_payment.amount_paise then
    v_reason := 'amount_mismatch';
  end if;

  if v_reason is null then
    update public.payments
    set manual_reference = v_external_reference,
        observed_amount_paise = p_observed_amount_paise,
        observed_currency = v_currency,
        verified_by_admin_id = v_admin.id,
        manual_verified_at = v_reference_instant,
        verification_source = 'administrator',
        operator_note = v_operator_note,
        evidence_descriptor = v_evidence_descriptor,
        status = 'manually_verified',
        updated_at = v_reference_instant
    where id = v_payment.id
      and status = 'pending'
    returning * into strict v_payment;

    update public.inventory_reservations
    set reservation_type = 'confirmed_booking',
        expires_at = null,
        updated_at = v_reference_instant
    where id = v_reservation.id
      and reservation_type = 'manual_booking'
      and status = 'active'
      and expires_at > v_reference_instant
    returning * into strict v_reservation;

    update public.bookings
    set booking_status = 'confirmed',
        updated_at = v_reference_instant
    where id = v_booking.id
      and booking_status = 'payment_pending'
    returning * into strict v_booking;

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
      'manual_payment_confirmed',
      'admin',
      v_admin.id,
      'payment_pending',
      'confirmed',
      '{}'::jsonb
    );

    insert into public.notification_events (
      booking_id,
      channel,
      template_key,
      recipient_hash,
      recipient_masked
    ) values (
      v_booking.id,
      'sms',
      'booking_confirmed',
      pg_catalog.encode(
        extensions.digest(v_booking.customer_phone_snapshot, 'sha256'),
        'hex'
      ),
      '***' || pg_catalog.right(v_booking.customer_phone_snapshot, 4)
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
      'manual_payment_verified',
      p_request_id,
      v_fingerprint,
      v_booking.id,
      v_reservation.id,
      v_payment.id,
      'payment_pending',
      'confirmed',
      'eligible_manual_payment'
    );
    v_result := 'confirmed';
  else
    update public.payments
    set manual_reference = v_external_reference,
        observed_amount_paise = p_observed_amount_paise,
        observed_currency = v_currency,
        verified_by_admin_id = v_admin.id,
        manual_verified_at = v_reference_instant,
        verification_source = 'administrator',
        operator_note = v_operator_note,
        evidence_descriptor = v_evidence_descriptor,
        status = 'reconciliation_required',
        recovery_reason = v_reason,
        recovery_required_at = coalesce(recovery_required_at, v_reference_instant),
        updated_at = v_reference_instant
    where id = v_payment.id
      and status in ('pending', 'expired')
    returning * into strict v_payment;

    if v_reservation.id is not null
      and v_reservation.reservation_type = 'manual_booking'
      and v_reservation.status = 'active' then
      update public.inventory_reservations
      set status = 'expired',
          updated_at = v_reference_instant
      where id = v_reservation.id
        and reservation_type = 'manual_booking'
        and status = 'active'
      returning * into strict v_reservation;
    end if;

    if v_booking.booking_status = 'payment_pending' then
      update public.bookings
      set booking_status = 'expired',
          updated_at = v_reference_instant
      where id = v_booking.id
        and booking_status = 'payment_pending'
      returning * into strict v_booking;
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
      'manual_payment_reconciliation_required',
      'admin',
      v_admin.id,
      v_old_booking_status::text,
      v_booking.booking_status::text,
      pg_catalog.jsonb_build_object('reason', v_reason)
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
      'manual_payment_reconciliation_required',
      p_request_id,
      v_fingerprint,
      v_booking.id,
      v_reservation.id,
      v_payment.id,
      v_old_booking_status::text,
      v_booking.booking_status::text,
      v_reason
    );
    v_result := 'reconciliation_required';
  end if;

  return (
    v_result,
    v_booking.booking_reference,
    v_booking.booking_status,
    v_reservation.reservation_type,
    v_reservation.status,
    v_payment.status,
    v_payment.provider,
    v_payment.amount_paise,
    v_payment.observed_amount_paise,
    v_payment.observed_currency,
    true
  )::public.admin_manual_payment_result;
end;
$$;

revoke all on function public.verify_admin_manual_payment(
  text, text, bigint, text, uuid, text, text
) from public, anon, authenticated;
grant usage on type public.admin_manual_payment_result to authenticated, service_role;
grant execute on function public.verify_admin_manual_payment(
  text, text, bigint, text, uuid, text, text
) to authenticated;

revoke all on function public.normalize_manual_payment_facts()
  from public, anon, authenticated, service_role;

comment on column public.payments.observed_amount_paise is
  'Administrator-observed manual payment amount in integer paise; distinct from the server-owned expected amount.';
comment on column public.payments.observed_currency is
  'Administrator-observed normalized ISO currency for a manual payment.';
comment on function public.verify_admin_manual_payment(
  text, text, bigint, text, uuid, text, text
) is
  'Atomically confirms an eligible manual booking or terminalizes it for reconciliation without inventory revival.';
