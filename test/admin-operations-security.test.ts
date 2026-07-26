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
import {
  isCanonicalBookingReference,
  MAX_ADMIN_PAGE,
  parseAdminListQuery,
} from "@/lib/admin/query";
import { buildAdminPaginationHref } from "@/components/admin/pagination";
import { orderAdminTimeline } from "@/lib/admin/timeline";

describe("Phase 5A operational data boundaries", () => {
  it("bounds pagination and accepts only allowlisted server filters", () => {
    expect(parseAdminListQuery({
      page: "-4",
      pageSize: "1000",
      bookingStatus: "confirmed'; drop table bookings;--",
      paymentStatus: "refund_pending",
      recoveryState: "verified",
      bookingReference: "guest@example.com",
    })).toEqual(expect.objectContaining({
      page: 1,
      pageSize: 20,
      bookingStatus: undefined,
      paymentStatus: "refund_pending",
      recoveryState: undefined,
      bookingReference: undefined,
    }));
  });

  it("accepts only a complete public booking reference in URL filters", () => {
    const validReference = "SOE-20260725-ABCD1234";
    expect(isCanonicalBookingReference(validReference)).toBe(true);
    expect(parseAdminListQuery({ bookingReference: validReference }).bookingReference)
      .toBe(validReference);
    for (const value of [
      "guest@example.com",
      "+91 98765 43210",
      "Priyanshu",
      "9876543210",
      "SOE-20260725-ABC",
      "SOE-20260725-abcD1234",
      `x${validReference}`,
      `${validReference}x`,
    ]) {
      expect(isCanonicalBookingReference(value)).toBe(false);
      expect(parseAdminListQuery({ bookingReference: value }).bookingReference).toBeUndefined();
    }
  });

  it("never preserves PII-capable URL terms in pagination", () => {
    const href = buildAdminPaginationHref("/admin/bookings", {
      search: "guest@example.com",
      bookingReference: "guest@example.com",
      legacy: "Priyanshu",
      page: "1",
    }, 2);
    expect(href).toBe("/admin/bookings?page=2");
    expect(href).not.toMatch(/guest|Priyanshu|98765/i);
    expect(buildAdminPaginationHref("/admin/bookings", {
      bookingReference: "SOE-20260725-ABCD1234",
    }, 2)).toContain("bookingReference=SOE-20260725-ABCD1234");
  });

  it("normalizes malformed and excessive page values before database ranges", () => {
    expect(parseAdminListQuery({ page: "0" }).page).toBe(1);
    expect(parseAdminListQuery({ page: "-1" }).page).toBe(1);
    expect(parseAdminListQuery({ page: "1.5" }).page).toBe(1);
    expect(parseAdminListQuery({ page: String(MAX_ADMIN_PAGE) }).page).toBe(MAX_ADMIN_PAGE);
    expect(parseAdminListQuery({ page: String(MAX_ADMIN_PAGE + 1) }).page).toBe(1);
    expect(parseAdminListQuery({ page: ["1", "999999999"] }).page).toBe(1);
  });

  it("orders same-timestamp timeline events deterministically without serializing ordering IDs", () => {
    const events = [
      { kind: "notification" as const, label: "Notification queued", state: "pending", occurredAt: "2026-07-25T05:30:00.000Z", sourcePriority: 4, typePriority: 0, orderingId: "b" },
      { kind: "payment" as const, label: "Payment attempt created", state: "pending", occurredAt: "2026-07-25T05:30:00.000Z", sourcePriority: 2, typePriority: 0, orderingId: "z" },
      { kind: "payment" as const, label: "Payment verified", state: "verified", occurredAt: "2026-07-25T05:30:00.000Z", sourcePriority: 2, typePriority: 5, orderingId: "a" },
      { kind: "audit" as const, label: "payment verified", state: "verified", occurredAt: "2026-07-25T05:31:00.000Z", sourcePriority: 3, typePriority: 0, orderingId: "a" },
    ];
    const first = orderAdminTimeline(events);
    expect(first.map((event) => event.label)).toEqual([
      "Payment attempt created", "Payment verified", "Notification queued", "payment verified",
    ]);
    expect(orderAdminTimeline([...events].reverse())).toEqual(first);
    expect(JSON.stringify(first)).not.toContain("orderingId");
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
      "src/app/api/admin/bookings/[bookingReference]/route.ts",
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

  it("uses only booking references for URL-backed database filtering", () => {
    const source = readFileSync("src/lib/admin/database.ts", "utf8");
    expect(source).toContain('request.eq("booking_reference", query.bookingReference)');
    expect(source).not.toContain("customer_name_snapshot.ilike");
    expect(source).not.toContain("customer_email_snapshot.ilike");
    expect(source).not.toContain("customer_phone_snapshot.ilike");
    expect(source).not.toContain("request.or(");
  });
});
