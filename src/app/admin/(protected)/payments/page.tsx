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
  title: "Payment attempts | Silver Oak Estate Operations",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminRole("operations", "admin", "super_admin");
  const params = await searchParams;
  const query = parseAdminListQuery(params);
  const result = await listAdminPayments(query);
  return (
    <AdminShell
      title="Payment attempts"
      description="Server-filtered, read-only payment attempts for operational diagnosis. Provider references and verification facts are persisted observations."
    >
      <section
        aria-labelledby="payments-workspace-heading"
        className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--accent)] p-4 sm:p-5"
      >
        <h2 id="payments-workspace-heading" className="font-bold">
          Read-only payment diagnosis
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted-foreground)]">
          This page lists persisted payment attempts. Filtering runs on the
          server. Provider references are shown for diagnosis, and a provider
          reference alone does not prove verification; verification facts are
          separate persisted observations. This page has no refund,
          reconciliation, capture, deletion or editing controls, and cannot
          modify payment state. Open a booking reference for unified booking
          diagnosis.
        </p>
      </section>
      <AdminFilters
        showPaymentStatus
        showRecoveryState
        showPageSize
        values={query}
        resetPath="/admin/payments"
        heading="Filter payment attempts"
      />
      <PaymentTable items={result.items} resetPath="/admin/payments" />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        path="/admin/payments"
        query={params}
        label="Payment attempts pagination"
      />
    </AdminShell>
  );
}
