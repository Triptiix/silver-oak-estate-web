# Domain and DNS plan — silveroakestate.online

**Plan only. No DNS or domain change is executed in Phase 7D.3A.** Execution is
Phase 7D.3B under separate authorization. All commands below are labelled and
must not be run in this phase.

Last updated: 2026-07-30 · Phase 7D.3A.2 (email DNS re-verified)

## Current observed state (read-only, re-verified 2026-07-30, Phase 7D.3A.2)

| Check | Result |
| --- | --- |
| `NS` | `apollo.dns-parking.com.`, `athena.dns-parking.com.` (Hostinger) |
| `A` apex | **none** — the domain is not yet pointed at Vercel |
| `AAAA` apex | none |
| `CNAME www` | none |
| `MX` | **`5 mx1.hostinger.com.`, `10 mx2.hostinger.com.`** — email is configured |
| `TXT` apex (SPF) | **`v=spf1 include:_spf.mail.hostinger.com ~all`** |
| `TXT _dmarc` | **`v=DMARC1; p=none`** (monitoring mode only) |
| DKIM | **Not verified** — the provider selector was not supplied, and selectors must not be guessed |

Verified with `dig` against 1.1.1.1, 8.8.8.8 and 9.9.9.9 and cross-checked with
Node's `dns/promises`. A first local query returned an empty TXT set from a stale
cache; the authoritative multi-resolver result above is the correct one.

## Email status

The owner reports that domain email was configured manually, and DNS now supports
that: **MX, SPF and DMARC records are present.** This is a material change from
Phase 7D.3A, when the domain had no mail records at all.

Outstanding for a complete verification (manual, Phase 7D.3B):

1. **DKIM** — obtain the selector from the Hostinger mail panel and confirm the
   record resolves. Do not guess selectors.
2. **Real send/receive test** — send from an unrelated external mailbox to
   `contact@silveroakestate.online`, confirm receipt, reply from that address,
   confirm external receipt, then inspect the received headers for
   `spf=pass`, `dkim=pass` and the DMARC result.
3. Consider tightening DMARC from `p=none` to `p=quarantine` or `p=reject` only
   after DKIM and SPF are confirmed passing, to avoid rejecting legitimate mail.

**No mailbox access was available in this phase, so real send/receive delivery is
NOT verified and is not claimed.**

### Protecting mail when the website DNS changes

The `MX`, SPF `TXT` and `_dmarc` `TXT` records above **must be left untouched**
when adding the website `A`/`CNAME` records. Adding website records does not
affect mail provided the existing mail records are preserved.

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
