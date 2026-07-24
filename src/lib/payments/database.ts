import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type PreparedPaymentOrder = {
  paymentId: string;
  providerReceipt: string;
  providerOrderId: string | null;
  bookingReference: string;
  amountPaise: number;
  currency: string;
  holdExpiresAt: string;
  reused: boolean;
};

export type FinalizationResult = {
  result: "payment_pending" | "confirmed" | "recovery_required";
  bookingReference: string;
};

async function rpc<T>(name: string, values: Record<string, unknown>): Promise<T> {
  const { data, error } = await createServiceRoleClient().rpc(name as never, values as never);
  if (error) throw error;
  return data as T;
}

export function preparePaymentOrder(bookingId: string, nonce: string) {
  return rpc<PreparedPaymentOrder>("prepare_payment_order", {
    p_booking_id: bookingId,
    p_hold_token_nonce: nonce,
    p_provider: "razorpay",
  });
}

export function attachProviderOrder(
  paymentId: string,
  providerOrderId: string,
  amountPaise: number,
  currency: string,
) {
  return rpc<PreparedPaymentOrder>("attach_provider_order", {
    p_payment_id: paymentId,
    p_provider_order_id: providerOrderId,
    p_amount_paise: amountPaise,
    p_currency: currency,
  });
}

export function markCheckoutStarted(paymentId: string) {
  return rpc<void>("mark_payment_checkout_started", { p_payment_id: paymentId });
}

export function markOrderFailed(paymentId: string, category: string) {
  return rpc<void>("mark_payment_order_failed", {
    p_payment_id: paymentId,
    p_failure_category: category,
  });
}

export function finalizeVerifiedPayment(input: {
  providerOrderId: string;
  providerPaymentId: string;
  amountPaise: number;
  currency: string;
  financialStatus: "authorized" | "captured";
  source: "browser" | "webhook" | "administrator";
  providerEventId?: string;
}) {
  return rpc<FinalizationResult>("finalize_verified_payment", {
    p_provider: "razorpay",
    p_provider_order_id: input.providerOrderId,
    p_provider_payment_id: input.providerPaymentId,
    p_amount_paise: input.amountPaise,
    p_currency: input.currency,
    p_financial_status: input.financialStatus,
    p_verification_source: input.source,
    p_provider_event_id: input.providerEventId ?? null,
  });
}

export function markProviderPaymentFailed(
  providerOrderId: string,
  providerPaymentId: string,
  providerEventId?: string,
) {
  return rpc<boolean>("mark_provider_payment_failed", {
    p_provider: "razorpay",
    p_provider_order_id: providerOrderId,
    p_provider_payment_id: providerPaymentId,
    p_provider_event_id: providerEventId ?? null,
  });
}

export function beginPaymentWebhook(input: {
  eventId: string;
  eventType: string;
  payloadHash: string;
  payloadRedacted: Record<string, string | null>;
}) {
  return rpc<{ created: boolean; shouldProcess: boolean; processingStatus: string }>(
    "begin_payment_webhook",
    {
      p_provider: "razorpay",
      p_provider_event_id: input.eventId,
      p_event_type: input.eventType,
      p_payload_hash: input.payloadHash,
      p_payload_redacted: input.payloadRedacted,
    },
  );
}

export function completePaymentWebhook(
  eventId: string,
  status: "processed" | "failed",
  errorCategory?: string,
) {
  return rpc<void>("complete_payment_webhook", {
    p_provider: "razorpay",
    p_provider_event_id: eventId,
    p_processing_status: status,
    p_error_category: errorCategory ?? null,
  });
}
