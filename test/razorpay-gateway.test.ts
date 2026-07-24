// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createRazorpayGateway, PaymentProviderError } from "@/lib/payments/razorpay";

describe("Razorpay server adapter", () => {
  it("creates an order using only server-owned money and receipt fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "order_test_1",
      amount: 500000,
      currency: "INR",
      receipt: "SOE-receipt",
      status: "created",
    }), { status: 200 }));
    const gateway = createRazorpayGateway({
      keyId: "rzp_test_public",
      keySecret: "private-secret",
      fetchImpl,
    });
    await expect(gateway.createOrder({
      amountPaise: 500000,
      currency: "INR",
      receipt: "SOE-receipt",
    })).resolves.toMatchObject({ id: "order_test_1" });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.razorpay.com/v1/orders");
    expect(JSON.parse(String(init.body))).toEqual({
      amount: 500000,
      currency: "INR",
      receipt: "SOE-receipt",
    });
    expect(String(init.body)).not.toContain("private-secret");
  });

  it("fetches only the authoritative payment fields and strips provider PII", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "pay_test_1",
      order_id: "order_test_1",
      amount: 500000,
      currency: "INR",
      status: "captured",
      captured: true,
      email: "customer@example.com",
      contact: "+919999000001",
      card: { last4: "1234" },
    }), { status: 200 }));
    const result = await createRazorpayGateway({
      keyId: "rzp_test_public",
      keySecret: "private-secret",
      fetchImpl,
    }).fetchPayment("pay_test_1");
    expect(result).toEqual({
      id: "pay_test_1",
      order_id: "order_test_1",
      amount: 500000,
      currency: "INR",
      status: "captured",
      captured: true,
    });
  });

  it("maps provider server failure to an ambiguous bounded category", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { description: "sensitive provider detail" } }),
      { status: 500 },
    ));
    await expect(createRazorpayGateway({
      keyId: "rzp_test_public",
      keySecret: "private-secret",
      fetchImpl,
    }).createOrder({
      amountPaise: 500000,
      currency: "INR",
      receipt: "SOE-receipt",
    })).rejects.toEqual(new PaymentProviderError("unavailable"));
  });
});
