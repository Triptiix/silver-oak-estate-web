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
const rawRequest = (
  body: BodyInit,
  options: {
    contentLength?: string;
    contentType?: string;
    origin?: string | null;
  } = {},
) => new NextRequest("http://localhost/api/bookings/hold", {
  method: "POST",
  headers: {
    "content-type": options.contentType ?? "application/json",
    ...(options.contentLength ? { "content-length": options.contentLength } : {}),
    ...(options.origin === null
      ? {}
      : { origin: options.origin ?? "http://localhost:3000" }),
  },
  body,
  ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
});
const request = (body: unknown, origin: string | null = "http://localhost:3000") =>
  rawRequest(JSON.stringify(body), { origin });
describe("hold API", () => {
  beforeEach(() => { createHold.mockReset(); verifyTurnstile.mockReset(); verifyTurnstile.mockResolvedValue(true); createHold.mockResolvedValue(result); });
  it("creates a hold and sets a protected API-scoped cookie", async () => {
    const response = await POST(request(input));
    expect(response.status).toBe(201);
    const cookies = response.headers.getSetCookie();
    const holdCookie = cookies.find((c) => c.startsWith("soe_booking_hold=")) ?? "";
    const actorCookie = cookies.find((c) => c.startsWith("soe_actor=")) ?? "";
    expect(holdCookie).toMatch(/soe_booking_hold=.*HttpOnly.*SameSite=lax/i);
    expect(holdCookie).toContain("Path=/api;");
    expect(holdCookie).not.toContain("Path=/api/bookings");
    expect(actorCookie).toMatch(/soe_actor=.*HttpOnly.*SameSite=lax/i);
    expect(actorCookie).toContain("Path=/api/bookings");
    expect(holdCookie).not.toContain(input.customerName);
    expect(holdCookie).not.toContain(input.customerPhone);
    expect(holdCookie).not.toContain(input.turnstileToken);
    expect(holdCookieOptions(false).httpOnly).toBe(true);
    expect("/api/payments/order".startsWith(HOLD_COOKIE_PATH)).toBe(true);
    const body = await response.json();
    expect(body.bookingId).toBeUndefined();
    expect(body.holdTokenNonce).toBeUndefined();
  });
  it("passes canonical phone identities to the booking RPC", async () => {
    const response = await POST(request({
      ...input,
      customerPhone: "+91 99990 00001",
      whatsapp: "+91-99990-00002",
    }));
    expect(response.status).toBe(201);
    expect(createHold).toHaveBeenCalledWith(expect.objectContaining({
      p_customer_phone: "+919999000001",
      p_whatsapp: "+919999000002",
    }));
  });
  it("ignores browser forwarding headers outside Vercel", async () => {
    const incoming = request(input);
    incoming.headers.set("x-vercel-forwarded-for", "203.0.113.10");
    incoming.headers.set("x-forwarded-for", "203.0.113.11");
    const previousVercel = process.env.VERCEL;
    delete process.env.VERCEL;
    try {
      expect((await POST(incoming)).status).toBe(201);
      expect(verifyTurnstile).toHaveBeenCalledWith(
        input.turnstileToken,
        "unknown",
        "dummy",
      );
      expect(createHold).toHaveBeenCalledOnce();
    } finally {
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
    }
  });
  it("finishes Turnstile verification before the fingerprint-backed booking RPC", async () => {
    const response = await POST(request(input));
    expect(response.status).toBe(201);
    expect(verifyTurnstile.mock.invocationCallOrder[0])
      .toBeLessThan(createHold.mock.invocationCallOrder[0]!);
    expect(createHold).toHaveBeenCalledWith(expect.objectContaining({
      p_request_fingerprint_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });
  it("returns 200 for an idempotent retry", async () => { createHold.mockResolvedValue({ ...result, created: false }); expect((await POST(request(input))).status).toBe(200); });
  it("rejects malformed dates", async () => expect((await POST(request({ ...input, checkInDate: "2026-02-31" }))).status).toBe(400));
  it("rejects total capacity above 40", async () => expect((await POST(request({ ...input, guestCount: 41 }))).status).toBe(400));
  it("rejects overnight capacity above 10", async () => expect((await POST(request({ ...input, guestCount: 11, overnightGuestCount: 11 }))).status).toBe(400));
  it.each(["+91+9999000001", "91+9999000001", "phone"])(
    "rejects malformed phone %s before the booking RPC",
    async (customerPhone) => {
      const response = await POST(request({ ...input, customerPhone }));
      expect(response.status).toBe(400);
      expect(createHold).not.toHaveBeenCalled();
    },
  );
  it("rejects browser-supplied price fields", async () => expect((await POST(request({ ...input, priceAmountPaise: 1 }))).status).toBe(400));
  it("rejects oversized JSON without downstream work or a cookie", async () => {
    const response = await POST(request({
      ...input,
      specialRequests: "a".repeat(17_000),
    }));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: {
        code: "REQUEST_TOO_LARGE",
        message: "The request body is too large.",
      },
    });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(createHold).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("enforces the streamed limit when Content-Length is missing", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(16 * 1024));
        controller.enqueue(new Uint8Array([1]));
        controller.close();
      },
    });
    const response = await POST(rawRequest(body));
    expect(response.status).toBe(413);
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(createHold).not.toHaveBeenCalled();
  });
  it("returns the existing invalid request for malformed JSON", async () => {
    const response = await POST(rawRequest('{"requestId":'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Review the booking details and try again.",
      },
    });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(createHold).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("rejects unsupported content types before downstream work", async () => {
    const response = await POST(rawRequest(JSON.stringify(input), {
      contentType: "text/plain",
    }));
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Send the request as JSON.",
      },
    });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(createHold).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("keeps maximum schema values below the route byte limit", async () => {
    const maximumInput = {
      ...input,
      propertySlug: "a".repeat(80),
      customerName: "a".repeat(120),
      customerEmail: `${"a".repeat(242)}@example.com`,
      customerPhone: "+123456789012345",
      whatsapp: "+123456789012345",
      guestCount: 40,
      overnightGuestCount: 10,
      specialRequests: "a".repeat(1000),
      turnstileToken: "a".repeat(4096),
    };
    expect(new TextEncoder().encode(JSON.stringify(maximumInput)).byteLength)
      .toBeLessThanOrEqual(16 * 1024);
    expect((await POST(request(maximumInput))).status).toBe(201);
  });
  it("rejects invalid Turnstile", async () => { verifyTurnstile.mockResolvedValue(false); expect((await POST(request(input))).status).toBe(403); });
  it.each([null, "https://evil.example"])("rejects origin %s before parsing or side effects", async (origin) => {
    const incoming = request(input, origin);
    const getReader = vi.spyOn(incoming.body!, "getReader");
    const response = await POST(incoming);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "ORIGIN_REJECTED",
        message: "Request origin was rejected.",
      },
    });
    expect(getReader).not.toHaveBeenCalled();
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(createHold).not.toHaveBeenCalled();
  });
  it("maps date conflicts safely and persists the actor cookie", async () => {
    createHold.mockRejectedValue(new Error("date_unavailable internal"));
    const response = await POST(request(input));
    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).not.toContain("internal");
    const actorCookie = response.headers.getSetCookie()
      .find((cookie) => cookie.startsWith("soe_actor=")) ?? "";
    expect(actorCookie).toMatch(/soe_actor=.*HttpOnly.*SameSite=lax/i);
    expect(actorCookie).toContain("Path=/api/bookings");
  });
  it("maps abuse limits to 429", async () => { createHold.mockRejectedValue(new Error("hold_abuse_limit")); expect((await POST(request(input))).status).toBe(429); });
  it("maps a database-rejected past business date to a safe 400", async () => { createHold.mockRejectedValue(new Error("past_booking_date internal detail")); const response = await POST(request(input)); expect(response.status).toBe(400); expect(JSON.stringify(await response.json())).not.toContain("internal detail"); });
});
