import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

type HoldTokenPayload = { v: 1; bookingId: string; nonce: string; expiresAt: string };

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signHoldToken(payload: HoldTokenPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, secret)}`;
}

export function verifyHoldToken(token: string, secret: string, now = new Date()): HoldTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("invalid_hold_token");
  const expected = Buffer.from(signature(parts[0], secret));
  const actual = Buffer.from(parts[1]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("invalid_hold_token");
  let payload: unknown;
  try { payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")); }
  catch { throw new Error("invalid_hold_token"); }
  if (!payload || typeof payload !== "object") throw new Error("invalid_hold_token");
  const candidate = payload as Record<string, unknown>;
  if (candidate.v !== 1 || typeof candidate.bookingId !== "string" || typeof candidate.nonce !== "string" || typeof candidate.expiresAt !== "string") {
    throw new Error(candidate.v === 1 ? "invalid_hold_token" : "unsupported_hold_token");
  }
  if (new Date(candidate.expiresAt).valueOf() <= now.valueOf()) throw new Error("expired_hold_token");
  return candidate as HoldTokenPayload;
}

export function assertHoldIdentity(payload: HoldTokenPayload, bookingId: string, nonce: string) {
  if (payload.bookingId !== bookingId || payload.nonce !== nonce) throw new Error("invalid_hold_token");
}
