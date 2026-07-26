import { NextRequest, NextResponse } from "next/server";
import { envClient } from "@/lib/env/client";
import { envServer } from "@/lib/env/server";
import { bookingError } from "@/lib/booking/api-errors";
import { releaseHold } from "@/lib/booking/database";
import { verifyHoldToken } from "@/lib/booking/hold-token";
import { HOLD_COOKIE_NAME, holdCookieOptions } from "@/lib/booking/hold-cookie";
import { hasTrustedMutationOrigin } from "@/lib/security/mutation-origin";

function clearCookie(response: NextResponse) {
  response.cookies.set(HOLD_COOKIE_NAME, "", {
    ...holdCookieOptions(envServer.APP_ENV === "production"),
    maxAge: 0,
  });
  return response;
}

export async function POST(request: NextRequest) {
  if (!hasTrustedMutationOrigin(request, envClient.NEXT_PUBLIC_SITE_URL)) {
    return bookingError(403, "ORIGIN_REJECTED", "Request origin was rejected.");
  }

  const token = request.cookies.get(HOLD_COOKIE_NAME)?.value;
  if (!token) {
    return clearCookie(NextResponse.json(
      { released: true },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    ));
  }
  try {
    const payload = verifyHoldToken(token, envServer.BOOKING_TOKEN_SECRET);
    await releaseHold(payload.bookingId, payload.nonce);
    return clearCookie(NextResponse.json({ released: true }, { headers: { "Cache-Control": "no-store, max-age=0" } }));
  } catch {
    return clearCookie(bookingError(400, "INVALID_HOLD", "No valid hold was found."));
  }
}
