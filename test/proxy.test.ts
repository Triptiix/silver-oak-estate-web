// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: null }),
    },
  }),
}));

describe("Next.js Proxy", () => {
  it("redirects unauthenticated protected administrator access", async () => {
    const request = new NextRequest("http://localhost:3000/admin/dashboard");
    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/login");
  });

  it("keeps the administrator login route accessible", async () => {
    const request = new NextRequest("http://localhost:3000/admin/login");
    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("matches administrator routes only", () => {
    expect(config.matcher).toEqual(["/admin/:path*"]);
  });
});
