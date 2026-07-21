alter table public.properties enable row level security;
alter table public.customers enable row level security;
alter table public.admins enable row level security;
alter table public.bookings enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;
alter table public.booking_events enable row level security;
alter table public.notification_events enable row level security;
alter table public.site_settings enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant usage on type public.admin_role to authenticated, service_role;
grant usage on type public.booking_status to authenticated, service_role;
grant usage on type public.payment_status to authenticated, service_role;
grant usage on type public.reservation_type to authenticated, service_role;
grant usage on type public.reservation_status to authenticated, service_role;
grant usage on type public.pricing_rule_type to authenticated, service_role;
grant usage on type public.webhook_processing_status to authenticated, service_role;
grant usage on type public.notification_status to authenticated, service_role;

grant select on public.properties to anon, authenticated;
grant select on public.admins to authenticated;
grant select on public.customers to authenticated;
grant select on public.bookings to authenticated;
grant select on public.inventory_reservations to authenticated;
grant select on public.pricing_rules to authenticated;
grant select (
  id,
  booking_id,
  provider,
  amount_paise,
  currency,
  status,
  signature_verified,
  created_at,
  updated_at
) on public.payments to authenticated;
grant select on public.webhook_events to authenticated;
grant select on public.booking_events to authenticated;
grant select on public.notification_events to authenticated;
grant select on public.site_settings to authenticated;

grant insert, update on public.properties to authenticated;
grant insert, update on public.customers to authenticated;
grant insert, update, delete on public.admins to authenticated;
grant insert, update on public.pricing_rules to authenticated;
grant insert, update on public.site_settings to authenticated;

grant all privileges on all tables in schema public to service_role;

create policy properties_public_read_active
on public.properties
for select
to anon
using (is_active);

create policy properties_admin_read
on public.properties
for select
to authenticated
using ((select public.is_active_admin()));

create policy properties_admin_insert
on public.properties
for insert
to authenticated
with check ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])));

create policy properties_admin_update
on public.properties
for update
to authenticated
using ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])))
with check ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])));

create policy admins_read_own_membership
on public.admins
for select
to authenticated
using (auth_user_id = (select auth.uid()));

create policy admins_super_admin_read
on public.admins
for select
to authenticated
using ((select public.has_admin_role(array['super_admin']::public.admin_role[])));

create policy admins_super_admin_insert
on public.admins
for insert
to authenticated
with check ((select public.has_admin_role(array['super_admin']::public.admin_role[])));

create policy admins_super_admin_update
on public.admins
for update
to authenticated
using ((select public.has_admin_role(array['super_admin']::public.admin_role[])))
with check ((select public.has_admin_role(array['super_admin']::public.admin_role[])));

create policy admins_super_admin_delete
on public.admins
for delete
to authenticated
using ((select public.has_admin_role(array['super_admin']::public.admin_role[])));

create policy customers_admin_read
on public.customers
for select
to authenticated
using ((select public.is_active_admin()));

create policy customers_admin_insert
on public.customers
for insert
to authenticated
with check ((select public.is_active_admin()));

create policy customers_admin_update
on public.customers
for update
to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

create policy bookings_admin_read
on public.bookings
for select
to authenticated
using ((select public.is_active_admin()));

create policy inventory_reservations_admin_read
on public.inventory_reservations
for select
to authenticated
using ((select public.is_active_admin()));

create policy pricing_rules_admin_read
on public.pricing_rules
for select
to authenticated
using ((select public.is_active_admin()));

create policy pricing_rules_admin_insert
on public.pricing_rules
for insert
to authenticated
with check ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])));

create policy pricing_rules_admin_update
on public.pricing_rules
for update
to authenticated
using ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])))
with check ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])));

create policy payments_admin_read
on public.payments
for select
to authenticated
using ((select public.is_active_admin()));

create policy webhook_events_admin_read
on public.webhook_events
for select
to authenticated
using ((select public.is_active_admin()));

create policy booking_events_admin_read
on public.booking_events
for select
to authenticated
using ((select public.is_active_admin()));

create policy notification_events_admin_read
on public.notification_events
for select
to authenticated
using ((select public.is_active_admin()));

create policy site_settings_admin_read
on public.site_settings
for select
to authenticated
using ((select public.is_active_admin()));

create policy site_settings_privileged_insert
on public.site_settings
for insert
to authenticated
with check ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])));

create policy site_settings_privileged_update
on public.site_settings
for update
to authenticated
using ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])))
with check ((select public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])));

comment on policy properties_public_read_active on public.properties is
  'The properties table contains only explicitly safe public configuration; inactive rows remain private.';
