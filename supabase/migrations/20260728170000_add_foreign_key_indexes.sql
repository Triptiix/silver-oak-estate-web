-- Supabase CLI 2.109.1 applies this file and its migration-history insert as
-- one implicitly transactional batch. Bound lock acquisition and index-build
-- duration without using top-level LOCK TABLE or manual transaction commands.
set lock_timeout = '4s';
set statement_timeout = '30s';

create index payments_verified_by_admin_id_idx
  on public.payments (verified_by_admin_id);

create index site_settings_updated_by_idx
  on public.site_settings (updated_by);

reset statement_timeout;
reset lock_timeout;
