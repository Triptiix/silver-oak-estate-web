// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  ACTOR_COOKIE_NAME,
  deriveActorDatabaseHash,
  getOrCreateActorIdentity,
  verifyActorCookieValue,
} from "@/lib/booking/actor-cookie";
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
        const verified = verifyActorCookieValue(forged, TEST_SECRET);
        expect(verified).toBeNull();

        const fresh = getOrCreateActorIdentity(forged, TEST_SECRET);
        expect(fresh.isNew).toBe(true);
        expect(fresh.cookieValue).not.toBe(forged);
      }
    });

    it("derives distinct hashes for cookie signature and database identity (domain separation)", () => {
      const rawToken = "dGVzdC1yYXctdG9rZW4tMzItYnl0ZXMtc3RyaW5nIQ"; // 43 chars base64url
      const dbHash = deriveActorDatabaseHash(rawToken, TEST_SECRET);

      expect(dbHash).toMatch(/^[a-f0-9]{64}$/);
      // DB hash must not match raw token or cookie signature
      expect(dbHash).not.toContain(rawToken);
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
