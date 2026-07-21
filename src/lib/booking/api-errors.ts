import { NextResponse } from "next/server";
import type { PublicBookingErrorCode } from "@/types/booking";

export function bookingError(status: number, code: PublicBookingErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export function mapDatabaseError(error: unknown) {
  const message = typeof error === "object" && error && "message" in error ? String(error.message) : "";
  if (message.includes("property_not_found")) return bookingError(404, "PROPERTY_NOT_FOUND", "Property not found.");
  if (message.includes("past_booking_date")) return bookingError(400, "INVALID_REQUEST", "The arrival date must not be in the past.");
  if (message.includes("date_unavailable")) return bookingError(409, "DATE_UNAVAILABLE", "That date is no longer available.");
  if (message.includes("idempotency")) return bookingError(409, "IDEMPOTENCY_CONFLICT", "This request cannot be reused.");
  if (message.includes("hold_abuse_limit")) return bookingError(429, "HOLD_LIMIT_REACHED", "Release or allow your existing hold to expire first.");
  return bookingError(500, "SERVER_ERROR", "The request could not be completed.");
}
