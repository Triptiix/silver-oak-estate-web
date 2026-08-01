# Phase 3: Booking Experience

This document details the architecture, design decisions, and implementation details for the public booking experience (Phase 3) of Silver Oak Estate.

## Route Flow

The booking flow uses a separate-page architecture rather than a unified single page.
1. **`/availability`**: The primary entry point for guests to view the property's calendar. Uses server-side data fetching coupled with client-side interactive month navigation.
2. **`/book?date=YYYY-MM-DD`**: The booking form page. The selected date is passed via the query string. The page revalidates the date's availability before allowing the user to proceed.

This structure allows direct linking from advertisements, simpler analytics, and cleaner separation of concerns.

## Component Structure

- `AvailabilityCalendar`: Displays the month grid, handles navigation, and highlights available vs. booked dates.
- `BookingExperience`: The main orchestrator for the `/book` page. Manages the transition between the `BookingForm` and `HoldSummary`.
- `BookingForm`: Captures guest details, handles Turnstile verification, and initiates the temporary hold via `POST /api/bookings/hold`.
- `HoldSummary`: Displays the active hold details, including a countdown timer and a placeholder informational text regarding the pending payment integration.
- `HoldCountdown`: A dedicated client component to manage the visual countdown ticker and handle expiration logic gracefully.
- `ReleaseHoldDialog`: A modal (using native HTML `<dialog>`) to confirm if the user wants to release their hold and select a different date.

## Request-ID Lifecycle

To safely handle network failures without generating orphaned records in the database (Idempotency):
- `BookingForm` generates a UUID client-side and stores it in a React `useRef`.
- The UUID is lazily initialised to ensure it is stable across renders.
- The UUID is **reused** if the submission fails due to network errors, server errors, or Turnstile failures.
- The UUID is **replaced** (regenerated) only if the server responds with an `IDEMPOTENCY_CONFLICT` (meaning the UUID was already used for a different booking attempt) or if the user changes the requested check-in date.

## Date Revalidation

The `/book` page uses `fetchAvailability` to perform a pre-check of the availability for the specifically requested date. If the date has been booked by someone else since the user left the `/availability` page, the UI degrades gracefully, informing the user that the date is no longer available and providing a button to return to the calendar. The database and the hold API remain the authoritative source of truth.

## Turnstile Lifecycle

Cloudflare Turnstile is integrated directly into the `BookingForm` for bot protection.
- The widget renders implicitly.
- The `onVerify` callback stores the opaque token in state.
- The form cannot be submitted until a valid token is received.
- If a hold request fails, the Turnstile widget is explicitly reset via `turnstile.reset()` so a fresh token can be generated for the next attempt.

## Safe Session Summary

Once a hold is successfully created, the server responds with a safe summary of the hold (booking reference, expiration time, and amounts).
- This summary is stored in `sessionStorage` purely as an untrusted display convenience.
- When the `/book` page is reloaded, the `BookingExperience` component immediately restores this safe summary.
- The page does *not* need to fetch sensitive user data from the database. It relies on the local `sessionStorage` summary for display, while the secure HttpOnly cookie maintains the actual authorisation and signed hold token. The database remains authoritative for the hold state.

## Countdown and Expiry

The `useHoldCountdown` hook calculates the remaining time.
- It ticks every second.
- When the countdown reaches `0`, the `HoldExperience` transitions to an "Expired" state locally.
- The transition does not force a hard redirect, allowing the user to read the expiration message.
- `sessionStorage` is cleared automatically upon expiration.
- The database cron job (or next request to the API) handles the actual server-side release of the expired hold.

## Release and Change-Date Flows

If a user holds a date but decides they want a different one, they can click "Release Hold & Change Date".
- This triggers a `POST` request to `/api/bookings/release` which relies on the secure `HttpOnly` cookie for authorization.
- If successful, the local session is cleared, and the user is redirected to `/availability`.
- If the network fails, the hold screen remains visible, and an inline error is displayed.
- The native `<dialog>` element is used for the confirmation modal, carefully mocked in Vitest to ensure robust automated testing without cascading render loops.

## Error-Code Mappings

The backend returns standardized error codes representing `PublicBookingErrorCode` values. The `BookingError` component maps these codes to user-friendly messages:
- `DATE_UNAVAILABLE`: "This date is no longer available."
- `BOT_VERIFICATION_FAILED`: "Security verification failed. Please try again."
- `IDEMPOTENCY_CONFLICT`: "A booking request is already in progress. Please wait a moment."
- `SERVER_ERROR`: "An unexpected error occurred. Please try again."
- Default: "An unknown error occurred."

## Privacy Boundaries

- `sessionStorage` stores only non-PII (Personally Identifiable Information) data: Booking Reference, amounts, and expiration time. No names, emails, or phone numbers are persisted in local storage.
- The `bookingToken` acts as a bearer token for the specific hold, allowing release without full user authentication.

## Automatic Payment Outcome Boundary

The later test-mode payment integration preserves a strict distinction between
financial receipt and booking confirmation. An eligible captured payment shows
`PAYMENT RECEIVED — AWAITING WRITTEN CONFIRMATION`, keeps the booking reference
visible, and explains that the advance payment was received and the dates remain
blocked while Silver Oak Estate reviews the booking. It must also state that the
booking is not yet confirmed and becomes confirmed only when Silver Oak Estate
issues written confirmation. Recovery outcomes state that payment was received
but manual review is required. An uncertain verification result warns the
customer not to retry payment blindly and does not claim written confirmation.

## Responsive and Accessibility Decisions

- **Responsive**: The calendar, booking form, and summary screens are verified against viewports from 320px to 1440px. No horizontal overflow exists. Sticky elements do not cover form fields.
- **Accessibility**: 
  - Native `<dialog>` is used for robust focus trapping and `Escape` key support.
  - Buttons have clear visible focus rings (`focus:ring-2 focus:ring-slate-900`).
  - Inputs use proper `<label>` associations.
  - Reduced motion is respected via Tailwind's transition utilities.
  - Color is not used as the sole indicator of state (e.g., icons and text explain errors).

## Local Testing

- **Database**: Run `npm run db:start` and `npm run db:reset` to provision the local Supabase instance.
- **Next.js**: Use `npm run dev` with `.env.local` configured to point to `http://127.0.0.1:54321`.
- **Turnstile**: The `.env.local` uses the official Cloudflare dummy keys (`1x00000000000000000000AA`) which always pass verification in local environments.

## Known Limitations

- **Phase boundary**: Phase 3 itself did not include Razorpay checkout; the later test-mode integration follows the automatic payment outcome boundary above.
- A "hold" is strictly a temporary reservation, not a confirmed booking.
