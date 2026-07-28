// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
  vi.resetModules();
});

describe("ONLINE_BOOKING_ENABLED", () => {
  it("defaults to false", async () => {
    delete process.env.ONLINE_BOOKING_ENABLED;
    const { envServer } = await import("@/lib/env/server");
    expect(envServer.ONLINE_BOOKING_ENABLED).toBe(false);
  });

  it("accepts an explicit true value", async () => {
    process.env.ONLINE_BOOKING_ENABLED = "true";
    const { envServer } = await import("@/lib/env/server");
    expect(envServer.ONLINE_BOOKING_ENABLED).toBe(true);
  });

  it.each(["1", "yes", "enabled"]) (
    "rejects invalid value %s",
    async (value) => {
      process.env.ONLINE_BOOKING_ENABLED = value;
      const { envServer } = await import("@/lib/env/server");
      expect(() => envServer.ONLINE_BOOKING_ENABLED).toThrow("ONLINE_BOOKING_ENABLED");
    },
  );
});
