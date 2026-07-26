// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readBoundedJson } from "@/lib/security/bounded-json";

const encoder = new TextEncoder();

function request(
  body: BodyInit | null,
  options: { contentLength?: string; contentType?: string | null } = {},
) {
  const headers = new Headers();
  if (options.contentType !== null) {
    headers.set("content-type", options.contentType ?? "application/json");
  }
  if (options.contentLength !== undefined) {
    headers.set("content-length", options.contentLength);
  }
  return new Request("http://localhost/test", {
    method: "POST",
    headers,
    body,
    ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
  } as RequestInit & { duplex?: "half" });
}

function jsonAtByteLength(length: number): string {
  return `{"x":"${"a".repeat(length - 8)}"}`;
}

function streamedRequest(
  chunks: Uint8Array[],
  options: {
    contentLength?: string;
    contentType?: string | null;
    failAtChunk?: number;
  } = {},
) {
  let chunksRead = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (options.failAtChunk === chunksRead) {
        controller.error(new Error("private stream failure detail"));
        return;
      }
      const chunk = chunks[chunksRead];
      if (!chunk) {
        controller.close();
        return;
      }
      chunksRead += 1;
      controller.enqueue(chunk);
    },
    cancel() {
      cancelled = true;
    },
  }, { highWaterMark: 0 });
  return {
    request: request(body, options),
    chunksRead: () => chunksRead,
    cancelled: () => cancelled,
  };
}

describe("bounded JSON reader", () => {
  it("accepts small valid JSON", async () => {
    await expect(readBoundedJson(request('{"ok":true}'), 100)).resolves.toEqual({
      ok: true,
      value: { ok: true },
    });
  });

  it("accepts an empty JSON object", async () => {
    await expect(readBoundedJson(request("{}"), 2)).resolves.toEqual({
      ok: true,
      value: {},
    });
  });

  it("accepts valid JSON exactly at the byte limit", async () => {
    const raw = jsonAtByteLength(64);
    expect(encoder.encode(raw)).toHaveLength(64);
    expect((await readBoundedJson(request(raw), 64)).ok).toBe(true);
  });

  it("rejects a body one byte over the limit", async () => {
    const raw = jsonAtByteLength(65);
    await expect(readBoundedJson(request(raw), 64)).resolves.toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("rejects oversized Content-Length before reading", async () => {
    const stream = streamedRequest([encoder.encode("{}")], { contentLength: "101" });
    expect(await readBoundedJson(stream.request, 100)).toEqual({
      ok: false,
      reason: "too_large",
    });
    expect(stream.chunksRead()).toBe(0);
  });

  it("enforces the stream limit without Content-Length", async () => {
    const stream = streamedRequest([encoder.encode(jsonAtByteLength(65))]);
    expect(await readBoundedJson(stream.request, 64)).toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("does not trust an understated Content-Length", async () => {
    const stream = streamedRequest(
      [encoder.encode(jsonAtByteLength(65))],
      { contentLength: "1" },
    );
    expect(await readBoundedJson(stream.request, 64)).toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("does not trust malformed Content-Length", async () => {
    const stream = streamedRequest(
      [encoder.encode(jsonAtByteLength(65))],
      { contentLength: "not-a-number" },
    );
    expect(await readBoundedJson(stream.request, 64)).toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("stops a chunked body as soon as it crosses the limit", async () => {
    const stream = streamedRequest([
      new Uint8Array(64),
      new Uint8Array([1]),
      new Uint8Array([2]),
    ]);
    expect(await readBoundedJson(stream.request, 64)).toEqual({
      ok: false,
      reason: "too_large",
    });
    expect(stream.chunksRead()).toBe(2);
    expect(stream.cancelled()).toBe(true);
  });

  it("counts multi-byte UTF-8 bytes rather than JavaScript characters", async () => {
    const raw = JSON.stringify({ value: "€€" });
    expect(raw.length).toBeLessThan(encoder.encode(raw).byteLength);
    expect(await readBoundedJson(request(raw), raw.length)).toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("classifies malformed JSON", async () => {
    expect(await readBoundedJson(request("{nope}"), 100)).toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("classifies truncated JSON", async () => {
    expect(await readBoundedJson(request('{"value":'), 100)).toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("classifies invalid UTF-8 without leaking decoder details", async () => {
    const invalidUtf8 = new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]);
    expect(await readBoundedJson(request(invalidUtf8), 100)).toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("classifies an empty body", async () => {
    expect(await readBoundedJson(request(""), 100)).toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("classifies a null body", async () => {
    expect(await readBoundedJson(request(null), 100)).toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("classifies stream failures without leaking details", async () => {
    const stream = streamedRequest(
      [encoder.encode('{"value":')],
      { failAtChunk: 1 },
    );
    const result = await readBoundedJson(stream.request, 100);
    expect(result).toEqual({ ok: false, reason: "invalid_json" });
    expect(JSON.stringify(result)).not.toContain("private stream failure");
  });

  it("accepts application/json", async () => {
    expect((await readBoundedJson(request("{}"), 100)).ok).toBe(true);
  });

  it("accepts application/json with charset", async () => {
    const incoming = request("{}", {
      contentType: "application/json; charset=utf-8",
    });
    expect((await readBoundedJson(incoming, 100)).ok).toBe(true);
  });

  it("accepts structured +json media types", async () => {
    const incoming = request("{}", {
      contentType: "application/problem+json",
    });
    expect((await readBoundedJson(incoming, 100)).ok).toBe(true);
  });

  it("rejects unrelated content types", async () => {
    const incoming = request("{}", { contentType: "text/plain" });
    expect(await readBoundedJson(incoming, 100)).toEqual({
      ok: false,
      reason: "unsupported_media_type",
    });
  });

  it("returns no request content in errors", async () => {
    const privatePayload = '{"secret":"must-not-leak"';
    const result = await readBoundedJson(request(privatePayload), 100);
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
  });

  it("cancels and unlocks an oversized stream", async () => {
    const stream = streamedRequest([new Uint8Array(101)]);
    await readBoundedJson(stream.request, 100);
    expect(stream.cancelled()).toBe(true);
    expect(stream.request.body?.locked).toBe(false);
  });
});

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? routeFiles(path)
      : entry.name === "route.ts" ? [path] : [];
  });
}

describe("request-body boundary source", () => {
  const holdPath = "src/app/api/bookings/hold/route.ts";
  const verifyPath = "src/app/api/payments/verify/route.ts";
  const webhookPath = "src/app/api/payments/webhook/route.ts";
  const holdSource = readFileSync(holdPath, "utf8");
  const verifySource = readFileSync(verifyPath, "utf8");
  const webhookSource = readFileSync(webhookPath, "utf8");

  it("removes request.json from both affected routes", () => {
    expect(holdSource).not.toContain("request.json");
    expect(verifySource).not.toContain("request.json");
  });

  it("imports the shared reader in both affected routes", () => {
    expect(holdSource).toContain("@/lib/security/bounded-json");
    expect(verifySource).toContain("@/lib/security/bounded-json");
  });

  it("leaves the webhook on its separate raw-body boundary", () => {
    expect(webhookSource).not.toContain("@/lib/security/bounded-json");
    expect(webhookSource).toContain("readBoundedRawBody");
    expect(webhookSource).toContain("MAX_WEBHOOK_BYTES = 256_000");
  });

  it("has no second bounded JSON implementation in API routes", () => {
    const sources = routeFiles("src/app/api").map((path) => readFileSync(path, "utf8"));
    expect(sources.filter((source) =>
      source.includes("@/lib/security/bounded-json")
    )).toHaveLength(2);
    expect(sources.some((source) => source.includes("function readBoundedJson"))).toBe(false);
  });
});
