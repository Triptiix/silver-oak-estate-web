import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationTable } from "@/components/admin/notification-table";
import { Pagination } from "@/components/admin/pagination";
import { listAdminNotifications } from "@/lib/admin/database";
import { parseAdminListQuery } from "@/lib/admin/query";
import { requireAdminRole } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminRole("operations", "admin", "super_admin");
  const params = await searchParams;
  const result = await listAdminNotifications(parseAdminListQuery(params));
  return <AdminShell title="Notification outbox" description="Queued, delivered and failed records. Pending rows are explicitly labelled delivery not implemented."><AdminFilters showNotificationStatus /><NotificationTable items={result.items} /><Pagination page={result.page} totalPages={result.totalPages} path="/admin/notifications" query={params} /></AdminShell>;
}
