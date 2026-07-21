create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  provider text not null,
  provider_order_id text,
  provider_payment_id text,
  idempotency_key text not null unique,
  amount_paise bigint not null,
  currency text not null default 'INR',
  status public.payment_status not null default 'not_started',
  signature_verified boolean not null default false,
  failure_code text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_not_blank check (btrim(provider) <> ''),
  constraint payments_idempotency_key_not_blank check (btrim(idempotency_key) <> ''),
  constraint payments_amount_nonnegative check (amount_paise >= 0),
  constraint payments_currency_not_blank check (btrim(currency) <> '')
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  payload_redacted jsonb,
  processing_status public.webhook_processing_status not null default 'pending',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  constraint webhook_events_provider_event_unique unique (provider, provider_event_id),
  constraint webhook_events_provider_not_blank check (btrim(provider) <> ''),
  constraint webhook_events_provider_event_not_blank check (btrim(provider_event_id) <> ''),
  constraint webhook_events_type_not_blank check (btrim(event_type) <> ''),
  constraint webhook_events_payload_hash_not_blank check (btrim(payload_hash) <> '')
);

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  event_type text not null,
  actor_type text not null,
  actor_id uuid,
  previous_state text,
  new_state text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint booking_events_type_not_blank check (btrim(event_type) <> ''),
  constraint booking_events_actor_not_blank check (btrim(actor_type) <> ''),
  constraint booking_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete restrict,
  channel text not null,
  template_key text not null,
  recipient_hash text not null,
  recipient_masked text,
  status public.notification_status not null default 'pending',
  provider_message_id text,
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint notification_events_channel_not_blank check (btrim(channel) <> ''),
  constraint notification_events_template_not_blank check (btrim(template_key) <> ''),
  constraint notification_events_recipient_hash_not_blank check (btrim(recipient_hash) <> ''),
  constraint notification_events_attempt_count_nonnegative check (attempt_count >= 0)
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  description text,
  is_sensitive boolean not null default false,
  updated_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_key_not_blank check (btrim(setting_key) <> '')
);

comment on table public.webhook_events is 'Append-oriented, redacted webhook receipt log; raw payloads are not retained.';
comment on table public.booking_events is 'Append-oriented audit trail for booking state changes.';
comment on table public.notification_events is 'Append-oriented notification delivery log with hashed or masked recipients.';
comment on table public.site_settings is 'Private typed JSON configuration; approved public values require a future controlled endpoint.';
