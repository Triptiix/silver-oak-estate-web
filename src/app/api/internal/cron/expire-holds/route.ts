import { NextRequest, NextResponse } from "next/server";
import { envServer } from "@/lib/env/server";
import { expireHolds } from "@/lib/booking/database";
import { secretsEqual } from "@/lib/booking/security";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!secretsEqual(authorization, `Bearer ${envServer.CRON_SECRET}`)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized." } }, { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
  try {
    const expiredCount = await expireHolds();
    return NextResponse.json({ expiredCount }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Cleanup failed." } }, { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
