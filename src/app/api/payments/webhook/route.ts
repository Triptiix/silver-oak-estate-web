import { NextRequest, NextResponse } from "next/server";
import { assertPaymentConfiguration } from "@/lib/payments/config";
import { hashWebhookPayload, verifyWebhookSignature } from "@/lib/payments/crypto";
import {
  beginPaymentWebhook,
  completePaymentWebhook,
  finalizeVerifiedPayment,
  markProviderPaymentFailed,
} from "@/lib/payments/database";
import { razorpayWebhookSchema } from "@/lib/payments/schemas";

const MAX_WEBHOOK_BYTES = 256_000;
const eventIdPattern = /^[A-Za-z0-9_-]{3,128}$/;

function response(body: Record<string, boolean>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: NextRequest) {
  const eventId = request.headers.get("x-razorpay-event-id");
  const signature = request.headers.get("x-razorpay-signature");
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (
    !eventId
    || !eventIdPattern.test(eventId)
    || !signature
    || (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES)
  ) {
    return response({ received: false }, 400);
  }

  let began = false;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
      return response({ received: false }, 413);
    }
    const config = assertPaymentConfiguration();
    if (!verifyWebhookSignature(rawBody, signature, config.webhookSecret)) {
      return response({ received: false }, 400);
    }

    const parsed = razorpayWebhookSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) return response({ received: false }, 400);

    const webhook = parsed.data;
    const payment = webhook.payload.payment?.entity;
    const order = webhook.payload.order?.entity;
    const receipt = await beginPaymentWebhook({
      eventId,
      eventType: webhook.event,
      payloadHash: hashWebhookPayload(rawBody),
      payloadRedacted: {
        providerOrderId: payment?.order_id ?? order?.id ?? null,
        providerPaymentId: payment?.id ?? null,
      },
    });
    began = true;

    if (!receipt.shouldProcess) return response({ received: true, duplicate: true });

    if (["payment.authorized", "payment.captured", "order.paid"].includes(webhook.event)) {
      if (!payment) throw new Error("payment_entity_missing");
      const financialStatus = webhook.event === "payment.authorized"
        ? "authorized"
        : "captured";
      await finalizeVerifiedPayment({
        providerOrderId: payment.order_id,
        providerPaymentId: payment.id,
        amountPaise: payment.amount,
        currency: payment.currency,
        financialStatus,
        source: "webhook",
        providerEventId: eventId,
      });
    } else if (webhook.event === "payment.failed") {
      if (!payment) throw new Error("payment_entity_missing");
      await markProviderPaymentFailed(payment.order_id, payment.id, eventId);
    }

    await completePaymentWebhook(eventId, "processed");
    return response({ received: true });
  } catch {
    if (began) {
      await completePaymentWebhook(eventId, "failed", "processing_failed").catch(() => undefined);
    }
    return response({ received: false }, 500);
  }
}
