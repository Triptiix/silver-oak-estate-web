import type { ManualPaymentCandidate } from "./manual-payment-verification-form";
import type { AdminUiRole } from "./form-helpers";

type CandidatePayment = {
  provider: string;
  status: string;
  amountPaise: number;
  currency: string;
};

const eligibleProviders = ["manual_upi", "payment_link"];
const eligibleStatuses = ["pending", "expired"];

/**
 * A payment attempt qualifies for manual verification only when it is a
 * manual-UPI or payment-link attempt that is still pending or has expired.
 * This is the single source of truth shared by the diagnosis page and
 * `resolveManualPaymentCandidate`.
 */
export function isEligibleManualPayment(
  payment: { provider: string; status: string } | null | undefined,
): boolean {
  return Boolean(
    payment
      && eligibleProviders.includes(payment.provider)
      && eligibleStatuses.includes(payment.status),
  );
}

export function resolveManualPaymentCandidate(
  role: AdminUiRole,
  bookingReference: string,
  payments: readonly CandidatePayment[],
): ManualPaymentCandidate | null {
  if (role !== "admin" && role !== "super_admin") return null;
  const payment = payments.at(-1);
  if (!payment || !isEligibleManualPayment(payment)) {
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
