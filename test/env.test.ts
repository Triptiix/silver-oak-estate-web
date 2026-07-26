// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";

vi.mock("server-only", () => ({}));

const originalEnvironment = { ...process.env };

function setEnvironment(overrides: Record<string, string | undefined>) {
  process.env = { ...originalEnvironment };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  process.env = { ...originalEnvironment };
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("lazy server environment", () => {
  it("imports without validating unrelated secrets", async () => {
    setEnvironment({
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      RAZORPAY_KEY_SECRET: undefined,
      EMAIL_API_KEY: undefined,
    });
    await expect(import("@/lib/env/server")).resolves.toHaveProperty("envServer");
  });

  it("reads APP_ENV without payment or integration secrets", async () => {
    setEnvironment({
      APP_ENV: "staging",
      RAZORPAY_KEY_SECRET: undefined,
      EMAIL_API_KEY: undefined,
      WHATSAPP_API_KEY: undefined,
      PMS_API_KEY: undefined,
    });
    const { envServer } = await import("@/lib/env/server");
    expect(envServer.APP_ENV).toBe("staging");
  });

  it("fails only when a missing required field is accessed", async () => {
    setEnvironment({ RAZORPAY_KEY_SECRET: undefined });
    const { envServer } = await import("@/lib/env/server");
    expect(envServer.APP_ENV).toBe("development");
    expect(() => envServer.RAZORPAY_KEY_SECRET).toThrow("RAZORPAY_KEY_SECRET");
  });

  it("reports variable names without values from other secrets", async () => {
    setEnvironment({
      PAYMENT_WEBHOOK_SECRET: undefined,
      RAZORPAY_KEY_SECRET: "do-not-report-this-value",
    });
    const { envServer } = await import("@/lib/env/server");
    expect(() => envServer.PAYMENT_WEBHOOK_SECRET).toThrow("PAYMENT_WEBHOOK_SECRET");
    expect(() => envServer.PAYMENT_WEBHOOK_SECRET).not.toThrow("do-not-report-this-value");
  });

  it("preserves all existing server defaults", async () => {
    setEnvironment({
      APP_ENV: undefined,
      APP_TIMEZONE: undefined,
      PAYMENT_PROVIDER: undefined,
      PAYMENT_MODE: undefined,
      BOOKING_HOLD_MINUTES: undefined,
      MANUAL_PAYMENT_HOLD_MINUTES: undefined,
      DATABASE_CRON_ENABLED: undefined,
    });
    const { envServer } = await import("@/lib/env/server");
    expect({
      appEnvironment: envServer.APP_ENV,
      timezone: envServer.APP_TIMEZONE,
      provider: envServer.PAYMENT_PROVIDER,
      paymentMode: envServer.PAYMENT_MODE,
      bookingHoldMinutes: envServer.BOOKING_HOLD_MINUTES,
      manualPaymentHoldMinutes: envServer.MANUAL_PAYMENT_HOLD_MINUTES,
      databaseCronEnabled: envServer.DATABASE_CRON_ENABLED,
    }).toEqual({
      appEnvironment: "development",
      timezone: "Asia/Kolkata",
      provider: "razorpay",
      paymentMode: "test",
      bookingHoldMinutes: 10,
      manualPaymentHoldMinutes: 30,
      databaseCronEnabled: true,
    });
  });

  it.each(["yes", "1", "invalid"])(
    "rejects invalid DATABASE_CRON_ENABLED value %s on access",
    async (value) => {
      setEnvironment({ DATABASE_CRON_ENABLED: value });
      const { envServer } = await import("@/lib/env/server");
      expect(() => envServer.DATABASE_CRON_ENABLED).toThrow("DATABASE_CRON_ENABLED");
    },
  );

  it.each([
    ["BOOKING_HOLD_MINUTES", "1.5"],
    ["MANUAL_PAYMENT_HOLD_MINUTES", "not-a-number"],
  ] as const)("rejects invalid numeric field %s on access", async (field, value) => {
    setEnvironment({ [field]: value });
    const { envServer } = await import("@/lib/env/server");
    expect(() => envServer[field]).toThrow(field);
  });

  it("keeps optional variables optional", async () => {
    setEnvironment({
      ERROR_MONITORING_DSN: undefined,
      WHATSAPP_API_KEY: undefined,
      PMS_API_KEY: undefined,
    });
    const { envServer } = await import("@/lib/env/server");
    expect(envServer.ERROR_MONITORING_DSN).toBeUndefined();
    expect(envServer.WHATSAPP_API_KEY).toBeUndefined();
    expect(envServer.PMS_API_KEY).toBeUndefined();
  });

  it("offers a real full parser with sanitized failures", async () => {
    const { parseServerEnvironment } = await import("@/lib/env/server");
    expect(() => parseServerEnvironment({
      ...originalEnvironment,
      SUPABASE_SERVICE_ROLE_KEY: "sensitive-service-role-value",
      RAZORPAY_KEY_SECRET: undefined,
    })).toThrow("RAZORPAY_KEY_SECRET");
    expect(() => parseServerEnvironment({
      ...originalEnvironment,
      SUPABASE_SERVICE_ROLE_KEY: "sensitive-service-role-value",
      RAZORPAY_KEY_SECRET: undefined,
    })).not.toThrow("sensitive-service-role-value");
  });
});

describe("client environment", () => {
  it("uses the real parser to reject a missing required public value", async () => {
    const { parseClientEnvironment } = await import("@/lib/env/client");
    expect(() => parseClientEnvironment({})).toThrow("NEXT_PUBLIC_SITE_URL");
  });

  it("reads a valid site URL without unrelated public keys", async () => {
    setEnvironment({
      NEXT_PUBLIC_SITE_URL: "https://silveroakestate.online",
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined,
      NEXT_PUBLIC_RAZORPAY_KEY_ID: undefined,
    });
    const { envClient } = await import("@/lib/env/client");
    expect(envClient.NEXT_PUBLIC_SITE_URL).toBe("https://silveroakestate.online");
  });

  it("rejects an invalid site URL without echoing its value", async () => {
    setEnvironment({ NEXT_PUBLIC_SITE_URL: "not-a-url-secret-value" });
    const { envClient } = await import("@/lib/env/client");
    expect(() => envClient.NEXT_PUBLIC_SITE_URL).toThrow("NEXT_PUBLIC_SITE_URL");
    expect(() => envClient.NEXT_PUBLIC_SITE_URL).not.toThrow("not-a-url-secret-value");
  });

  it("retains explicit static public environment references", async () => {
    const source = await readFile("src/lib/env/client.ts", "utf8");
    for (const key of [
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    ]) {
      expect(source).toContain(`process.env.${key}`);
    }
  });
});

describe("capability isolation", () => {
  it("creates the service-role client with only its Supabase configuration", async () => {
    setEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-for-test",
      RAZORPAY_KEY_SECRET: undefined,
      EMAIL_API_KEY: undefined,
      CRON_SECRET: undefined,
    });
    const createClient = vi.fn(() => ({ capability: "service-role" }));
    vi.doMock("@supabase/supabase-js", () => ({ createClient }));
    const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
    expect(createServiceRoleClient()).toEqual({ capability: "service-role" });
    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-for-test",
      expect.any(Object),
    );
  });

  it("payment configuration ignores email, cron and deferred integrations", async () => {
    setEnvironment({
      PAYMENT_PROVIDER: "razorpay",
      PAYMENT_MODE: "test",
      APP_ENV: "development",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_public",
      RAZORPAY_KEY_SECRET: "payment-secret",
      PAYMENT_WEBHOOK_SECRET: undefined,
      EMAIL_API_KEY: undefined,
      EMAIL_SENDER: undefined,
      CRON_SECRET: undefined,
      ICAL_FEED_SECRET: undefined,
      WHATSAPP_API_KEY: undefined,
      PMS_API_KEY: undefined,
    });
    const { assertPaymentConfiguration } = await import("@/lib/payments/config");
    expect(assertPaymentConfiguration()).toEqual({
      keyId: "rzp_test_public",
      keySecret: "payment-secret",
    });
  });

  it("webhook configuration does not require browser or gateway credentials", async () => {
    setEnvironment({
      PAYMENT_PROVIDER: "razorpay",
      PAYMENT_WEBHOOK_SECRET: "webhook-secret",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: undefined,
      RAZORPAY_KEY_SECRET: undefined,
      EMAIL_API_KEY: undefined,
    });
    const { assertPaymentWebhookConfiguration } = await import("@/lib/payments/config");
    expect(assertPaymentWebhookConfiguration()).toEqual({ webhookSecret: "webhook-secret" });
  });

  it("missing payment and cron configuration does not break a non-payment module", async () => {
    setEnvironment({
      RAZORPAY_KEY_SECRET: undefined,
      PAYMENT_WEBHOOK_SECRET: undefined,
      CRON_SECRET: undefined,
    });
    await expect(import("@/lib/booking/schemas")).resolves.toHaveProperty("holdRequestSchema");
  });
});
