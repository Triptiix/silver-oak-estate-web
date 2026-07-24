import { NextRequest, NextResponse } from "next/server";
import { bookingError } from "@/lib/booking/api-errors";
import { hasAllowedOrigin } from "@/lib/booking/security";
import { HOLD_COOKIE_NAME, holdCookieOptions } from "@/lib/booking/hold-cookie";
import { envClient } from "@/lib/env/client";
import { envServer } from "@/lib/env/server";
import { assertPaymentConfiguration } from "@/lib/payments/config";
import { verifyCheckoutSignature } from "@/lib/payments/crypto";
import { finalizeVerifiedPayment } from "@/lib/payments/database";
import { createRazorpayGateway } from "@/lib/payments/razorpay";
import { verifyPaymentRequestSchema } from "@/lib/payments/schemas";

function clearHoldCookie(response: NextResponse) {
  response.cookies.set(HOLD_COOKIE_NAME, "", {
    ...holdCookieOptions(envServer.APP_ENV === "production"),
    maxAge: 0,
  });
  return response;
}

export async function POST(request: NextRequest) {
  if (!hasAllowedOrigin(request, envClient.NEXT_PUBLIC_SITE_URL)) {
    return bookingError(403, "ORIGIN_REJECTED", "Request origin was rejected.");
  }

  const parsed = verifyPaymentRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return bookingError(400, "INVALID_REQUEST", "Payment verification details were invalid.");
  }

  try {
    const config = assertPaymentConfiguration();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
    if (!verifyCheckoutSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      config.keySecret,
    )) {
      return bookingError(400, "PAYMENT_VERIFICATION_FAILED", "Payment could not be verified.");
    }

    const providerPayment = await createRazorpayGateway(config).fetchPayment(razorpay_payment_id);
    if (
      providerPayment.id !== razorpay_payment_id
      || providerPayment.order_id !== razorpay_order_id
      || !["authorized", "captured"].includes(providerPayment.status)
    ) {
      return bookingError(400, "PAYMENT_VERIFICATION_FAILED", "Payment could not be verified.");
    }

    const result = await finalizeVerifiedPayment({
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
      amountPaise: providerPayment.amount,
      currency: providerPayment.currency.toUpperCase(),
      financialStatus: providerPayment.status as "authorized" | "captured",
      source: "browser",
    });

    const response = NextResponse.json(
      { state: result.result, bookingReference: result.bookingReference },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
    return result.result === "payment_pending" ? response : clearHoldCookie(response);
  } catch {
    return bookingError(500, "SERVER_ERROR", "Payment verification is still pending.");
  }
}

