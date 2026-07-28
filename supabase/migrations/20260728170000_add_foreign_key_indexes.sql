create index payments_verified_by_admin_id_idx
  on public.payments (verified_by_admin_id);

create index site_settings_updated_by_idx
  on public.site_settings (updated_by);
