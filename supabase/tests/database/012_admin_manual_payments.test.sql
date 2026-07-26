begin;

select plan(85);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('c0000000-0000-4000-8000-000000000001', 'verify-operations@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('c0000000-0000-4000-8000-000000000002', 'verify-admin@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('c0000000-0000-4000-8000-000000000003', 'verify-super@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('c0000000-0000-4000-8000-000000000004', 'verify-inactive@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.admins (id, auth_user_id, role, name, email, is_active)
values
  ('c0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000001', 'operations', 'Verify Operations', 'verify-operations@example.test', true),
  ('c0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000002', 'admin', 'Verify Admin', 'verify-admin@example.test', true),
  ('c0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000003', 'super_admin', 'Verify Super', 'verify-super@example.test', true),
  ('c0000000-0000-4000-8000-000000000014', 'c0000000-0000-4000-8000-000000000004', 'admin', 'Verify Inactive', 'verify-inactive@example.test', false);

create temporary table verification_context (
  label text primary key,
  booking_reference text not null,
  booking_id uuid not null,
  reservation_id uuid not null,
  payment_id uuid not null
);
grant select on verification_context to authenticated;

select is(
  has_function_privilege(
    'public',
    'public.verify_admin_manual_payment(text,text,bigint,text,uuid,text,text)',
    'EXECUTE'
  ),
  false,
  'public execution is revoked'
);
select is(
  has_function_privilege(
    'anon',
    'public.verify_admin_manual_payment(text,text,bigint,text,uuid,text,text)',
    'EXECUTE'
  ),
  false,
  'anonymous execution is revoked'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.verify_admin_manual_payment(text,text,bigint,text,uuid,text,text)',
    'EXECUTE'
  ),
  true,
  'authenticated receives the narrow verification RPC'
);
select results_eq(
  $$
    select count(*)::integer
    from pg_proc
    where oid = 'public.verify_admin_manual_payment(text,text,bigint,text,uuid,text,text)'::regprocedure
      and prosecdef
      and proconfig[1] = 'search_path=pg_catalog'
  $$,
  array[1::integer],
  'verification RPC is security definer with fixed search path'
);
select results_eq(
  $$
    select count(*)::integer
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and (
        proname like '%confirm%booking%'
        or proname like '%payment%override%'
        or proname like '%resolve%reconciliation%'
      )
  $$,
  array[0::integer],
  'no generic confirmation, override, or reconciliation RPC exists'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.normalize_manual_payment_facts()',
    'EXECUTE'
  ),
  false,
  'normalization trigger helper is not directly callable'
);
select is(
  (
    select proargnames
    from pg_proc
    where oid = 'public.verify_admin_manual_payment(text,text,bigint,text,uuid,text,text)'::regprocedure
  ),
  array[
    'p_booking_reference',
    'p_external_reference',
    'p_observed_amount_paise',
    'p_observed_currency',
    'p_request_id',
    'p_operator_note',
    'p_evidence_descriptor'
  ]::text[],
  'RPC accepts no internal IDs, provider, status, confirmation flag, or fingerprint'
);

grant select on public.bookings, public.inventory_reservations, public.payments,
  public.booking_events, public.notification_events, public.admin_operation_events
to authenticated;
create policy phase5b_verify_test_receipts
on public.admin_operation_events for select to authenticated using (true);
create policy phase5b_verify_test_bookings
on public.bookings for select to authenticated using (true);
create policy phase5b_verify_test_reservations
on public.inventory_reservations for select to authenticated using (true);
create policy phase5b_verify_test_payments
on public.payments for select to authenticated using (true);
create policy phase5b_verify_test_booking_events
on public.booking_events for select to authenticated using (true);
create policy phase5b_verify_test_notifications
on public.notification_events for select to authenticated using (true);

set local role authenticated;
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-001', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000101', null, null
  )$$,
  '42501',
  'admin_unauthorized',
  'unauthenticated caller is denied'
);
set local "request.jwt.claim.sub" = 'c0000000-0000-4000-8000-000000000004';
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-002', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000102', null, null
  )$$,
  '42501',
  'admin_unauthorized',
  'inactive administrator is denied'
);
set local "request.jwt.claim.sub" = 'c0000000-0000-4000-8000-000000000001';
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-003', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000103', null, null
  )$$,
  '42501',
  'admin_unauthorized',
  'operations role is denied'
);

set local "request.jwt.claim.sub" = 'c0000000-0000-4000-8000-000000000002';
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'Priyanshu', 'REF-004', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000104', null, null
  )$$,
  '22023',
  'invalid_booking_reference',
  'name-like booking reference is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'soe-20400101-aaaaaaaa', 'REF-005', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000105', null, null
  )$$,
  '22023',
  'invalid_booking_reference',
  'lowercase booking reference is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'x!', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000106', null, null
  )$$,
  '22023',
  'invalid_external_reference',
  'invalid external reference is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', repeat('A',129), 500000, 'INR',
    'c0000000-0000-4000-8000-000000000107', null, null
  )$$,
  '22023',
  'invalid_external_reference',
  'oversized external reference is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-008', 0, 'INR',
    'c0000000-0000-4000-8000-000000000108', null, null
  )$$,
  '22023',
  'invalid_observed_amount',
  'zero amount is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-009', -1, 'INR',
    'c0000000-0000-4000-8000-000000000109', null, null
  )$$,
  '22023',
  'invalid_observed_amount',
  'negative amount is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-010', 500000, 'US',
    'c0000000-0000-4000-8000-000000000110', null, null
  )$$,
  '22023',
  'invalid_observed_currency',
  'malformed currency is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-011', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000111', repeat('n',501), null
  )$$,
  '22023',
  'invalid_operator_note',
  'oversized note is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-012', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000112', null, repeat('e',201)
  )$$,
  '22023',
  'invalid_evidence_descriptor',
  'oversized evidence descriptor is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-013', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000113', null, 'https://example.test/evidence'
  )$$,
  '22023',
  'invalid_evidence_descriptor',
  'evidence URL is rejected'
);
select throws_ok(
  $$select public.verify_admin_manual_payment(
    'SOE-20400101-AAAAAAAA', 'REF-014', 500000, 'INR',
    'c0000000-0000-4000-8000-000000000114', null, null
  )$$,
  'P0002',
  'booking_not_found',
  'absent canonical reference returns generic not found'
);

reset role;
set local "request.jwt.claim.sub" = 'c0000000-0000-4000-8000-000000000002';
select lives_ok(
  $$select public.create_admin_manual_booking(
    '2040-01-02', 'Success Guest', '+919811111101', null, 2, 0, null,
    'manual_upi', 'c0000000-0000-4000-8000-000000000201'
  )$$,
  'admin fixture creates an eligible pending manual UPI booking'
);
insert into verification_context
select
  'success',
  booking.booking_reference,
  booking.id,
  reservation.id,
  payment.id
from public.bookings as booking
join public.inventory_reservations as reservation on reservation.booking_id = booking.id
join public.payments as payment on payment.booking_id = booking.id
where booking.customer_phone_snapshot = '+919811111101';

set local role authenticated;
select isnt(
  (select booking_reference from verification_context where label = 'success'),
  null,
  'eligible fixture exposes its public booking reference'
);
select matches(
  (select booking_reference from verification_context where label = 'success'),
  '^SOE-[0-9]{8}-[A-F0-9]{8}$',
  'eligible fixture uses the canonical public reference'
);
select is(
  (
    public.verify_admin_manual_payment(
      (select booking_reference from verification_context where label = 'success'),
      '  upi/ref.abc-123  ',
      500000,
      ' inr ',
      'c0000000-0000-4000-8000-000000000202',
      '  checked at desk  ',
      '  receipt sighted  '
    )
  ).result,
  'confirmed',
  'admin can atomically confirm an eligible UPI payment'
);
select is(
  (select booking_status from public.bookings where id = (
    select booking_id from verification_context where label = 'success'
  )),
  'confirmed'::public.booking_status,
  'booking becomes confirmed'
);
select is(
  (select reservation_type from public.inventory_reservations where id = (
    select reservation_id from verification_context where label = 'success'
  )),
  'confirmed_booking'::public.reservation_type,
  'original reservation converts to confirmed booking'
);
select is(
  (select status from public.inventory_reservations where id = (
    select reservation_id from verification_context where label = 'success'
  )),
  'active'::public.reservation_status,
  'confirmed reservation remains active'
);
select is(
  (select expires_at is null from public.inventory_reservations where id = (
    select reservation_id from verification_context where label = 'success'
  )),
  true,
  'confirmed reservation expiry is cleared'
);
select is(
  (select status from public.payments where id = (
    select payment_id from verification_context where label = 'success'
  )),
  'manually_verified'::public.payment_status,
  'payment becomes manually verified'
);
select is(
  (select manual_reference from public.payments where id = (
    select payment_id from verification_context where label = 'success'
  )),
  'UPI/REF.ABC-123',
  'external reference is trimmed and uppercased'
);
select is(
  (select observed_amount_paise from public.payments where id = (
    select payment_id from verification_context where label = 'success'
  )),
  500000::bigint,
  'observed amount is stored separately'
);
select is(
  (select observed_currency from public.payments where id = (
    select payment_id from verification_context where label = 'success'
  )),
  'INR',
  'observed currency is normalized'
);
select is(
  (select signature_verified from public.payments where id = (
    select payment_id from verification_context where label = 'success'
  )),
  false,
  'manual verification never claims a cryptographic signature'
);
select is(
  (select verification_source from public.payments where id = (
    select payment_id from verification_context where label = 'success'
  )),
  'administrator',
  'verification source is administrator'
);
select is(
  (select operator_note from public.payments where id = (
    select payment_id from verification_context where label = 'success'
  )),
  'checked at desk',
  'operator note is bounded and trimmed'
);
select is(
  (select evidence_descriptor from public.payments where id = (
    select payment_id from verification_context where label = 'success'
  )),
  'receipt sighted',
  'evidence descriptor is bounded and trimmed'
);
select results_eq(
  $$select count(*)::integer from public.booking_events
    where booking_id = (select booking_id from verification_context where label = 'success')
      and event_type = 'manual_payment_confirmed'$$,
  array[1::integer],
  'one confirmation lifecycle event exists'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events
    where booking_id = (select booking_id from verification_context where label = 'success')
      and action_type = 'manual_payment_verified'$$,
  array[1::integer],
  'one immutable verification receipt exists'
);
select results_eq(
  $$select count(*)::integer from public.notification_events
    where booking_id = (select booking_id from verification_context where label = 'success')
      and template_key = 'booking_confirmed' and status = 'pending'$$,
  array[1::integer],
  'one pending confirmation notification is queued'
);
select is(
  (
    public.verify_admin_manual_payment(
      (select booking_reference from verification_context where label = 'success'),
      'upi/ref.abc-123', 500000, 'INR',
      'c0000000-0000-4000-8000-000000000202',
      'checked at desk', 'receipt sighted'
    )
  ).applied,
  false,
  'exact successful retry returns the original result without applying'
);
select results_eq(
  $$select count(*)::integer from public.notification_events
    where booking_id = (select booking_id from verification_context where label = 'success')
      and template_key = 'booking_confirmed'$$,
  array[1::integer],
  'successful replay does not duplicate the outbox'
);
select throws_ok(
  format(
    $$select public.verify_admin_manual_payment(%L,'upi/ref.abc-123',499999,'INR',
      'c0000000-0000-4000-8000-000000000202','checked at desk','receipt sighted')$$,
    (select booking_reference from verification_context where label = 'success')
  ),
  'P0001',
  'idempotency_conflict',
  'same request UUID with changed facts is rejected'
);

reset role;
set local "request.jwt.claim.sub" = 'c0000000-0000-4000-8000-000000000003';
select lives_ok(
  $$select public.create_admin_manual_booking(
    '2040-01-04', 'Mismatch Guest', '+919811111102', null, 2, 0, null,
    'payment_link', 'c0000000-0000-4000-8000-000000000301'
  )$$,
  'super-admin fixture creates an eligible pending payment-link booking'
);
insert into verification_context
select
  'mismatch',
  booking.booking_reference,
  booking.id,
  reservation.id,
  payment.id
from public.bookings as booking
join public.inventory_reservations as reservation on reservation.booking_id = booking.id
join public.payments as payment on payment.booking_id = booking.id
where booking.customer_phone_snapshot = '+919811111102';

set local role authenticated;
select is(
  (
    public.verify_admin_manual_payment(
      (select booking_reference from verification_context where label = 'mismatch'),
      'LINK-REF-900', 499999, 'INR',
      'c0000000-0000-4000-8000-000000000302', '', ''
    )
  ).result,
  'reconciliation_required',
  'amount mismatch is a successful reconciliation outcome'
);
select is(
  (select status from public.payments where id = (
    select payment_id from verification_context where label = 'mismatch'
  )),
  'reconciliation_required'::public.payment_status,
  'mismatched payment becomes reconciliation required'
);
select is(
  (select booking_status from public.bookings where id = (
    select booking_id from verification_context where label = 'mismatch'
  )),
  'expired'::public.booking_status,
  'payment-pending booking is terminalized'
);
select is(
  (select status from public.inventory_reservations where id = (
    select reservation_id from verification_context where label = 'mismatch'
  )),
  'expired'::public.reservation_status,
  'active manual reservation is terminalized'
);
select results_eq(
  $$select count(*)::integer from public.notification_events
    where booking_id = (select booking_id from verification_context where label = 'mismatch')
      and template_key = 'booking_confirmed'$$,
  array[0::integer],
  'reconciliation creates no confirmation notification'
);
select results_eq(
  $$select count(*)::integer from public.booking_events
    where booking_id = (select booking_id from verification_context where label = 'mismatch')
      and event_type = 'manual_payment_reconciliation_required'$$,
  array[1::integer],
  'one reconciliation lifecycle event exists'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events
    where booking_id = (select booking_id from verification_context where label = 'mismatch')
      and action_type = 'manual_payment_reconciliation_required'$$,
  array[1::integer],
  'one reconciliation receipt exists'
);
select is(
  (
    public.verify_admin_manual_payment(
      (select booking_reference from verification_context where label = 'mismatch'),
      'LINK-REF-900', 499999, 'INR',
      'c0000000-0000-4000-8000-000000000302', null, null
    )
  ).applied,
  false,
  'exact reconciliation retry returns without reapplying'
);
select results_eq(
  $$select count(*)::integer from public.inventory_reservations
    where booking_id = (select booking_id from verification_context where label = 'mismatch')$$,
  array[1::integer],
  'reconciliation creates no replacement reservation'
);
select results_eq(
  $$select count(*)::integer from public.inventory_reservations
    where booking_id = (select booking_id from verification_context where label = 'mismatch')
      and status = 'active'$$,
  array[0::integer],
  'reconciliation leaves no active inventory'
);
select is(
  (select operator_note from public.payments where id = (
    select payment_id from verification_context where label = 'mismatch'
  )),
  null,
  'empty operator note normalizes to null'
);
select is(
  (select evidence_descriptor from public.payments where id = (
    select payment_id from verification_context where label = 'mismatch'
  )),
  null,
  'empty evidence descriptor normalizes to null'
);

reset role;
set local "request.jwt.claim.sub" = 'c0000000-0000-4000-8000-000000000002';
select lives_ok(
  $$select public.create_admin_manual_booking(
    '2040-01-08', 'Released Guest', '+919811111104', null, 2, 0, null,
    'manual_upi', 'c0000000-0000-4000-8000-000000000501'
  )$$,
  'admin fixture creates a booking for released-reservation reconciliation'
);
insert into verification_context
select
  'released',
  booking.booking_reference,
  booking.id,
  reservation.id,
  payment.id
from public.bookings as booking
join public.inventory_reservations as reservation on reservation.booking_id = booking.id
join public.payments as payment on payment.booking_id = booking.id
where booking.customer_phone_snapshot = '+919811111104';
update public.inventory_reservations
set status = 'released'
where id = (select reservation_id from verification_context where label = 'released');

set local role authenticated;
select is(
  (
    public.verify_admin_manual_payment(
      (select booking_reference from verification_context where label = 'released'),
      'RELEASED-REF-001', 500000, 'INR',
      'c0000000-0000-4000-8000-000000000502', null, null
    )
  ).result,
  'reconciliation_required',
  'payment observed after release routes to reconciliation'
);
select is(
  (select status from public.payments where id = (
    select payment_id from verification_context where label = 'released'
  )),
  'reconciliation_required'::public.payment_status,
  'released-reservation payment becomes reconciliation required'
);
select is(
  (select manual_reference from public.payments where id = (
    select payment_id from verification_context where label = 'released'
  )),
  'RELEASED-REF-001',
  'released-reservation observation facts remain durable'
);
select is(
  (select status from public.inventory_reservations where id = (
    select reservation_id from verification_context where label = 'released'
  )),
  'released'::public.reservation_status,
  'released reservation remains released'
);
select is(
  (select booking_status from public.bookings where id = (
    select booking_id from verification_context where label = 'released'
  )),
  'expired'::public.booking_status,
  'released-reservation booking is terminalized'
);
select results_eq(
  $$select count(*)::integer from public.inventory_reservations
    where booking_id = (select booking_id from verification_context where label = 'released')$$,
  array[1::integer],
  'released-reservation reconciliation creates no replacement inventory'
);
select results_eq(
  $$select count(*)::integer from public.notification_events
    where booking_id = (select booking_id from verification_context where label = 'released')
      and template_key = 'booking_confirmed'$$,
  array[0::integer],
  'released-reservation reconciliation creates no confirmation notification'
);
select results_eq(
  $$select count(*)::integer from public.booking_events
    where booking_id = (select booking_id from verification_context where label = 'released')
      and event_type = 'manual_payment_reconciliation_required'$$,
  array[1::integer],
  'released-reservation reconciliation creates one booking event'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events
    where booking_id = (select booking_id from verification_context where label = 'released')
      and action_type = 'manual_payment_reconciliation_required'$$,
  array[1::integer],
  'released-reservation reconciliation creates one receipt'
);

reset role;
insert into public.bookings (
  id, booking_reference, public_confirmation_token, property_id, customer_id,
  customer_name_snapshot, customer_email_snapshot, customer_phone_snapshot,
  source, booking_type, check_in_at, check_out_at, guest_count,
  overnight_guest_count, total_amount_paise, advance_amount_paise,
  balance_amount_paise, booking_status
)
select
  'c0000000-0000-4000-8000-000000000601',
  'SOE-20400110-A1B2C3D4',
  'missing-reservation-confirmation-token',
  property_id,
  customer_id,
  'Missing Reservation Guest',
  null,
  '+919811111105',
  'admin_manual',
  'manual_one_night',
  '2040-01-10 05:30:00+00',
  '2040-01-11 04:30:00+00',
  2,
  0,
  1500000,
  500000,
  1000000,
  'payment_pending'
from public.bookings
limit 1;
insert into public.payments (
  id, booking_id, provider, idempotency_key, amount_paise, currency,
  status, signature_verified, attempt_expires_at
) values (
  'c0000000-0000-4000-8000-000000000602',
  'c0000000-0000-4000-8000-000000000601',
  'manual_upi',
  'missing-reservation-payment',
  500000,
  'INR',
  'pending',
  false,
  '2040-01-10 06:00:00+00'
);

set local role authenticated;
select is(
  (
    public.verify_admin_manual_payment(
      'SOE-20400110-A1B2C3D4', 'MISSING-REF-001', 500000, 'INR',
      'c0000000-0000-4000-8000-000000000603', null, null
    )
  ).result,
  'reconciliation_required',
  'missing reservation routes observed payment to reconciliation'
);
select is(
  (select status from public.payments where id = 'c0000000-0000-4000-8000-000000000602'),
  'reconciliation_required'::public.payment_status,
  'missing-reservation payment becomes reconciliation required'
);
select is(
  (select booking_status from public.bookings where id = 'c0000000-0000-4000-8000-000000000601'),
  'expired'::public.booking_status,
  'missing-reservation booking does not confirm'
);
select results_eq(
  $$select count(*)::integer from public.inventory_reservations
    where booking_id = 'c0000000-0000-4000-8000-000000000601'$$,
  array[0::integer],
  'missing-reservation reconciliation does not create inventory'
);
select results_eq(
  $$select count(*)::integer from public.notification_events
    where booking_id = 'c0000000-0000-4000-8000-000000000601'
      and template_key = 'booking_confirmed'$$,
  array[0::integer],
  'missing-reservation reconciliation creates no confirmation notification'
);
select results_eq(
  $$select count(*)::integer from public.booking_events
    where booking_id = 'c0000000-0000-4000-8000-000000000601'
      and event_type = 'manual_payment_reconciliation_required'$$,
  array[1::integer],
  'missing-reservation reconciliation creates one event'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events
    where booking_id = 'c0000000-0000-4000-8000-000000000601'
      and inventory_reservation_id is null
      and action_type = 'manual_payment_reconciliation_required'$$,
  array[1::integer],
  'missing-reservation reconciliation creates one receipt without inventing a target'
);
select is(
  (
    public.verify_admin_manual_payment(
      'SOE-20400110-A1B2C3D4', 'MISSING-REF-001', 500000, 'INR',
      'c0000000-0000-4000-8000-000000000603', null, null
    )
  ).reservation_type,
  null,
  'safe missing-reservation replay exposes no internal reservation identifier'
);

reset role;
set local "request.jwt.claim.sub" = 'c0000000-0000-4000-8000-000000000002';
select lives_ok(
  $$select public.create_admin_manual_booking(
    '2040-01-06', 'Currency Guest', '+919811111103', null, 2, 0, null,
    'manual_upi', 'c0000000-0000-4000-8000-000000000401'
  )$$,
  'admin fixture creates a booking for currency mismatch'
);
insert into verification_context
select
  'currency',
  booking.booking_reference,
  booking.id,
  reservation.id,
  payment.id
from public.bookings as booking
join public.inventory_reservations as reservation on reservation.booking_id = booking.id
join public.payments as payment on payment.booking_id = booking.id
where booking.customer_phone_snapshot = '+919811111103';

set local role authenticated;
select is(
  (
    public.verify_admin_manual_payment(
      (select booking_reference from verification_context where label = 'currency'),
      'CURRENCY-REF-001', 500000, 'usd',
      'c0000000-0000-4000-8000-000000000402', null, null
    )
  ).result,
  'reconciliation_required',
  'well-formed nonmatching observed currency routes to reconciliation'
);
select is(
  (select observed_currency from public.payments where id = (
    select payment_id from verification_context where label = 'currency'
  )),
  'USD',
  'nonmatching observed currency is durably normalized and stored'
);
select is(
  (select booking_status from public.bookings where id = (
    select booking_id from verification_context where label = 'currency'
  )),
  'expired'::public.booking_status,
  'currency mismatch terminalizes the payment-pending booking'
);
select is(
  (select status from public.inventory_reservations where id = (
    select reservation_id from verification_context where label = 'currency'
  )),
  'expired'::public.reservation_status,
  'currency mismatch terminalizes active manual inventory'
);
select results_eq(
  $$select count(*)::integer from public.admin_operation_events
    where booking_id in (select booking_id from verification_context)
      and (
        coalesce(internal_note, '') ~ 'UPI/REF|LINK-REF|Success Guest|Mismatch Guest|919811'
        or request_fingerprint !~ '^[a-f0-9]{64}$'
      )$$,
  array[0::integer],
  'receipts contain no external reference or customer PII'
);
select results_eq(
  $$select count(*)::integer from public.booking_events
    where booking_id in (select booking_id from verification_context)
      and metadata::text ~ 'UPI/REF|LINK-REF|Success Guest|Mismatch Guest|919811'$$,
  array[0::integer],
  'booking-event metadata contains no reference or customer PII'
);
select results_eq(
  $$
    select count(*)::integer
    from pg_attribute
    where attrelid = 'public.admin_manual_payment_result'::regclass
      and attnum > 0 and not attisdropped
      and attname in (
        'booking_id', 'reservation_id', 'payment_id', 'customer_id',
        'actor_admin_id', 'request_fingerprint', 'manual_reference',
        'operator_note', 'evidence_descriptor'
      )
  $$,
  array[0::integer],
  'safe result excludes internal IDs, fingerprint, raw reference, note, and evidence'
);
select is(
  (select count(*)::integer from public.inventory_reservations
    where booking_id = (select booking_id from verification_context where label = 'success')),
  1,
  'successful confirmation retains exactly one original reservation'
);
select is(
  (select count(*)::integer from public.payments
    where booking_id = (select booking_id from verification_context where label = 'success')),
  1,
  'verification creates no second payment attempt'
);
select is(
  (select count(*)::integer from public.notification_events
    where booking_id = (select booking_id from verification_context where label = 'mismatch')),
  0,
  'reconciliation queues no customer notification'
);

reset role;
select * from finish();
rollback;
