import { type NextRequest } from "next/server";
import { listAdminBookings } from "@/lib/admin/database";
import { adminError, adminJson, authorizeAdminApi } from "@/lib/admin/http";
import { parseAdminListQuery } from "@/lib/admin/query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!await authorizeAdminApi()) return adminError(403);
  try {
    const query = parseAdminListQuery(Object.fromEntries(request.nextUrl.searchParams));
    return adminJson(await listAdminBookings(query));
  } catch {
    return adminError(500);
  }
}
