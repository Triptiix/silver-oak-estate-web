import { NextRequest, NextResponse } from "next/server";
import { envServer } from "@/lib/env/server";
import { bookingError } from "@/lib/booking/api-errors";
import { releaseHold } from "@/lib/booking/database";
import { verifyHoldToken } from "@/lib/booking/hold-token";

function clearCookie(response: NextResponse) {
  response.cookies.set("soe_booking_hold", "", { httpOnly: true, sameSite: "lax", secure: envServer.APP_ENV === "production", path: "/api/bookings", maxAge: 0 });
  return response;
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("soe_booking_hold")?.value;
  if (!token) return clearCookie(bookingError(400, "INVALID_HOLD", "No valid hold was found."));
  try {
    const payload = verifyHoldToken(token, envServer.BOOKING_TOKEN_SECRET);
    await releaseHold(payload.bookingId, payload.nonce);
    return clearCookie(NextResponse.json({ released: true }, { headers: { "Cache-Control": "no-store, max-age=0" } }));
  } catch {
    return clearCookie(bookingError(400, "INVALID_HOLD", "No valid hold was found."));
  }
}
