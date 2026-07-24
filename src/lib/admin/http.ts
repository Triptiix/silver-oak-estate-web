import "server-only";

import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/auth/admin";

export const ADMIN_CACHE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

export async function authorizeAdminApi() {
  const admin = await getActiveAdmin();
  if (!admin || !["operations", "admin", "super_admin"].includes(admin.role)) {
    return null;
  }
  return admin;
}

export function adminJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: ADMIN_CACHE_HEADERS });
}

export function adminError(status: 400 | 403 | 404 | 500) {
  return adminJson({ error: status === 404 ? "not_found" : "request_unavailable" }, status);
}
