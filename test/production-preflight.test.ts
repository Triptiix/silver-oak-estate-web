import { describe, expect, it } from "vitest";

import {
  evaluateProductionReadiness,
  formatProductionReadinessReport,
} from "../scripts/production-preflight.mjs";

function createEnvironment(overrides: Record<string, string | undefined> = {}) {
  return {
    NEXT_PUBLIC_SITE_URL: "https://staging.silveroakestate.online",
    NEXT_PUBLIC_SUPABASE_URL: "https://silver-oak-staging.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key-with-sufficient-length",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "turnstile-site-key-with-sufficient-length",
    RAZORPAY_KEY_ID: "rzp_test_validstagingkey",
    APP_ENV: "staging",
    APP_TIMEZONE: "Asia/Kolkata",
    ONLINE_BOOKING_ENABLED: "true",
    PAYMENT_PROVIDER: "razorpay",
    PAYMENT_PROVIDER_MODE: "test",
    BOOKING_HOLD_MINUTES: "10",
    MANUAL_PAYMENT_HOLD_MINUTES: "30",
    DATABASE_CRON_ENABLED: "true",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-secret-with-sufficient-length",
    RAZORPAY_KEY_SECRET: "razorpay-secret-with-sufficient-length",
    RAZORPAY_WEBHOOK_SECRET: "webhook-secret-with-sufficient-length",
    TURNSTILE_SECRET_KEY: "turnstile-secret-with-sufficient-length",
    BOOKING_TOKEN_SECRET: "booking-token-secret-with-sufficient-length",
    ICAL_FEED_SECRET: "ical-feed-secret-with-sufficient-length",
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
  it("passes the core website profile without payment or email configuration", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined,
        RAZORPAY_KEY_ID: undefined,
        SUPABASE_SERVICE_ROLE_KEY: undefined,
        RAZORPAY_KEY_SECRET: undefined,
        RAZORPAY_WEBHOOK_SECRET: undefined,
        TURNSTILE_SECRET_KEY: undefined,
        BOOKING_TOKEN_SECRET: undefined,
        EMAIL_API_KEY: undefined,
        EMAIL_SENDER: undefined,
        ADMIN_NOTIFICATION_RECIPIENTS: undefined,
      }),
      { profile: "core" },
    );

    expect(result.ready).toBe(true);
    expect(result.profile).toBe("core");
    expect(result.blockers).toEqual([]);
  });

  it("passes booking-test without deferred email configuration", () => {
    const environment = createEnvironment({
      EMAIL_API_KEY: undefined,
      EMAIL_SENDER: undefined,
      ADMIN_NOTIFICATION_RECIPIENTS: undefined,
    });
    const result = evaluateProductionReadiness(environment, { profile: "booking-test" });
    const report = formatProductionReadinessReport(result);

    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(report).toContain("Readiness profile: booking-test");
    expect(report).not.toContain(environment.SUPABASE_SERVICE_ROLE_KEY);
    expect(report).not.toContain(environment.RAZORPAY_KEY_SECRET);
  });

  it("accepts the maximum 60-minute booking hold", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({ BOOKING_HOLD_MINUTES: "60" }),
      { profile: "booking-test" },
    );

    expect(result.ready).toBe(true);
    expect(result.blockers).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "BOOKING_HOLD_MINUTES" })]),
    );
  });

  it("rejects a booking hold longer than 60 minutes", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({ BOOKING_HOLD_MINUTES: "61" }),
      { profile: "booking-test" },
    );

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "BOOKING_HOLD_MINUTES",
          message: "must be between 1 and 60",
        }),
      ]),
    );
  });

  it("blocks booking-test when the kill switch is disabled or configuration is incomplete", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({
        ONLINE_BOOKING_ENABLED: "false",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        TURNSTILE_SECRET_KEY: undefined,
        BOOKING_HOLD_MINUTES: "zero",
      }),
      { profile: "booking-test" },
    );

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "ONLINE_BOOKING_ENABLED" }),
        expect.objectContaining({ field: "NEXT_PUBLIC_SUPABASE_URL" }),
        expect.objectContaining({ field: "TURNSTILE_SECRET_KEY" }),
        expect.objectContaining({ field: "BOOKING_HOLD_MINUTES" }),
      ]),
    );
  });

  it("validates email independently from the booking stack", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        RAZORPAY_KEY_SECRET: undefined,
        EMAIL_SENDER: "not-an-email",
      }),
      { profile: "email" },
    );

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual([
      expect.objectContaining({ field: "EMAIL_SENDER" }),
    ]);
    expect(result.blockers).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "NEXT_PUBLIC_SUPABASE_URL" })]),
    );
  });

  it("blocks production-live because live payments are outside Phase 6C.1", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({
        APP_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://preview.silveroakestate.online",
        PAYMENT_PROVIDER_MODE: "test",
        RAZORPAY_KEY_ID: "rzp_test_notlive",
        ERROR_MONITORING_DSN: undefined,
      }),
      { profile: "production-live" },
    );

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "NEXT_PUBLIC_SITE_URL" }),
        expect.objectContaining({ field: "PAYMENT_PROVIDER_MODE" }),
        expect.objectContaining({ field: "ERROR_MONITORING_DSN" }),
      ]),
    );
  });

  it("blocks live credentials during this test-only phase", () => {
    const result = evaluateProductionReadiness(
      createEnvironment({
        APP_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://silveroakestate.online",
        PAYMENT_PROVIDER_MODE: "live",
        RAZORPAY_KEY_ID: "rzp_live_validproductionkey",
      }),
      { profile: "production-live" },
    );

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "PAYMENT_PROVIDER_MODE" })]),
    );
  });

  it("keeps staging and production targets as compatibility aliases", () => {
    expect(
      evaluateProductionReadiness(createEnvironment(), { target: "staging" }).profile,
    ).toBe("booking-test");

    expect(
      evaluateProductionReadiness(
        createEnvironment({
          APP_ENV: "production",
          NEXT_PUBLIC_SITE_URL: "https://silveroakestate.online",
          PAYMENT_PROVIDER_MODE: "live",
          RAZORPAY_KEY_ID: "rzp_live_validproductionkey",
        }),
        { target: "production" },
      ).profile,
    ).toBe("production-live");
  });

  it.each([
    ["profile", { profile: "" }],
    ["target", { target: "" }],
  ] as const)("rejects an explicitly empty %s selector", (_name, options) => {
    expect(() =>
      evaluateProductionReadiness(
        createEnvironment(),
        // @ts-expect-error Runtime validation rejects empty CLI selectors.
        options,
      ),
    ).toThrow(/^Unsupported preflight (profile|target): $/);
  });

  it("rejects unsupported profiles", () => {
    expect(() =>
      evaluateProductionReadiness(createEnvironment(), {
        // @ts-expect-error Runtime validation rejects unsupported CLI profiles.
        profile: "preview",
      }),
    ).toThrow("Unsupported preflight profile: preview");
  });
});
