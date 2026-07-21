import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  PAYMENT_PROVIDER: z.string().default("razorpay"),
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

export const envServer = (() => {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorPaths = result.error.issues.map(issue => issue.path.join(".")).join(", ");
    throw new Error(`Environment validation failed for variables: ${errorPaths}`);
  }
  return result.data;
})();
