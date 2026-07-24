import "server-only";
import { z } from "zod";

const RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1";

const orderSchema = z.object({
  id: z.string().min(3).max(128),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  receipt: z.string().min(1).max(40).nullable().optional(),
  status: z.string(),
});

const paymentSchema = z.object({
  id: z.string().min(3).max(128),
  order_id: z.string().min(3).max(128),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  status: z.enum(["created", "authorized", "captured", "refunded", "failed"]),
  captured: z.boolean(),
});

export type ProviderOrder = z.infer<typeof orderSchema>;
export type ProviderPayment = z.infer<typeof paymentSchema>;

export class PaymentProviderError extends Error {
  constructor(public readonly category: "timeout" | "rejected" | "invalid_response" | "unavailable") {
    super("Payment provider request failed.");
  }
}

type RazorpayGatewayOptions = {
  keyId: string;
  keySecret: string;
  fetchImpl?: typeof fetch;
};

export function createRazorpayGateway({
  keyId,
  keySecret,
  fetchImpl = fetch,
}: RazorpayGatewayOptions) {
  const authorization = `Basic ${Buffer.from(`${keyId}:${keySecret}`, "utf8").toString("base64")}`;

  async function providerFetch(path: string, init: RequestInit): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImpl(`${RAZORPAY_API_BASE_URL}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: authorization,
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
        throw new PaymentProviderError("timeout");
      }
      throw new PaymentProviderError("unavailable");
    }
    if (!response.ok) {
      throw new PaymentProviderError(response.status >= 500 ? "unavailable" : "rejected");
    }
    try {
      return await response.json();
    } catch {
      throw new PaymentProviderError("invalid_response");
    }
  }

  return {
    async createOrder(input: {
      amountPaise: number;
      currency: string;
      receipt: string;
    }): Promise<ProviderOrder> {
      const data = await providerFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: input.amountPaise,
          currency: input.currency,
          receipt: input.receipt,
        }),
      });
      const parsed = orderSchema.safeParse(data);
      if (!parsed.success) throw new PaymentProviderError("invalid_response");
      return parsed.data;
    },

    async fetchPayment(paymentId: string): Promise<ProviderPayment> {
      const data = await providerFetch(`/payments/${encodeURIComponent(paymentId)}`, {
        method: "GET",
      });
      const parsed = paymentSchema.safeParse(data);
      if (!parsed.success) throw new PaymentProviderError("invalid_response");
      return parsed.data;
    },
  };
}
