-- The monthly availability resolver returns only public property timing,
-- public prices and a per-date availability boolean. It is SECURITY DEFINER
-- with a fixed pg_catalog search path and does not expose reservation/customer
-- rows. Allow the public website's anon-key API client to execute only this RPC.

revoke all on function public.get_monthly_availability(text, text)
  from public, authenticated;

grant execute on function public.get_monthly_availability(text, text)
  to anon, service_role;

comment on function public.get_monthly_availability(text, text) is
  'Public-safe monthly availability projection. Executable by anon and service_role; returns no customer, booking, payment or reservation identifiers.';
