create type public.admin_inventory_block_result as (
  result text,
  reservation_type public.reservation_type,
  status public.reservation_status,
  first_blocked_date date,
  last_blocked_date date,
  applied boolean
);

create function private.create_admin_inventory_block_internal(
  p_reservation_type public.reservation_type,
  p_action_type public.admin_operation_action,
  p_allowed_roles public.admin_role[],
  p_first_blocked_date date,
  p_last_blocked_date date,
  p_request_id uuid,
  p_reason_category text,
  p_internal_note text
)
returns public.admin_inventory_block_result
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_admin public.admins%rowtype;
  v_property public.properties%rowtype;
  v_property_count integer;
  v_start_dates record;
  v_end_dates record;
  v_reason text := lower(btrim(p_reason_category));
  v_note text := nullif(btrim(p_internal_note), '');
  v_fingerprint text;
  v_existing public.admin_operation_events%rowtype;
  v_reservation public.inventory_reservations%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'admin_unauthorized';
  end if;

  select * into v_admin
  from public.admins
  where auth_user_id = auth.uid()
    and is_active;
  if not found or v_admin.role <> all(p_allowed_roles) then
    raise exception using errcode = '42501', message = 'admin_unauthorized';
  end if;

  if p_request_id is null
    or p_first_blocked_date is null
    or p_last_blocked_date is null
    or p_last_blocked_date < p_first_blocked_date
    or (p_last_blocked_date - p_first_blocked_date + 1) > 31
    or v_reason is null
    or v_reason = ''
    or char_length(v_note) > 500 then
    raise exception using errcode = '22023', message = 'invalid_block_request';
  end if;

  if p_reservation_type = 'owner_block' then
    if v_reason not in ('owner_use', 'private_event', 'operational_hold', 'other') then
      raise exception using errcode = '22023', message = 'invalid_block_reason';
    end if;
  elsif p_reservation_type = 'maintenance_block' then
    if v_reason not in (
      'maintenance', 'repair', 'inspection', 'deep_cleaning', 'safety', 'other'
    ) then
      raise exception using errcode = '22023', message = 'invalid_block_reason';
    end if;
  else
    raise exception using errcode = '22023', message = 'invalid_block_request';
  end if;

  select count(*)::integer into v_property_count
  from public.properties
  where is_active;
  if v_property_count <> 1 then
    raise exception using errcode = 'P0001', message = 'property_configuration_invalid';
  end if;

  select * into strict v_property
  from public.properties
  where is_active;

  if not coalesce(public.is_current_or_future_business_date(
    v_property.id,
    p_first_blocked_date,
    now()
  ), false) then
    raise exception using errcode = '22023', message = 'past_block_date';
  end if;

  select * into strict v_start_dates
  from public.resolve_booking_dates(v_property.id, p_first_blocked_date);
  select * into strict v_end_dates
  from public.resolve_booking_dates(v_property.id, p_last_blocked_date);

  v_fingerprint := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_array(
          v_admin.id::text,
          p_action_type::text,
          v_property.id::text,
          v_start_dates.check_in_at::text,
          v_end_dates.check_out_at::text,
          v_reason,
          v_note
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_admin.id::text || ':' || p_action_type::text || ':' || p_request_id::text,
      0
    )
  );

  select * into v_existing
  from public.admin_operation_events
  where actor_admin_id = v_admin.id
    and action_type = p_action_type
    and request_id = p_request_id
  for update;

  if found then
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return (
      'block_created',
      p_reservation_type,
      'active'::public.reservation_status,
      p_first_blocked_date,
      p_last_blocked_date,
      false
    )::public.admin_inventory_block_result;
  end if;

  perform public.expire_stale_holds(v_property.id);
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_property.id::text, 0)
  );

  begin
    insert into public.inventory_reservations (
      property_id,
      reservation_type,
      status,
      start_at,
      end_at,
      expires_at,
      source
    ) values (
      v_property.id,
      p_reservation_type,
      'active',
      v_start_dates.check_in_at,
      v_end_dates.check_out_at,
      null,
      'admin_manual'
    )
    returning * into v_reservation;
  exception
    when exclusion_violation then
      raise exception using errcode = 'P0001', message = 'date_unavailable';
  end;

  insert into public.admin_operation_events (
    actor_admin_id,
    action_type,
    request_id,
    request_fingerprint,
    inventory_reservation_id,
    previous_state,
    resulting_state,
    reason_category,
    internal_note
  ) values (
    v_admin.id,
    p_action_type,
    p_request_id,
    v_fingerprint,
    v_reservation.id,
    null,
    'active',
    v_reason,
    v_note
  );

  return (
    'block_created',
    p_reservation_type,
    v_reservation.status,
    p_first_blocked_date,
    p_last_blocked_date,
    true
  )::public.admin_inventory_block_result;
end;
$$;

create function private.release_admin_inventory_block_internal(
  p_reservation_type public.reservation_type,
  p_action_type public.admin_operation_action,
  p_allowed_roles public.admin_role[],
  p_inventory_reservation_id uuid,
  p_request_id uuid,
  p_reason_category text,
  p_internal_note text
)
returns public.admin_inventory_block_result
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_admin public.admins%rowtype;
  v_property public.properties%rowtype;
  v_property_count integer;
  v_reason text := lower(btrim(p_reason_category));
  v_note text := nullif(btrim(p_internal_note), '');
  v_fingerprint text;
  v_existing public.admin_operation_events%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_first_date date;
  v_last_date date;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'admin_unauthorized';
  end if;

  select * into v_admin
  from public.admins
  where auth_user_id = auth.uid()
    and is_active;
  if not found or v_admin.role <> all(p_allowed_roles) then
    raise exception using errcode = '42501', message = 'admin_unauthorized';
  end if;

  if p_inventory_reservation_id is null
    or p_request_id is null
    or v_reason not in (
      'no_longer_needed', 'corrected', 'rescheduled', 'created_in_error', 'other'
    )
    or char_length(v_note) > 500 then
    raise exception using errcode = '22023', message = 'invalid_release_request';
  end if;

  v_fingerprint := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_array(
          v_admin.id::text,
          p_action_type::text,
          p_inventory_reservation_id::text,
          v_reason,
          v_note
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_admin.id::text || ':' || p_action_type::text || ':' || p_request_id::text,
      0
    )
  );

  select * into v_existing
  from public.admin_operation_events
  where actor_admin_id = v_admin.id
    and action_type = p_action_type
    and request_id = p_request_id
  for update;

  if found then
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    select * into v_reservation
    from public.inventory_reservations
    where id = v_existing.inventory_reservation_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'operation_result_unavailable';
    end if;
    select * into v_property
    from public.properties
    where id = v_reservation.property_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'operation_result_unavailable';
    end if;
    v_first_date := (v_reservation.start_at at time zone v_property.timezone)::date;
    v_last_date := (
      (v_reservation.end_at at time zone v_property.timezone)::date - 1
    );
    return (
      'block_released',
      p_reservation_type,
      'released'::public.reservation_status,
      v_first_date,
      v_last_date,
      false
    )::public.admin_inventory_block_result;
  end if;

  select * into v_reservation
  from public.inventory_reservations
  where id = p_inventory_reservation_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'block_not_found';
  end if;
  if v_reservation.reservation_type <> p_reservation_type then
    raise exception using errcode = 'P0001', message = 'wrong_block_type';
  end if;
  if v_reservation.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'block_not_active';
  end if;
  if v_reservation.booking_id is not null
    or v_reservation.external_reservation_id is not null
    or v_reservation.expires_at is not null then
    raise exception using errcode = 'P0001', message = 'block_ineligible';
  end if;

  select count(*)::integer into v_property_count
  from public.properties
  where is_active;
  if v_property_count <> 1 then
    raise exception using errcode = 'P0001', message = 'property_configuration_invalid';
  end if;
  select * into strict v_property
  from public.properties
  where is_active;
  if v_reservation.property_id <> v_property.id then
    raise exception using errcode = 'P0001', message = 'block_ineligible';
  end if;

  v_first_date := (v_reservation.start_at at time zone v_property.timezone)::date;
  v_last_date := (
    (v_reservation.end_at at time zone v_property.timezone)::date - 1
  );

  update public.inventory_reservations
  set status = 'released',
      updated_at = now()
  where id = v_reservation.id
    and status = 'active';
  if not found then
    raise exception using errcode = 'P0001', message = 'block_not_active';
  end if;

  insert into public.admin_operation_events (
    actor_admin_id,
    action_type,
    request_id,
    request_fingerprint,
    inventory_reservation_id,
    previous_state,
    resulting_state,
    reason_category,
    internal_note
  ) values (
    v_admin.id,
    p_action_type,
    p_request_id,
    v_fingerprint,
    v_reservation.id,
    'active',
    'released',
    v_reason,
    v_note
  );

  return (
    'block_released',
    p_reservation_type,
    'released'::public.reservation_status,
    v_first_date,
    v_last_date,
    true
  )::public.admin_inventory_block_result;
end;
$$;

create function public.create_admin_owner_block(
  p_first_blocked_date date,
  p_last_blocked_date date,
  p_request_id uuid,
  p_reason_category text,
  p_internal_note text default null
)
returns public.admin_inventory_block_result
language sql
security definer
set search_path = pg_catalog
as $$
  select private.create_admin_inventory_block_internal(
    'owner_block',
    'owner_block_created',
    array['admin', 'super_admin']::public.admin_role[],
    p_first_blocked_date,
    p_last_blocked_date,
    p_request_id,
    p_reason_category,
    p_internal_note
  );
$$;

create function public.create_admin_maintenance_block(
  p_first_blocked_date date,
  p_last_blocked_date date,
  p_request_id uuid,
  p_reason_category text,
  p_internal_note text default null
)
returns public.admin_inventory_block_result
language sql
security definer
set search_path = pg_catalog
as $$
  select private.create_admin_inventory_block_internal(
    'maintenance_block',
    'maintenance_block_created',
    array['operations', 'admin', 'super_admin']::public.admin_role[],
    p_first_blocked_date,
    p_last_blocked_date,
    p_request_id,
    p_reason_category,
    p_internal_note
  );
$$;

create function public.release_admin_owner_block(
  p_inventory_reservation_id uuid,
  p_request_id uuid,
  p_reason_category text,
  p_internal_note text default null
)
returns public.admin_inventory_block_result
language sql
security definer
set search_path = pg_catalog
as $$
  select private.release_admin_inventory_block_internal(
    'owner_block',
    'owner_block_released',
    array['admin', 'super_admin']::public.admin_role[],
    p_inventory_reservation_id,
    p_request_id,
    p_reason_category,
    p_internal_note
  );
$$;

create function public.release_admin_maintenance_block(
  p_inventory_reservation_id uuid,
  p_request_id uuid,
  p_reason_category text,
  p_internal_note text default null
)
returns public.admin_inventory_block_result
language sql
security definer
set search_path = pg_catalog
as $$
  select private.release_admin_inventory_block_internal(
    'maintenance_block',
    'maintenance_block_released',
    array['operations', 'admin', 'super_admin']::public.admin_role[],
    p_inventory_reservation_id,
    p_request_id,
    p_reason_category,
    p_internal_note
  );
$$;

revoke all on function private.create_admin_inventory_block_internal(
  public.reservation_type,
  public.admin_operation_action,
  public.admin_role[],
  date,
  date,
  uuid,
  text,
  text
) from public, anon, authenticated, service_role;
revoke all on function private.release_admin_inventory_block_internal(
  public.reservation_type,
  public.admin_operation_action,
  public.admin_role[],
  uuid,
  uuid,
  text,
  text
) from public, anon, authenticated, service_role;

revoke all on function public.create_admin_owner_block(date, date, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.create_admin_maintenance_block(date, date, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.release_admin_owner_block(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.release_admin_maintenance_block(uuid, uuid, text, text)
  from public, anon, authenticated;

grant usage on type public.admin_inventory_block_result to authenticated, service_role;
grant execute on function public.create_admin_owner_block(date, date, uuid, text, text)
  to authenticated;
grant execute on function public.create_admin_maintenance_block(date, date, uuid, text, text)
  to authenticated;
grant execute on function public.release_admin_owner_block(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.release_admin_maintenance_block(uuid, uuid, text, text)
  to authenticated;

comment on function public.create_admin_owner_block(date, date, uuid, text, text) is
  'Creates one idempotent owner inventory block after active admin authorization.';
comment on function public.create_admin_maintenance_block(date, date, uuid, text, text) is
  'Creates one idempotent maintenance inventory block after active admin authorization.';
comment on function public.release_admin_owner_block(uuid, uuid, text, text) is
  'Releases only an eligible active owner block with an immutable idempotency receipt.';
comment on function public.release_admin_maintenance_block(uuid, uuid, text, text) is
  'Releases only an eligible active maintenance block with an immutable idempotency receipt.';
