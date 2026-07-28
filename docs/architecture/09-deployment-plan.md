# Deployment Plan

## Deployment Safety

Supabase GitHub `Deploy to production` automatically applies pending
`supabase/migrations` files when the production Git branch changes. That
setting caused the verified canonical launch-data application after PR #29
merged on 28 July 2026; it is now disabled for Silver Oak Estate.

When the setting is enabled, merging a migration PR is the production
application authorization and all target, backup, role, dry-run and approval
gates must be complete before merge. The preferred controlled workflow keeps
the setting disabled and requires explicit manual application after merge.

**Strict Deployment Procedure:**
1. **CI Pipeline:** Run typecheck, linting, and automated tests on PRs.
2. **Migration Validation:** Verify SQL scripts against staging schemas.
3. **Explicit Production Approval:** Require manual intervention for production rollout.
4. **Backup/Recovery Confirmation:** Supabase point-in-time recovery confirmed.
5. **Apply Forward Migration:** Database structure updated via Supabase CLI (Expand/Contract migration strategy preferred; do not depend primarily on down migrations).
6. **Deploy Compatible Application:** Vercel deploys the Next.js frontend and API.
7. **Smoke Tests:** Automated endpoints pinged.
8. **Rollback:** Revert Vercel deployment and apply corrective migration if failure occurs.

## Environments
- **Local:** Developer machines.
- **Preview:** Vercel preview environments per PR (using a dedicated Supabase Staging environment).
- **Production:** Vercel Production paired with Supabase Production.
- **Razorpay Modes:** Test credentials for Local/Preview; Live credentials for Production.
- **Production Domain:** `https://silveroakestate.online`.
- **Platform Attestation:** Keep Vercel system environment variables enabled in
  Preview and Production. The application uses Vercel-provided `VERCEL=1` only
  to decide whether forwarding headers can supply a validated client address;
  local and non-Vercel runtimes ignore those headers.
