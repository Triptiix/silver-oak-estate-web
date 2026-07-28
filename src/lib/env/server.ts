import "server-only";
import { z } from "zod";
import { parseEnvironment, parseEnvironmentField } from "./validation";

export const serverEnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  ONLINE_BOOKING_ENABLED: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
  PAYMENT_PROVIDER: z.string().default("razorpay"),
  PAYMENT_MODE: z.enum(["test", "live"]).default("test"),
  BOOKING_HOLD_MINUTES: z.coerce.number().int().default(10),
  MANUAL_PAYMENT_HOLD_MINUTES: z.coerce.number().int().default(30),
  DATABASE_CRON_ENABLED: z.enum(["true", "false"]).default("true").transform(value => value === "true"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  PAYMENT_WEBHOOK_SECRET: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  BOOKING_TOKEN_SECRET: z.string().min(1),
  ICAL_FEED_SECRET: z.string().min(1),
  EMAIL_API_KEY: z.string().min(1),
  EMAIL_SENDER: z.string().email(),
  ADMIN_NOTIFICATION_RECIPIENTS: z.string(),
  CRON_SECRET: z.string().min(1),
  ERROR_MONITORING_DSN: z.string().url().optional(),
  WHATSAPP_API_KEY: z.string().optional(),
  PMS_API_KEY: z.string().optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvSchema>;

export function parseServerEnvironment(rawEnvironment: Record<string, unknown>): ServerEnvironment {
  return parseEnvironment(serverEnvSchema, rawEnvironment);
}

function readServerField<K extends keyof ServerEnvironment>(key: K): ServerEnvironment[K] {
  return parseEnvironmentField(
    key,
    serverEnvSchema.shape[key],
    process.env[key],
  ) as ServerEnvironment[K];
}

export const envServer: ServerEnvironment = {
  get APP_ENV() { return readServerField("APP_ENV"); },
  get APP_TIMEZONE() { return readServerField("APP_TIMEZONE"); },
  get ONLINE_BOOKING_ENABLED() { return readServerField("ONLINE_BOOKING_ENABLED"); },
  get PAYMENT_PROVIDER() { return readServerField("PAYMENT_PROVIDER"); },
  get PAYMENT_MODE() { return readServerField("PAYMENT_MODE"); },
  get BOOKING_HOLD_MINUTES() { return readServerField("BOOKING_HOLD_MINUTES"); },
  get MANUAL_PAYMENT_HOLD_MINUTES() { return readServerField("MANUAL_PAYMENT_HOLD_MINUTES"); },
  get DATABASE_CRON_ENABLED() { return readServerField("DATABASE_CRON_ENABLED"); },
  get SUPABASE_SERVICE_ROLE_KEY() { return readServerField("SUPABASE_SERVICE_ROLE_KEY"); },
  get RAZORPAY_KEY_SECRET() { return readServerField("RAZORPAY_KEY_SECRET"); },
  get PAYMENT_WEBHOOK_SECRET() { return readServerField("PAYMENT_WEBHOOK_SECRET"); },
  get TURNSTILE_SECRET_KEY() { return readServerField("TURNSTILE_SECRET_KEY"); },
  get BOOKING_TOKEN_SECRET() { return readServerField("BOOKING_TOKEN_SECRET"); },
  get ICAL_FEED_SECRET() { return readServerField("ICAL_FEED_SECRET"); },
  get EMAIL_API_KEY() { return readServerField("EMAIL_API_KEY"); },
  get EMAIL_SENDER() { return readServerField("EMAIL_SENDER"); },
  get ADMIN_NOTIFICATION_RECIPIENTS() { return readServerField("ADMIN_NOTIFICATION_RECIPIENTS"); },
  get CRON_SECRET() { return readServerField("CRON_SECRET"); },
  get ERROR_MONITORING_DSN() { return readServerField("ERROR_MONITORING_DSN"); },
  get WHATSAPP_API_KEY() { return readServerField("WHATSAPP_API_KEY"); },
  get PMS_API_KEY() { return readServerField("PMS_API_KEY"); },
};
