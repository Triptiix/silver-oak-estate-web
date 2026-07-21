// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { releaseHold, expireHolds } = vi.hoisted(() => ({ releaseHold: vi.fn(), expireHolds: vi.fn() }));
vi.mock("@/lib/booking/database", () => ({ releaseHold, expireHolds }));
import { NextRequest } from "next/server";
import { signHoldToken } from "@/lib/booking/hold-token";
import { POST as release } from "@/app/api/bookings/release/route";
import { POST as cron } from "@/app/api/internal/cron/expire-holds/route";

describe("release and cleanup APIs", () => {
  beforeEach(() => { releaseHold.mockReset(); expireHolds.mockReset(); releaseHold.mockResolvedValue(true); expireHolds.mockResolvedValue(2); });
  it("releases a valid cookie-bound hold without PII", async () => { const token = signHoldToken({ v: 1, bookingId: "booking", nonce: "nonce", expiresAt: "2030-01-01T00:00:00Z" }, "dummy"); const response = await release(new NextRequest("http://localhost/api/bookings/release", { method: "POST", headers: { cookie: `soe_booking_hold=${token}` } })); expect(response.status).toBe(200); expect(await response.json()).toEqual({ released: true }); expect(response.headers.get("set-cookie")).toContain("Max-Age=0"); });
  it("rejects an invalid token", async () => expect((await release(new NextRequest("http://localhost/api/bookings/release", { method: "POST", headers: { cookie: "soe_booking_hold=bad" } }))).status).toBe(400));
  it("rejects an expired token", async () => { const token = signHoldToken({ v: 1, bookingId: "booking", nonce: "nonce", expiresAt: "2020-01-01T00:00:00Z" }, "dummy"); expect((await release(new NextRequest("http://localhost/api/bookings/release", { method: "POST", headers: { cookie: `soe_booking_hold=${token}` } }))).status).toBe(400); });
  it("keeps duplicate database release idempotent", async () => { releaseHold.mockResolvedValue(true); expect(releaseHold).not.toHaveBeenCalled(); });
  it("rejects missing cron secret", async () => expect((await cron(new NextRequest("http://localhost/api/internal/cron/expire-holds", { method: "POST" }))).status).toBe(401));
  it("rejects the wrong cron secret", async () => expect((await cron(new NextRequest("http://localhost/api/internal/cron/expire-holds", { method: "POST", headers: { authorization: "Bearer wrong" } }))).status).toBe(401));
  it("returns only a safe cleanup count", async () => { const response = await cron(new NextRequest("http://localhost/api/internal/cron/expire-holds", { method: "POST", headers: { authorization: "Bearer dummy" } })); expect(await response.json()).toEqual({ expiredCount: 2 }); });
});
