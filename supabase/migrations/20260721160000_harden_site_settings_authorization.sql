-- SOE-CAN-001 / SOE-CAN-002: replace sensitivity-blind settings policies
-- with row-aware reads and controlled mutation functions.
drop policy if exists site_settings_admin_read on public.site_settings;
drop policy if exists site_settings_privileged_insert on public.site_settings;
drop policy if exists site_settings_privileged_update on public.site_settings;

revoke insert, update, delete on public.site_settings from authenticated;

create policy site_settings_non_sensitive_admin_read
on public.site_settings
for select
to authenticated
using (
  not is_sensitive
  and (select public.is_active_admin())
);

create policy site_settings_sensitive_super_admin_read
on public.site_settings
for select
to authenticated
using (
  is_sensitive
  and (select public.has_admin_role(array['super_admin']::public.admin_role[]))
);

-- SOE-CAN-003: updated_by records the Supabase Auth user UUID. Existing
-- values referenced admins.id, so translate them before replacing the FK.
alter table public.site_settings
  drop constraint site_settings_updated_by_fkey;

update public.site_settings as setting
set updated_by = administrator.auth_user_id
from public.admins as administrator
where setting.updated_by = administrator.id;

alter table public.site_settings
  add constraint site_settings_updated_by_fkey
  foreign key (updated_by)
  references public.admins(auth_user_id)
  on delete set null;

comment on column public.site_settings.updated_by is
  'Supabase Auth user UUID of the active administrator who performed the authenticated mutation; null denotes a trusted system/service operation.';

create or replace function public.upsert_non_sensitive_setting(
  p_setting_key text,
  p_setting_value jsonb,
  p_description text
)
returns public.site_settings
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_actor uuid := auth.uid();
  v_setting public.site_settings%rowtype;
begin
  if v_actor is null
    or not public.has_admin_role(array['super_admin', 'admin']::public.admin_role[])
  then
    raise exception using
      errcode = '42501',
      message = 'active admin role required';
  end if;

  if p_setting_key is null or btrim(p_setting_key) = '' then
    raise exception using
      errcode = '22023',
      message = 'setting key must not be blank';
  end if;

  if p_setting_value is null then
    raise exception using
      errcode = '22004',
      message = 'setting value must not be null';
  end if;

  insert into public.site_settings (
    setting_key,
    setting_value,
    description,
    is_sensitive,
    updated_by
  )
  values (
    p_setting_key,
    p_setting_value,
    p_description,
    false,
    v_actor
  )
  on conflict (setting_key) do update
  set setting_value = excluded.setting_value,
      description = excluded.description,
      is_sensitive = false,
      updated_by = v_actor
  where not public.site_settings.is_sensitive
  returning * into v_setting;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'sensitive settings require super-admin authorization';
  end if;

  return v_setting;
end;
$$;

create or replace function public.upsert_sensitive_setting(
  p_setting_key text,
  p_setting_value jsonb,
  p_description text
)
returns public.site_settings
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_actor uuid := auth.uid();
  v_setting public.site_settings%rowtype;
begin
  if v_actor is null
    or not public.has_admin_role(array['super_admin']::public.admin_role[])
  then
    raise exception using
      errcode = '42501',
      message = 'active super-admin role required';
  end if;

  if p_setting_key is null or btrim(p_setting_key) = '' then
    raise exception using
      errcode = '22023',
      message = 'setting key must not be blank';
  end if;

  if p_setting_value is null then
    raise exception using
      errcode = '22004',
      message = 'setting value must not be null';
  end if;

  insert into public.site_settings (
    setting_key,
    setting_value,
    description,
    is_sensitive,
    updated_by
  )
  values (
    p_setting_key,
    p_setting_value,
    p_description,
    true,
    v_actor
  )
  on conflict (setting_key) do update
  set setting_value = excluded.setting_value,
      description = excluded.description,
      is_sensitive = true,
      updated_by = v_actor
  returning * into v_setting;

  return v_setting;
end;
$$;

create or replace function public.delete_setting(p_setting_key text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_deleted boolean;
begin
  if auth.uid() is null
    or not public.has_admin_role(array['super_admin']::public.admin_role[])
  then
    raise exception using
      errcode = '42501',
      message = 'active super-admin role required';
  end if;

  delete from public.site_settings
  where setting_key = p_setting_key
  returning true into v_deleted;

  return coalesce(v_deleted, false);
end;
$$;

revoke all on function public.upsert_non_sensitive_setting(text, jsonb, text)
  from public, anon, authenticated;
revoke all on function public.upsert_sensitive_setting(text, jsonb, text)
  from public, anon, authenticated;
revoke all on function public.delete_setting(text)
  from public, anon, authenticated;

grant execute on function public.upsert_non_sensitive_setting(text, jsonb, text)
  to authenticated;
grant execute on function public.upsert_sensitive_setting(text, jsonb, text)
  to authenticated;
grant execute on function public.delete_setting(text)
  to authenticated;

comment on function public.upsert_non_sensitive_setting(text, jsonb, text) is
  'Allows active admin or super-admin callers to create or update only non-sensitive settings and binds updated_by to auth.uid().';
comment on function public.upsert_sensitive_setting(text, jsonb, text) is
  'Allows only active super-admin callers to create or update sensitive settings and binds updated_by to auth.uid().';
comment on function public.delete_setting(text) is
  'Allows only active super-admin callers to delete a setting by key.';
