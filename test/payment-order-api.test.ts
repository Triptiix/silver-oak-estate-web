// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  preparePaymentOrder: vi.fn(),
  attachProviderOrder: vi.fn(),
  markCheckoutStarted: vi.fn(),
  markOrderFailed: vi.fn(),
  createOrder: vi.fn(),
}));
vi.mock("@/lib/payments/database", () => ({
  preparePaymentOrder: mocks.preparePaymentOrder,
  attachProviderOrder: mocks.attachProviderOrder,
  markCheckoutStarted: mocks.markCheckoutStarted,
  markOrderFailed: mocks.markOrderFailed,
}));
vi.mock("@/lib/payments/razorpay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/razorpay")>();
  return {
    ...actual,
    createRazorpayGateway: () => ({ createOrder: mocks.createOrder }),
  };
});

import { NextRequest } from "next/server";
import { signHoldToken } from "@/lib/booking/hold-token";
import { POST } from "@/app/api/payments/order/route";

const prepared = {
  paymentId: "11000000-0000-4000-8000-000000000001",
  providerReceipt: "SOE-11000000000040008000000000000001",
  providerOrderId: null,
  bookingReference: "SOE-20260725-ABCD1234",
  amountPaise: 500000,
  currency: "INR",
  holdExpiresAt: new Date(Date.now() + 600_000).toISOString(),
  reused: false,
};

function request(origin = "http://localhost:3000") {
  const token = signHoldToken({
    v: 1,
    bookingId: "22000000-0000-4000-8000-000000000001",
    nonce: "33000000-0000-4000-8000-000000000001",
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  }, "dummy");
  return new NextRequest("http://localhost/api/payments/order", {
    method: "POST",
    headers: { origin, cookie: `soe_booking_hold=${token}` },
  });
}

describe("payment order API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.preparePaymentOrder.mockResolvedValue(prepared);
    mocks.createOrder.mockResolvedValue({
      id: "order_test_1",
      amount: 500000,
      currency: "INR",
      receipt: prepared.providerReceipt,
      status: "created",
    });
    mocks.attachProviderOrder.mockResolvedValue({
      ...prepared,
      providerOrderId: "order_test_1",
    });
    mocks.markCheckoutStarted.mockResolvedValue(undefined);
    mocks.markOrderFailed.mockResolvedValue(undefined);
  });

  it("creates an order from the stored advance and returns only checkout-safe fields", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(mocks.createOrder).toHaveBeenCalledWith({
      amountPaise: 500000,
      currency: "INR",
      receipt: prepared.providerReceipt,
    });
    const body = await response.json();
    expect(body).toEqual({
      state: "checkout_ready",
      keyId: "rzp_test_dummy",
      providerOrderId: "order_test_1",
      bookingReference: prepared.bookingReference,
      amountPaise: 500000,
      currency: "INR",
      holdExpiresAt: prepared.holdExpiresAt,
    });
    expect(JSON.stringify(body)).not.toContain(prepared.paymentId);
    expect(JSON.stringify(body)).not.toContain("private-payment-secret");
  });

  it("reuses an attached provider order without creating another", async () => {
    mocks.preparePaymentOrder.mockResolvedValue({
      ...prepared,
      providerOrderId: "order_existing",
      reused: true,
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect((await response.json()).providerOrderId).toBe("order_existing");
  });

  it("rejects missing hold ownership and foreign origins", async () => {
    const withoutCookie = new NextRequest("http://localhost/api/payments/order", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect((await POST(withoutCookie)).status).toBe(400);
    expect((await POST(request("https://evil.example"))).status).toBe(403);
    expect(mocks.preparePaymentOrder).not.toHaveBeenCalled();
  });

  it("keeps an ambiguous timeout on the same attempt for safe retry", async () => {
    const { PaymentProviderError } = await import("@/lib/payments/razorpay");
    mocks.createOrder.mockRejectedValue(new PaymentProviderError("timeout"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.markOrderFailed).not.toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toContain("timeout");
  });

  it("records a definitive provider rejection using only its bounded category", async () => {
    const { PaymentProviderError } = await import("@/lib/payments/razorpay");
    mocks.createOrder.mockRejectedValue(new PaymentProviderError("rejected"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.markOrderFailed).toHaveBeenCalledWith(prepared.paymentId, "rejected");
    expect(JSON.stringify(await response.json())).not.toContain("rejected");
  });
});
