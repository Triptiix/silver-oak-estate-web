// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "@/proxy";

// Mock supabase ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: null }),
    },
  }),
}));

describe("Proxy / Middleware", () => {
  it("unauthenticated admin access redirects to /admin/login", async () => {
    const request = new NextRequest("http://localhost:3000/admin/dashboard");
    const response = await proxy(request);
    
    // 307 Temporary Redirect is Next.js NextResponse.redirect default
    expect(response.status).toBe(307); 
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/login");
  });

  it("public routes do not redirect", async () => {
    const request = new NextRequest("http://localhost:3000/estate");
    const response = await proxy(request);
    
    // Status 200 via NextResponse.next()
    expect(response.status).toBe(200);
  });
  
  it("matcher excludes health, robots, and sitemap", () => {
    // Next.js matcher regex requires slight adaptation to test in JS
    const matcherString = config.matcher[0].replace("^", "").replace("$", "");
    const regex = new RegExp(`^${matcherString}$`);
    
    // Excluded paths should NOT match
    expect(regex.test("/api/health")).toBe(false);
    expect(regex.test("/robots.txt")).toBe(false);
    expect(regex.test("/sitemap.xml")).toBe(false);
    
    // Included paths SHOULD match
    expect(regex.test("/admin/dashboard")).toBe(true);
    expect(regex.test("/estate")).toBe(true);
  });
});
