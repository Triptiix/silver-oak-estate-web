import { NextResponse } from "next/server";
import { envServer } from "@/lib/env/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      environment: envServer.APP_ENV,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
