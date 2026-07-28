// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createHold: vi.fn(),
  verifyTurnstile: vi.fn(),
  preparePaymentOrder: vi.fn(),
  attachProviderOrder: vi.fn(),
  markCheckoutStarted: vi.fn(),
  markOrderFailed: vi.fn(),
  createOrder: vi.fn(),
}));

vi.mock("@/lib/booking/database", () => ({
  createHold: mocks.createHold,
}));
vi.mock("@/lib/booking/turnstile", () => ({
  verifyTurnstile: mocks.verifyTurnstile,
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
import { POST as createBookingHold } from "@/app/api/bookings/hold/route";
import { POST as createPaymentOrder } from "@/app/api/payments/order/route";

function holdRequest() {
  return new NextRequest("http://localhost/api/bookings/hold", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

function paymentRequest() {
  return new NextRequest("http://localhost/api/payments/order", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
    },
  });
}

beforeEach(() => {
  process.env.ONLINE_BOOKING_ENABLED = "false";
  vi.clearAllMocks();
});

describe("public booking API capability gate", () => {
  it("rejects hold creation before reading the body or performing downstream work", async () => {
    const request = holdRequest();
    const getReader = vi.spyOn(request.body!, "getReader");

    const response = await createBookingHold(request);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "BOOKING_UNAVAILABLE",
        message: "Online booking is currently unavailable. Contact our team for assistance.",
      },
    });
    expect(getReader).not.toHaveBeenCalled();
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.createHold).not.toHaveBeenCalled();
  });

  it("rejects new payment orders before hold, database or provider work", async () => {
    const response = await createPaymentOrder(paymentRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "BOOKING_UNAVAILABLE",
        message: "Online booking is currently unavailable. Contact our team for assistance.",
      },
    });
    expect(mocks.preparePaymentOrder).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect(mocks.markCheckoutStarted).not.toHaveBeenCalled();
  });
});
