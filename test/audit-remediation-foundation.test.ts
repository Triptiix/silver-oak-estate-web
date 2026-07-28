// @vitest-environment node
import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { config as proxyConfig } from "@/proxy";

describe("audit remediation foundation", () => {
  it("runs the Supabase auth proxy only for administrator routes", () => {
    expect(proxyConfig.matcher).toEqual(["/admin/:path*"]);
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
