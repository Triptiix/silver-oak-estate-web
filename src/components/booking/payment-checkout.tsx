"use client";

import Script from "next/script";
import { useState } from "react";
import { formatInrFromPaise } from "@/lib/booking/format";
import type {
  PaymentOrderResponse,
  PaymentVerificationResponse,
  RazorpayCheckoutResult,
} from "@/types/payment";

type RazorpayInstance = {
  open(): void;
  on(event: "payment.failed", callback: () => void): void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

type CheckoutState =
  | "idle"
  | "starting"
  | "checkout_open"
  | "verifying"
  | "payment_pending"
  | "failed";

export function PaymentCheckout({
  advanceAmountPaise,
  bookingReference,
  onFinalState,
}: {
  advanceAmountPaise: number;
  bookingReference: string;
  onFinalState: (result: PaymentVerificationResponse) => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<CheckoutState>("idle");

  async function verifyPayment(result: RazorpayCheckoutResult) {
    setState("verifying");
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!response.ok) {
        setState("payment_pending");
        return;
      }
      const verified = await response.json() as PaymentVerificationResponse;
      if (verified.state === "payment_received" || verified.state === "recovery_required") {
        onFinalState(verified);
      } else {
        setState("payment_pending");
      }
    } catch {
      setState("payment_pending");
    }
  }

  async function startCheckout() {
    if (!window.Razorpay || state === "starting" || state === "verifying") return;
    setState("starting");
    try {
      const response = await fetch("/api/payments/order", { method: "POST" });
      if (!response.ok) {
        setState("failed");
        return;
      }
      const order = await response.json() as PaymentOrderResponse;
      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.providerOrderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Silver Oak Estate",
        description: `Booking advance · ${bookingReference}`,
        handler: verifyPayment,
        modal: {
          ondismiss: () => setState("idle"),
        },
        theme: { color: "#1e293b" },
      });
      checkout.on("payment.failed", () => setState("failed"));
      setState("checkout_open");
      checkout.open();
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setState("failed")}
      />
      <button
        type="button"
        onClick={startCheckout}
        disabled={!scriptReady || state === "starting" || state === "verifying"}
        className="w-full px-6 py-3 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none"
      >
        {state === "starting" ? "Preparing secure checkout…"
          : state === "verifying" ? "Verifying payment…"
            : `Pay ${formatInrFromPaise(advanceAmountPaise)} securely`}
      </button>
      <div className="text-sm text-center" aria-live="polite">
        {state === "checkout_open" && (
          <p className="text-slate-600">Complete payment in the secure Razorpay window.</p>
        )}
        {state === "payment_pending" && (
          <p className="text-amber-800">
            Payment status is being checked. Do not retry payment blindly. Written confirmation
            has not been issued; contact Silver Oak Estate with your booking reference.
          </p>
        )}
        {state === "failed" && (
          <p className="text-red-700">Payment could not be completed. Your booking is not confirmed.</p>
        )}
      </div>
    </div>
  );
}
