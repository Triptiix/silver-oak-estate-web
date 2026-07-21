// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { createHold, verifyTurnstile } = vi.hoisted(() => ({ createHold: vi.fn(), verifyTurnstile: vi.fn() }));
vi.mock("@/lib/booking/database", () => ({ createHold }));
vi.mock("@/lib/booking/turnstile", () => ({ verifyTurnstile }));
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/hold/route";
import { HOLD_COOKIE_PATH, holdCookieOptions } from "@/lib/booking/hold-cookie";

const input = { requestId: "31000000-0000-4000-8000-000000000001", propertySlug: "silver-oak-estate", checkInDate: "2026-07-25", customerName: "Guest", customerPhone: "+919999000001", guestCount: 8, overnightGuestCount: 4, turnstileToken: "test-token" };
const result = { created: true, bookingId: "booking-id", holdTokenNonce: "nonce", bookingReference: "SOE-1", checkInAt: "2026-07-25T05:30:00Z", checkOutAt: "2026-07-26T04:30:00Z", holdExpiresAt: new Date(Date.now() + 600000).toISOString(), priceAmountPaise: 2000000, advanceAmountPaise: 500000, balanceAmountPaise: 1500000, currency: "INR" };
const request = (body: unknown, origin = "http://localhost:3000") => new NextRequest("http://localhost/api/bookings/hold", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
describe("hold API", () => {
  beforeEach(() => { createHold.mockReset(); verifyTurnstile.mockReset(); verifyTurnstile.mockResolvedValue(true); createHold.mockResolvedValue(result); });
  it("creates a hold and sets a protected API-scoped cookie", async () => { const response = await POST(request(input)); expect(response.status).toBe(201); const cookie = response.headers.get("set-cookie"); expect(cookie).toMatch(/soe_booking_hold=.*HttpOnly.*SameSite=lax/i); expect(cookie).toContain("Path=/api"); expect(cookie).not.toContain("Path=/api/bookings"); expect(cookie).not.toContain(input.customerName); expect(cookie).not.toContain(input.customerPhone); expect(cookie).not.toContain(input.turnstileToken); expect(holdCookieOptions(false).httpOnly).toBe(true); expect("/api/payments/order".startsWith(HOLD_COOKIE_PATH)).toBe(true); const body = await response.json(); expect(body.bookingId).toBeUndefined(); expect(body.holdTokenNonce).toBeUndefined(); });
  it("returns 200 for an idempotent retry", async () => { createHold.mockResolvedValue({ ...result, created: false }); expect((await POST(request(input))).status).toBe(200); });
  it("rejects malformed dates", async () => expect((await POST(request({ ...input, checkInDate: "2026-02-31" }))).status).toBe(400));
  it("rejects capacity above 30", async () => expect((await POST(request({ ...input, guestCount: 31 }))).status).toBe(400));
  it("rejects browser-supplied price fields", async () => expect((await POST(request({ ...input, priceAmountPaise: 1 }))).status).toBe(400));
  it("rejects invalid Turnstile", async () => { verifyTurnstile.mockResolvedValue(false); expect((await POST(request(input))).status).toBe(403); });
  it("rejects a foreign origin", async () => expect((await POST(request(input, "https://evil.example"))).status).toBe(403));
  it("maps date conflicts safely", async () => { createHold.mockRejectedValue(new Error("date_unavailable internal")); const response = await POST(request(input)); expect(response.status).toBe(409); expect(JSON.stringify(await response.json())).not.toContain("internal"); });
  it("maps abuse limits to 429", async () => { createHold.mockRejectedValue(new Error("hold_abuse_limit")); expect((await POST(request(input))).status).toBe(429); });
  it("maps a database-rejected past business date to a safe 400", async () => { createHold.mockRejectedValue(new Error("past_booking_date internal detail")); const response = await POST(request(input)); expect(response.status).toBe(400); expect(JSON.stringify(await response.json())).not.toContain("internal detail"); });
});
