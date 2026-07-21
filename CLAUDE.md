# Claude Code Instructions — Silver Oak Estate

Read AGENTS.md and all referenced architecture documents before making
changes.

## Working method

1. Inspect the repository.
2. Present a concise implementation plan.
3. Identify contradictions or missing prerequisites.
4. Implement only the requested phase.
5. Run migrations against local or staging Supabase only.
6. Run database and application tests.
7. Review the complete diff.
8. Stop and provide a structured report.

## High-risk rules

- Do not deploy to production.
- Do not use production credentials.
- Do not create hardcoded administrator accounts.
- Do not create a public registration route.
- Do not weaken RLS to make tests pass.
- Do not rely only on application code to prevent double bookings.
- Do not use floating-point values for money.
- Do not let expired active holds remain indefinitely.
- Do not expose full site_settings to anonymous clients.
- Do not implement booking checkout or Razorpay in this phase.
- Do not silently change confirmed business rules.
- Do not rewrite Git history.

## Migration rules

- Use gen_random_uuid() with pgcrypto.
- Enable btree_gist for the inventory exclusion constraint.
- Use timestamptz for instants.
- Use date or time only when the value represents a business calendar date
  or local wall-clock time.
- Apply constraints at the database level.
- Lock SECURITY DEFINER function search paths.
- Revoke unnecessary public function execution.
- Verify migrations from a completely clean database.
