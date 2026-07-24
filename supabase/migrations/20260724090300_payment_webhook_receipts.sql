create or replace function public.begin_payment_webhook(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_payload_hash text,
  p_payload_redacted jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_event public.webhook_events%rowtype;
  v_created boolean := false;
begin
  if p_provider is null or btrim(p_provider) = ''
    or p_provider_event_id is null or btrim(p_provider_event_id) = ''
    or p_event_type is null or btrim(p_event_type) = ''
    or p_payload_hash !~ '^[0-9a-f]{64}$'
    or p_payload_redacted is null
    or jsonb_typeof(p_payload_redacted) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_webhook_receipt';
  end if;

  insert into public.webhook_events (
    provider, provider_event_id, event_type, payload_hash, payload_redacted
  ) values (
    p_provider, p_provider_event_id, p_event_type, p_payload_hash, p_payload_redacted
  )
  on conflict (provider, provider_event_id) do nothing
  returning * into v_event;

  if found then
    v_created := true;
  else
    select * into v_event
    from public.webhook_events
    where provider = p_provider and provider_event_id = p_provider_event_id
    for update;

    if v_event.payload_hash <> p_payload_hash or v_event.event_type <> p_event_type then
      raise exception using errcode = 'P0001', message = 'webhook_replay_conflict';
    end if;
  end if;

  return jsonb_build_object(
    'created', v_created,
    'shouldProcess', v_event.processing_status <> 'processed',
    'processingStatus', v_event.processing_status
  );
end;
$$;

create or replace function public.complete_payment_webhook(
  p_provider text,
  p_provider_event_id text,
  p_processing_status public.webhook_processing_status,
  p_error_category text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if p_processing_status not in ('processed', 'failed') then
    raise exception using errcode = '22023', message = 'invalid_webhook_completion';
  end if;

  update public.webhook_events
  set processing_status = p_processing_status,
      processed_at = case when p_processing_status = 'processed' then now() else processed_at end,
      error_message = case
        when p_processing_status = 'failed'
          then left(coalesce(nullif(btrim(p_error_category), ''), 'processing_failed'), 64)
        else null
      end
  where provider = p_provider and provider_event_id = p_provider_event_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'webhook_receipt_not_found';
  end if;
end;
$$;

revoke all on function public.begin_payment_webhook(text,text,text,text,jsonb)
  from public, anon, authenticated;
revoke all on function public.complete_payment_webhook(text,text,public.webhook_processing_status,text)
  from public, anon, authenticated;
grant execute on function public.begin_payment_webhook(text,text,text,text,jsonb)
  to service_role;
grant execute on function public.complete_payment_webhook(text,text,public.webhook_processing_status,text)
  to service_role;
