// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  hashWebhookPayload,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "@/lib/payments/crypto";

describe("payment cryptography", () => {
  it("verifies the provider order and payment signature in constant-shape hex form", () => {
    const expected = createHmac("sha256", "secret")
      .update("order_1|pay_1")
      .digest("hex");
    expect(verifyCheckoutSignature("order_1", "pay_1", expected, "secret")).toBe(true);
    expect(verifyCheckoutSignature("order_2", "pay_1", expected, "secret")).toBe(false);
    expect(verifyCheckoutSignature("order_1", "pay_1", "not-hex", "secret")).toBe(false);
  });

  it("verifies the exact raw webhook bytes and produces a stable hash", () => {
    const raw = '{"event":"payment.captured","value":"नमस्ते"}';
    const signature = createHmac("sha256", "webhook-secret").update(raw).digest("hex");
    expect(verifyWebhookSignature(raw, signature, "webhook-secret")).toBe(true);
    expect(verifyWebhookSignature(`${raw} `, signature, "webhook-secret")).toBe(false);
    expect(hashWebhookPayload(raw)).toMatch(/^[a-f0-9]{64}$/);
  });
});

