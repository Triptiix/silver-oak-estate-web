import "server-only";
import { envServer } from "@/lib/env/server";

function assertRazorpayTestPhase() {
  if (envServer.APP_ENV === "production") {
    throw new Error("Online payments are unavailable in production during Phase 6C.1.");
  }
  if (envServer.PAYMENT_PROVIDER !== "razorpay") {
    throw new Error("Payment provider is unavailable.");
  }
  if (envServer.PAYMENT_PROVIDER_MODE !== "test") {
    throw new Error("Only Razorpay test mode is permitted.");
  }
}

export function assertPaymentConfiguration() {
  assertRazorpayTestPhase();
  if (!envServer.RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    throw new Error("Razorpay test credentials are required.");
  }
  return {
    keyId: envServer.RAZORPAY_KEY_ID,
    keySecret: envServer.RAZORPAY_KEY_SECRET,
  };
}

export function assertPaymentWebhookConfiguration() {
  assertRazorpayTestPhase();
  return {
    webhookSecret: envServer.RAZORPAY_WEBHOOK_SECRET,
  };
}
