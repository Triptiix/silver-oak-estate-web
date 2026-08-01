// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  beginPaymentWebhook: vi.fn(),
  completePaymentWebhook: vi.fn(),
  finalizeVerifiedPayment: vi.fn(),
  markProviderPaymentFailed: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));
vi.mock("@/lib/payments/database", () => mocks);
vi.mock("@/lib/payments/crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/crypto")>();
  return {
    ...actual,
    verifyWebhookSignature: mocks.verifyWebhookSignature,
  };
});

import { NextRequest } from "next/server";
import { POST } from "@/app/api/payments/webhook/route";

const MAX_WEBHOOK_BYTES = 256_000;

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

function streamedRequest(
  chunks: Uint8Array[],
  options: { contentLength?: string; failAtChunk?: number } = {},
) {
  let chunksRead = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (options.failAtChunk === chunksRead) {
        controller.error(new Error("private stream failure detail"));
        return;
      }
      const chunk = chunks[chunksRead];
      if (!chunk) {
        controller.close();
        return;
      }
      chunksRead += 1;
      controller.enqueue(chunk);
    },
    cancel() {
      cancelled = true;
    },
  }, { highWaterMark: 0 });
  const headers = new Headers({
    "content-type": "application/json",
    "x-razorpay-event-id": "event_test_1",
    "x-razorpay-signature": "0".repeat(64),
  });
  if (options.contentLength !== undefined) {
    headers.set("content-length", options.contentLength);
  }
  return {
    request: new NextRequest("http://localhost/api/payments/webhook", {
      method: "POST",
      headers,
      body,
      duplex: "half",
    }),
    chunksRead: () => chunksRead,
    cancelled: () => cancelled,
  };
}

function expectNoDownstreamWork() {
  expect(mocks.verifyWebhookSignature).not.toHaveBeenCalled();
  expect(mocks.beginPaymentWebhook).not.toHaveBeenCalled();
  expect(mocks.finalizeVerifiedPayment).not.toHaveBeenCalled();
  expect(mocks.markProviderPaymentFailed).not.toHaveBeenCalled();
}

describe("payment webhook API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyWebhookSignature.mockImplementation(
      (rawBody: Uint8Array, signature: string, secret: string) => {
        const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
        return signature === expected;
      },
    );
    mocks.beginPaymentWebhook.mockResolvedValue({
      created: true,
      shouldProcess: true,
      processingStatus: "pending",
    });
    mocks.completePaymentWebhook.mockResolvedValue(undefined);
    mocks.finalizeVerifiedPayment.mockResolvedValue({
      result: "payment_received",
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

  it("stops a missing-length stream as soon as it crosses the byte limit", async () => {
    const stream = streamedRequest([
      new Uint8Array(MAX_WEBHOOK_BYTES),
      new Uint8Array([1]),
      new Uint8Array([2]),
    ]);

    const response = await POST(stream.request);

    expect(response.status).toBe(413);
    expect(stream.chunksRead()).toBe(2);
    expect(stream.cancelled()).toBe(true);
    expectNoDownstreamWork();
  });

  it.each([
    ["understated", "1"],
    ["malformed", "not-a-number"],
  ])("enforces the streamed limit with %s Content-Length", async (_name, contentLength) => {
    const stream = streamedRequest(
      [new Uint8Array(MAX_WEBHOOK_BYTES), new Uint8Array([1])],
      { contentLength },
    );

    const response = await POST(stream.request);

    expect(response.status).toBe(413);
    expectNoDownstreamWork();
  });

  it("rejects a declared oversized body before reading its stream", async () => {
    const stream = streamedRequest([new Uint8Array([1])], {
      contentLength: String(MAX_WEBHOOK_BYTES + 1),
    });

    const response = await POST(stream.request);

    expect(response.status).toBe(413);
    expect(stream.chunksRead()).toBe(0);
    expectNoDownstreamWork();
  });

  it("allows a body exactly at the raw-byte limit to reach signature verification", async () => {
    const stream = streamedRequest([new Uint8Array(MAX_WEBHOOK_BYTES)]);

    const response = await POST(stream.request);

    expect(response.status).toBe(400);
    expect(mocks.verifyWebhookSignature).toHaveBeenCalledOnce();
    expect(mocks.verifyWebhookSignature.mock.calls[0]?.[0]).toHaveLength(MAX_WEBHOOK_BYTES);
    expect(mocks.beginPaymentWebhook).not.toHaveBeenCalled();
  });

  it("counts multi-byte UTF-8 input by raw bytes", async () => {
    const multiByte = new TextEncoder().encode("€".repeat(90_000));
    expect("€".repeat(90_000)).toHaveLength(90_000);
    expect(multiByte.byteLength).toBeGreaterThan(MAX_WEBHOOK_BYTES);
    const stream = streamedRequest([multiByte]);

    const response = await POST(stream.request);

    expect(response.status).toBe(413);
    expectNoDownstreamWork();
  });

  it("preserves exact bounded bytes for signature verification", async () => {
    const raw = new TextEncoder().encode(
      '{\n  "event":"refund.created", "payload":{}, "note":"€" \n}',
    );
    const signature = createHmac("sha256", "dummy").update(raw).digest("hex");
    const stream = streamedRequest([raw.subarray(0, 17), raw.subarray(17)]);
    stream.request.headers.set("x-razorpay-signature", signature);

    const response = await POST(stream.request);

    expect(response.status).toBe(200);
    expect(Buffer.from(mocks.verifyWebhookSignature.mock.calls[0]?.[0])).toEqual(Buffer.from(raw));
    expect(mocks.verifyWebhookSignature).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      signature,
      "dummy",
    );
    expect(mocks.completePaymentWebhook).toHaveBeenCalledWith("event_test_1", "processed");
  });

  it("returns a generic response when the body stream fails", async () => {
    const stream = streamedRequest(
      [new TextEncoder().encode('{"event":')],
      { failAtChunk: 1 },
    );

    const response = await POST(stream.request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ received: false });
    expectNoDownstreamWork();
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
