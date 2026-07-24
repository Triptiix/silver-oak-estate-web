// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatAdminDateTime,
  formatPaise,
  maskEmail,
  maskName,
  maskPhone,
  notificationDelivery,
} from "@/lib/admin/format";
import { parseAdminListQuery } from "@/lib/admin/query";

describe("Phase 5A operational data boundaries", () => {
  it("bounds pagination and accepts only allowlisted server filters", () => {
    expect(parseAdminListQuery({
      page: "-4",
      pageSize: "1000",
      bookingStatus: "confirmed'; drop table bookings;--",
      paymentStatus: "refund_pending",
      recoveryState: "verified",
      search: "name,or(secret.eq.true)",
    })).toEqual(expect.objectContaining({
      page: 1,
      pageSize: 20,
      bookingStatus: undefined,
      paymentStatus: "refund_pending",
      recoveryState: undefined,
      search: undefined,
    }));
  });

  it("masks operational customer fields", () => {
    expect(maskName("Priyanshu")).toBe("P******");
    expect(maskEmail("guest@example.com")).toBe("g***@example.com");
    expect(maskPhone("+91 98765 43210")).toBe("***3210");
  });

  it("keeps money as integer paise at the boundary", () => {
    expect(formatPaise(500000)).toContain("5,000");
    expect(() => formatPaise(500000.5)).toThrow("invalid_integer_paise");
    const source = readFileSync("src/lib/admin/database.ts", "utf8");
    expect(source).toContain("Number.isSafeInteger");
    expect(source).not.toContain("parseFloat");
  });

  it("formats instants in Asia/Kolkata", () => {
    expect(formatAdminDateTime("2026-07-25T05:30:00.000Z")).toMatch(/25 Jul 2026.*11:00/i);
  });

  it("does not falsely label a pending outbox row as delivered", () => {
    expect(notificationDelivery("pending")).toEqual({
      deliveryLabel: "queued",
      deliveryNote: "Delivery not implemented in Phase 5A.",
    });
  });

  it("contains no Phase 5A payment or recovery mutation handler", () => {
    const sources = [
      "src/app/api/admin/bookings/route.ts",
      "src/app/api/admin/payments/route.ts",
      "src/app/api/admin/recovery/route.ts",
      "src/app/api/admin/notifications/route.ts",
    ].map((path) => readFileSync(path, "utf8")).join("\n");
    expect(sources).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)/);
    expect(sources).not.toMatch(/finalizeVerifiedPayment|markProviderPaymentFailed/);
  });

  it("never selects forbidden booking secrets in the admin data module", () => {
    const source = readFileSync("src/lib/admin/database.ts", "utf8");
    for (const forbidden of [
      "hold_token_nonce",
      "request_fingerprint_hash",
      "public_confirmation_token",
      "idempotency_key",
      "failure_reason",
      "payload_hash",
      "payload_redacted",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
