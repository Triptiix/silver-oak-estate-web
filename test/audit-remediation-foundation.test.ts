// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import { siteConfig } from "@/config/site";
import { serverEnvSchema } from "@/lib/env/server";
import { config as proxyConfig } from "@/proxy";

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
    expect(serverEnvSchema.shape[field].safeParse(value).success).toBe(false);
  });

  it("publishes a stable explicit public sitemap without the disabled checkout route", () => {
    const entries = sitemap();

    expect(entries.map((entry) => entry.url)).toEqual([
      siteConfig.url,
      `${siteConfig.url}/estate`,
      `${siteConfig.url}/experiences`,
      `${siteConfig.url}/gallery`,
      `${siteConfig.url}/pricing`,
      `${siteConfig.url}/location`,
      `${siteConfig.url}/policies`,
      `${siteConfig.url}/privacy`,
      `${siteConfig.url}/terms`,
      `${siteConfig.url}/contact`,
      `${siteConfig.url}/availability`,
    ]);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith("/book"))).toBe(false);
  });
});
