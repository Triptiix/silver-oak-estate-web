import { readFileSync, readdirSync } from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";

import {
  evaluateProductionReadiness,
  formatProductionReadinessReport,
} from "../scripts/production-preflight.mjs";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { metadata as privacyMetadata } from "@/app/(marketing)/privacy/page";
import { metadata as termsMetadata } from "@/app/(marketing)/terms/page";

/** Minimal valid assisted-production environment. */
function assistedEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    NEXT_PUBLIC_SITE_URL: "https://silveroakestate.online",
    NEXT_PUBLIC_SUPABASE_URL: "https://silveroak.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key-with-sufficient-length",
    APP_ENV: "production",
    APP_TIMEZONE: "Asia/Kolkata",
    ONLINE_BOOKING_ENABLED: "false",
    VERCEL: "1",
    ...overrides,
  };
}

function assisted(overrides?: Record<string, string | undefined>) {
  return evaluateProductionReadiness(assistedEnv(overrides), {
    profile: "production-assisted",
  });
}

describe("assisted preflight — profile and alias", () => {
  it("passes a valid assisted-production environment with no payment or email fields", () => {
    const result = assisted();
    expect(result.profile).toBe("production-assisted");
    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.checkedFields).toBe(6);
  });

  it("resolves the assisted-production target alias", () => {
    const result = evaluateProductionReadiness(assistedEnv(), {
      target: "assisted-production",
    });
    expect(result.profile).toBe("production-assisted");
    expect(result.ready).toBe(true);
  });

  it("requires no payment, Razorpay, Turnstile, booking-token or email field", () => {
    // None of these are present in assistedEnv(), yet the profile passes.
    for (const field of [
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "PAYMENT_PROVIDER",
      "PAYMENT_PROVIDER_MODE",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "TURNSTILE_SECRET_KEY",
      "BOOKING_TOKEN_SECRET",
      "EMAIL_API_KEY",
      "EMAIL_SENDER",
    ]) {
      expect(assistedEnv()[field as keyof ReturnType<typeof assistedEnv>]).toBeUndefined();
    }
    expect(assisted().ready).toBe(true);
  });
});

describe("assisted preflight — validation", () => {
  const cases: Array<[string, Record<string, string | undefined>, string]> = [
    ["a non-canonical domain", { NEXT_PUBLIC_SITE_URL: "https://example.com" }, "NEXT_PUBLIC_SITE_URL"],
    ["an http site url", { NEXT_PUBLIC_SITE_URL: "http://silveroakestate.online" }, "NEXT_PUBLIC_SITE_URL"],
    ["a localhost supabase url", { NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321" }, "NEXT_PUBLIC_SUPABASE_URL"],
    ["a missing supabase url", { NEXT_PUBLIC_SUPABASE_URL: undefined }, "NEXT_PUBLIC_SUPABASE_URL"],
    ["a missing supabase anon key", { NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined }, "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    ["a wrong app environment", { APP_ENV: "staging" }, "APP_ENV"],
    ["a wrong timezone", { APP_TIMEZONE: "UTC" }, "APP_TIMEZONE"],
    ["online booking enabled", { ONLINE_BOOKING_ENABLED: "true" }, "ONLINE_BOOKING_ENABLED"],
    ["a missing online-booking flag", { ONLINE_BOOKING_ENABLED: undefined }, "ONLINE_BOOKING_ENABLED"],
  ];

  it.each(cases)("blocks %s", (_label, overrides, field) => {
    const result = assisted(overrides);
    expect(result.ready).toBe(false);
    expect(result.blockers.map((b: { field: string }) => b.field)).toContain(field);
  });

  it("warns, but does not block, when monitoring DSN is absent", () => {
    const result = assisted();
    expect(result.ready).toBe(true);
    expect(result.warnings.map((w: { field: string }) => w.field)).toContain(
      "ERROR_MONITORING_DSN",
    );
  });
});

describe("assisted preflight — output safety and profile isolation", () => {
  it("never prints a secret-looking value", () => {
    const report = formatProductionReadinessReport(
      assisted({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "super-secret-anon-key-value-123456" }),
    );
    expect(report).not.toContain("super-secret-anon-key-value-123456");
    expect(report).toContain("Secret values were not printed.");
  });

  it("leaves existing profiles behaving exactly as before", () => {
    // core still passes on a minimal valid env; production-live still blocks.
    const core = evaluateProductionReadiness(
      {
        NEXT_PUBLIC_SITE_URL: "https://silveroakestate.online",
        NEXT_PUBLIC_SUPABASE_URL: "https://silveroak.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key-with-sufficient-length",
        APP_ENV: "production",
        APP_TIMEZONE: "Asia/Kolkata",
        VERCEL: "1",
      },
      { profile: "core" },
    );
    expect(core.ready).toBe(true);

    const live = evaluateProductionReadiness(assistedEnv({ ONLINE_BOOKING_ENABLED: "true" }), {
      profile: "production-live",
    });
    expect(live.ready).toBe(false);

    expect(evaluateProductionReadiness(assistedEnv(), { target: "staging" }).profile)
      .toBe("booking-test");
    expect(evaluateProductionReadiness(assistedEnv(), { target: "production" }).profile)
      .toBe("production-live");
  });
});

describe("legal placeholders stay unindexed and out of the sitemap", () => {
  it("marks privacy and terms noindex", () => {
    expect(privacyMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(termsMetadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("keeps privacy and terms out of the sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/privacy"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/terms"))).toBe(false);
    // Non-placeholder public routes remain present.
    expect(urls.some((u) => u.endsWith("/policies"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/contact"))).toBe(true);
  });

  it("does not disallow privacy or terms in robots (crawlers must read noindex)", () => {
    const disallow = ([] as string[]).concat(
      (robots().rules as { disallow?: string | string[] }).disallow ?? [],
    );
    expect(disallow).not.toContain("/privacy");
    expect(disallow).not.toContain("/terms");
  });

  it("keeps the pages accessible and honestly labelled as review drafts", () => {
    for (const file of [
      "src/app/(marketing)/privacy/page.tsx",
      "src/app/(marketing)/terms/page.tsx",
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("LegalDraftNotice");
    }
    const notice = readFileSync(
      "src/components/legal/legal-draft-notice.tsx",
      "utf8",
    );
    expect(notice).toContain("Review draft");
    expect(notice).toContain("Not yet effective");
    // The draft is never positively asserted as effective/final; it only
    // disclaims effectiveness ("does not yet state final, legally effective…").
    expect(notice).not.toMatch(/\bthese terms are (?:now )?effective\b/i);
    expect(notice).not.toMatch(/\bthis policy is (?:now )?in effect\b/i);
    expect(notice).toMatch(/does not yet state final/i);
  });
});

describe("booking gates remain closed", () => {
  it("does not link /book from navigation or footer", () => {
    for (const file of [
      "src/components/layout/site-header.tsx",
      "src/components/layout/site-footer.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).not.toMatch(/href="\/book"/);
    }
  });

  it("keeps /book noindex", () => {
    const book = readFileSync("src/app/(marketing)/book/page.tsx", "utf8");
    expect(book).toMatch(/index:\s*false/);
  });

  it("the assisted profile requires online booking to be false", () => {
    expect(assisted({ ONLINE_BOOKING_ENABLED: "true" }).ready).toBe(false);
    expect(assisted({ ONLINE_BOOKING_ENABLED: "false" }).ready).toBe(true);
  });
});

describe("launch documents contain no secret-looking values", () => {
  it("holds no key, token or credential-looking strings", () => {
    const dir = "docs/launch";
    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThanOrEqual(4);
    const secretish = [
      /rzp_(?:test|live)_[A-Za-z0-9]{8,}/,
      /sk_live_[A-Za-z0-9]/,
      /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, // JWT
      /service_role.{0,20}[:=].{0,4}["'][A-Za-z0-9]{20,}/,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    ];
    for (const f of files) {
      const content = readFileSync(path.join(dir, f), "utf8");
      for (const pattern of secretish) {
        expect(pattern.test(content), `${f} contains a secret-looking value`).toBe(false);
      }
    }
  });
});
