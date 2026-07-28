// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import { parseServerEnvironment } from "@/lib/env/server";
import { config as proxyConfig } from "@/proxy";

const validServerEnvironment = {
  APP_ENV: "staging",
  APP_TIMEZONE: "Asia/Kolkata",
  ONLINE_BOOKING_ENABLED: "false",
  PAYMENT_PROVIDER: "razorpay",
  PAYMENT_MODE: "test",
  BOOKING_HOLD_MINUTES: "10",
  MANUAL_PAYMENT_HOLD_MINUTES: "30",
  DATABASE_CRON_ENABLED: "true",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  RAZORPAY_KEY_SECRET: "razorpay-key-secret",
  PAYMENT_WEBHOOK_SECRET: "payment-webhook-secret",
  TURNSTILE_SECRET_KEY: "turnstile-secret-key",
  BOOKING_TOKEN_SECRET: "booking-token-secret",
  ICAL_FEED_SECRET: "ical-feed-secret",
  EMAIL_API_KEY: "email-api-key",
  EMAIL_SENDER: "bookings@example.com",
  ADMIN_NOTIFICATION_RECIPIENTS: "operations@example.com",
  CRON_SECRET: "cron-secret",
} as const;

describe("audit remediation foundation", () => {
  it("runs the Supabase auth proxy only for administrator routes", () => {
    expect(proxyConfig.matcher).toEqual(["/admin/:path*"]);
  });

  it.each([
    ["BOOKING_HOLD_MINUTES", "0"],
    ["BOOKING_HOLD_MINUTES", "-1"],
    ["MANUAL_PAYMENT_HOLD_MINUTES", "0"],
    ["MANUAL_PAYMENT_HOLD_MINUTES", "-1"],
  ] as const)("rejects non-positive runtime duration %s=%s", (field, value) => {
    expect(() => parseServerEnvironment({
      ...validServerEnvironment,
      [field]: value,
    })).toThrow(field);
  });

  it("publishes a stable explicit public sitemap without the disabled checkout route", () => {
    const entries = sitemap();

    expect(entries.map((entry) => new URL(entry.url).pathname)).toEqual([
      "/",
      "/estate",
      "/experiences",
      "/gallery",
      "/pricing",
      "/location",
      "/policies",
      "/privacy",
      "/terms",
      "/contact",
      "/availability",
    ]);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith("/book"))).toBe(false);
  });
});
