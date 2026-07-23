// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assertHoldIdentity, signHoldToken, verifyHoldToken } from "@/lib/booking/hold-token";

const secret = "a-long-local-test-secret";
const payload = { v: 1 as const, bookingId: "booking-1", nonce: "nonce-1", expiresAt: "2030-01-01T00:00:00.000Z" };

describe("hold token", () => {
  it("accepts a valid signed token", () => expect(verifyHoldToken(signHoldToken(payload, secret), secret, new Date("2029-01-01"))).toEqual(payload));
  it("rejects a tampered payload", () => { const token = signHoldToken(payload, secret); expect(() => verifyHoldToken(`e30.${token.split(".")[1]}`, secret)).toThrow(); });
  it("rejects a tampered signature", () => { const token = signHoldToken(payload, secret); expect(() => verifyHoldToken(`${token}x`, secret)).toThrow(); });
  it("rejects the wrong secret", () => expect(() => verifyHoldToken(signHoldToken(payload, secret), "wrong-secret")).toThrow());
  it("rejects an expired token", () => expect(() => verifyHoldToken(signHoldToken(payload, secret), secret, new Date("2031-01-01"))).toThrow("expired_hold_token"));
  it("rejects an unsupported version", () => { const token = signHoldToken({ ...payload, v: 1 }, secret); const [body] = token.split("."); const bad = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), v: 2 })).toString("base64url"); expect(() => verifyHoldToken(`${bad}.${token.split(".")[1]}`, secret)).toThrow(); });
  it("rejects malformed input", () => expect(() => verifyHoldToken("not-a-token", secret)).toThrow());
  it("rejects the wrong booking", () => expect(() => assertHoldIdentity(payload, "other", payload.nonce)).toThrow());
  it("rejects the wrong nonce", () => expect(() => assertHoldIdentity(payload, payload.bookingId, "other")).toThrow());
});
