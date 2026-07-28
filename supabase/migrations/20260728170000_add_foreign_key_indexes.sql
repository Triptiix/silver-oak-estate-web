-- Fail closed if either table has an active conflicting writer. Once acquired,
-- these transaction-scoped locks prevent new writes until both indexes finish
-- and the migration transaction commits.
lock table public.payments, public.site_settings
  in share mode nowait;

create index payments_verified_by_admin_id_idx
  on public.payments (verified_by_admin_id);

create index site_settings_updated_by_idx
  on public.site_settings (updated_by);
