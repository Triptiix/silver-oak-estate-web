-- Confirmed non-sensitive launch data only. This file is safe to replay locally.
insert into public.properties (
  name,
  slug,
  timezone,
  check_in_time,
  check_out_time,
  cleaning_buffer_minutes,
  max_event_guests,
  max_overnight_guests,
  is_active
)
values (
  'Silver Oak Estate',
  'silver-oak-estate',
  'Asia/Kolkata',
  '11:00'::time,
  '10:00'::time,
  60,
  40,
  10,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  timezone = excluded.timezone,
  check_in_time = excluded.check_in_time,
  check_out_time = excluded.check_out_time,
  cleaning_buffer_minutes = excluded.cleaning_buffer_minutes,
  max_event_guests = excluded.max_event_guests,
  max_overnight_guests = excluded.max_overnight_guests,
  is_active = excluded.is_active;

update public.pricing_rules
set price_amount_paise = case rule_type
    when 'weekday' then 1500000
    when 'weekend' then 2000000
    else price_amount_paise
  end,
  advance_amount_paise = 500000,
  priority = 0,
  is_active = true
where property_id = (select id from public.properties where slug = 'silver-oak-estate')
  and rule_type in ('weekday', 'weekend')
  and specific_date is null
  and effective_from is null
  and effective_until is null;

insert into public.pricing_rules (
  property_id,
  rule_type,
  specific_date,
  effective_from,
  effective_until,
  price_amount_paise,
  advance_amount_paise,
  priority,
  is_active
)
select
  property.id,
  launch_rule.rule_type,
  null,
  null,
  null,
  launch_rule.price_amount_paise,
  500000,
  0,
  true
from public.properties as property
cross join (
  values
    ('weekday'::public.pricing_rule_type, 1500000::bigint),
    ('weekend'::public.pricing_rule_type, 2000000::bigint)
) as launch_rule(rule_type, price_amount_paise)
where property.slug = 'silver-oak-estate'
  and not exists (
    select 1
    from public.pricing_rules as existing
    where existing.property_id = property.id
      and existing.rule_type = launch_rule.rule_type
      and existing.specific_date is null
      and existing.effective_from is null
      and existing.effective_until is null
  );

insert into public.site_settings (setting_key, setting_value, description, is_sensitive)
values
  ('booking_hold_minutes', '10'::jsonb, 'Temporary online booking hold duration.', false),
  ('manual_payment_hold_minutes', '30'::jsonb, 'Manual payment fallback hold duration.', false),
  ('currency', '"INR"'::jsonb, 'Launch settlement currency.', false),
  ('max_event_guests', '40'::jsonb, 'Maximum standard daytime event capacity.', false),
  ('max_overnight_guests', '10'::jsonb, 'Maximum overnight stay capacity.', false)
on conflict (setting_key) do update set
  setting_value = excluded.setting_value,
  description = excluded.description,
  is_sensitive = excluded.is_sensitive;
