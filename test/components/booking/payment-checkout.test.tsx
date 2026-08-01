import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentCheckout } from "../../../src/components/booking/payment-checkout";

vi.mock("next/script", () => ({
  default: ({ onLoad }: { onLoad: () => void }) => (
    <button type="button" onClick={onLoad}>Load checkout</button>
  ),
}));

type CheckoutOptions = {
  handler: (result: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
};

describe("PaymentCheckout", () => {
  let checkoutOptions: CheckoutOptions | null;

  beforeEach(() => {
    vi.restoreAllMocks();
    checkoutOptions = null;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        state: "checkout_ready",
        keyId: "rzp_test_dummy",
        providerOrderId: "order_test_1",
        bookingReference: "REF-123",
        amountPaise: 500000,
        currency: "INR",
        holdExpiresAt: new Date(Date.now() + 600000).toISOString(),
      }),
    });
    window.Razorpay = class {
      constructor(options: Record<string, unknown>) {
        checkoutOptions = options as CheckoutOptions;
      }
      open() {}
      on() {}
    } as typeof window.Razorpay;
  });

  async function openCheckout() {
    fireEvent.click(screen.getByRole("button", { name: "Load checkout" }));
    fireEvent.click(screen.getByRole("button", { name: /Pay .* securely/ }));
    await waitFor(() => expect(checkoutOptions).not.toBeNull());
  }

  it.each(["payment_received", "recovery_required"] as const)(
    "treats %s as a final payment state",
    async (state) => {
      const onFinalState = vi.fn();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state, bookingReference: "REF-123" }),
      } as Response);
      render(
        <PaymentCheckout
          advanceAmountPaise={500000}
          bookingReference="REF-123"
          onFinalState={onFinalState}
        />,
      );
      await openCheckout();

      checkoutOptions!.handler({
        razorpay_order_id: "order_test_1",
        razorpay_payment_id: "pay_test_1",
        razorpay_signature: "a".repeat(64),
      });

      await waitFor(() => expect(onFinalState).toHaveBeenCalledWith({
        state,
        bookingReference: "REF-123",
      }));
    },
  );

  it("warns against duplicate payment when verification remains pending", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: "payment_pending", bookingReference: "REF-123" }),
    } as Response);
    render(
      <PaymentCheckout
        advanceAmountPaise={500000}
        bookingReference="REF-123"
        onFinalState={vi.fn()}
      />,
    );
    await openCheckout();

    checkoutOptions!.handler({
      razorpay_order_id: "order_test_1",
      razorpay_payment_id: "pay_test_1",
      razorpay_signature: "a".repeat(64),
    });

    expect(await screen.findByText(/Payment status is being checked/i)).toBeInTheDocument();
    expect(screen.getByText(/Do not retry payment blindly/i)).toBeInTheDocument();
    expect(screen.getByText(/Written confirmation has not been issued/i)).toBeInTheDocument();
  });
});
