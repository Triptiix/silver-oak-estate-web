import { z } from "zod";

const providerId = z.string().trim().min(3).max(128).regex(/^[A-Za-z0-9_-]+$/);

export const verifyPaymentRequestSchema = z.object({
  razorpay_order_id: providerId,
  razorpay_payment_id: providerId,
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();

const paymentEntitySchema = z.object({
  id: providerId,
  order_id: providerId,
  amount: z.number().int().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  status: z.enum(["created", "authorized", "captured", "refunded", "failed"]),
  captured: z.boolean().optional(),
});

const orderEntitySchema = z.object({
  id: providerId,
  amount: z.number().int().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  status: z.string().optional(),
});

export const razorpayWebhookSchema = z.object({
  event: z.string().trim().min(1).max(100),
  payload: z.object({
    payment: z.object({ entity: paymentEntitySchema }).optional(),
    order: z.object({ entity: orderEntitySchema }).optional(),
  }).passthrough(),
}).passthrough();

export type RazorpayWebhook = z.infer<typeof razorpayWebhookSchema>;
