// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
  vi.resetModules();
});

describe("Health API Endpoint", () => {
  it("responds using only APP_ENV configuration", async () => {
    process.env = { NODE_ENV: "test", APP_ENV: "staging" };
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual(expect.objectContaining({
      status: "ok",
      environment: "staging",
    }));
  });

  it("does not require unrelated service, payment or integration configuration", async () => {
    process.env = { NODE_ENV: "test", APP_ENV: "development" };
    const { GET } = await import("@/app/api/health/route");
    await expect(GET()).resolves.toHaveProperty("status", 200);
  });

  it("fails closed for an invalid APP_ENV", async () => {
    process.env = { NODE_ENV: "test", APP_ENV: "invalid" };
    const { GET } = await import("@/app/api/health/route");
    await expect(GET()).rejects.toThrow("APP_ENV");
  });
});
