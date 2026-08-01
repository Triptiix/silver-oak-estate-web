begin;
select plan(60);

create temporary table payment_test_context (
  key text primary key,
  value jsonb not null
);

insert into payment_test_context values
  ('active_hold', public.create_booking_hold(
    'silver-oak-estate', (now() at time zone 'Asia/Kolkata')::date + 30,
    'Payment Active', null, '+919976000001', null, 2, 0, null,
    '51000000-0000-4000-8000-000000000001',
    '52000000-0000-4000-8000-000000000001', 'payment-active',
    '1111111111111111111111111111111111111111111111111111111111111111', 10
  )),
  ('released_hold', public.create_booking_hold(
    'silver-oak-estate', (now() at time zone 'Asia/Kolkata')::date + 31,
    'Payment Released', null, '+919976000002', null, 2, 0, null,
    '51000000-0000-4000-8000-000000000002',
    '52000000-0000-4000-8000-000000000002', 'payment-released',
    '2222222222222222222222222222222222222222222222222222222222222222', 10
  )),
  ('expired_hold', public.create_booking_hold(
    'silver-oak-estate', (now() at time zone 'Asia/Kolkata')::date + 32,
    'Payment Expired', null, '+919976000003', null, 2, 0, null,
    '51000000-0000-4000-8000-000000000003',
    '52000000-0000-4000-8000-000000000003', 'payment-expired',
    '3333333333333333333333333333333333333333333333333333333333333333', 10
  )),
  ('mismatch_hold', public.create_booking_hold(
    'silver-oak-estate', (now() at time zone 'Asia/Kolkata')::date + 33,
    'Payment Mismatch', null, '+919976000004', null, 2, 0, null,
    '51000000-0000-4000-8000-000000000004',
    '52000000-0000-4000-8000-000000000004', 'payment-mismatch',
    '4444444444444444444444444444444444444444444444444444444444444444', 10
  )),
  ('authorized_hold', public.create_booking_hold(
    'silver-oak-estate', (now() at time zone 'Asia/Kolkata')::date + 34,
    'Payment Authorized', null, '+919976000005', null, 2, 0, null,
    '51000000-0000-4000-8000-000000000005',
    '52000000-0000-4000-8000-000000000005', 'payment-authorized',
    '5555555555555555555555555555555555555555555555555555555555555555', 10
  )),
  ('currency_hold', public.create_booking_hold(
    'silver-oak-estate', (now() at time zone 'Asia/Kolkata')::date + 35,
    'Payment Currency', null, '+919976000006', null, 2, 0, null,
    '51000000-0000-4000-8000-000000000006',
    '52000000-0000-4000-8000-000000000006', 'payment-currency',
    '6666666666666666666666666666666666666666666666666666666666666666', 10
  )),
  ('failure_hold', public.create_booking_hold(
    'silver-oak-estate', (now() at time zone 'Asia/Kolkata')::date + 36,
    'Payment Failure Recovery', null, '+919976000007', null, 2, 0, null,
    '51000000-0000-4000-8000-000000000007',
    '52000000-0000-4000-8000-000000000007', 'payment-failure-recovery',
    '7777777777777777777777777777777777777777777777777777777777777777', 10
  ));

insert into payment_test_context
select 'active_payment', public.prepare_payment_order(
  (value->>'bookingId')::uuid,
  (value->>'holdTokenNonce')::uuid,
  'razorpay'
) from payment_test_context where key = 'active_hold';

select is(
  (select (value->>'amountPaise')::bigint from payment_test_context where key = 'active_payment'),
  500000::bigint,
  'payment order uses the stored server-side advance'
);
select is(
  (select value->>'currency' from payment_test_context where key = 'active_payment'),
  'INR',
  'payment order uses the server-side currency'
);
select is(
  (
    select count(*)::integer from public.payments
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
  ),
  1,
  'one payment attempt is created'
);
select is(
  (
    public.prepare_payment_order(
      (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold'),
      '52000000-0000-4000-8000-000000000001',
      'razorpay'
    )->>'paymentId'
  ),
  (select value->>'paymentId' from payment_test_context where key = 'active_payment'),
  'order preparation retry reuses the open attempt'
);
select throws_ok(
  format(
    $$select public.prepare_payment_order(%L::uuid, %L::uuid, 'razorpay')$$,
    (select value->>'bookingId' from payment_test_context where key = 'active_hold'),
    '52000000-0000-4000-8000-000000000099'
  ),
  'P0001',
  'payment_hold_ineligible',
  'another hold nonce cannot create an order'
);

select is(
  public.attach_provider_order(
    (select (value->>'paymentId')::uuid from payment_test_context where key = 'active_payment'),
    'order_active_1', 500000, 'INR'
  )->>'providerOrderId',
  'order_active_1',
  'provider order is attached after exact amount and currency validation'
);
select lives_ok(
  format(
    $$select public.mark_payment_checkout_started(%L::uuid)$$,
    (select value->>'paymentId' from payment_test_context where key = 'active_payment')
  ),
  'checkout-start transition succeeds'
);

select is(
  public.finalize_verified_payment(
    'razorpay', 'order_active_1', 'pay_active_1', 500000, 'INR',
    'captured', 'browser', null
  )->>'result',
  'payment_received',
  'captured payment is received while the original hold remains eligible'
);
select is(
  (
    select booking_status from public.bookings
    where id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
  ),
  'payment_pending'::public.booking_status,
  'eligible booking awaits written confirmation'
);
select is(
  (
    select reservation_type from public.inventory_reservations
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
  ),
  'confirmed_booking'::public.reservation_type,
  'existing temporary reservation is converted without reacquisition'
);
select is(
  (
    select status from public.inventory_reservations
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
  ),
  'active'::public.reservation_status,
  'durable reservation remains active'
);
select is(
  (
    select expires_at from public.inventory_reservations
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
  ),
  null,
  'durable reservation has no expiry'
);
select is(
  (
    select count(*)::integer from public.inventory_reservations
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
  ),
  1,
  'automatic finalization retains exactly one reservation'
);
select is(
  (
    select status from public.payments
    where id = (select (value->>'paymentId')::uuid from payment_test_context where key = 'active_payment')
  ),
  'verified'::public.payment_status,
  'received payment reaches verified state'
);
select is(
  (
    select count(*)::integer from public.booking_events
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
      and event_type = 'payment_verified'
  ),
  1,
  'payment verification records one event'
);
select is(
  (
    select count(*)::integer from public.notification_events
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
      and template_key = 'payment_received_awaiting_confirmation'
      and channel = 'internal'
      and recipient_hash = encode(extensions.digest('administrator_payment_received_awaiting_confirmation', 'sha256'), 'hex')
      and recipient_masked = 'administrator'
  ),
  1,
  'payment receipt queues one PII-free internal notification'
);
select is(
  (
    select count(*)::integer from public.booking_events
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
      and event_type = 'payment_received_awaiting_confirmation'
      and actor_type = 'system'
      and previous_state = 'held'
      and new_state = 'payment_pending'
      and metadata = '{}'::jsonb
  ),
  1,
  'payment receipt records one PII-free awaiting-confirmation event'
);
select is(
  (
    select count(*)::integer from public.booking_events
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
      and event_type = 'booking_confirmed'
  ),
  0,
  'automatic payment receipt records no booking-confirmed event'
);
select is(
  (
    select count(*)::integer from public.notification_events
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
      and template_key = 'booking_confirmed'
  ),
  0,
  'automatic payment receipt queues no customer confirmation'
);
select is(
  public.finalize_verified_payment(
    'razorpay', 'order_active_1', 'pay_active_1', 500000, 'INR',
    'captured', 'webhook', 'event_active_1'
  )->>'result',
  'payment_received',
  'webhook-after-callback is idempotently received'
);
select is(
  (
    select count(*)::integer from public.booking_events
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
      and event_type = 'payment_received_awaiting_confirmation'
  ),
  1,
  'idempotent finalization does not duplicate awaiting-confirmation events'
);
select is(
  (
    select count(*)::integer from public.notification_events
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
      and template_key = 'payment_received_awaiting_confirmation'
  ),
  1,
  'idempotent finalization does not duplicate internal notifications'
);
update public.bookings
set booking_status = 'confirmed'
where id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold');
select is(
  public.finalize_verified_payment(
    'razorpay', 'order_active_1', 'pay_active_1', 500000, 'INR',
    'captured', 'browser', null
  )->>'result',
  'payment_received',
  'duplicate automatic finalization returns the payment-layer result after later confirmation'
);
select is(
  (
    select booking_status from public.bookings
    where id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
  ),
  'confirmed'::public.booking_status,
  'duplicate automatic finalization does not undo later confirmation'
);
select is(
  (
    select count(*)::integer from public.booking_events
    where booking_id = (select (value->>'bookingId')::uuid from payment_test_context where key = 'active_hold')
      and event_type = 'booking_confirmed'
  ),
  0,
  'duplicate automatic finalization does not emit confirmation'
);

insert into payment_test_context
select 'released_payment', public.prepare_payment_order(
  (value->>'bookingId')::uuid, (value->>'holdTokenNonce')::uuid, 'razorpay'
) from payment_test_context where key = 'released_hold';
select public.attach_provider_order(
  (select (value->>'paymentId')::uuid from payment_test_context where key = 'released_payment'),
  'order_released_1', 500000, 'INR'
);
select public.release_booking_hold(
  (select (value->>'bookingId')::uuid from payment_test_context where key = 'released_hold'),
  '52000000-0000-4000-8000-000000000002'
);

select is(
  public.finalize_verified_payment(
    'razorpay', 'order_released_1', 'pay_released_1', 500000, 'INR',
    'captured', 'webhook', 'event_released_1'
  )->>'result',
  'recovery_required',
  'verified payment after release exits through recovery'
);
select is(
  (select booking_status from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000002'),
  'expired'::public.booking_status,
  'released booking remains unconfirmed'
);
select is(
  (
    select status from public.inventory_reservations
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000002')
  ),
  'released'::public.reservation_status,
  'released inventory remains released'
);
select is(
  (
    select status from public.payments
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000002')
  ),
  'refund_pending'::public.payment_status,
  'late released-hold payment is preserved as refund pending'
);
select is(
  (
    select count(*)::integer from public.inventory_reservations
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000002')
      and reservation_type = 'confirmed_booking'
  ),
  0,
  'late payment never reacquires confirmed inventory'
);
select is(
  (
    select count(*)::integer from public.booking_events
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000002')
      and event_type = 'payment_recovery_required'
  ),
  1,
  'recovery records one audit event'
);
select is(
  public.finalize_verified_payment(
    'razorpay', 'order_released_1', 'pay_released_1', 500000, 'INR',
    'captured', 'browser', null
  )->>'result',
  'recovery_required',
  'repeated late-payment finalization is idempotent'
);
select is(
  (
    select count(*)::integer from public.booking_events
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000002')
      and event_type = 'payment_recovery_required'
  ),
  1,
  'repeated recovery does not duplicate audit events'
);

insert into payment_test_context
select 'expired_payment', public.prepare_payment_order(
  (value->>'bookingId')::uuid, (value->>'holdTokenNonce')::uuid, 'razorpay'
) from payment_test_context where key = 'expired_hold';
select public.attach_provider_order(
  (select (value->>'paymentId')::uuid from payment_test_context where key = 'expired_payment'),
  'order_expired_1', 500000, 'INR'
);
update public.inventory_reservations
set expires_at = now() - interval '1 second'
where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000003');

select is(
  public.finalize_verified_payment(
    'razorpay', 'order_expired_1', 'pay_expired_1', 500000, 'INR',
    'captured', 'webhook', 'event_expired_1'
  )->>'result',
  'recovery_required',
  'verified payment after expiry requires recovery'
);
select is(
  (
    select status from public.inventory_reservations
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000003')
  ),
  'expired'::public.reservation_status,
  'finalizer durably expires the stale temporary reservation'
);
select is(
  (select booking_status from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000003'),
  'expired'::public.booking_status,
  'expired booking remains terminal'
);

insert into payment_test_context
select 'mismatch_payment', public.prepare_payment_order(
  (value->>'bookingId')::uuid, (value->>'holdTokenNonce')::uuid, 'razorpay'
) from payment_test_context where key = 'mismatch_hold';
select public.attach_provider_order(
  (select (value->>'paymentId')::uuid from payment_test_context where key = 'mismatch_payment'),
  'order_mismatch_1', 500000, 'INR'
);
select is(
  public.finalize_verified_payment(
    'razorpay', 'order_mismatch_1', 'pay_mismatch_1', 499999, 'INR',
    'captured', 'webhook', 'event_mismatch_1'
  )->>'result',
  'recovery_required',
  'amount mismatch can never confirm a booking'
);
select is(
  (select booking_status from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000004'),
  'held'::public.booking_status,
  'amount mismatch leaves the active booking unconfirmed'
);
select is(
  (
    select status from public.payments
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000004')
  ),
  'refund_pending'::public.payment_status,
  'verified mismatched amount is preserved for recovery'
);

insert into payment_test_context
select 'currency_payment', public.prepare_payment_order(
  (value->>'bookingId')::uuid, (value->>'holdTokenNonce')::uuid, 'razorpay'
) from payment_test_context where key = 'currency_hold';
select public.attach_provider_order(
  (select (value->>'paymentId')::uuid from payment_test_context where key = 'currency_payment'),
  'order_currency_1', 500000, 'INR'
);
select is(
  public.finalize_verified_payment(
    'razorpay', 'order_currency_1', 'pay_currency_1', 500000, 'USD',
    'captured', 'webhook', 'event_currency_1'
  )->>'result',
  'recovery_required',
  'currency mismatch can never confirm a booking'
);
select is(
  (select booking_status from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000006'),
  'held'::public.booking_status,
  'currency mismatch leaves the active booking unconfirmed'
);
select is(
  (
    select status from public.payments
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000006')
  ),
  'refund_pending'::public.payment_status,
  'verified mismatched currency is preserved for recovery'
);

insert into payment_test_context
select 'failure_payment', public.prepare_payment_order(
  (value->>'bookingId')::uuid, (value->>'holdTokenNonce')::uuid, 'razorpay'
) from payment_test_context where key = 'failure_hold';
select public.attach_provider_order(
  (select (value->>'paymentId')::uuid from payment_test_context where key = 'failure_payment'),
  'order_failure_1', 500000, 'INR'
);
create function pg_temp.reject_test_confirmation()
returns trigger language plpgsql as $$
begin
  if old.hold_request_id = '51000000-0000-4000-8000-000000000007' then
    raise exception 'test_confirmation_failure';
  end if;
  return new;
end;
$$;
create trigger payment_test_reject_confirmation
before update of booking_status on public.bookings
for each row
when (new.booking_status = 'payment_pending')
execute function pg_temp.reject_test_confirmation();

select is(
  public.finalize_verified_payment(
    'razorpay', 'order_failure_1', 'pay_failure_1', 500000, 'INR',
    'captured', 'webhook', 'event_failure_1'
  )->>'result',
  'recovery_required',
  'payment-receipt transition failure exits through durable recovery'
);
select is(
  (select booking_status from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000007'),
  'held'::public.booking_status,
  'failed payment-receipt transition does not partially update the booking'
);
select is(
  (
    select status from public.payments
    where booking_id = (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000007')
  ),
  'refund_pending'::public.payment_status,
  'verified money survives a rolled-back payment-receipt transition as refund pending'
);
drop trigger payment_test_reject_confirmation on public.bookings;

insert into payment_test_context
select 'authorized_payment', public.prepare_payment_order(
  (value->>'bookingId')::uuid, (value->>'holdTokenNonce')::uuid, 'razorpay'
) from payment_test_context where key = 'authorized_hold';
select public.attach_provider_order(
  (select (value->>'paymentId')::uuid from payment_test_context where key = 'authorized_payment'),
  'order_authorized_1', 500000, 'INR'
);
select is(
  public.finalize_verified_payment(
    'razorpay', 'order_authorized_1', 'pay_authorized_1', 500000, 'INR',
    'authorized', 'webhook', 'event_authorized_1'
  )->>'result',
  'payment_pending',
  'authorized but uncaptured payment remains pending'
);
select is(
  (select booking_status from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000005'),
  'held'::public.booking_status,
  'authorization alone does not confirm'
);
select is(
  public.finalize_verified_payment(
    'razorpay', 'order_authorized_1', 'pay_authorized_1', 500000, 'INR',
    'captured', 'webhook', 'event_authorized_2'
  )->>'result',
  'payment_received',
  'later captured event records payment receipt through the same finalizer'
);

select is(
  public.begin_payment_webhook(
    'razorpay', 'webhook_dedup_1', 'payment.captured', repeat('a', 64),
    '{"providerOrderId":"order_active_1","providerPaymentId":"pay_active_1"}'::jsonb
  )->>'created',
  'true',
  'first webhook receipt is recorded'
);
select lives_ok(
  $$select public.complete_payment_webhook('razorpay', 'webhook_dedup_1', 'processed', null)$$,
  'webhook receipt can be completed'
);
select is(
  public.begin_payment_webhook(
    'razorpay', 'webhook_dedup_1', 'payment.captured', repeat('a', 64),
    '{"providerOrderId":"order_active_1","providerPaymentId":"pay_active_1"}'::jsonb
  )->>'shouldProcess',
  'false',
  'processed duplicate webhook is acknowledged without reprocessing'
);
select is(
  (select count(*)::integer from public.webhook_events where provider_event_id = 'webhook_dedup_1'),
  1,
  'webhook event ID is deduplicated'
);

insert into public.payments (
  booking_id, provider, provider_order_id, idempotency_key,
  amount_paise, currency, status
) values (
  (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000004'),
  'dedup-order', 'order_duplicate_1', 'dedup-order-one',
  500000, 'INR', 'failed'
);
select throws_ok(
  format(
    $$insert into public.payments (
      booking_id, provider, provider_order_id, idempotency_key,
      amount_paise, currency, status
    ) values (%L::uuid, 'dedup-order', 'order_duplicate_1', 'dedup-order-two', 500000, 'INR', 'failed')$$,
    (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000005')
  ),
  '23505',
  null,
  'provider order identifiers cannot be duplicated'
);

insert into public.payments (
  booking_id, provider, provider_payment_id, idempotency_key,
  amount_paise, currency, status
) values (
  (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000004'),
  'dedup-payment', 'pay_duplicate_1', 'dedup-payment-one',
  500000, 'INR', 'failed'
);
select throws_ok(
  format(
    $$insert into public.payments (
      booking_id, provider, provider_payment_id, idempotency_key,
      amount_paise, currency, status
    ) values (%L::uuid, 'dedup-payment', 'pay_duplicate_1', 'dedup-payment-two', 500000, 'INR', 'failed')$$,
    (select id from public.bookings where hold_request_id = '51000000-0000-4000-8000-000000000005')
  ),
  '23505',
  null,
  'provider payment identifiers cannot be duplicated'
);

select throws_ok(
  $$update public.payments set status = 'order_created' where provider_order_id = 'order_active_1'$$,
  'P0001',
  'invalid_payment_status_transition',
  'invalid backward payment transition is rejected'
);
select throws_ok(
  $$select public.finalize_verified_payment(
    'razorpay', 'order_active_1', 'pay_different', 500000, 'INR',
    'captured', 'webhook', 'event_conflict'
  )$$,
  'P0001',
  'provider_payment_conflict',
  'a provider order cannot be rebound to another payment'
);
select is(
  has_function_privilege('anon', 'public.prepare_payment_order(uuid,uuid,text)', 'EXECUTE'),
  false,
  'anonymous role cannot prepare payment orders'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.finalize_verified_payment(text,text,text,bigint,text,text,text,text)',
    'EXECUTE'
  ),
  false,
  'authenticated role cannot finalize payments'
);
select is(
  has_function_privilege(
    'service_role',
    'public.finalize_verified_payment(text,text,text,bigint,text,text,text,text)',
    'EXECUTE'
  ),
  true,
  'service role can execute the shared finalizer'
);
select is(
  (
    select proconfig[1]
    from pg_proc
    where oid = 'public.finalize_verified_payment(text,text,text,bigint,text,text,text,text)'::regprocedure
  ),
  'search_path=pg_catalog',
  'shared finalizer has a fixed safe search path'
);

select * from finish();
rollback;
