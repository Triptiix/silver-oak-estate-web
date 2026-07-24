import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminShell } from "@/components/admin/admin-shell";
import { Pagination } from "@/components/admin/pagination";
import { PaymentTable } from "@/components/admin/payment-table";
import { listAdminPayments } from "@/lib/admin/database";
import { parseAdminListQuery } from "@/lib/admin/query";
import { requireAdminRole } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminRecoveryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminRole("operations", "admin", "super_admin");
  const params = await searchParams;
  const result = await listAdminPayments(parseAdminListQuery(params), true);
  return <AdminShell title="Recovery queue" description="Diagnosis for refund_pending and reconciliation_required only. Refund, confirmation and revival controls are intentionally absent."><AdminFilters showRecoveryState /><PaymentTable items={result.items} recovery /><Pagination page={result.page} totalPages={result.totalPages} path="/admin/recovery" query={params} /></AdminShell>;
}
