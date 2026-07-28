-- Validate the capacity constraints in a separate migration transaction after
-- the corrective values and NOT VALID constraints have been installed.

alter table public.properties
  validate constraint properties_event_capacity;

alter table public.properties
  validate constraint properties_overnight_capacity;

alter table public.bookings
  validate constraint bookings_guest_capacity;

alter table public.bookings
  validate constraint bookings_overnight_capacity;
