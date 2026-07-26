import { type NextRequest } from "next/server";
import { listAdminPayments } from "@/lib/admin/database";
import { adminError, adminJson, authorizeAdminApi } from "@/lib/admin/http";
import { parseAdminListQuery } from "@/lib/admin/query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!await authorizeAdminApi()) return adminError(403);
  try {
    return adminJson(
      await listAdminPayments(
        parseAdminListQuery(Object.fromEntries(request.nextUrl.searchParams)),
        true,
      ),
    );
  } catch {
    return adminError(500);
  }
}
