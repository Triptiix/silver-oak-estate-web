# Phase 6B.3 Foreign-Key Indexes

## Purpose

Migration `20260728170000_add_foreign_key_indexes.sql` adds only two ordinary,
non-unique B-tree indexes: `public.payments.verified_by_admin_id` and
`public.site_settings.updated_by`. It changes no rows, foreign keys,
permissions, RLS, functions or business behavior.

## Target

- Project: Silver Oak Estate
- Project ref: `tcjijcqdulszckbbkbcz`
- Region: `ap-south-1`
- Environment: production target in pre-launch mode

## Deployment control

Supabase GitHub Deploy to production: **disabled**.

It must remain disabled throughout review, merge and manual deployment. The
repository-pinned CLI is `npx --no-install supabase` (2.109.1); do not install
or upgrade it during the change.

## Backup and approval gates

Managed scheduled backups: unavailable on the current Free plan.

Before hosted application, the named operator must inspect:

```bash
npx --no-install supabase db dump --help
```

Then record timestamped secure logical-backup evidence covering hosted schema
and data, or another explicitly approved restore procedure. Do not create that
backup during repository implementation.

Before applying, record the exact merged commit, named mutation approver,
migration operator, recovery owner and post-migration verification owner; clean
CI; clean migration history; pre-migration row counts; confirmation that both
indexes are absent; and explicit application authorization.

Run the exact-commit preflight:

```bash
npx --no-install supabase migration list --linked
npx --no-install supabase db push --linked --dry-run
```

Proceed only when the dry run lists exactly
`20260728170000_add_foreign_key_indexes.sql` and no other pending migration.

## Application

The named operator may run the following command only after the gates above are
recorded and explicit hosted-application authorization is granted:

```bash
npx --no-install supabase db push --linked
```

## Post-application verification

Do not treat application as complete until read-only verification confirms:

1. The migration appears once in hosted migration history.
2. Both exact indexes exist, are valid and ready, are non-unique B-tree
   indexes, and each has exactly its approved single key column.
3. No duplicate equivalent index exists and both foreign-key definitions and
   delete behavior are unchanged.
4. Property, pricing, customer, booking, payment, reservation, administrator
   and notification row counts match the pre-application record.
5. `/api/availability` still resolves canonical availability, `/book` remains
   assisted-only, and online booking remains disabled.
6. The hosted Supabase performance advisor no longer reports these two
   unindexed-foreign-key findings.

## Correction policy

Because indexes contain no business data, a separately reviewed forward
migration may drop an incorrect new index. Do not edit migration history, use
ad hoc hosted DDL, or alter or drop the underlying foreign keys.
