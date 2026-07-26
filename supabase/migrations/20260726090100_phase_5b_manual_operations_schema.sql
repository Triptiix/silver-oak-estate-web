alter table public.payments
  add column manual_reference text,
  add column verified_by_admin_id uuid references public.admins(id) on delete restrict,
  add column manual_verified_at timestamptz,
  add column operator_note text,
  add column evidence_descriptor text;

create or replace function public.normalize_manual_payment_facts()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.manual_reference is not null then
    new.manual_reference := upper(btrim(new.manual_reference));
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
before insert or update of manual_reference, operator_note, evidence_descriptor
on public.payments
for each row execute function public.normalize_manual_payment_facts();

alter table public.payments
  add constraint payments_manual_reference_format
    check (
      manual_reference is null
      or manual_reference ~ '^[A-Z0-9][A-Z0-9._:/-]{2,127}$'
    ),
  add constraint payments_operator_note_bounded
    check (operator_note is null or char_length(operator_note) <= 500),
  add constraint payments_evidence_descriptor_bounded
    check (
      evidence_descriptor is null
      or char_length(evidence_descriptor) <= 200
    ),
  add constraint payments_manual_provider_fact_boundary
    check (
      (
        provider not in ('manual_upi', 'payment_link')
        and manual_reference is null
        and verified_by_admin_id is null
        and manual_verified_at is null
        and operator_note is null
        and evidence_descriptor is null
      )
      or (
        provider in ('manual_upi', 'payment_link')
        and provider_order_id is null
        and provider_payment_id is null
        and signature_verified = false
      )
    ),
  add constraint payments_manual_attestation_consistent
    check (
      (
        manual_reference is null
        and verified_by_admin_id is null
        and manual_verified_at is null
        and operator_note is null
        and evidence_descriptor is null
      )
      or (
        provider in ('manual_upi', 'payment_link')
        and manual_reference is not null
        and verified_by_admin_id is not null
        and manual_verified_at is not null
        and verification_source = 'administrator'
        and signature_verified = false
      )
    ),
  add constraint payments_manually_verified_complete
    check (
      status <> 'manually_verified'
      or (
        provider in ('manual_upi', 'payment_link')
        and manual_reference is not null
        and verified_by_admin_id is not null
        and manual_verified_at is not null
        and verification_source = 'administrator'
        and signature_verified = false
      )
    ),
  add constraint payments_manual_never_razorpay_verified
    check (
      provider not in ('manual_upi', 'payment_link')
      or status <> 'verified'
    );

create unique index payments_manual_reference_unique
  on public.payments (provider, manual_reference)
  where provider in ('manual_upi', 'payment_link')
    and manual_reference is not null;

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
      'authorized', 'captured', 'verified', 'manually_verified', 'failed', 'expired',
      'reconciliation_required'
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
    or (old.status = 'manually_verified' and new.status = 'reconciliation_required')
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

alter table public.inventory_reservations
  drop constraint inventory_reservations_expired_status_type;

alter table public.inventory_reservations
  add constraint inventory_reservations_expired_status_type
    check (
      status <> 'expired'
      or reservation_type in ('temporary_hold', 'manual_booking')
    ),
  add constraint inventory_reservations_booking_relationship
    check (
      reservation_type not in (
        'confirmed_booking', 'manual_booking'
      )
      or booking_id is not null
    ),
  add constraint inventory_reservations_manual_booking_expiry
    check (
      reservation_type <> 'manual_booking'
      or status <> 'active'
      or expires_at is not null
    ),
  add constraint inventory_reservations_confirmed_booking_no_expiry
    check (
      reservation_type <> 'confirmed_booking'
      or expires_at is null
    ),
  add constraint inventory_reservations_confirmed_booking_active
    check (
      reservation_type <> 'confirmed_booking'
      or status = 'active'
    ),
  add constraint inventory_reservations_manual_blocks_isolated
    check (
      reservation_type not in ('owner_block', 'maintenance_block')
      or (
        booking_id is null
        and external_reservation_id is null
        and expires_at is null
      )
    );

create or replace function public.prevent_inventory_reservation_reactivation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.status in ('released', 'expired', 'cancelled')
    and new.status = 'active' then
    raise exception using
      errcode = 'P0001',
      message = 'terminal_reservation_cannot_reactivate';
  end if;
  return new;
end;
$$;

create trigger inventory_reservations_prevent_reactivation
before update of status on public.inventory_reservations
for each row execute function public.prevent_inventory_reservation_reactivation();

create type public.admin_operation_action as enum (
  'owner_block_created',
  'maintenance_block_created',
  'owner_block_released',
  'maintenance_block_released',
  'manual_booking_created',
  'manual_booking_expired',
  'manual_payment_verified',
  'manual_payment_reconciliation_required'
);

create table public.admin_operation_events (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid not null references public.admins(id) on delete restrict,
  action_type public.admin_operation_action not null,
  request_id uuid not null,
  request_fingerprint text not null,
  booking_id uuid references public.bookings(id) on delete restrict,
  inventory_reservation_id uuid references public.inventory_reservations(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete restrict,
  previous_state text,
  resulting_state text not null,
  reason_category text,
  internal_note text,
  created_at timestamptz not null default now(),
  constraint admin_operation_events_request_unique
    unique (actor_admin_id, action_type, request_id),
  constraint admin_operation_events_fingerprint_format
    check (request_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint admin_operation_events_result_not_blank
    check (btrim(resulting_state) <> '' and char_length(resulting_state) <= 64),
  constraint admin_operation_events_previous_state_bounded
    check (
      previous_state is null
      or (btrim(previous_state) <> '' and char_length(previous_state) <= 64)
    ),
  constraint admin_operation_events_reason_bounded
    check (
      reason_category is null
      or (
        reason_category ~ '^[a-z][a-z0-9_]{1,63}$'
        and char_length(reason_category) <= 64
      )
    ),
  constraint admin_operation_events_note_bounded
    check (
      internal_note is null
      or (btrim(internal_note) <> '' and char_length(internal_note) <= 500)
    ),
  constraint admin_operation_events_required_targets
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
        action_type in (
          'manual_payment_verified',
          'manual_payment_reconciliation_required'
        )
        and booking_id is not null
        and inventory_reservation_id is not null
        and payment_id is not null
      )
    )
);

create index admin_operation_events_booking_created_idx
  on public.admin_operation_events (booking_id, created_at)
  where booking_id is not null;

create index admin_operation_events_reservation_created_idx
  on public.admin_operation_events (inventory_reservation_id, created_at)
  where inventory_reservation_id is not null;

create index admin_operation_events_payment_created_idx
  on public.admin_operation_events (payment_id, created_at)
  where payment_id is not null;

create or replace function public.reject_admin_operation_event_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = 'P0001',
    message = 'admin_operation_events_are_immutable';
end;
$$;

create trigger admin_operation_events_reject_update_delete
before update or delete on public.admin_operation_events
for each row execute function public.reject_admin_operation_event_mutation();

alter table public.admin_operation_events enable row level security;

revoke all on table public.admin_operation_events from public, anon, authenticated;
grant select on table public.admin_operation_events to service_role;

revoke all on function public.normalize_manual_payment_facts()
  from public, anon, authenticated;
revoke all on function public.prevent_inventory_reservation_reactivation()
  from public, anon, authenticated;
revoke all on function public.reject_admin_operation_event_mutation()
  from public, anon, authenticated;

grant usage on type public.admin_operation_action to service_role;

comment on column public.payments.manual_reference is
  'Uppercase, trimmed external reference for a manual UPI or payment-link fact.';
comment on column public.payments.evidence_descriptor is
  'Bounded non-sensitive evidence label only. Raw evidence and uploads are prohibited.';
comment on table public.admin_operation_events is
  'Immutable Phase 5B administrator mutation and idempotency receipts. Request fingerprints are SHA-256 hex digests of normalized inputs.';
