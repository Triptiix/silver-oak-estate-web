import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";

type ClientAddressHeaders = Pick<Headers, "get">;

export function resolveTrustedClientAddress(
  headers: ClientAddressHeaders,
  runtime: { isVercel: boolean },
): string {
  if (!runtime.isVercel) return "unknown";

  const forwarded = headers.get("x-vercel-forwarded-for")
    ?? headers.get("x-forwarded-for");
  const address = forwarded?.split(",")[0]?.trim();

  return address && isIP(address) !== 0 ? address : "unknown";
}

export function getTrustedClientAddress(request: NextRequest): string {
  return resolveTrustedClientAddress(request.headers, {
    isVercel: process.env.VERCEL === "1",
  });
}

export function createRequestFingerprint(address: string, phone: string, secret: string): string {
  return createHmac("sha256", secret).update(`${address}\n${phone}`).digest("hex");
}
