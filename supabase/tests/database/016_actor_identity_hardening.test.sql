begin;
select plan(21);

-- 1. Verify existence of 14-argument public wrapper and private internal functions
select has_function(
  'public',
  'create_booking_hold',
  ARRAY['text', 'date', 'text', 'text', 'text', 'text', 'integer', 'integer', 'text', 'uuid', 'uuid', 'text', 'text', 'integer'],
  'public 14-argument create_booking_hold wrapper exists'
);

select has_function(
  'private',
  'create_booking_hold_v3_internal',
  ARRAY['text', 'date', 'text', 'text', 'text', 'text', 'integer', 'integer', 'text', 'uuid', 'uuid', 'text', 'text', 'integer'],
  'private 14-argument create_booking_hold_v3_internal exists'
);

-- 2. Verify absence of 13-argument old functions
select hasnt_function(
  'public',
  'create_booking_hold',
  ARRAY['text', 'date', 'text', 'text', 'text', 'text', 'integer', 'integer', 'text', 'uuid', 'uuid', 'text', 'integer'],
  'old 13-argument public create_booking_hold is absent'
);

select hasnt_function(
  'private',
  'create_booking_hold_v2_internal',
  ARRAY['text', 'date', 'text', 'text', 'text', 'text', 'integer', 'integer', 'text', 'uuid', 'uuid', 'text', 'integer'],
  'old 13-argument private create_booking_hold_v2_internal is absent'
);

-- 3. Verify search_path settings
select is(
  (select proconfig[1] from pg_proc where oid = 'public.create_booking_hold(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,text,integer)'::regprocedure),
  'search_path=pg_catalog',
  'public 14-arg create_booking_hold has safe search_path'
);

select is(
  (select proconfig[1] from pg_proc where oid = 'private.create_booking_hold_v3_internal(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,text,integer)'::regprocedure),
  'search_path=pg_catalog',
  'private 14-arg create_booking_hold_v3_internal has safe search_path'
);

-- 4. Verify execution privileges on public wrapper
select is(
  has_function_privilege('anon', 'public.create_booking_hold(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,text,integer)', 'EXECUTE'),
  false,
  'anon cannot execute public 14-arg create_booking_hold'
);

select is(
  has_function_privilege('authenticated', 'public.create_booking_hold(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,text,integer)', 'EXECUTE'),
  false,
  'authenticated cannot execute public 14-arg create_booking_hold'
);

select is(
  has_function_privilege('service_role', 'public.create_booking_hold(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,text,integer)', 'EXECUTE'),
  true,
  'service_role can execute public 14-arg create_booking_hold'
);

-- 5. Verify execution privileges on private internal function
select is(
  has_function_privilege('anon', 'private.create_booking_hold_v3_internal(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,text,integer)', 'EXECUTE'),
  false,
  'anon cannot execute private create_booking_hold_v3_internal'
);

select is(
  has_function_privilege('authenticated', 'private.create_booking_hold_v3_internal(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,text,integer)', 'EXECUTE'),
  false,
  'authenticated cannot execute private create_booking_hold_v3_internal'
);

select is(
  has_function_privilege('service_role', 'private.create_booking_hold_v3_internal(text,date,text,text,text,text,integer,integer,text,uuid,uuid,text,text,integer)', 'EXECUTE'),
  false,
  'service_role cannot execute private create_booking_hold_v3_internal directly'
);

-- 6. Test actor_identity_hash input validations
select throws_ok(
  $$ select public.create_booking_hold('silver-oak-estate', '2032-05-10'::date, 'Actor Test', null, '+919999900001', null, 2, 0, null, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '3333333333333333333333333333333333333333333333333333333333333333', null, 10) $$,
  '22023',
  'invalid_actor_identity',
  'NULL actor identity hash is rejected'
);

select throws_ok(
  $$ select public.create_booking_hold('silver-oak-estate', '2032-05-10'::date, 'Actor Test', null, '+919999900001', null, 2, 0, null, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '3333333333333333333333333333333333333333333333333333333333333333', '', 10) $$,
  '22023',
  'invalid_actor_identity',
  'blank actor identity hash is rejected'
);

select throws_ok(
  $$ select public.create_booking_hold('silver-oak-estate', '2032-05-10'::date, 'Actor Test', null, '+919999900001', null, 2, 0, null, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '3333333333333333333333333333333333333333333333333333333333333333', 'A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A0', 10) $$,
  '22023',
  'invalid_actor_identity',
  'uppercase hex actor identity hash is rejected'
);

select throws_ok(
  $$ select public.create_booking_hold('silver-oak-estate', '2032-05-10'::date, 'Actor Test', null, '+919999900001', null, 2, 0, null, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '3333333333333333333333333333333333333333333333333333333333333333', 'short_hash', 10) $$,
  '22023',
  'invalid_actor_identity',
  'short actor identity hash is rejected'
);

-- 7. Test successful creation and idempotency logic
select is(
  (public.create_booking_hold(
    'silver-oak-estate', '2032-05-12'::date, 'Actor Test', null, '+919999900002', null, 2, 0, null,
    '44444444-4444-4444-4444-444444444444'::uuid, '55555555-5555-5555-5555-555555555555'::uuid,
    '6666666666666666666666666666666666666666666666666666666666666666',
    '7777777777777777777777777777777777777777777777777777777777777777',
    10
  )->>'created')::boolean,
  true,
  'valid 14-arg hold creation succeeds'
);

-- Same requestId + same fingerprint + same actor identity hash -> returns existing hold with created: false
select is(
  (public.create_booking_hold(
    'silver-oak-estate', '2032-05-12'::date, 'Actor Test', null, '+919999900002', null, 2, 0, null,
    '44444444-4444-4444-4444-444444444444'::uuid, '55555555-5555-5555-5555-555555555555'::uuid,
    '6666666666666666666666666666666666666666666666666666666666666666',
    '7777777777777777777777777777777777777777777777777777777777777777',
    10
  )->>'created')::boolean,
  false,
  'identical idempotent hold request returns created: false'
);

-- Same requestId + different actor identity hash -> raises idempotency_conflict
select throws_ok(
  $$ select public.create_booking_hold(
    'silver-oak-estate', '2032-05-12'::date, 'Actor Test', null, '+919999900002', null, 2, 0, null,
    '44444444-4444-4444-4444-444444444444'::uuid, '55555555-5555-5555-5555-555555555555'::uuid,
    '6666666666666666666666666666666666666666666666666666666666666666',
    '8888888888888888888888888888888888888888888888888888888888888888',
    10
  ) $$,
  'P0001',
  'idempotency_conflict',
  'mismatched actor identity hash on same request ID raises idempotency_conflict'
);

select is(
  (public.create_booking_hold(
    'silver-oak-estate', '2032-05-14'::date, 'Serial Actor', null, '+919999900003', null, 2, 0, null,
    '99999999-9999-4999-8999-999999999991'::uuid, '99999999-9999-4999-8999-999999999992'::uuid,
    '9999999999999999999999999999999999999999999999999999999999999993',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    10
  )->>'created')::boolean,
  true,
  'serial actor abuse setup creates the first hold'
);

select throws_ok(
  $$ select public.create_booking_hold(
    'silver-oak-estate', '2032-05-16'::date, 'Serial Actor Changed', null, '+919999900004', null, 2, 0, null,
    '99999999-9999-4999-8999-999999999994'::uuid, '99999999-9999-4999-8999-999999999995'::uuid,
    '9999999999999999999999999999999999999999999999999999999999999996',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    10
  ) $$,
  'P0001',
  'hold_abuse_limit',
  'same actor cannot create another active hold with changed request, fingerprint, phone, and date'
);

select * from finish();
rollback;
