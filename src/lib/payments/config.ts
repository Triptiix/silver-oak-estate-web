import "server-only";
import { envClient } from "@/lib/env/client";
import { envServer } from "@/lib/env/server";

export function assertPaymentConfiguration() {
  if (envServer.PAYMENT_PROVIDER !== "razorpay") {
    throw new Error("Payment provider is unavailable.");
  }
  if (envServer.PAYMENT_MODE === "test" && !envClient.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    throw new Error("Razorpay test credentials are required.");
  }
  if (envServer.PAYMENT_MODE === "live" && envServer.APP_ENV !== "production") {
    throw new Error("Live payment mode is not permitted outside production.");
  }
  return {
    keyId: envClient.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    keySecret: envServer.RAZORPAY_KEY_SECRET,
    webhookSecret: envServer.PAYMENT_WEBHOOK_SECRET,
  };
}

