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
      RAZORPAY_WEBHOOK_SECRET: undefined,
      RAZORPAY_KEY_SECRET: "do-not-report-this-value",
    });
    const { envServer } = await import("@/lib/env/server");
    expect(() => envServer.RAZORPAY_WEBHOOK_SECRET).toThrow("RAZORPAY_WEBHOOK_SECRET");
    expect(() => envServer.RAZORPAY_WEBHOOK_SECRET).not.toThrow("do-not-report-this-value");
  });

  it("preserves all existing server defaults", async () => {
    setEnvironment({
      APP_ENV: undefined,
      APP_TIMEZONE: undefined,
      PAYMENT_PROVIDER: undefined,
      PAYMENT_PROVIDER_MODE: undefined,
      BOOKING_HOLD_MINUTES: undefined,
      MANUAL_PAYMENT_HOLD_MINUTES: undefined,
      DATABASE_CRON_ENABLED: undefined,
    });
    const { envServer } = await import("@/lib/env/server");
    expect({
      appEnvironment: envServer.APP_ENV,
      timezone: envServer.APP_TIMEZONE,
      provider: envServer.PAYMENT_PROVIDER,
      paymentMode: envServer.PAYMENT_PROVIDER_MODE,
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
    ["BOOKING_HOLD_MINUTES", "0"],
    ["BOOKING_HOLD_MINUTES", "61"],
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
      PAYMENT_PROVIDER_MODE: "test",
      APP_ENV: "development",
      RAZORPAY_KEY_ID: "rzp_test_public",
      RAZORPAY_KEY_SECRET: "payment-secret",
      RAZORPAY_WEBHOOK_SECRET: undefined,
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

  it("rejects live payment configuration outright", async () => {
    setEnvironment({
      PAYMENT_PROVIDER: "razorpay",
      PAYMENT_PROVIDER_MODE: "live",
      RAZORPAY_KEY_ID: "rzp_live_not_permitted",
      RAZORPAY_KEY_SECRET: "payment-secret",
    });
    const { assertPaymentConfiguration } = await import("@/lib/payments/config");
    expect(assertPaymentConfiguration).toThrow("PAYMENT_PROVIDER_MODE");
  });

  it.each([
    ["production", { APP_ENV: "production", PAYMENT_PROVIDER_MODE: "test", PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_test_key" }, "production"],
    ["live mode", { APP_ENV: "development", PAYMENT_PROVIDER_MODE: "live", PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_live_key" }, "PAYMENT_PROVIDER_MODE"],
    ["unsupported provider", { APP_ENV: "development", PAYMENT_PROVIDER_MODE: "test", PAYMENT_PROVIDER: "stripe", RAZORPAY_KEY_ID: "rzp_test_key" }, "Payment provider"],
    ["live key", { APP_ENV: "development", PAYMENT_PROVIDER_MODE: "test", PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_live_key" }, "Razorpay test credentials"],
  ] as const)("rejects browser/order payment configuration in %s", async (_description, overrides, expectedError) => {
    setEnvironment({ RAZORPAY_KEY_SECRET: "payment-secret", ...overrides });
    const { assertPaymentConfiguration } = await import("@/lib/payments/config");
    expect(assertPaymentConfiguration).toThrow(expectedError);
  });

  it("webhook configuration does not require browser or gateway credentials", async () => {
    setEnvironment({
      PAYMENT_PROVIDER: "razorpay",
      RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
      RAZORPAY_KEY_ID: undefined,
      RAZORPAY_KEY_SECRET: undefined,
      EMAIL_API_KEY: undefined,
    });
    const { assertPaymentWebhookConfiguration } = await import("@/lib/payments/config");
    expect(assertPaymentWebhookConfiguration()).toEqual({ webhookSecret: "webhook-secret" });
  });

  it.each([
    ["production", { APP_ENV: "production", PAYMENT_PROVIDER_MODE: "test", PAYMENT_PROVIDER: "razorpay" }, "production"],
    ["live mode", { APP_ENV: "development", PAYMENT_PROVIDER_MODE: "live", PAYMENT_PROVIDER: "razorpay" }, "PAYMENT_PROVIDER_MODE"],
    ["unsupported provider", { APP_ENV: "development", PAYMENT_PROVIDER_MODE: "test", PAYMENT_PROVIDER: "stripe" }, "Payment provider"],
  ] as const)("rejects webhook configuration in %s", async (_description, overrides, expectedError) => {
    setEnvironment({ RAZORPAY_WEBHOOK_SECRET: "webhook-secret", ...overrides });
    const { assertPaymentWebhookConfiguration } = await import("@/lib/payments/config");
    expect(assertPaymentWebhookConfiguration).toThrow(expectedError);
  });

  it("keeps the CI workflow aligned with the current payment environment contract", async () => {
    const workflow = await readFile(".github/workflows/ci.yml", "utf8");
    const retiredPublicKey = ["NEXT_PUBLIC_RAZORPAY", "KEY_ID"].join("_");
    const retiredMode = ["PAYMENT", "MODE"].join("_");
    const retiredWebhookSecret = ["PAYMENT_WEBHOOK", "SECRET"].join("_");
    expect(workflow).toMatch(/^\s+RAZORPAY_KEY_ID:/m);
    expect(workflow).toMatch(/^\s+PAYMENT_PROVIDER_MODE:/m);
    expect(workflow).toMatch(/^\s+RAZORPAY_WEBHOOK_SECRET:/m);
    expect(workflow).not.toMatch(new RegExp(`^\\s+${retiredPublicKey}:`, "m"));
    expect(workflow).not.toMatch(new RegExp(`^\\s+${retiredMode}:`, "m"));
    expect(workflow).not.toMatch(new RegExp(`^\\s+${retiredWebhookSecret}:`, "m"));
  });

  it("missing payment and cron configuration does not break a non-payment module", async () => {
    setEnvironment({
      RAZORPAY_KEY_SECRET: undefined,
      RAZORPAY_WEBHOOK_SECRET: undefined,
      CRON_SECRET: undefined,
    });
    await expect(import("@/lib/booking/schemas")).resolves.toHaveProperty("holdRequestSchema");
  });
});
