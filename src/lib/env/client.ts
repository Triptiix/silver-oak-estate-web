import { z } from "zod";
import { parseEnvironment, parseEnvironmentField } from "./validation";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
});

export type ClientEnvironment = z.infer<typeof clientEnvSchema>;

export function parseClientEnvironment(rawEnvironment: Record<string, unknown>): ClientEnvironment {
  return parseEnvironment(clientEnvSchema, rawEnvironment);
}

function readClientField<K extends keyof ClientEnvironment>(
  key: K,
  rawValue: unknown,
): ClientEnvironment[K] {
  return parseEnvironmentField(key, clientEnvSchema.shape[key], rawValue) as ClientEnvironment[K];
}

export const envClient: ClientEnvironment = {
  get NEXT_PUBLIC_SITE_URL() {
    return readClientField("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL);
  },
  get NEXT_PUBLIC_SUPABASE_URL() {
    return readClientField("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return readClientField("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get NEXT_PUBLIC_TURNSTILE_SITE_KEY() {
    return readClientField("NEXT_PUBLIC_TURNSTILE_SITE_KEY", process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  },
  get NEXT_PUBLIC_RAZORPAY_KEY_ID() {
    return readClientField("NEXT_PUBLIC_RAZORPAY_KEY_ID", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  },
};
