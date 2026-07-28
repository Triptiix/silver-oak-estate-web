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

## No-write application gate

This migration uses ordinary transaction-managed `CREATE INDEX` statements.
PostgreSQL permits reads while each index is built but temporarily blocks writes
to the indexed table.

### Operational maintenance preparation

Immediately before application, verify and record:

1. Online booking remains disabled.
2. No administrator is being provisioned or operating.
3. Payment providers, webhooks, payment-link processes and reconciliation
   workers remain disabled.
4. No cron, background deployment or manual process is expected to write
   `payments` or `site_settings`.
5. All known database consoles, SQL editors and direct maintenance sessions
   except the named migration operator are closed.
6. Row counts and non-null foreign-key counts are recorded.
7. The mutation approver confirms the maintenance window.

### Objective read-only session inspection

The named operator must collect this read-only session evidence immediately
before application:

```sql
select
  pid,
  usename,
  application_name,
  client_addr,
  state,
  wait_event_type,
  wait_event,
  xact_start,
  query_start,
  left(query, 500) as query
from pg_stat_activity
where datname = current_database()
  and pid <> pg_backend_pid()
  and backend_type = 'client backend'
  and (
    state <> 'idle'
    or xact_start is not null
  )
order by
  xact_start nulls last,
  query_start nulls last;
```

Every active or idle-in-transaction client session must be identified. Unknown
or potentially write-capable active sessions block application. Do not
terminate sessions automatically. This is supporting preflight evidence and
cannot prove that an idle connection will never submit a future write.

### Database-enforced bounded failure

The migration does not use top-level `LOCK TABLE` because Supabase CLI 2.109.1
does not provide the explicit transaction block required by that command.

Instead, ordinary `CREATE INDEX` acquires PostgreSQL's required write-blocking
table lock. The migration sets `lock_timeout` to four seconds, so a conflicting
writer causes bounded migration failure rather than indefinite waiting.

The CLI executes both index statements and the migration-history insert as one
implicitly transactional batch. If either index fails, the other index and the
history insertion roll back. The 30-second `statement_timeout` bounds each
index build; the reset statements prevent successful migration settings from
leaking into later work on the connection.

New database sessions may still connect. A write conflicting with an active
index build is blocked by PostgreSQL, while a pre-existing write that prevents
the required index lock causes the index statement to fail after the lock
timeout. A timeout or statement failure rolls back the whole migration batch.
Do not repair migration history after failure. Re-establish the full preflight
and authorization process before any retry.

## Application

The named operator may run the following command only after operational
maintenance preparation, session inspection, backup and named-role gates, and
the exact-commit dry run have passed; explicit hosted-application authorization
must also be granted. The bounded lock and statement timeouts are the final
fail-closed controls:

```bash
npx --no-install supabase db push --linked
```

If lock acquisition or an index build exceeds its bound, `db push` must fail
without applying the migration. Stop, record the error, re-establish the
maintenance window, repeat all preflight checks and obtain renewed application
authorization before retrying.

## Post-application verification

### Stage 1 — Blocking integrity verification

Keep the no-write maintenance window active only until all of these pass:

1. `db push` completed successfully.
2. The migration appears exactly once in hosted migration history.
3. Both exact indexes exist.
4. Both indexes are valid and ready.
5. Both are non-unique B-tree indexes.
6. Each has exactly its approved single key column.
7. No equivalent duplicate exists.
8. Both foreign-key definitions and delete actions remain unchanged.
9. Pre- and post-application row counts match.
10. No migration other than the explicitly approved migration was applied.

When all Stage 1 checks pass, record the completion timestamp, release the
maintenance/no-write window, and resume permitted writers when any are
eventually enabled. If any Stage 1 check fails, keep writers paused, do not
alter migration history, escalate to the recovery owner, and use only a
separately reviewed forward corrective migration.

### Stage 2 — Bounded follow-up verification

These checks must not keep writers paused after Stage 1 passes:

- `/api/availability` resolves the canonical property.
- `/book` remains assisted-only.
- Online booking remains disabled.
- The Supabase performance advisor no longer reports the two missing-index
  findings.

Runtime endpoint verification must complete immediately after Stage 1, with a
maximum five-minute verification window. Rerun and record performance-advisor
verification within 30 minutes after application.

If runtime verification fails or times out, record the failure, block further
launch-readiness progression, and investigate without applying additional DDL.
Do not keep the database in an indefinite no-write state solely because the
endpoint check is delayed.

If the performance advisor is unavailable, stale or still reports either
warning after 30 minutes, capture its output and timestamp, confirm the index
catalog state again, and escalate for focused investigation. Do not apply
another index or change migration history, and do not keep writers paused
solely for delayed advisor refresh.

Do not declare Phase 6B.3 fully complete until Stage 2 is recorded; this is
separate from writer resumption.

## Correction policy

Because indexes contain no business data, a separately reviewed forward
migration may drop an incorrect new index. Do not edit migration history, use
ad hoc hosted DDL, or alter or drop the underlying foreign keys.
