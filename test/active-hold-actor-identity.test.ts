// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { ACTOR_COOKIE_NAME, getOrCreateActorIdentity } from "@/lib/booking/actor-cookie";
import { evaluateOnlineBookingCapability } from "@/lib/capabilities/online-booking";

const TEST_SECRET = "test-booking-secret-key-32-chars-long!";

describe("SOE-AUDIT-001 — Anonymous Active-Hold Identity Hardening", () => {
  describe("A. Actor Cookie & Crypto Helper Unit Contracts", () => {
    it("mints a valid, signed actor cookie when no cookie exists", () => {
      const identity = getOrCreateActorIdentity(undefined, TEST_SECRET);
      expect(identity.isNew).toBe(true);
      expect(identity.cookieValue).toMatch(/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/);
      expect(identity.actorIdentityHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("verifies and reuses a valid actor cookie", () => {
      const initial = getOrCreateActorIdentity(undefined, TEST_SECRET);
      const reEvaluated = getOrCreateActorIdentity(initial.cookieValue, TEST_SECRET);

      expect(reEvaluated.isNew).toBe(false);
      expect(reEvaluated.cookieValue).toBe(initial.cookieValue);
      expect(reEvaluated.actorIdentityHash).toBe(initial.actorIdentityHash);
    });

    it("rejects forged or malformed actor cookies and mints a fresh identity", () => {
      const forgedValues = [
        "forgedtoken.invalidSignature",
        "short.sig",
        "not-base64url!@#.signature",
        "a".repeat(43),
        "a".repeat(43) + "." + "b".repeat(43) + ".extra",
      ];

      for (const forged of forgedValues) {
        const fresh = getOrCreateActorIdentity(forged, TEST_SECRET);
        expect(fresh.isNew).toBe(true);
        expect(fresh.cookieValue).not.toBe(forged);
        expect(fresh.cookieValue).toMatch(/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/);
      }
    });

    it("derives distinct hashes for cookie signature and database identity (domain separation)", () => {
      const identity = getOrCreateActorIdentity(undefined, TEST_SECRET);
      const [rawToken, signature] = identity.cookieValue.split(".");

      expect(identity.actorIdentityHash).toMatch(/^[a-f0-9]{64}$/);
      // The database hash must never leak the raw token held by the browser.
      expect(identity.actorIdentityHash).not.toContain(rawToken);
      // Separate HMAC domains: were both derivations to share one domain string,
      // the database hash would be the hex encoding of the cookie signature.
      expect(identity.actorIdentityHash).not.toBe(Buffer.from(signature, "base64url").toString("hex"));
    });

    it("derives a different database identity for every minted actor cookie", () => {
      const first = getOrCreateActorIdentity(undefined, TEST_SECRET);
      const second = getOrCreateActorIdentity(undefined, TEST_SECRET);

      expect(first.cookieValue).not.toBe(second.cookieValue);
      expect(first.actorIdentityHash).not.toBe(second.actorIdentityHash);
    });

    it("does not reuse a database identity across differing signing secrets", () => {
      const identity = getOrCreateActorIdentity(undefined, TEST_SECRET);
      const underOtherSecret = getOrCreateActorIdentity(identity.cookieValue, `${TEST_SECRET}-rotated`);

      // A cookie signed under the previous secret must fail verification.
      expect(underOtherSecret.isNew).toBe(true);
      expect(underOtherSecret.actorIdentityHash).not.toBe(identity.actorIdentityHash);
    });
  });

  describe("B. Operational Security & Capability Boundaries", () => {
    it("ensures online booking capability remains disabled when ONLINE_BOOKING_ENABLED is false or in production", () => {
      const capabilityDisabled = evaluateOnlineBookingCapability({ ONLINE_BOOKING_ENABLED: "false" });
      expect(capabilityDisabled.available).toBe(false);
      expect(capabilityDisabled.state).toBe("disabled");

      const capabilityProd = evaluateOnlineBookingCapability({ ONLINE_BOOKING_ENABLED: "true", APP_ENV: "production" });
      expect(capabilityProd.available).toBe(false);
      expect(capabilityProd.state).toBe("disabled");
    });

    it("verifies actor cookie constants and attributes", () => {
      expect(ACTOR_COOKIE_NAME).toBe("soe_actor");
    });
  });
});
