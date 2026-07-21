create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger admins_set_updated_at
before update on public.admins
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger inventory_reservations_set_updated_at
before update on public.inventory_reservations
for each row execute function public.set_updated_at();

create trigger pricing_rules_set_updated_at
before update on public.pricing_rules
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.inventory_reservations
  add constraint inventory_reservations_prevent_active_overlap
  exclude using gist (
    property_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (status = 'active');

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.admins
    where auth_user_id = auth.uid()
      and is_active
  );
$$;

create or replace function public.has_admin_role(required_roles public.admin_role[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.admins
    where auth_user_id = auth.uid()
      and is_active
      and role = any(required_roles)
  );
$$;

revoke all on function public.is_active_admin() from public, anon;
revoke all on function public.has_admin_role(public.admin_role[]) from public, anon;
grant execute on function public.is_active_admin() to authenticated, service_role;
grant execute on function public.has_admin_role(public.admin_role[]) to authenticated, service_role;

comment on function public.is_active_admin() is
  'Returns whether auth.uid() belongs to an active administrator; callers cannot supply a user ID.';
comment on function public.has_admin_role(public.admin_role[]) is
  'Checks auth.uid() against active administrator membership and the required database roles.';

create index customers_phone_lookup_idx on public.customers (phone);
create index customers_email_lookup_idx on public.customers (lower(email)) where email is not null;
create index bookings_property_dates_idx on public.bookings (property_id, check_in_at, check_out_at);
create index bookings_customer_id_idx on public.bookings (customer_id) where customer_id is not null;
create index bookings_status_idx on public.bookings (booking_status);
create index inventory_reservations_property_dates_idx
  on public.inventory_reservations (property_id, start_at, end_at);
create index inventory_reservations_booking_id_idx
  on public.inventory_reservations (booking_id) where booking_id is not null;
create index inventory_reservations_active_expiry_idx
  on public.inventory_reservations (expires_at)
  where reservation_type = 'temporary_hold' and status = 'active';
create index pricing_rules_resolution_idx
  on public.pricing_rules (property_id, is_active, priority desc, rule_type, specific_date);
create index payments_booking_id_idx on public.payments (booking_id);
create unique index payments_provider_order_unique_idx
  on public.payments (provider, provider_order_id) where provider_order_id is not null;
create unique index payments_provider_payment_unique_idx
  on public.payments (provider, provider_payment_id) where provider_payment_id is not null;
create index booking_events_booking_created_idx on public.booking_events (booking_id, created_at);
create index notification_events_booking_created_idx
  on public.notification_events (booking_id, created_at) where booking_id is not null;
create unique index notification_events_provider_message_unique_idx
  on public.notification_events (provider_message_id) where provider_message_id is not null;
