import { NextRequest, NextResponse } from "next/server";
import { bookingError } from "@/lib/booking/api-errors";
import { hasAllowedOrigin } from "@/lib/booking/security";
import { HOLD_COOKIE_NAME } from "@/lib/booking/hold-cookie";
import { verifyHoldToken } from "@/lib/booking/hold-token";
import { envClient } from "@/lib/env/client";
import { envServer } from "@/lib/env/server";
import { assertPaymentConfiguration } from "@/lib/payments/config";
import {
  attachProviderOrder,
  markCheckoutStarted,
  markOrderFailed,
  preparePaymentOrder,
} from "@/lib/payments/database";
import { createRazorpayGateway, PaymentProviderError } from "@/lib/payments/razorpay";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

export async function POST(request: NextRequest) {
  if (!hasAllowedOrigin(request, envClient.NEXT_PUBLIC_SITE_URL)) {
    return bookingError(403, "ORIGIN_REJECTED", "Request origin was rejected.");
  }

  const token = request.cookies.get(HOLD_COOKIE_NAME)?.value;
  if (!token) return bookingError(400, "INVALID_HOLD", "No active hold was found.");

  let hold: { bookingId: string; nonce: string };
  try {
    hold = verifyHoldToken(token, envServer.BOOKING_TOKEN_SECRET);
  } catch {
    return bookingError(400, "INVALID_HOLD", "No active hold was found.");
  }

  let paymentId: string | undefined;
  try {
    const config = assertPaymentConfiguration();
    let prepared = await preparePaymentOrder(hold.bookingId, hold.nonce);
    paymentId = prepared.paymentId;

    if (!prepared.providerOrderId) {
      const provider = createRazorpayGateway(config);
      const order = await provider.createOrder({
        amountPaise: prepared.amountPaise,
        currency: prepared.currency,
        receipt: prepared.providerReceipt,
      });
      if (
        order.amount !== prepared.amountPaise
        || order.currency.toUpperCase() !== prepared.currency
        || (order.receipt && order.receipt !== prepared.providerReceipt)
      ) {
        throw new PaymentProviderError("invalid_response");
      }
      prepared = await attachProviderOrder(
        prepared.paymentId,
        order.id,
        order.amount,
        order.currency,
      );
    }

    await markCheckoutStarted(prepared.paymentId);
    return NextResponse.json(
      {
        state: "checkout_ready",
        keyId: config.keyId,
        providerOrderId: prepared.providerOrderId,
        bookingReference: prepared.bookingReference,
        amountPaise: prepared.amountPaise,
        currency: prepared.currency,
        holdExpiresAt: prepared.holdExpiresAt,
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (
      paymentId
      && error instanceof PaymentProviderError
      && error.category === "rejected"
    ) {
      await markOrderFailed(paymentId, error.category).catch(() => undefined);
    }
    if (error instanceof PaymentProviderError) {
      return bookingError(503, "PAYMENT_UNAVAILABLE", "Payment could not be started. Please try again.");
    }
    const message = error instanceof Error ? error.message : "";
    if (message.includes("payment_hold_ineligible")) {
      return bookingError(409, "INVALID_HOLD", "The booking hold is no longer eligible.");
    }
    if (message.includes("payment_recovery_required")) {
      return bookingError(409, "PAYMENT_RECOVERY_REQUIRED", "This payment requires review.");
    }
    return bookingError(500, "SERVER_ERROR", "Payment could not be started.");
  }
}
