import type { ManualPaymentCandidate } from "./manual-payment-verification-form";
import type { AdminUiRole } from "./form-helpers";

type CandidatePayment = {
  provider: string;
  status: string;
  amountPaise: number;
  currency: string;
};

export function resolveManualPaymentCandidate(
  role: AdminUiRole,
  bookingReference: string,
  payments: readonly CandidatePayment[],
): ManualPaymentCandidate | null {
  if (role !== "admin" && role !== "super_admin") return null;
  const payment = payments.at(-1);
  if (
    !payment
    || !["manual_upi", "payment_link"].includes(payment.provider)
    || !["pending", "expired"].includes(payment.status)
  ) {
    return null;
  }
  return {
    bookingReference,
    provider: payment.provider as ManualPaymentCandidate["provider"],
    paymentStatus: payment.status as ManualPaymentCandidate["paymentStatus"],
    expectedAmountPaise: payment.amountPaise,
    currency: payment.currency,
  };
}
