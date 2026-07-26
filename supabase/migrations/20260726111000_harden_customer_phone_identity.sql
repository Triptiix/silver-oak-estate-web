create function private.normalize_customer_phone(p_phone text)
returns text
language plpgsql
immutable
strict
security definer
set search_path = pg_catalog
as $$
declare
  v_trimmed text := pg_catalog.btrim(p_phone);
  v_plus_count integer;
  v_digits text;
  v_normalized text;
begin
  v_plus_count :=
    pg_catalog.length(v_trimmed)
    - pg_catalog.length(pg_catalog.replace(v_trimmed, '+', ''));

  if v_plus_count > 1
    or (v_plus_count = 1 and pg_catalog.left(v_trimmed, 1) <> '+') then
    raise exception using errcode = '22023', message = 'invalid_phone';
  end if;

  v_digits := pg_catalog.regexp_replace(v_trimmed, '[^0-9]', '', 'g');
  v_normalized :=
    case when pg_catalog.left(v_trimmed, 1) = '+' then '+' else '' end
    || v_digits;

  if v_normalized !~ '^\+?[0-9]{7,15}$' then
    raise exception using errcode = '22023', message = 'invalid_phone';
  end if;

  return v_normalized;
end;
$$;

revoke all on function private.normalize_customer_phone(text)
from public, anon, authenticated, service_role;

comment on function private.normalize_customer_phone(text) is
  'Private canonical phone normalizer. It removes presentation formatting without inferring a country code.';

do $$
declare
  v_customer record;
begin
  for v_customer in
    select id, phone
    from public.customers
  loop
    begin
      perform private.normalize_customer_phone(v_customer.phone);
    exception
      when invalid_parameter_value then
        raise exception using
          errcode = 'P0001',
          message = 'customer_phone_normalization_conflict';
    end;
  end loop;

  if exists (
    select private.normalize_customer_phone(phone)
    from public.customers
    group by private.normalize_customer_phone(phone)
    having count(*) > 1
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'customer_phone_normalization_conflict';
  end if;
end;
$$;

alter table public.customers disable trigger customers_set_updated_at;

update public.customers
set phone = private.normalize_customer_phone(phone)
where phone is distinct from private.normalize_customer_phone(phone);

alter table public.customers enable trigger customers_set_updated_at;

alter table public.customers
  add constraint customers_phone_canonical
  check (phone ~ '^\+?[0-9]{7,15}$'),
  add constraint customers_phone_unique
  unique (phone);

drop index public.customers_phone_lookup_idx;

create function private.normalize_customer_phone_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  new.phone := private.normalize_customer_phone(new.phone);
  return new;
end;
$$;

revoke all on function private.normalize_customer_phone_write()
from public, anon, authenticated, service_role;

create trigger customers_normalize_phone
before insert or update of phone on public.customers
for each row
execute function private.normalize_customer_phone_write();

create or replace function public.create_booking_hold(
  p_property_slug text,
  p_check_in_date date,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_whatsapp text,
  p_guest_count integer,
  p_overnight_guest_count integer,
  p_special_requests text,
  p_hold_request_id uuid,
  p_hold_token_nonce uuid,
  p_request_fingerprint_hash text,
  p_fallback_hold_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_customer_phone text;
  v_whatsapp text;
begin
  if p_customer_phone is null then
    raise exception using errcode = '22023', message = 'invalid_phone';
  end if;

  v_customer_phone := private.normalize_customer_phone(p_customer_phone);
  v_whatsapp := case
    when p_whatsapp is null then null
    else private.normalize_customer_phone(p_whatsapp)
  end;

  return private.create_booking_hold_v2_internal(
    p_property_slug,
    p_check_in_date,
    p_customer_name,
    p_customer_email,
    v_customer_phone,
    v_whatsapp,
    p_guest_count,
    p_overnight_guest_count,
    p_special_requests,
    p_hold_request_id,
    p_hold_token_nonce,
    p_request_fingerprint_hash,
    p_fallback_hold_minutes
  );
exception
  when deadlock_detected then
    raise exception using errcode = 'P0001', message = 'date_unavailable';
end;
$$;

revoke all on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) from public, anon, authenticated;
grant execute on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) to service_role;

comment on function public.create_booking_hold(
  text, date, text, text, text, text, integer, integer, text,
  uuid, uuid, text, integer
) is
  'Service-only public hold boundary; canonicalizes phone identity before privileged booking creation.';
