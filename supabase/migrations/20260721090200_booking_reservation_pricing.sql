create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  public_confirmation_token text not null unique,
  property_id uuid not null references public.properties(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name_snapshot text not null,
  customer_email_snapshot text,
  customer_phone_snapshot text not null,
  source text not null,
  booking_type text not null,
  check_in_at timestamptz not null,
  check_out_at timestamptz not null,
  guest_count integer not null,
  overnight_guest_count integer,
  total_amount_paise bigint not null,
  advance_amount_paise bigint not null,
  balance_amount_paise bigint not null,
  booking_status public.booking_status not null default 'draft',
  special_requests text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint bookings_reference_not_blank check (btrim(booking_reference) <> ''),
  constraint bookings_confirmation_token_not_blank check (btrim(public_confirmation_token) <> ''),
  constraint bookings_snapshot_name_not_blank check (btrim(customer_name_snapshot) <> ''),
  constraint bookings_snapshot_phone_not_blank check (btrim(customer_phone_snapshot) <> ''),
  constraint bookings_source_not_blank check (btrim(source) <> ''),
  constraint bookings_type_not_blank check (btrim(booking_type) <> ''),
  constraint bookings_valid_interval check (check_out_at > check_in_at),
  constraint bookings_guest_capacity check (guest_count between 1 and 30),
  constraint bookings_overnight_capacity check (
    overnight_guest_count is null or overnight_guest_count between 0 and 8
  ),
  constraint bookings_overnight_not_above_total check (
    overnight_guest_count is null or overnight_guest_count <= guest_count
  ),
  constraint bookings_total_nonnegative check (total_amount_paise >= 0),
  constraint bookings_advance_nonnegative check (advance_amount_paise >= 0),
  constraint bookings_balance_nonnegative check (balance_amount_paise >= 0),
  constraint bookings_advance_not_above_total check (advance_amount_paise <= total_amount_paise),
  constraint bookings_balance_matches check (
    balance_amount_paise = total_amount_paise - advance_amount_paise
  )
);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete restrict,
  booking_id uuid references public.bookings(id) on delete restrict,
  external_reservation_id uuid,
  reservation_type public.reservation_type not null,
  status public.reservation_status not null default 'active',
  start_at timestamptz not null,
  end_at timestamptz not null,
  expires_at timestamptz,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_reservations_source_not_blank check (btrim(source) <> ''),
  constraint inventory_reservations_valid_interval check (end_at > start_at),
  constraint inventory_reservations_temporary_hold_expiry check (
    reservation_type <> 'temporary_hold' or expires_at is not null
  ),
  constraint inventory_reservations_expired_status_type check (
    status <> 'expired' or reservation_type = 'temporary_hold'
  ),
  constraint inventory_reservations_active_hold_expiry_after_start check (
    reservation_type <> 'temporary_hold'
    or status <> 'active'
    or expires_at > start_at
  )
);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  rule_type public.pricing_rule_type not null,
  specific_date date,
  effective_from date,
  effective_until date,
  price_amount_paise bigint not null,
  advance_amount_paise bigint not null,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_rules_price_nonnegative check (price_amount_paise >= 0),
  constraint pricing_rules_advance_nonnegative check (advance_amount_paise >= 0),
  constraint pricing_rules_advance_not_above_price check (advance_amount_paise <= price_amount_paise),
  constraint pricing_rules_valid_effective_range check (
    effective_until is null or effective_from is null or effective_until >= effective_from
  ),
  constraint pricing_rules_specific_date_matches_type check (
    (rule_type = 'special_date' and specific_date is not null)
    or (rule_type in ('weekday', 'weekend') and specific_date is null)
  )
);

comment on table public.inventory_reservations is
  'Sole authoritative inventory blocking table. Active rows are protected by a GiST exclusion constraint.';
comment on column public.inventory_reservations.external_reservation_id is
  'Deferred external integration reference; intentionally has no Phase 1 foreign key.';
comment on table public.pricing_rules is
  'Applicable rules resolve by highest priority, then special_date before general rules; dates use Asia/Kolkata.';
