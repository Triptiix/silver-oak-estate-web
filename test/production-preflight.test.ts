import { describe, expect, it } from "vitest";

import {
  evaluateProductionReadiness,
  formatProductionReadinessReport,
} from "../scripts/production-preflight.mjs";

function createEnvironment(overrides: Record<string, string> = {}) {
  return {
    NEXT_PUBLIC_SITE_URL: "https://staging.silveroakestate.online",
    NEXT_PUBLIC_SUPABASE_URL: "https://silver-oak-staging.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key-with-sufficient-length",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "turnstile-site-key-with-sufficient-length",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_validstagingkey",
    APP_ENV: "staging",
    APP_TIMEZONE: "Asia/Kolkata",
    PAYMENT_PROVIDER: "razorpay",
    PAYMENT_MODE: "test",
    BOOKING_HOLD_MINUTES: "10",
    MANUAL_PAYMENT_HOLD_MINUTES: "30",
    DATABASE_CRON_ENABLED: "true",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-secret-with-sufficient-length",
    RAZORPAY_KEY_SECRET: "razorpay-secret-with-sufficient-length",
    PAYMENT_WEBHOOK_SECRET: "webhook-secret-with-sufficient-length",
    TURNSTILE_SECRET_KEY: "turnstile-secret-with-sufficient-length",
    BOOKING_TOKEN_SECRET: "booking-token-secret-with-sufficient-length",
    ICAL_FEED_SECRET: "email-api-key-with-sufficient-length",
    EMAIL_API_KEY: "email-api-key-with-sufficient-length",
    EMAIL_SENDER: "bookings@silveroakestate.online",
    ADMIN_NOTIFICATION_RECIPIENTS: "contact@silveroakestate.online",
    CRON_SECRET: "cron-secret-with-sufficient-length",
    ERROR_MONITORING_DSN: "https://public@example.com/1",
    VERCEL: "1",
    ...overrides,
  };
}

describe("production readiness preflight", () => {
  it("passes a complete staging configuration without exposing values", () => {
    const environment = createEnvironment();
    const result = evaluateProductionReadiness(environment, { target: "staging" });
    const report = formatProductionReadinessReport(result);

    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(report).toContain("Status: PASS");
    expect(report).not.toContain(environment.SUPABASE_SERVICE_ROLE_KEY);
    expect(report).not.toContain(environment.RAZORPAY_KEY_SECRET);
  });

  it("blocks placeholder and malformed configuration", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "<YOUR_SUPABASE_SERVICE_ROLE_KEY>",
        BOOKING_HOLD_MINUTES: "zero",
      }),
      { target: "staging" },
    );

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "NEXT_PUBLIC_SUPABASE_URL" }),
        expect.objectContaining({ field: "SUPABASE_SERVICE_ROLE_KEY" }),
        expect.objectContaining({ field: "BOOKING_HOLD_MINUTES" }),
      ]),
    );
  });

  it("requires the canonical URL and live Razorpay mode for production", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({
        APP_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://preview.silveroakestate.online",
        PAYMENT_MODE: "test",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_notlive",
      }),
      { target: "production" },
    );

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "NEXT_PUBLIC_SITE_URL" }),
        expect.objectContaining({ field: "PAYMENT_MODE" }),
        expect.objectContaining({ field: "NEXT_PUBLIC_RAZORPAY_KEY_ID" }),
      ]),
    );
  });

  it("passes a production-shaped configuration", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({
        APP_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://silveroakestate.online",
        PAYMENT_MODE: "live",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_validproductionkey",
      }),
      { target: "production" },
    );

    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it("rejects unsupported targets", () => {
    expect(() =>
      evaluateProductionReadiness(createEnvironment(), {
        // @ts-expect-error Runtime validation rejects unsupported CLI targets.
        target: "preview",
      }),
    ).toThrow("Unsupported preflight target: preview");
  });
});
