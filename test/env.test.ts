// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { envClient } from "@/lib/env/client";

vi.mock("server-only", () => ({}));

describe("Environment Variables", () => {
  it("client environment schema rejects missing required public variables", () => {
    expect(() => {
      // @ts-expect-error Testing invalid runtime validation
      envClient.parse({});
    }).toThrow();
  });
});

describe("Server Environment Validation", () => {
  it("parses DATABASE_CRON_ENABLED correctly", async () => {
    // Import dynamically so it evaluates with the mocked process.env
    const originalEnv = process.env;

    const getParsedEnv = async (cronValue: string | undefined) => {
      vi.resetModules();
      process.env = { ...originalEnv, DATABASE_CRON_ENABLED: cronValue };
      const { envServer } = await import("@/lib/env/server");
      return envServer.DATABASE_CRON_ENABLED;
    };

    expect(await getParsedEnv("true")).toBe(true);
    expect(await getParsedEnv("false")).toBe(false);
    expect(await getParsedEnv(undefined)).toBe(true); // default
  });

  it("rejects invalid DATABASE_CRON_ENABLED without leaking secrets", async () => {
    const originalEnv = process.env;
    vi.resetModules();
    process.env = { ...originalEnv, DATABASE_CRON_ENABLED: "invalid", SECRET_XYZ: "should_not_leak" };
    
    try {
      await import("@/lib/env/server");
      expect.fail("Should have thrown");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).toContain("DATABASE_CRON_ENABLED");
        expect(e.message).not.toContain("invalid");
        expect(e.message).not.toContain("should_not_leak");
      } else {
        expect.fail("Caught non-error");
      }
    }
    process.env = originalEnv;
  });
});
