# Assisted production launch runbook

Ordered, reversible steps for **Phase 7D.3B** (separate authorization). Every
mutation command is **labelled and must not be executed in Phase 7D.3A**. No
secret values appear here. "Online booking stays disabled" is a standing
invariant across every step.

Last updated: 2026-07-30 · Phase 7D.3A

Legend: **RO** = read-only check · **MUT** = mutation (7D.3B only).

---

### 1. Approve final legal pack
- **Precondition:** `docs/launch/legal-readiness-register.md` blockers for assisted launch resolved.
- **RO:** review approved privacy/terms source; confirm approver and date.
- **MUT (code, not infra):** replace placeholder pages, remove `noindex`, re-add to `sitemap.ts`, add effective/last-updated dates.
- **Expected:** `/privacy` and `/terms` render approved content; `robots` no longer `noindex`.
- **Verify:** metadata + sitemap tests updated and passing.
- **Rollback:** revert the commit; pages return to review-draft placeholders.
- **Owner:** Owner + counsel. **Evidence:** signed legal pack reference.

### 2. Supply approved logo source
- **Precondition:** owner provides an approved mark — SVG preferred, or transparent PNG ≥1024×1024, with approved colour and (when available) monochrome versions.
- **RO:** confirm the file is the approved Silver Oak Estate mark, not the scaffold placeholder.
- **MUT (code):** derive favicon, apple-icon, 192 and 512 icons deterministically; add dimension/reference tests.
- **Expected:** icons show the approved mark with safe padding.
- **Verify:** icon tests pass; visual check at 100%.
- **Rollback:** revert to previous icons.
- **Owner:** Owner. **Evidence:** approval message + source file.

### 3. Merge code readiness
- **RO:** PR #? (this phase) merged; CI green at exact head.
- **MUT:** merge via review, not force.
- **Verify:** `origin/main` at the merged SHA.
- **Rollback:** revert merge commit.

### 4. Verify production environment variable **names**
- **RO:** `vercel link --project silver-oak-estate-web` (in a scratch checkout) then `vercel env ls production` — inspect **names only**.
- **Expected:** the six assisted-required names present; no live payment names required.
- **Verify:** cross-check against `docs/launch/production-environment-matrix.md`.
- **Owner:** Ops.

### 5. Configure canonical production variables
- **MUT (Vercel dashboard or CLI, 7D.3B):** set `NEXT_PUBLIC_SITE_URL=https://silveroakestate.online`, `APP_ENV=production`, `APP_TIMEZONE=Asia/Kolkata`, `ONLINE_BOOKING_ENABLED=false`, and the two public Supabase values. **Never paste secrets into chat or docs.**
- **Verify:** `vercel env ls production` shows the names.
- **Rollback:** restore prior values (record them before change).
- **Owner:** Ops.

### 6. Run assisted-production preflight
- **RO/MUT (build step):** `npm run preflight:assisted` inside the Vercel/production environment.
- **Expected:** `Status: PASS` (monitoring DSN warning acceptable).
- **Verify:** exit code 0.
- **Rollback:** n/a (read-only gate).

### 7. Attach apex domain
- **MUT (7D.3B):** `vercel domains add silveroakestate.online` and add to the project. Follow `docs/launch/domain-dns-plan.md` Option A.
- **RO:** `dig +short A silveroakestate.online`.
- **Rollback:** remove the domain; DNS returns to parked.

### 8. Attach `www`
- **MUT:** add `www.silveroakestate.online` to the project.
- **Verify:** `dig +short CNAME www.silveroakestate.online`.

### 9. Configure permanent `www` → apex redirect
- **MUT:** set 308 redirect in Vercel.
- **Verify:** `curl -sI https://www.silveroakestate.online` returns 308 to apex.

### 10. Verify DNS without disturbing MX/TXT
- **RO:** re-run the full `dig` set; confirm any mail records are unchanged.
- **Expected:** apex/www resolve to Vercel; mail records intact.

### 11. Verify HTTPS
- **RO:** `curl -sI https://silveroakestate.online | grep -i strict-transport-security`.

### 12. Verify canonical URLs
- **RO:** each public page emits `rel="canonical"` on the apex.

### 13. Verify sitemap and robots
- **RO:** `/sitemap.xml` excludes `/admin`, `/api`, `/book`, and (until legal approval) `/privacy`, `/terms`; `/robots.txt` disallows `/api/` and `/admin/`.

### 14. Verify social image
- **RO:** `/images/brand/silver-oak-estate-og.webp` returns 200; OG/Twitter reference it.

### 15. Verify structured data
- **RO:** homepage JSON-LD parses; `LodgingBusiness`+`EventVenue`; no `ReserveAction`.

### 16. Verify availability calendar
- **RO:** `/availability` loads; the calendar reads only public Supabase config; selecting a date creates **no** hold, reservation or payment order.

### 17. Verify WhatsApp, phone and email pathways
- **RO:** `tel:`, `wa.me` and `mailto:` links resolve to the verified numbers/address.

### 18. Create the first administrator
- **MUT (approved secure process, 7D.3B):** provision the first admin outside public self-service. **Do not create an administrator in 7D.3A.**
- **Rollback:** disable the account.

### 19. Run authenticated administrator QA
- **RO:** verify protected routes, masking, recovery diagnosis-only, notification "pending = queued".

### 20. Verify production logs
- **RO:** `vercel logs` — confirm no secret or PII leakage, no 5xx storms.

### 21. Configure error monitoring (when approved)
- **MUT:** set `ERROR_MONITORING_DSN`.

### 22. Configure analytics (only after approval + privacy disclosure)
- **MUT:** deferred until an approved privacy policy discloses it.

### 23. Configure Search Console (after canonical domain resolves)
- **MUT:** add the property and verify.

### 24. Submit sitemap
- **MUT:** submit `/sitemap.xml` in Search Console.

### 25. Run post-launch smoke tests
- **RO:** all public routes 200; `/book` still `noindex` and unlinked; admin anon redirects to `/admin/login`.

### 26. Maintain online booking disabled
- **RO:** `ONLINE_BOOKING_ENABLED=false`; `/book` unlinked and `noindex`; no `ReserveAction`. Standing invariant.

### 27. Record rollback steps
- Keep prior env values, prior DNS records and the pre-launch commit SHA. Rollback = remove domains, restore DNS to parked, revert to the prior deployment. Email records are managed independently and are not part of website rollback.

---

## Brand blocker (must clear before or during step 2)

No approved Silver Oak Estate logo exists in the repository — the current mark is
a scaffold placeholder (circle + triangle). Required owner input:
- **SVG preferred**, or transparent PNG **≥ 1024×1024**.
- Approved **colour** version; approved **monochrome** version when available.
Do not design or AI-generate a substitute.
