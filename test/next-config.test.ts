import { describe, expect, it } from "vitest";

import {
  createNextConfig,
  getSupabaseImageHostname,
} from "../next.config";

const STAGING_SUPABASE_URL = "https://hirelfuprxruzppwrabc.supabase.co";
const STAGING_SUPABASE_HOSTNAME = "hirelfuprxruzppwrabc.supabase.co";

async function getContentSecurityPolicy(
  config: ReturnType<typeof createNextConfig>,
): Promise<string> {
  const headerRules = await config.headers?.();
  const cspHeader = headerRules?.[0]?.headers.find(
    (header) => header.key === "Content-Security-Policy",
  );

  if (!cspHeader) {
    throw new Error("Content-Security-Policy header was not configured");
  }

  return cspHeader.value;
}

function getSupabaseOrigins(value: string): string[] {
  return value.match(/https:\/\/[a-z0-9-]+\.supabase\.co/g) ?? [];
}

describe("Supabase image host configuration", () => {
  it("derives only the validated staging Supabase hostname for remote images and CSP", async () => {
    const config = createNextConfig(STAGING_SUPABASE_URL);
    const csp = await getContentSecurityPolicy(config);
    const imageDirectives = csp
      .split("; ")
      .filter((directive) => directive.startsWith("img-src "));

    expect(getSupabaseImageHostname(STAGING_SUPABASE_URL)).toBe(
      STAGING_SUPABASE_HOSTNAME,
    );
    expect(config.images?.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: STAGING_SUPABASE_HOSTNAME,
        pathname: "/storage/v1/object/public/**",
      },
    ]);
    expect(imageDirectives).toEqual([
      `img-src 'self' data: ${STAGING_SUPABASE_URL}`,
    ]);
    expect(getSupabaseOrigins(csp)).toEqual([STAGING_SUPABASE_URL]);
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["non-HTTPS", "http://hirelfuprxruzppwrabc.supabase.co"],
    ["root Supabase host", "https://supabase.co"],
    ["lookalike suffix", "https://hirelfuprxruzppwrabc.supabase.co.example.com"],
    ["credentials", "https://user@hirelfuprxruzppwrabc.supabase.co"],
    ["invalid URL", "not-a-url"],
  ])("uses no remote Supabase host for a %s URL", async (_label, rawUrl) => {
    const config = createNextConfig(rawUrl);
    const csp = await getContentSecurityPolicy(config);

    expect(getSupabaseImageHostname(rawUrl)).toBeNull();
    expect(config.images?.remotePatterns).toEqual([]);
    expect(csp).toContain("img-src 'self' data:");
    expect(getSupabaseOrigins(csp)).toEqual([]);
  });
});
