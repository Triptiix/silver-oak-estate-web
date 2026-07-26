// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  fetchPayment: vi.fn(),
  finalizeVerifiedPayment: vi.fn(),
}));
vi.mock("@/lib/payments/database", () => ({
  finalizeVerifiedPayment: mocks.finalizeVerifiedPayment,
}));
vi.mock("@/lib/payments/razorpay", () => ({
  createRazorpayGateway: () => ({ fetchPayment: mocks.fetchPayment }),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/payments/verify/route";

function request(overrides: Record<string, string> = {}, origin: string | null = "http://localhost:3000") {
  const orderId = overrides.razorpay_order_id ?? "order_test_1";
  const paymentId = overrides.razorpay_payment_id ?? "pay_test_1";
  const signature = overrides.razorpay_signature
    ?? createHmac("sha256", "private-payment-secret").update(`${orderId}|${paymentId}`).digest("hex");
  return new NextRequest("http://localhost/api/payments/verify", {
    method: "POST",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    }),
  });
}

describe("payment verification API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchPayment.mockResolvedValue({
      id: "pay_test_1",
      order_id: "order_test_1",
      amount: 500000,
      currency: "INR",
      status: "captured",
      captured: true,
    });
    mocks.finalizeVerifiedPayment.mockResolvedValue({
      result: "confirmed",
      bookingReference: "SOE-20260725-ABCD1234",
    });
  });

  it("fetches authoritative payment facts and calls the shared finalizer", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.finalizeVerifiedPayment).toHaveBeenCalledWith({
      providerOrderId: "order_test_1",
      providerPaymentId: "pay_test_1",
      amountPaise: 500000,
      currency: "INR",
      financialStatus: "captured",
      source: "browser",
    });
    expect(await response.json()).toEqual({
      state: "confirmed",
      bookingReference: "SOE-20260725-ABCD1234",
    });
  });

  it("rejects an invalid signature before fetching provider data", async () => {
    const response = await POST(request({ razorpay_signature: "0".repeat(64) }));
    expect(response.status).toBe(400);
    expect(mocks.fetchPayment).not.toHaveBeenCalled();
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
  });

  it("does not accept a payment linked to another order", async () => {
    mocks.fetchPayment.mockResolvedValue({
      id: "pay_test_1",
      order_id: "order_other",
      amount: 500000,
      currency: "INR",
      status: "captured",
      captured: true,
    });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
  });

  it.each([null, "https://evil.example"])("rejects origin %s before parsing or payment work", async (origin) => {
    const incoming = request({}, origin);
    const json = vi.spyOn(incoming, "json");
    const response = await POST(incoming);
    expect(response.status).toBe(403);
    expect(json).not.toHaveBeenCalled();
    expect(mocks.fetchPayment).not.toHaveBeenCalled();
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
  });

  it("returns recovery state and clears the API-scoped HttpOnly hold cookie", async () => {
    mocks.finalizeVerifiedPayment.mockResolvedValue({
      result: "recovery_required",
      bookingReference: "SOE-20260725-ABCD1234",
    });
    const response = await POST(request());
    expect((await response.json()).state).toBe("recovery_required");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("soe_booking_hold=");
    expect(cookie).toContain("Path=/api");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Max-Age=0/i);
  });
});
