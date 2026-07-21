// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { GET } from "@/app/api/health/route";

describe("Health API Endpoint", () => {
  it("returns status ok and no-store headers", async () => {
    const response = await GET();
    
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body).toHaveProperty("environment");
    expect(body).toHaveProperty("timestamp");
  });
});
