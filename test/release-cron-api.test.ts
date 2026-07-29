// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { releaseHold, expireHolds } = vi.hoisted(() => ({ releaseHold: vi.fn(), expireHolds: vi.fn() }));
vi.mock("@/lib/booking/database", () => ({ releaseHold, expireHolds }));
import { NextRequest } from "next/server";
import { signHoldToken } from "@/lib/booking/hold-token";
import { POST as release } from "@/app/api/bookings/release/route";
import { POST as cron } from "@/app/api/internal/cron/expire-holds/route";

function releaseRequest(cookie?: string, origin: string | null = "http://localhost:3000") {
  return new NextRequest("http://localhost/api/bookings/release", {
    method: "POST",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(origin ? { origin } : {}),
    },
  });
}

describe("release and cleanup APIs", () => {
  beforeEach(() => { releaseHold.mockReset(); expireHolds.mockReset(); releaseHold.mockResolvedValue(true); expireHolds.mockResolvedValue(2); });
  it("releases a valid cookie-bound hold and clears the same API-scoped cookie", async () => { const token = signHoldToken({ v: 1, bookingId: "booking", nonce: "nonce", expiresAt: "2030-01-01T00:00:00Z" }, "unit-test-only-secret-not-a-real-credential"); const response = await release(releaseRequest(`soe_booking_hold=${token}`)); expect(response.status).toBe(200); expect(await response.json()).toEqual({ released: true }); const cookie = response.headers.get("set-cookie"); expect(cookie).toContain("Max-Age=0"); expect(cookie).toContain("Path=/api"); expect(cookie).toMatch(/HttpOnly.*SameSite=lax/i); });
  it("rejects an invalid token", async () => expect((await release(releaseRequest("soe_booking_hold=bad"))).status).toBe(400));
  it("rejects an expired token", async () => { const token = signHoldToken({ v: 1, bookingId: "booking", nonce: "nonce", expiresAt: "2020-01-01T00:00:00Z" }, "unit-test-only-secret-not-a-real-credential"); expect((await release(releaseRequest(`soe_booking_hold=${token}`))).status).toBe(400); });
  it("returns idempotent success after the browser cookie is already cleared", async () => { const response = await release(releaseRequest()); expect(response.status).toBe(200); expect(await response.json()).toEqual({ released: true }); expect(releaseHold).not.toHaveBeenCalled(); expect(response.headers.get("set-cookie")).toContain("Path=/api"); });
  it.each([null, "https://evil.example"])("rejects origin %s without releasing or changing the cookie", async (origin) => {
    const response = await release(releaseRequest("soe_booking_hold=bad", origin));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "ORIGIN_REJECTED",
        message: "Request origin was rejected.",
      },
    });
    expect(releaseHold).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("keeps duplicate database release idempotent", async () => { releaseHold.mockResolvedValue(true); expect(releaseHold).not.toHaveBeenCalled(); });
  it("rejects missing cron secret", async () => expect((await cron(new NextRequest("http://localhost/api/internal/cron/expire-holds", { method: "POST" }))).status).toBe(401));
  it("rejects the wrong cron secret", async () => expect((await cron(new NextRequest("http://localhost/api/internal/cron/expire-holds", { method: "POST", headers: { authorization: "Bearer wrong" } }))).status).toBe(401));
  it("returns only a safe cleanup count", async () => { const response = await cron(new NextRequest("http://localhost/api/internal/cron/expire-holds", { method: "POST", headers: { authorization: "Bearer dummy" } })); expect(await response.json()).toEqual({ expiredCount: 2 }); });
});
