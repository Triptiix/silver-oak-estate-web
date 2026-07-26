-- Replace the early broad authenticated-table model with narrow RPC and
-- own-membership boundaries used by the current administrator application.

drop policy if exists properties_admin_read on public.properties;
drop policy if exists properties_admin_insert on public.properties;
drop policy if exists properties_admin_update on public.properties;

drop policy if exists admins_super_admin_read on public.admins;
drop policy if exists admins_super_admin_insert on public.admins;
drop policy if exists admins_super_admin_update on public.admins;
drop policy if exists admins_super_admin_delete on public.admins;

drop policy if exists customers_admin_read on public.customers;
drop policy if exists customers_admin_insert on public.customers;
drop policy if exists customers_admin_update on public.customers;

drop policy if exists bookings_admin_read on public.bookings;
drop policy if exists inventory_reservations_admin_read on public.inventory_reservations;

drop policy if exists pricing_rules_admin_read on public.pricing_rules;
drop policy if exists pricing_rules_admin_insert on public.pricing_rules;
drop policy if exists pricing_rules_admin_update on public.pricing_rules;

drop policy if exists payments_admin_read on public.payments;
drop policy if exists webhook_events_admin_read on public.webhook_events;
drop policy if exists booking_events_admin_read on public.booking_events;
drop policy if exists notification_events_admin_read on public.notification_events;

drop policy if exists site_settings_admin_read on public.site_settings;
drop policy if exists site_settings_privileged_insert on public.site_settings;
drop policy if exists site_settings_privileged_update on public.site_settings;
drop policy if exists site_settings_non_sensitive_admin_read on public.site_settings;
drop policy if exists site_settings_sensitive_super_admin_read on public.site_settings;

revoke all privileges on table
  public.properties,
  public.customers,
  public.bookings,
  public.inventory_reservations,
  public.pricing_rules,
  public.payments,
  public.webhook_events,
  public.booking_events,
  public.notification_events,
  public.site_settings,
  public.admin_operation_events
from authenticated;

revoke all privileges on table public.admins from authenticated;

-- Table-level revocation does not remove grants made directly on columns.
-- Enumerate only the hardened tables and revoke every supported column ACL.
do $$
declare
  v_privilege record;
begin
  for v_privilege in
    select
      columns.table_schema,
      columns.table_name,
      columns.column_name,
      columns.privilege_type
    from information_schema.column_privileges as columns
    where columns.grantee = 'authenticated'
      and columns.table_schema = 'public'
      and columns.table_name = any (array[
        'properties',
        'customers',
        'admins',
        'bookings',
        'inventory_reservations',
        'pricing_rules',
        'payments',
        'webhook_events',
        'booking_events',
        'notification_events',
        'site_settings',
        'admin_operation_events'
      ])
      and columns.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
  loop
    execute format(
      'revoke %s (%I) on table %I.%I from authenticated',
      v_privilege.privilege_type,
      v_privilege.column_name,
      v_privilege.table_schema,
      v_privilege.table_name
    );
  end loop;
end;
$$;

grant select (
  id,
  auth_user_id,
  role,
  name,
  email,
  is_active
) on table public.admins to authenticated;

-- Supabase may install this defensive event-trigger function outside project
-- migrations. Preserve it when present while removing direct API-role execute.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable()
      from public, anon, authenticated, service_role;
  end if;
end;
$$;
