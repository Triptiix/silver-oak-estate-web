// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isTrustedMutationOrigin } from "@/lib/security/mutation-origin";

describe("mutation origin policy", () => {
  it.each([
    ["http://example.com", "http://example.com"],
    ["https://example.com", "https://example.com"],
    ["https://example.com:443", "https://example.com"],
    ["https://EXAMPLE.com", "https://example.com"],
  ])("accepts trusted origin %s for %s", (incoming, trusted) => {
    expect(isTrustedMutationOrigin(incoming, trusted)).toBe(true);
  });

  it.each([
    null,
    "",
    "null",
    "not a url",
    "https://evil.example",
    "https://admin.example.com",
    "https://example.com.evil.test",
    "http://example.com",
    "https://example.com:444",
    "https://user:password@example.com",
    "https://example.com/path",
    "https://example.com/.",
    "https://example.com/%2e",
    "https://example.com/?next=https://evil.test",
    "https://example.com/#evil",
  ])("rejects untrusted origin %s", (incoming) => {
    expect(isTrustedMutationOrigin(incoming, "https://example.com")).toBe(false);
  });

  it("does not add browser-origin enforcement to excluded routes", () => {
    const excluded = [
      "src/app/api/payments/webhook/route.ts",
      "src/app/api/internal/cron/expire-holds/route.ts",
      "src/app/api/availability/route.ts",
    ];
    for (const file of excluded) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("mutation-origin");
      expect(source).not.toContain("isTrustedMutationOrigin");
    }
  });
});
