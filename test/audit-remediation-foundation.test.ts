// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import { config as proxyConfig } from "@/proxy";
import { serverEnvSchema } from "@/lib/env/server";

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
      "http://localhost:3000",
      "http://localhost:3000/estate",
      "http://localhost:3000/experiences",
      "http://localhost:3000/gallery",
      "http://localhost:3000/pricing",
      "http://localhost:3000/location",
      "http://localhost:3000/policies",
      "http://localhost:3000/privacy",
      "http://localhost:3000/terms",
      "http://localhost:3000/contact",
      "http://localhost:3000/availability",
    ]);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith("/book"))).toBe(false);
  });
});
