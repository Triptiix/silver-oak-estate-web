# Deployment Plan

## Deployment Safety
We will not silently apply production database migrations during every automated main deployment.

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
