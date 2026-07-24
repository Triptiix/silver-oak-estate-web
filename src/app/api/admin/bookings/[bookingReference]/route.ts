import { getAdminBookingDetail } from "@/lib/admin/database";
import { adminError, adminJson, authorizeAdminApi } from "@/lib/admin/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingReference: string }> },
) {
  if (!await authorizeAdminApi()) return adminError(403);
  try {
    const { bookingReference } = await params;
    if (!/^[A-Za-z0-9-]{3,80}$/.test(bookingReference)) return adminError(400);
    const detail = await getAdminBookingDetail(bookingReference);
    return detail ? adminJson(detail) : adminError(404);
  } catch {
    return adminError(500);
  }
}
