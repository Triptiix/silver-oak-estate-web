// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  createGateway: vi.fn(),
  fetchPayment: vi.fn(),
  finalizeVerifiedPayment: vi.fn(),
  verifyCheckoutSignature: vi.fn(),
}));
vi.mock("@/lib/payments/database", () => ({
  finalizeVerifiedPayment: mocks.finalizeVerifiedPayment,
}));
vi.mock("@/lib/payments/razorpay", () => ({
  createRazorpayGateway: mocks.createGateway,
}));
vi.mock("@/lib/payments/crypto", () => ({
  verifyCheckoutSignature: mocks.verifyCheckoutSignature,
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/payments/verify/route";

function rawRequest(
  body: BodyInit,
  options: {
    contentLength?: string;
    contentType?: string;
    origin?: string | null;
  } = {},
) {
  return new NextRequest("http://localhost/api/payments/verify", {
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
}

function request(overrides: Record<string, string> = {}, origin: string | null = "http://localhost:3000") {
  const orderId = overrides.razorpay_order_id ?? "order_test_1";
  const paymentId = overrides.razorpay_payment_id ?? "pay_test_1";
  const signature = overrides.razorpay_signature ?? "a".repeat(64);
  return rawRequest(
    JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    }),
    { origin },
  );
}

describe("payment verification API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createGateway.mockReturnValue({ fetchPayment: mocks.fetchPayment });
    mocks.verifyCheckoutSignature.mockReturnValue(true);
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
    mocks.verifyCheckoutSignature.mockReturnValue(false);
    const response = await POST(request());
    expect(response.status).toBe(400);
    expect(mocks.verifyCheckoutSignature).toHaveBeenCalledOnce();
    expect(mocks.createGateway).not.toHaveBeenCalled();
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
    const getReader = vi.spyOn(incoming.body!, "getReader");
    const response = await POST(incoming);
    expect(response.status).toBe(403);
    expect(getReader).not.toHaveBeenCalled();
    expect(mocks.verifyCheckoutSignature).not.toHaveBeenCalled();
    expect(mocks.createGateway).not.toHaveBeenCalled();
    expect(mocks.fetchPayment).not.toHaveBeenCalled();
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
  });

  it("rejects oversized JSON before payment work or cookie mutation", async () => {
    const response = await POST(rawRequest(JSON.stringify({
      razorpay_order_id: "order_test_1",
      razorpay_payment_id: "pay_test_1",
      razorpay_signature: "a".repeat(64),
      padding: "a".repeat(8_192),
    })));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: {
        code: "REQUEST_TOO_LARGE",
        message: "The request body is too large.",
      },
    });
    expect(mocks.verifyCheckoutSignature).not.toHaveBeenCalled();
    expect(mocks.createGateway).not.toHaveBeenCalled();
    expect(mocks.fetchPayment).not.toHaveBeenCalled();
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns the existing invalid request for malformed JSON", async () => {
    const response = await POST(rawRequest('{"razorpay_order_id":'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Payment verification details were invalid.",
      },
    });
    expect(mocks.verifyCheckoutSignature).not.toHaveBeenCalled();
    expect(mocks.createGateway).not.toHaveBeenCalled();
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects unsupported content types before payment work", async () => {
    const response = await POST(rawRequest("{}", { contentType: "text/plain" }));
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Send the request as JSON.",
      },
    });
    expect(mocks.verifyCheckoutSignature).not.toHaveBeenCalled();
    expect(mocks.createGateway).not.toHaveBeenCalled();
    expect(mocks.fetchPayment).not.toHaveBeenCalled();
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
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
