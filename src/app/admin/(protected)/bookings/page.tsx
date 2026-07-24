import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminShell } from "@/components/admin/admin-shell";
import { BookingTable } from "@/components/admin/booking-table";
import { Pagination } from "@/components/admin/pagination";
import { requireAdminRole } from "@/lib/auth/admin";
import { listAdminBookings } from "@/lib/admin/database";
import { parseAdminListQuery } from "@/lib/admin/query";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking Operations | Silver Oak Estate" };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminRole("operations", "admin", "super_admin");
  const params = await searchParams;
  const query = parseAdminListQuery(params);
  const result = await listAdminBookings(query);
  return (
    <AdminShell title="Booking operations" description="Server-filtered bookings, authoritative reservations, holds and payment state. Customer identifiers are masked.">
      <AdminFilters showBookingStatus showPaymentStatus showRecoveryState showDates />
      <BookingTable items={result.items} />
      <Pagination page={result.page} totalPages={result.totalPages} path="/admin/bookings" query={params} />
    </AdminShell>
  );
}
