begin;

select plan(41);

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '90000000-0000-4000-8000-000000000001',
  'phase5b-admin@example.test',
  '',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

insert into public.admins (id, auth_user_id, role, name, email, is_active)
values (
  '90000000-0000-4000-8000-000000000002',
  '90000000-0000-4000-8000-000000000001',
  'admin',
  'Phase 5B Admin',
  'phase5b-admin@example.test',
  true
);

insert into public.bookings (
  id, booking_reference, public_confirmation_token, property_id,
  customer_name_snapshot, customer_phone_snapshot, source, booking_type,
  check_in_at, check_out_at, guest_count, overnight_guest_count,
  total_amount_paise, advance_amount_paise, balance_amount_paise, booking_status
)
select
  '90000000-0000-4000-8000-000000000010',
  'SOE-20990101-00000001',
  'phase5b-confirmation-token-1',
  id,
  'Phase Five',
  '+919999999999',
  'admin_manual',
  'manual_one_night',
  '2099-01-01 05:30+00',
  '2099-01-02 04:30+00',
  4,
  2,
  1500000,
  500000,
  1000000,
  'payment_pending'
from public.properties
where slug = 'silver-oak-estate';

insert into public.inventory_reservations (
  id, property_id, booking_id, reservation_type, status,
  start_at, end_at, expires_at, source
)
select
  '90000000-0000-4000-8000-000000000020',
  property_id,
  id,
  'manual_booking',
  'active',
  check_in_at,
  check_out_at,
  '2098-12-31 00:00+00',
  'admin_manual'
from public.bookings
where id = '90000000-0000-4000-8000-000000000010';

select ok(
  'manually_verified' = any(enum_range(null::public.payment_status)::text[]),
  'manually_verified exists in payment_status'
);

select is(
  array_length(enum_range(null::public.payment_status), 1),
  14,
  'all existing payment states are preserved with one new state'
);

select lives_ok(
  $$
    insert into public.payments (
      id, booking_id, provider, idempotency_key, amount_paise, currency, status
    ) values (
      '90000000-0000-4000-8000-000000000030',
      '90000000-0000-4000-8000-000000000010',
      'razorpay', 'phase5b-razorpay-open', 500000, 'INR', 'pending'
    )
  $$,
  'existing Razorpay pending rows remain valid'
);

select lives_ok(
  $$
    update public.payments
    set status = 'captured'
    where id = '90000000-0000-4000-8000-000000000030'
  $$,
  'existing Razorpay pending to captured transition remains valid'
);

select throws_ok(
  $$
    update public.payments
    set status = 'manually_verified'
    where id = '90000000-0000-4000-8000-000000000030'
  $$,
  'P0001',
  'invalid_payment_status_transition',
  'Razorpay rows cannot become manually verified'
);

select throws_ok(
  $$
    insert into public.payments (
      booking_id, provider, idempotency_key, amount_paise, currency, status,
      manual_reference, verified_by_admin_id, manual_verified_at,
      verification_source, signature_verified
    ) values (
      '90000000-0000-4000-8000-000000000010',
      'manual_upi', 'phase5b-bad-signature', 500000, 'INR',
      'manually_verified', 'UPI-BAD-SIGNATURE',
      '90000000-0000-4000-8000-000000000002', now(),
      'administrator', true
    )
  $$,
  '23514',
  null,
  'manual verification rejects a cryptographic signature flag'
);

select throws_ok(
  $$
    insert into public.payments (
      booking_id, provider, idempotency_key, amount_paise, currency, status
    ) values (
      '90000000-0000-4000-8000-000000000010',
      'manual_upi', 'phase5b-missing-facts', 500000, 'INR',
      'manually_verified'
    )
  $$,
  '23514',
  null,
  'manually verified status requires attestation facts'
);

select throws_ok(
  $$
    insert into public.payments (
      booking_id, provider, provider_payment_id, idempotency_key,
      amount_paise, currency, status
    ) values (
      '90000000-0000-4000-8000-000000000010',
      'payment_link', 'pay_must_not_exist', 'phase5b-provider-id',
      500000, 'INR', 'pending'
    )
  $$,
  '23514',
  null,
  'manual providers reject Razorpay provider identifiers'
);

select lives_ok(
  $$
    insert into public.payments (
      id, booking_id, provider, idempotency_key, amount_paise, currency, status,
      manual_reference, verified_by_admin_id, manual_verified_at,
      verification_source, operator_note, evidence_descriptor
    ) values (
      '90000000-0000-4000-8000-000000000031',
      '90000000-0000-4000-8000-000000000010',
      'manual_upi', 'phase5b-valid-manual', 500000, 'INR',
      'manually_verified', '  upi-tx/abc.001  ',
      '90000000-0000-4000-8000-000000000002', now(),
      'administrator', '  verified against operator portal  ',
      '  operator portal record  '
    )
  $$,
  'a complete manual payment fact is accepted'
);

select is(
  (
    select manual_reference
    from public.payments
    where id = '90000000-0000-4000-8000-000000000031'
  ),
  'UPI-TX/ABC.001',
  'manual references are trimmed and normalized to uppercase'
);

select is(
  (
    select operator_note
    from public.payments
    where id = '90000000-0000-4000-8000-000000000031'
  ),
  'verified against operator portal',
  'manual operator notes are trimmed'
);

select throws_ok(
  $$
    insert into public.payments (
      booking_id, provider, idempotency_key, amount_paise, currency, status,
      manual_reference, verified_by_admin_id, manual_verified_at,
      verification_source
    ) values (
      '90000000-0000-4000-8000-000000000010',
      'manual_upi', 'phase5b-duplicate-manual', 500000, 'INR',
      'manually_verified', ' upi-tx/abc.001 ',
      '90000000-0000-4000-8000-000000000002', now(),
      'administrator'
    )
  $$,
  '23505',
  null,
  'case and whitespace cannot bypass manual reference uniqueness'
);

select throws_ok(
  $$
    insert into public.payments (
      booking_id, provider, idempotency_key, amount_paise, currency, status,
      manual_reference, verified_by_admin_id, manual_verified_at,
      verification_source, operator_note
    ) values (
      '90000000-0000-4000-8000-000000000010',
      'payment_link', 'phase5b-long-note', 500000, 'INR',
      'manually_verified', 'LINK-REFERENCE-1',
      '90000000-0000-4000-8000-000000000002', now(),
      'administrator', repeat('x', 501)
    )
  $$,
  '23514',
  null,
  'manual operator notes are bounded'
);

select throws_ok(
  $$
    insert into public.payments (
      booking_id, provider, idempotency_key, amount_paise, currency, status,
      manual_reference, verified_by_admin_id, manual_verified_at,
      verification_source, evidence_descriptor
    ) values (
      '90000000-0000-4000-8000-000000000010',
      'payment_link', 'phase5b-long-evidence', 500000, 'INR',
      'manually_verified', 'LINK-REFERENCE-2',
      '90000000-0000-4000-8000-000000000002', now(),
      'administrator', repeat('x', 201)
    )
  $$,
  '23514',
  null,
  'manual evidence descriptors are bounded'
);

select throws_ok(
  $$
    insert into public.payments (
      booking_id, provider, idempotency_key, amount_paise, currency, status,
      manual_reference, verified_by_admin_id, manual_verified_at,
      verification_source
    ) values (
      '90000000-0000-4000-8000-000000000010',
      'cash', 'phase5b-unsupported-provider', 500000, 'INR',
      'manually_verified', 'CASH-REFERENCE',
      '90000000-0000-4000-8000-000000000002', now(),
      'administrator'
    )
  $$,
  '23514',
  null,
  'unsupported payment providers are rejected'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.admin_operation_events'::regclass
  ),
  'administrator operation receipts have RLS enabled'
);

select is(
  has_table_privilege('anon', 'public.admin_operation_events', 'SELECT'),
  false,
  'anonymous users cannot select operation receipts'
);

select is(
  has_table_privilege('authenticated', 'public.admin_operation_events', 'INSERT'),
  false,
  'authenticated users cannot insert operation receipts directly'
);

select is(
  has_table_privilege('authenticated', 'public.admin_operation_events', 'UPDATE'),
  false,
  'authenticated users cannot update operation receipts directly'
);

select is(
  has_table_privilege('authenticated', 'public.admin_operation_events', 'DELETE'),
  false,
  'authenticated users cannot delete operation receipts directly'
);

select throws_ok(
  $$
    insert into public.admin_operation_events (
      actor_admin_id, action_type, request_id, request_fingerprint,
      inventory_reservation_id, resulting_state
    ) values (
      '90000000-0000-4000-8000-000000000002',
      'maintenance_block_created',
      '90000000-0000-4000-8000-000000000040',
      'NOT-A-SHA256-DIGEST',
      '90000000-0000-4000-8000-000000000020',
      'active'
    )
  $$,
  '23514',
  null,
  'operation receipt fingerprints require lowercase SHA-256 hex'
);

insert into public.admin_operation_events (
  id, actor_admin_id, action_type, request_id, request_fingerprint,
  inventory_reservation_id, resulting_state, reason_category
) values (
  '90000000-0000-4000-8000-000000000041',
  '90000000-0000-4000-8000-000000000002',
  'maintenance_block_created',
  '90000000-0000-4000-8000-000000000040',
  repeat('a', 64),
  '90000000-0000-4000-8000-000000000020',
  'active',
  'maintenance_required'
);

select throws_ok(
  $$
    insert into public.admin_operation_events (
      actor_admin_id, action_type, request_id, request_fingerprint,
      inventory_reservation_id, resulting_state
    ) values (
      '90000000-0000-4000-8000-000000000002',
      'maintenance_block_created',
      '90000000-0000-4000-8000-000000000040',
      repeat('b', 64),
      '90000000-0000-4000-8000-000000000020',
      'active'
    )
  $$,
  '23505',
  null,
  'operation request IDs are unique per actor and action'
);

select throws_ok(
  $$
    update public.admin_operation_events
    set resulting_state = 'released'
    where id = '90000000-0000-4000-8000-000000000041'
  $$,
  'P0001',
  'admin_operation_events_are_immutable',
  'operation receipts cannot be updated'
);

select throws_ok(
  $$
    delete from public.admin_operation_events
    where id = '90000000-0000-4000-8000-000000000041'
  $$,
  'P0001',
  'admin_operation_events_are_immutable',
  'operation receipts cannot be deleted'
);

select throws_ok(
  $$
    insert into public.admin_operation_events (
      actor_admin_id, action_type, request_id, request_fingerprint,
      booking_id, resulting_state
    ) values (
      '90000000-0000-4000-8000-000000000002',
      'owner_block_created',
      '90000000-0000-4000-8000-000000000042',
      repeat('c', 64),
      '90000000-0000-4000-8000-000000000010',
      'active'
    )
  $$,
  '23514',
  null,
  'inventory block receipts require only an inventory target'
);

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select id, 'manual_booking', 'active',
      '2099-02-01 05:30+00', '2099-02-02 04:30+00', 'test'
    from public.properties where slug = 'silver-oak-estate'
  $$,
  '23514',
  null,
  'active manual bookings require a booking and expiry'
);

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, booking_id, reservation_type, status,
      start_at, end_at, expires_at, source
    )
    select id, '90000000-0000-4000-8000-000000000010',
      'owner_block', 'active',
      '2099-03-01 05:30+00', '2099-03-02 04:30+00',
      '2099-02-28 00:00+00', 'test'
    from public.properties where slug = 'silver-oak-estate'
  $$,
  '23514',
  null,
  'owner blocks reject booking relationships and expiry'
);

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, external_reservation_id, reservation_type, status,
      start_at, end_at, source
    )
    select id, gen_random_uuid(), 'maintenance_block', 'active',
      '2099-03-03 05:30+00', '2099-03-04 04:30+00', 'test'
    from public.properties where slug = 'silver-oak-estate'
  $$,
  '23514',
  null,
  'maintenance blocks reject external reservation relationships'
);

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, booking_id, reservation_type, status,
      start_at, end_at, source
    )
    select id, '90000000-0000-4000-8000-000000000010',
      'temporary_hold', 'active',
      '2099-04-01 05:30+00', '2099-04-02 04:30+00', 'test'
    from public.properties where slug = 'silver-oak-estate'
  $$,
  '23514',
  null,
  'temporary holds still require expiry'
);

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, booking_id, reservation_type, status,
      start_at, end_at, expires_at, source
    )
    select id, '90000000-0000-4000-8000-000000000010',
      'confirmed_booking', 'active',
      '2099-04-03 05:30+00', '2099-04-04 04:30+00',
      '2099-04-01 00:00+00', 'test'
    from public.properties where slug = 'silver-oak-estate'
  $$,
  '23514',
  null,
  'confirmed bookings reject expiry'
);

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, booking_id, reservation_type, status,
      start_at, end_at, source
    )
    select id, '90000000-0000-4000-8000-000000000010',
      'confirmed_booking', 'released',
      '2099-04-05 05:30+00', '2099-04-06 04:30+00', 'test'
    from public.properties where slug = 'silver-oak-estate'
  $$,
  '23514',
  null,
  'confirmed booking inventory remains active'
);

select throws_ok(
  $$
    update public.inventory_reservations
    set status = 'expired'
    where id = '90000000-0000-4000-8000-000000000020';
    update public.inventory_reservations
    set status = 'active'
    where id = '90000000-0000-4000-8000-000000000020'
  $$,
  'P0001',
  'terminal_reservation_cannot_reactivate',
  'expired manual bookings cannot become active again'
);

insert into public.inventory_reservations (
  property_id, reservation_type, status, start_at, end_at, source
)
select id, 'owner_block', 'active',
  '2099-05-01 05:30+00', '2099-05-02 04:30+00', 'test'
from public.properties where slug = 'silver-oak-estate';

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, booking_id, reservation_type, status,
      start_at, end_at, expires_at, source
    )
    select id, '90000000-0000-4000-8000-000000000010',
      'manual_booking', 'active',
      '2099-05-01 05:30+00', '2099-05-02 04:30+00',
      '2099-04-30 00:00+00', 'test'
    from public.properties where slug = 'silver-oak-estate'
  $$,
  '23P01',
  null,
  'active manual bookings participate in overlap exclusion'
);

select throws_ok(
  $$
    insert into public.inventory_reservations (
      property_id, reservation_type, status, start_at, end_at, source
    )
    select id, 'maintenance_block', 'active',
      '2099-05-01 05:30+00', '2099-05-02 04:30+00', 'test'
    from public.properties where slug = 'silver-oak-estate'
  $$,
  '23P01',
  null,
  'active maintenance blocks participate in overlap exclusion'
);

select throws_ok(
  $$
    update public.payments
    set status = 'reconciliation_required'
    where id = '90000000-0000-4000-8000-000000000031';
    update public.payments
    set status = 'manually_verified'
    where id = '90000000-0000-4000-8000-000000000031';
  $$,
  'P0001',
  'invalid_payment_status_transition',
  'manual verification cannot transition from an arbitrary terminal state'
);

select lives_ok(
  $$
    insert into public.payments (
      id, booking_id, provider, idempotency_key, amount_paise, currency, status
    ) values (
      '90000000-0000-4000-8000-000000000032',
      '90000000-0000-4000-8000-000000000010',
      'payment_link', 'phase5b-pending-manual', 500000, 'INR', 'pending'
    )
  $$,
  'manual providers begin in pending state without attestation facts'
);

select lives_ok(
  $$
    update public.payments
    set status = 'reconciliation_required'
    where id = '90000000-0000-4000-8000-000000000032'
  $$,
  'pending manual payments can transition to reconciliation required'
);

select is(
  has_table_privilege('service_role', 'public.admin_operation_events', 'SELECT'),
  true,
  'service role may read receipts for authorized server-only views'
);

select is(
  has_table_privilege('service_role', 'public.admin_operation_events', 'INSERT'),
  false,
  'service role has no direct receipt mutation grant'
);

select is(
  (
    select proconfig[1]
    from pg_proc
    where oid = 'public.prevent_inventory_reservation_reactivation()'::regprocedure
  ),
  'search_path=pg_catalog',
  'reservation transition enforcement has a fixed safe search path'
);

select is(
  (
    select count(*)::integer
    from pg_policy
    where polrelid = 'public.admin_operation_events'::regclass
  ),
  0,
  'operation receipts expose no direct RLS policies'
);

rollback;
