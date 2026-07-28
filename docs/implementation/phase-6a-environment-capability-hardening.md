# Phase 6A Environment Capability Hardening

## Outcome

The public marketing website can remain available while online booking, payment and email providers are incomplete. Booking routes fail closed and direct guests to assisted booking instead of rendering a partially configured flow.

## Capability contract

Online booking is available only when:

1. `ONLINE_BOOKING_ENABLED=true`.
2. Core Supabase browser values are present.
3. The Supabase service-role key is present.
4. Cloudflare Turnstile public and secret keys are present.
5. The booking-token secret is present.
6. Razorpay public, secret and webhook values are present.

The gate treats missing and explicit placeholder values as unavailable. It returns variable names only and never returns environment values.

## Public fallback

When the capability is disabled or incomplete:

- `/availability` does not mount the availability client or call the availability API.
- `/book` does not mount the booking form, Turnstile or payment flow.
- Both routes show the verified primary call, WhatsApp and email options.
- The fallback states that no online payment is being collected through the page.

## Kill-switch policy

`ONLINE_BOOKING_ENABLED` defaults to `false`. It must remain false in hosted environments until:

- hosted migrations are applied and verified;
- the first administrator is provisioned;
- Turnstile is configured for the intended domain;
- Razorpay test order, verification and webhook flows pass;
- hold expiry and release are verified;
- the complete staging rehearsal is approved.

## Readiness profiles

- `core`: marketing website and core Supabase browser configuration
- `booking-test`: complete staging booking and Razorpay test configuration
- `email`: transactional email configuration only
- `production-live`: complete live launch configuration

Backward-compatible aliases remain available for `--target=staging` and `--target=production`.

## Safety boundary

This phase changes repository behavior only. It does not modify Vercel environment variables, hosted Supabase, Razorpay, Turnstile, email providers, DNS, the custom domain or customer data.
