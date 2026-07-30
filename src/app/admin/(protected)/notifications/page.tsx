import type { Metadata } from "next";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationTable } from "@/components/admin/notification-table";
import { Pagination } from "@/components/admin/pagination";
import { listAdminNotifications } from "@/lib/admin/database";
import { parseAdminListQuery } from "@/lib/admin/query";
import { requireAdminRole } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notification outbox | Silver Oak Estate Operations",
};

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminRole("operations", "admin", "super_admin");
  const params = await searchParams;
  const query = parseAdminListQuery(params);
  const result = await listAdminNotifications(query);
  return (
    <AdminShell
      title="Notification outbox"
      description="Server-filtered notification-outbox records. An outbox row alone is not proof of delivery."
    >
      <section
        aria-labelledby="notifications-workspace-heading"
        className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--accent)] p-4 sm:p-5"
      >
        <h2 id="notifications-workspace-heading" className="font-bold">
          Delivery terminology
        </h2>
        <ul className="mt-2 max-w-4xl list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--muted-foreground)]">
          <li>
            <span className="font-mono">pending</span> means queued; delivery is
            not implemented for pending records.
          </li>
          <li>
            <span className="font-mono">sent</span> reflects the persisted
            provider result.
          </li>
          <li>
            <span className="font-mono">failed</span> means a delivery attempt
            failed.
          </li>
          <li>
            An outbox row alone is not proof of delivery. Customer recipients
            remain masked, and no resend or delivery action exists here.
          </li>
        </ul>
      </section>
      <AdminFilters
        showNotificationStatus
        showPageSize
        values={query}
        resetPath="/admin/notifications"
        heading="Filter notification outbox"
      />
      <NotificationTable items={result.items} resetPath="/admin/notifications" />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        path="/admin/notifications"
        query={params}
        label="Notification outbox pagination"
      />
    </AdminShell>
  );
}
