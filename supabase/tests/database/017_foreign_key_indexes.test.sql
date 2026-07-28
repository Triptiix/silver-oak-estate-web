begin;

select plan(24);

select is(
  (
    select count(*)::integer
    from pg_class as index_class
    join pg_namespace as index_namespace on index_namespace.oid = index_class.relnamespace
    where index_namespace.nspname = 'public'
      and index_class.relname = 'payments_verified_by_admin_id_idx'
  ),
  1,
  'payments verified-by administrator index exists with the approved name'
);

select is(
  (
    select index_definition.indrelid
    from pg_index as index_definition
    join pg_class as index_class on index_class.oid = index_definition.indexrelid
    join pg_namespace as index_namespace on index_namespace.oid = index_class.relnamespace
    where index_namespace.nspname = 'public'
      and index_class.relname = 'payments_verified_by_admin_id_idx'
  ),
  'public.payments'::regclass,
  'payments verified-by administrator index belongs to payments'
);

select ok(
  (
    select index_definition.indnkeyatts = 1 and index_definition.indnatts = 1
    from pg_index as index_definition
    where index_definition.indexrelid = 'public.payments_verified_by_admin_id_idx'::regclass
  ),
  'payments verified-by administrator index has one key column and no included columns'
);

select is(
  (
    select attribute_definition.attname
    from pg_index as index_definition
    cross join lateral unnest(index_definition.indkey) with ordinality as index_key(attnum, position)
    join pg_attribute as attribute_definition
      on attribute_definition.attrelid = index_definition.indrelid
      and attribute_definition.attnum = index_key.attnum
    where index_definition.indexrelid = 'public.payments_verified_by_admin_id_idx'::regclass
      and index_key.position = 1
  ),
  'verified_by_admin_id',
  'payments verified-by administrator index keys verified_by_admin_id'
);

select is(
  (
    select access_method.amname
    from pg_index as index_definition
    join pg_class as index_class on index_class.oid = index_definition.indexrelid
    join pg_am as access_method on access_method.oid = index_class.relam
    where index_definition.indexrelid = 'public.payments_verified_by_admin_id_idx'::regclass
  ),
  'btree',
  'payments verified-by administrator index uses B-tree'
);

select is(
  (
    select index_definition.indisunique
    from pg_index as index_definition
    where index_definition.indexrelid = 'public.payments_verified_by_admin_id_idx'::regclass
  ),
  false,
  'payments verified-by administrator index is non-unique'
);

select ok(
  (
    select index_definition.indisvalid
    from pg_index as index_definition
    where index_definition.indexrelid = 'public.payments_verified_by_admin_id_idx'::regclass
  ),
  'payments verified-by administrator index is valid'
);

select ok(
  (
    select index_definition.indisready
    from pg_index as index_definition
    where index_definition.indexrelid = 'public.payments_verified_by_admin_id_idx'::regclass
  ),
  'payments verified-by administrator index is ready'
);

select is(
  (
    select count(*)::integer
    from pg_index as index_definition
    join pg_class as index_class on index_class.oid = index_definition.indexrelid
    join pg_am as access_method on access_method.oid = index_class.relam
    where index_definition.indrelid = 'public.payments'::regclass
      and index_definition.indnkeyatts = 1
      and index_definition.indnatts = 1
      and index_definition.indkey[0] = (
        select attnum from pg_attribute
        where attrelid = 'public.payments'::regclass
          and attname = 'verified_by_admin_id'
      )
      and access_method.amname = 'btree'
      and not index_definition.indisunique
      and index_definition.indisvalid
      and index_definition.indisready
      and index_definition.indpred is null
      and index_definition.indexprs is null
  ),
  1,
  'payments has exactly one structurally equivalent verified-by administrator index'
);

select is(
  (
    select count(*)::integer
    from pg_constraint as foreign_key
    where foreign_key.conname = 'payments_verified_by_admin_id_fkey'
      and foreign_key.conrelid = 'public.payments'::regclass
      and foreign_key.contype = 'f'
  ),
  1,
  'payments verified-by administrator foreign key remains present'
);

select is(
  (
    select count(*)::integer
    from pg_constraint as foreign_key
    cross join lateral unnest(foreign_key.conkey) with ordinality as local_key(attnum, position)
    join pg_attribute as local_attribute
      on local_attribute.attrelid = foreign_key.conrelid
      and local_attribute.attnum = local_key.attnum
    join pg_attribute as referenced_attribute
      on referenced_attribute.attrelid = foreign_key.confrelid
      and referenced_attribute.attnum = foreign_key.confkey[local_key.position::integer]
    where foreign_key.conname = 'payments_verified_by_admin_id_fkey'
      and foreign_key.conrelid = 'public.payments'::regclass
      and foreign_key.confrelid = 'public.admins'::regclass
      and local_attribute.attname = 'verified_by_admin_id'
      and referenced_attribute.attname = 'id'
  ),
  1,
  'payments verified-by administrator foreign key target remains admins(id)'
);

select is(
  (
    select foreign_key.confdeltype
    from pg_constraint as foreign_key
    where foreign_key.conname = 'payments_verified_by_admin_id_fkey'
      and foreign_key.conrelid = 'public.payments'::regclass
  ),
  'r'::"char",
  'payments verified-by administrator foreign key keeps RESTRICT deletion behavior'
);

select is(
  (
    select count(*)::integer
    from pg_class as index_class
    join pg_namespace as index_namespace on index_namespace.oid = index_class.relnamespace
    where index_namespace.nspname = 'public'
      and index_class.relname = 'site_settings_updated_by_idx'
  ),
  1,
  'site settings updated-by index exists with the approved name'
);

select is(
  (
    select index_definition.indrelid
    from pg_index as index_definition
    join pg_class as index_class on index_class.oid = index_definition.indexrelid
    join pg_namespace as index_namespace on index_namespace.oid = index_class.relnamespace
    where index_namespace.nspname = 'public'
      and index_class.relname = 'site_settings_updated_by_idx'
  ),
  'public.site_settings'::regclass,
  'site settings updated-by index belongs to site settings'
);

select ok(
  (
    select index_definition.indnkeyatts = 1 and index_definition.indnatts = 1
    from pg_index as index_definition
    where index_definition.indexrelid = 'public.site_settings_updated_by_idx'::regclass
  ),
  'site settings updated-by index has one key column and no included columns'
);

select is(
  (
    select attribute_definition.attname
    from pg_index as index_definition
    cross join lateral unnest(index_definition.indkey) with ordinality as index_key(attnum, position)
    join pg_attribute as attribute_definition
      on attribute_definition.attrelid = index_definition.indrelid
      and attribute_definition.attnum = index_key.attnum
    where index_definition.indexrelid = 'public.site_settings_updated_by_idx'::regclass
      and index_key.position = 1
  ),
  'updated_by',
  'site settings updated-by index keys updated_by'
);

select is(
  (
    select access_method.amname
    from pg_index as index_definition
    join pg_class as index_class on index_class.oid = index_definition.indexrelid
    join pg_am as access_method on access_method.oid = index_class.relam
    where index_definition.indexrelid = 'public.site_settings_updated_by_idx'::regclass
  ),
  'btree',
  'site settings updated-by index uses B-tree'
);

select is(
  (
    select index_definition.indisunique
    from pg_index as index_definition
    where index_definition.indexrelid = 'public.site_settings_updated_by_idx'::regclass
  ),
  false,
  'site settings updated-by index is non-unique'
);

select ok(
  (
    select index_definition.indisvalid
    from pg_index as index_definition
    where index_definition.indexrelid = 'public.site_settings_updated_by_idx'::regclass
  ),
  'site settings updated-by index is valid'
);

select ok(
  (
    select index_definition.indisready
    from pg_index as index_definition
    where index_definition.indexrelid = 'public.site_settings_updated_by_idx'::regclass
  ),
  'site settings updated-by index is ready'
);

select is(
  (
    select count(*)::integer
    from pg_index as index_definition
    join pg_class as index_class on index_class.oid = index_definition.indexrelid
    join pg_am as access_method on access_method.oid = index_class.relam
    where index_definition.indrelid = 'public.site_settings'::regclass
      and index_definition.indnkeyatts = 1
      and index_definition.indnatts = 1
      and index_definition.indkey[0] = (
        select attnum from pg_attribute
        where attrelid = 'public.site_settings'::regclass
          and attname = 'updated_by'
      )
      and access_method.amname = 'btree'
      and not index_definition.indisunique
      and index_definition.indisvalid
      and index_definition.indisready
      and index_definition.indpred is null
      and index_definition.indexprs is null
  ),
  1,
  'site settings has exactly one structurally equivalent updated-by index'
);

select is(
  (
    select count(*)::integer
    from pg_constraint as foreign_key
    where foreign_key.conname = 'site_settings_updated_by_fkey'
      and foreign_key.conrelid = 'public.site_settings'::regclass
      and foreign_key.contype = 'f'
  ),
  1,
  'site settings updated-by foreign key remains present'
);

select is(
  (
    select count(*)::integer
    from pg_constraint as foreign_key
    cross join lateral unnest(foreign_key.conkey) with ordinality as local_key(attnum, position)
    join pg_attribute as local_attribute
      on local_attribute.attrelid = foreign_key.conrelid
      and local_attribute.attnum = local_key.attnum
    join pg_attribute as referenced_attribute
      on referenced_attribute.attrelid = foreign_key.confrelid
      and referenced_attribute.attnum = foreign_key.confkey[local_key.position::integer]
    where foreign_key.conname = 'site_settings_updated_by_fkey'
      and foreign_key.conrelid = 'public.site_settings'::regclass
      and foreign_key.confrelid = 'public.admins'::regclass
      and local_attribute.attname = 'updated_by'
      and referenced_attribute.attname = 'auth_user_id'
  ),
  1,
  'site settings updated-by foreign key target remains admins(auth_user_id)'
);

select is(
  (
    select foreign_key.confdeltype
    from pg_constraint as foreign_key
    where foreign_key.conname = 'site_settings_updated_by_fkey'
      and foreign_key.conrelid = 'public.site_settings'::regclass
  ),
  'n'::"char",
  'site settings updated-by foreign key keeps SET NULL deletion behavior'
);

select * from finish();

rollback;
