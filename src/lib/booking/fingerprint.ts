import "server-only";
import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";

export function getTrustedClientAddress(request: NextRequest): string {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export function createRequestFingerprint(address: string, phone: string, secret: string): string {
  return createHmac("sha256", secret).update(`${address}\n${phone}`).digest("hex");
}
