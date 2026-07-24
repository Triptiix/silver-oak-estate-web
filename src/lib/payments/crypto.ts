import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function safeHexEqual(actual: string, expected: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(actual)) return false;
  const left = Buffer.from(actual.toLowerCase(), "hex");
  const right = Buffer.from(expected.toLowerCase(), "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`, "utf8")
    .digest("hex");
  return safeHexEqual(signature, expected);
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return safeHexEqual(signature, expected);
}

export function hashWebhookPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}

