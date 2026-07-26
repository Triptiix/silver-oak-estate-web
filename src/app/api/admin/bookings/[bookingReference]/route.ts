import { getAdminBookingDetail } from "@/lib/admin/database";
import { adminError, adminJson, authorizeAdminApi } from "@/lib/admin/http";
import { isCanonicalBookingReference } from "@/lib/admin/query";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingReference: string }> },
) {
  if (!await authorizeAdminApi()) return adminError(403);
  try {
    const { bookingReference } = await params;
    if (!isCanonicalBookingReference(bookingReference)) return adminError(404);
    const detail = await getAdminBookingDetail(bookingReference);
    return detail ? adminJson(detail) : adminError(404);
  } catch {
    return adminError(500);
  }
}
