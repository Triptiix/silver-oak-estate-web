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
    <AdminShell
      title="Booking operations"
      description="Server-filtered, masked booking records for unified operational diagnosis. Booking, reservation and payment states are authoritative persisted facts."
    >
      <section
        aria-labelledby="booking-workspace-heading"
        className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--accent)] p-4 sm:p-5"
      >
        <h2 id="booking-workspace-heading" className="font-bold">
          Read-only booking diagnosis
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted-foreground)]">
          Customer identifiers remain masked and all filters run on the server.
          Open a booking reference to inspect its unified reservation, payment,
          audit and notification history. This list contains no booking mutation
          controls.
        </p>
      </section>
      <AdminFilters
        showBookingStatus
        showPaymentStatus
        showRecoveryState
        showDates
        showPageSize
        values={query}
        resetPath="/admin/bookings"
        heading="Filter booking records"
      />
      <BookingTable items={result.items} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        path="/admin/bookings"
        query={params}
        label="Booking results pagination"
      />
    </AdminShell>
  );
}
