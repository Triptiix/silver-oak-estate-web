import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminShell } from "@/components/admin/admin-shell";
import { Pagination } from "@/components/admin/pagination";
import { PaymentTable } from "@/components/admin/payment-table";
import { listAdminPayments } from "@/lib/admin/database";
import { parseAdminListQuery } from "@/lib/admin/query";
import { requireAdminRole } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminRole("operations", "admin", "super_admin");
  const params = await searchParams;
  const result = await listAdminPayments(parseAdminListQuery(params));
  return <AdminShell title="Payment attempts" description="Read-only Razorpay test-mode lifecycle, verification and safe provider linkage."><AdminFilters showPaymentStatus showRecoveryState /><PaymentTable items={result.items} /><Pagination page={result.page} totalPages={result.totalPages} path="/admin/payments" query={params} /></AdminShell>;
}
