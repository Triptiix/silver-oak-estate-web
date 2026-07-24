export type PaymentOrderResponse = {
  state: "checkout_ready";
  keyId: string;
  providerOrderId: string;
  bookingReference: string;
  amountPaise: number;
  currency: string;
  holdExpiresAt: string;
};

export type PaymentVerificationResponse = {
  state: "payment_pending" | "confirmed" | "recovery_required";
  bookingReference: string;
};

export type RazorpayCheckoutResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

