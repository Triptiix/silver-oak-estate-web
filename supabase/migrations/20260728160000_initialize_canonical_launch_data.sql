-- Initialize the approved non-sensitive property and general pricing records.
-- Existing canonical rows are accepted only when every launch value matches.
-- Conflicting rows fail the migration instead of being updated or deleted.

do $$
declare
  v_property public.properties%rowtype;
  v_rule_type public.pricing_rule_type;
  v_expected_price bigint;
  v_rule_count integer;
  v_rule_matches boolean;
begin
  select *
  into v_property
  from public.properties
  where slug = 'silver-oak-estate'
  for update;

  if not found then
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
    returning * into v_property;
  elsif v_property.name is distinct from 'Silver Oak Estate'
    or v_property.timezone is distinct from 'Asia/Kolkata'
    or v_property.check_in_time is distinct from '11:00'::time
    or v_property.check_out_time is distinct from '10:00'::time
    or v_property.cleaning_buffer_minutes is distinct from 60
    or v_property.max_event_guests is distinct from 40
    or v_property.max_overnight_guests is distinct from 10
    or v_property.is_active is distinct from true then
    raise exception using
      errcode = 'P0001',
      message = 'canonical_launch_property_conflict';
  end if;

  for v_rule_type, v_expected_price in
    values
      ('weekday'::public.pricing_rule_type, 1500000::bigint),
      ('weekend'::public.pricing_rule_type, 2000000::bigint)
  loop
    perform 1
    from public.pricing_rules
    where property_id = v_property.id
      and rule_type = v_rule_type
      and specific_date is null
      and effective_from is null
      and effective_until is null
    for update;

    select
      count(*)::integer,
      bool_and(
        price_amount_paise = v_expected_price
        and advance_amount_paise = 500000
        and priority = 0
        and is_active
      )
    into v_rule_count, v_rule_matches
    from public.pricing_rules
    where property_id = v_property.id
      and rule_type = v_rule_type
      and specific_date is null
      and effective_from is null
      and effective_until is null;

    if v_rule_count = 0 then
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
      values (
        v_property.id,
        v_rule_type,
        null,
        null,
        null,
        v_expected_price,
        500000,
        0,
        true
      );
    elsif v_rule_count <> 1 or not coalesce(v_rule_matches, false) then
      raise exception using
        errcode = 'P0001',
        message = 'canonical_launch_pricing_conflict',
        detail = 'Conflicting or duplicate general pricing rule for ' || v_rule_type::text || '.';
    end if;
  end loop;

  if (
    select count(*)
    from public.pricing_rules
    where property_id = v_property.id
      and rule_type in ('weekday', 'weekend')
      and specific_date is null
      and effective_from is null
      and effective_until is null
      and priority = 0
      and is_active
      and advance_amount_paise = 500000
      and (
        (rule_type = 'weekday' and price_amount_paise = 1500000)
        or (rule_type = 'weekend' and price_amount_paise = 2000000)
      )
  ) <> 2 then
    raise exception using
      errcode = 'P0001',
      message = 'canonical_launch_data_assertion_failed';
  end if;
end;
$$;
