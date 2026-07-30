# Domain and DNS plan — silveroakestate.online

**Plan only. No DNS or domain change is executed in Phase 7D.3A.** Execution is
Phase 7D.3B under separate authorization. All commands below are labelled and
must not be run in this phase.

Last updated: 2026-07-30 · Phase 7D.3A

## Current observed state (read-only, 2026-07-30)

| Check | Result |
| --- | --- |
| `NS silveroakestate.online` | `athena.dns-parking.com.`, `apollo.dns-parking.com.` (parked, Hostinger) |
| `A silveroakestate.online` | none |
| `AAAA silveroakestate.online` | none |
| `CNAME www` | none |
| `A www` | none |
| `MX silveroakestate.online` | none |
| `TXT silveroakestate.online` | none (no SPF) |
| `TXT _dmarc` | none (no DMARC) |
| `CAA` | none |

**Interpretation:** the domain is registered and parked. It resolves to nothing,
has **no email records**, and is **not attached to Vercel** (the Vercel account
holds unrelated domains only, and production currently serves on `*.vercel.app`).

## Email status and risk

**Email at `@silveroakestate.online` is currently UNCONFIGURED at the DNS layer.**
There are no `MX`, SPF `TXT`, DKIM or `DMARC` records, so this domain cannot
receive mail today and `contact@silveroakestate.online` is **not yet a working
inbound mailbox** unless it is hosted under a different domain/alias. This is a
**launch blocker for relying on email enquiries**: verify with the owner whether
mail is expected here.

- If email should work at this domain, the mail provider's `MX`, SPF `TXT` and
  DKIM records must be added first, and then **left untouched** by any website
  change.
- Until mail is configured, the assisted-enquiry pathways that are actually
  functional are **phone and WhatsApp** (the `tel:`/`wa.me` links); the site's
  `mailto:` link opens the visitor's own mail client and does not itself prove
  the estate can receive replies.

**Website-DNS risk to mail: none in either direction** — because there are no mail
records to overwrite, adding website `A`/`CNAME` records cannot break mail. Once
mail records exist, never overwrite them when changing website records.

## Target state

- Apex `https://silveroakestate.online` serves the site.
- `www.silveroakestate.online` **permanently redirects (308)** to the apex.
- HTTPS via Vercel-managed certificate.
- Existing (future) mail records preserved.

## Proposed record changes (Phase 7D.3B — DO NOT RUN NOW)

Two supported options; prefer **Option A** (keep Hostinger DNS, add records) so
nameservers and any future mail records stay with the current provider.

### Option A — keep current nameservers, add records at Hostinger

| Record | Host | Type | Value | Notes |
| --- | --- | --- | --- | --- |
| Apex | `@` | `A` | `76.76.21.21` | Vercel apex A record (confirm current value in Vercel dashboard at execution time) |
| www | `www` | `CNAME` | `cname.vercel-dns.com.` | Vercel-provided target |

Then in Vercel: add domain `silveroakestate.online`, add `www.silveroakestate.online`,
set `www` → apex permanent redirect.

### Option B — delegate nameservers to Vercel

Only if Option A is impractical. Requires moving **all** DNS (including future
mail records) to Vercel, which is riskier for email and is **not recommended**
while mail may be provider-hosted.

## Records that must remain untouched

- Any future `MX`, SPF `TXT`, DKIM `TXT`/`CNAME`, `DMARC` `TXT` for email.
- Domain registration and contact records.

## Sequence (no downtime)

1. Read-only: `dig +short A silveroakestate.online` and `vercel domains inspect …`.
2. Add apex `A` and `www` `CNAME` (Option A) — labelled command, executed only in 7D.3B.
3. Add both domains in Vercel and configure the `www` → apex 308 redirect.
4. Wait for propagation (TTL-dependent; use a low TTL such as 300s before cutover).
5. Verify HTTPS issues automatically.
6. Verify canonical URLs, sitemap, robots, social image and structured data resolve on the apex.
7. Confirm mail is unaffected (send/receive a test to `contact@`).

## TTL considerations

Lower TTL to ~300s before the change to speed rollback; restore a normal TTL
(e.g. 3600s) once stable.

## HTTPS verification

`curl -sI https://silveroakestate.online | grep -i strict-transport-security`
after Vercel issues the certificate. (Read-only; run in 7D.3B.)

## Rollback

- Remove the apex `A` / `www` `CNAME` records to return the domain to parked state.
- Remove the domains from the Vercel project.
- Because mail records are added independently, rollback of website records does
  not affect email.

## Propagation verification

`dig +short A silveroakestate.online @1.1.1.1` and `@8.8.8.8` should both return
the Vercel apex address before announcing the domain publicly.
