// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  beginPaymentWebhook: vi.fn(),
  completePaymentWebhook: vi.fn(),
  finalizeVerifiedPayment: vi.fn(),
  markProviderPaymentFailed: vi.fn(),
}));
vi.mock("@/lib/payments/database", () => mocks);

import { NextRequest } from "next/server";
import { POST } from "@/app/api/payments/webhook/route";

const payload = {
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_test_1",
        order_id: "order_test_1",
        amount: 500000,
        currency: "INR",
        status: "captured",
        captured: true,
        email: "must-not-be-stored@example.com",
        contact: "+919999000001",
      },
    },
  },
};

function request(body: unknown = payload, signatureSecret = "dummy") {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const signature = createHmac("sha256", signatureSecret).update(raw).digest("hex");
  return new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-event-id": "event_test_1",
      "x-razorpay-signature": signature,
    },
    body: raw,
  });
}

describe("payment webhook API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.beginPaymentWebhook.mockResolvedValue({
      created: true,
      shouldProcess: true,
      processingStatus: "pending",
    });
    mocks.completePaymentWebhook.mockResolvedValue(undefined);
    mocks.finalizeVerifiedPayment.mockResolvedValue({
      result: "confirmed",
      bookingReference: "SOE-20260725-ABCD1234",
    });
  });

  it("validates the raw signature, redacts PII, and uses the shared finalizer", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.beginPaymentWebhook).toHaveBeenCalledWith(expect.objectContaining({
      eventId: "event_test_1",
      eventType: "payment.captured",
      payloadRedacted: {
        providerOrderId: "order_test_1",
        providerPaymentId: "pay_test_1",
      },
    }));
    expect(JSON.stringify(mocks.beginPaymentWebhook.mock.calls)).not.toContain("must-not-be-stored");
    expect(JSON.stringify(mocks.beginPaymentWebhook.mock.calls)).not.toContain("+919999");
    expect(mocks.finalizeVerifiedPayment).toHaveBeenCalledWith(expect.objectContaining({
      financialStatus: "captured",
      source: "webhook",
      providerEventId: "event_test_1",
    }));
    expect(mocks.completePaymentWebhook).toHaveBeenCalledWith("event_test_1", "processed");
  });

  it("rejects an invalid signature before recording the event", async () => {
    const response = await POST(request(payload, "wrong-secret"));
    expect(response.status).toBe(400);
    expect(mocks.beginPaymentWebhook).not.toHaveBeenCalled();
  });

  it("acknowledges a processed duplicate without finalizing twice", async () => {
    mocks.beginPaymentWebhook.mockResolvedValue({
      created: false,
      shouldProcess: false,
      processingStatus: "processed",
    });
    const response = await POST(request());
    expect(await response.json()).toEqual({ received: true, duplicate: true });
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
  });

  it("acknowledges unknown signed events without changing payment state", async () => {
    const response = await POST(request({ event: "refund.created", payload: {} }));
    expect(response.status).toBe(200);
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
    expect(mocks.completePaymentWebhook).toHaveBeenCalledWith("event_test_1", "processed");
  });

  it("records a signed payment failure without overwriting successful states in the route", async () => {
    const failed = {
      ...payload,
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            ...payload.payload.payment.entity,
            status: "failed",
            captured: false,
          },
        },
      },
    };
    const response = await POST(request(failed));
    expect(response.status).toBe(200);
    expect(mocks.markProviderPaymentFailed).toHaveBeenCalledWith(
      "order_test_1",
      "pay_test_1",
      "event_test_1",
    );
    expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
  });

  it("returns a generic retryable response and marks a begun event failed", async () => {
    mocks.finalizeVerifiedPayment.mockRejectedValue(new Error("database internal detail"));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ received: false });
    expect(mocks.completePaymentWebhook).toHaveBeenCalledWith(
      "event_test_1",
      "failed",
      "processing_failed",
    );
  });
});
