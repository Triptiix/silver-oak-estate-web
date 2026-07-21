import "server-only";

export const HOLD_COOKIE_NAME = "soe_booking_hold";
export const HOLD_COOKIE_PATH = "/api";

export function holdCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: isProduction,
    path: HOLD_COOKIE_PATH,
  };
}
