import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { envClient } from "@/lib/env/client";
import { envServer } from "@/lib/env/server";
import { bookingError, mapDatabaseError } from "@/lib/booking/api-errors";
import { createHold } from "@/lib/booking/database";
import { createRequestFingerprint, getTrustedClientAddress } from "@/lib/booking/fingerprint";
import { signHoldToken } from "@/lib/booking/hold-token";
import { HOLD_COOKIE_NAME, holdCookieOptions } from "@/lib/booking/hold-cookie";
import { holdRequestSchema, normalizePhone } from "@/lib/booking/schemas";
import { verifyTurnstile } from "@/lib/booking/turnstile";
import { getOnlineBookingCapability } from "@/lib/capabilities/online-booking";
import { readBoundedJson } from "@/lib/security/bounded-json";
import { hasTrustedMutationOrigin } from "@/lib/security/mutation-origin";

const MAX_BOOKING_HOLD_JSON_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  if (!hasTrustedMutationOrigin(request, envClient.NEXT_PUBLIC_SITE_URL)) {
    return bookingError(403, "ORIGIN_REJECTED", "Request origin was rejected.");
  }
  if (!getOnlineBookingCapability().available) {
    return bookingError(
      503,
      "BOOKING_UNAVAILABLE",
      "Online booking is currently unavailable. Contact our team for assistance.",
    );
  }
  const body = await readBoundedJson(request, MAX_BOOKING_HOLD_JSON_BYTES);
  if (!body.ok) {
    if (body.reason === "too_large") {
      return bookingError(413, "REQUEST_TOO_LARGE", "The request body is too large.");
    }
    if (body.reason === "unsupported_media_type") {
      return bookingError(415, "UNSUPPORTED_MEDIA_TYPE", "Send the request as JSON.");
    }
    return bookingError(400, "INVALID_REQUEST", "Review the booking details and try again.");
  }
  const parsed = holdRequestSchema.safeParse(body.value);
  if (!parsed.success) return bookingError(400, "INVALID_REQUEST", "Review the booking details and try again.");
  let phone: string; let whatsapp: string | undefined;
  try { phone = normalizePhone(parsed.data.customerPhone); whatsapp = parsed.data.whatsapp ? normalizePhone(parsed.data.whatsapp) : undefined; }
  catch { return bookingError(400, "INVALID_REQUEST", "Enter a valid phone number."); }
  const address = getTrustedClientAddress(request);
  if (!await verifyTurnstile(parsed.data.turnstileToken, address, envServer.TURNSTILE_SECRET_KEY)) {
    return bookingError(403, "BOT_VERIFICATION_FAILED", "Bot verification failed.");
  }
  const nonce = randomUUID();
  const fingerprint = createRequestFingerprint(address, phone, envServer.BOOKING_TOKEN_SECRET);
  try {
    const result = await createHold({
      p_property_slug: parsed.data.propertySlug,
      p_check_in_date: parsed.data.checkInDate,
      p_customer_name: parsed.data.customerName,
      p_customer_email: parsed.data.customerEmail ?? null,
      p_customer_phone: phone,
      p_whatsapp: whatsapp ?? null,
      p_guest_count: parsed.data.guestCount,
      p_overnight_guest_count: parsed.data.overnightGuestCount ?? 0,
      p_special_requests: parsed.data.specialRequests ?? null,
      p_hold_request_id: parsed.data.requestId,
      p_hold_token_nonce: nonce,
      p_request_fingerprint_hash: fingerprint,
      p_fallback_hold_minutes: envServer.BOOKING_HOLD_MINUTES,
    });
    const token = signHoldToken({ v: 1, bookingId: result.bookingId, nonce: result.holdTokenNonce, expiresAt: result.holdExpiresAt }, envServer.BOOKING_TOKEN_SECRET);
    const { created, bookingId: _bookingId, holdTokenNonce: _nonce, ...publicResult } = result;
    void _bookingId; void _nonce;
    const response = NextResponse.json(publicResult, { status: created ? 201 : 200, headers: { "Cache-Control": "no-store, max-age=0" } });
    response.cookies.set(HOLD_COOKIE_NAME, token, {
      ...holdCookieOptions(envServer.APP_ENV === "production"),
      maxAge: Math.max(0, Math.floor((new Date(result.holdExpiresAt).valueOf() - Date.now()) / 1000)),
    });
    return response;
  } catch (error) { return mapDatabaseError(error); }
}
