import type { Metadata } from "next";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminShell } from "@/components/admin/admin-shell";
import { Pagination } from "@/components/admin/pagination";
import { PaymentTable } from "@/components/admin/payment-table";
import { listAdminPayments } from "@/lib/admin/database";
import { parseAdminListQuery } from "@/lib/admin/query";
import { requireAdminRole } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recovery queue | Silver Oak Estate Operations",
};

export default async function AdminRecoveryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminRole("operations", "admin", "super_admin");
  const params = await searchParams;
  const query = parseAdminListQuery(params);
  const result = await listAdminPayments(query, true);
  return (
    <AdminShell
      title="Recovery queue"
      description="Diagnosis for refund_pending and reconciliation_required only. Refund, confirmation and revival controls are intentionally absent."
    >
      <section
        aria-labelledby="recovery-boundary-heading"
        className="mb-6 rounded-[var(--radius)] border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-950 sm:p-5"
      >
        <p className="text-xs font-bold uppercase tracking-[0.12em]">
          Diagnosis boundary
        </p>
        <h2 id="recovery-boundary-heading" className="mt-2 font-bold">
          Read-only recovery diagnosis
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6">
          This queue contains only payments in{" "}
          <span className="font-mono">refund_pending</span> and{" "}
          <span className="font-mono">reconciliation_required</span>. Each record
          requires operator review. The queue is read-only: no refund is
          initiated here, no reconciliation is executed here, and no expired
          inventory is revived here. Open a booking for its full persisted
          timeline.
        </p>
      </section>
      <AdminFilters
        showRecoveryState
        showPageSize
        values={query}
        resetPath="/admin/recovery"
        heading="Filter recovery queue"
      />
      <PaymentTable items={result.items} recovery resetPath="/admin/recovery" />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        path="/admin/recovery"
        query={params}
        label="Recovery queue pagination"
      />
    </AdminShell>
  );
}
