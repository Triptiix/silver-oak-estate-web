-- Align executable booking limits with the verified operational capacity contract.
-- Indoor gathering capacity remains operational guidance rather than a separate
-- database field; max_event_guests is the standard daytime booking limit.

alter table public.properties
  drop constraint if exists properties_event_capacity,
  drop constraint if exists properties_overnight_capacity;

alter table public.properties
  add constraint properties_event_capacity
    check (max_event_guests between 1 and 40) not valid,
  add constraint properties_overnight_capacity
    check (max_overnight_guests between 1 and 10) not valid;

alter table public.bookings
  drop constraint if exists bookings_guest_capacity,
  drop constraint if exists bookings_overnight_capacity;

alter table public.bookings
  add constraint bookings_guest_capacity
    check (guest_count between 1 and 40) not valid,
  add constraint bookings_overnight_capacity
    check (
      overnight_guest_count is null
      or overnight_guest_count between 0 and 10
    ) not valid;

update public.properties
set max_event_guests = 40,
    max_overnight_guests = 10,
    updated_at = now()
where slug = 'silver-oak-estate';

insert into public.site_settings (
  setting_key,
  setting_value,
  description,
  is_sensitive
)
values
  (
    'max_event_guests',
    '40'::jsonb,
    'Maximum standard daytime event capacity.',
    false
  ),
  (
    'max_overnight_guests',
    '10'::jsonb,
    'Maximum overnight stay capacity.',
    false
  )
on conflict (setting_key) do update set
  setting_value = excluded.setting_value,
  description = excluded.description,
  is_sensitive = excluded.is_sensitive,
  updated_at = now();
