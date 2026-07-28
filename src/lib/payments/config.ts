import "server-only";
import { envServer } from "@/lib/env/server";

export function assertPaymentConfiguration() {
  if (envServer.PAYMENT_PROVIDER !== "razorpay") {
    throw new Error("Payment provider is unavailable.");
  }
  if (envServer.PAYMENT_PROVIDER_MODE !== "test") {
    throw new Error("Only Razorpay test mode is permitted.");
  }
  if (!envServer.RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    throw new Error("Razorpay test credentials are required.");
  }
  return {
    keyId: envServer.RAZORPAY_KEY_ID,
    keySecret: envServer.RAZORPAY_KEY_SECRET,
  };
}

export function assertPaymentWebhookConfiguration() {
  if (envServer.PAYMENT_PROVIDER !== "razorpay") {
    throw new Error("Payment provider is unavailable.");
  }
  return {
    webhookSecret: envServer.RAZORPAY_WEBHOOK_SECRET,
  };
}
