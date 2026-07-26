// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import {
  createRequestFingerprint,
  getTrustedClientAddress,
  resolveTrustedClientAddress,
} from "@/lib/booking/fingerprint";
import { verifyTurnstile } from "@/lib/booking/turnstile";

const originalVercel = process.env.VERCEL;

function headers(values: Record<string, string> = {}) {
  return new Headers(values);
}

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  vi.restoreAllMocks();
});

describe("trusted client address resolution", () => {
  it.each([
    ["x-forwarded-for", "203.0.113.10"],
    ["x-vercel-forwarded-for", "2001:db8::1"],
  ])("ignores forged %s outside Vercel", (name, value) => {
    expect(resolveTrustedClientAddress(headers({ [name]: value }), { isVercel: false }))
      .toBe("unknown");
  });

  it("ignores both forwarding headers outside Vercel", () => {
    expect(resolveTrustedClientAddress(headers({
      "x-vercel-forwarded-for": "203.0.113.1",
      "x-forwarded-for": "203.0.113.2",
    }), { isVercel: false })).toBe("unknown");
  });

  it.each(["203.0.113.10", "2001:db8::1"])(
    "accepts valid IP %s in an attested Vercel runtime",
    (address) => {
      expect(resolveTrustedClientAddress(
        headers({ "x-vercel-forwarded-for": address }),
        { isVercel: true },
      )).toBe(address);
    },
  );

  it("prefers x-vercel-forwarded-for over the fallback", () => {
    expect(resolveTrustedClientAddress(headers({
      "x-vercel-forwarded-for": "203.0.113.1",
      "x-forwarded-for": "203.0.113.2",
    }), { isVercel: true })).toBe("203.0.113.1");
  });

  it("accepts x-forwarded-for only as a Vercel fallback", () => {
    expect(resolveTrustedClientAddress(
      headers({ "x-forwarded-for": "203.0.113.2" }),
      { isVercel: true },
    )).toBe("203.0.113.2");
  });

  it("selects the first comma-separated address", () => {
    expect(resolveTrustedClientAddress(
      headers({ "x-vercel-forwarded-for": "203.0.113.1, 203.0.113.2" }),
      { isVercel: true },
    )).toBe("203.0.113.1");
  });

  it.each([
    ["empty first value", ", 203.0.113.2"],
    ["hostname", "client.example.com"],
    ["IPv4 with port", "203.0.113.1:443"],
    ["bracketed IPv6 with port", "[2001:db8::1]:443"],
    ["arbitrary text", "not-an-address"],
  ])("rejects %s", (_label, value) => {
    expect(resolveTrustedClientAddress(
      headers({ "x-vercel-forwarded-for": value }),
      { isVercel: true },
    )).toBe("unknown");
  });

  it("returns unknown when no trusted header exists", () => {
    expect(resolveTrustedClientAddress(headers(), { isVercel: true })).toBe("unknown");
  });

  it("does not accept a request header as runtime attestation", () => {
    delete process.env.VERCEL;
    const request = new NextRequest("http://localhost/test", {
      headers: {
        vercel: "1",
        "x-vercel-forwarded-for": "203.0.113.1",
      },
    });
    expect(getTrustedClientAddress(request)).toBe("unknown");
  });

  it("uses only the server-side VERCEL indicator for adapter trust", () => {
    process.env.VERCEL = "1";
    const request = new NextRequest("http://localhost/test", {
      headers: { "x-vercel-forwarded-for": "203.0.113.1" },
    });
    expect(getTrustedClientAddress(request)).toBe("203.0.113.1");
  });

  it("does not log or throw rejected address values", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => resolveTrustedClientAddress(
      headers({ "x-vercel-forwarded-for": "not-an-ip-sensitive-input" }),
      { isVercel: true },
    )).not.toThrow();
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});

describe("fingerprint and Turnstile downstream invariants", () => {
  it("keeps unknown-address fingerprints deterministic and phone-inclusive", () => {
    const first = createRequestFingerprint("unknown", "+919999000001", "secret");
    expect(createRequestFingerprint("unknown", "+919999000001", "secret")).toBe(first);
    expect(createRequestFingerprint("unknown", "+919999000002", "secret")).not.toBe(first);
    expect(createRequestFingerprint("203.0.113.1", "+919999000001", "secret")).not.toBe(first);
  });

  it.each([
    ["unknown", false],
    ["203.0.113.1", true],
  ] as const)("sets Turnstile remoteip for trusted addresses only", async (address, included) => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await expect(verifyTurnstile("token", address, "secret")).resolves.toBe(true);
    const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.has("remoteip")).toBe(included);
    if (included) expect(body.get("remoteip")).toBe(address);
  });
});
