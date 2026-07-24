import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationTable } from "@/components/admin/notification-table";
import { PaymentTable } from "@/components/admin/payment-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatAdminDateTime, formatPaise } from "@/lib/admin/format";
import { getAdminBookingDetail } from "@/lib/admin/database";
import { requireAdminRole } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

function Fact({ label, value, state }: { label: string; value: string; state?: string | null }) {
  return <div className="rounded border border-[var(--border)] bg-white p-4"><dt className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</dt><dd className="mt-2">{state !== undefined ? <StatusBadge value={state} /> : value}</dd></div>;
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingReference: string }>;
}) {
  await requireAdminRole("operations", "admin", "super_admin");
  const { bookingReference } = await params;
  if (!/^[A-Za-z0-9-]{3,80}$/.test(bookingReference)) notFound();
  const detail = await getAdminBookingDetail(bookingReference);
  if (!detail) notFound();
  const { booking } = detail;

  return (
    <AdminShell title={booking.bookingReference} description="Unified read-only operational diagnosis. No control on this page can confirm, revive, refund or reconcile a booking.">
      {detail.interventionRequired && <div role="alert" className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-amber-950"><strong>Administrator intervention required.</strong> Policy and execution remain outside Phase 5A.</div>}
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Booking state" value="" state={booking.bookingStatus} />
        <Fact label="Reservation" value="" state={booking.reservationStatus} />
        <Fact label="Payment" value="" state={booking.paymentStatus} />
        <Fact label="Recovery" value="" state={booking.recoveryState} />
        <Fact label="Hold eligible" value={detail.holdEligible ? "Yes" : "No"} />
        <Fact label="Reservation exists" value={detail.authoritativeReservationExists ? "Yes" : "No"} />
        <Fact label="Inventory converted" value={detail.inventoryConverted ? "Yes" : "No"} />
        <Fact label="Captured / verified" value={`${detail.moneyCaptured ? "Captured" : "Not captured"} / ${detail.moneyVerified ? "Verified" : "Not verified"}`} />
      </dl>

      <section className="mt-8 rounded border border-[var(--border)] bg-white p-5">
        <h2 className="text-xl font-bold">Booking and masked customer details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-stone-500">Customer</dt><dd>{booking.customerNameMasked}</dd></div>
          <div><dt className="text-stone-500">Email</dt><dd>{booking.customerEmailMasked ?? "Not provided"}</dd></div>
          <div><dt className="text-stone-500">Phone</dt><dd>{booking.customerPhoneMasked}</dd></div>
          <div><dt className="text-stone-500">Stay</dt><dd>{formatAdminDateTime(booking.checkInAt)} — {formatAdminDateTime(booking.checkOutAt)}</dd></div>
          <div><dt className="text-stone-500">Guests</dt><dd>{booking.guestCount} total / {booking.overnightGuestCount ?? 0} overnight</dd></div>
          <div><dt className="text-stone-500">Amounts</dt><dd>{formatPaise(booking.totalAmountPaise)} total · {formatPaise(booking.advanceAmountPaise)} advance</dd></div>
        </dl>
      </section>

      <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Payment-attempt history</h2><PaymentTable items={detail.payments} recovery={detail.interventionRequired} /></section>
      <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Audit and operational timeline</h2>
        <ol className="space-y-3 border-l border-stone-300 pl-5">
          {detail.timeline.map((item, index) => <li key={`${item.kind}-${item.occurredAt}-${index}`} className="relative rounded border border-[var(--border)] bg-white p-4 before:absolute before:-left-[1.55rem] before:top-5 before:h-2 before:w-2 before:rounded-full before:bg-stone-800"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="capitalize">{item.label}</strong><time className="font-mono text-xs text-stone-500">{formatAdminDateTime(item.occurredAt)}</time></div><p className="mt-1 text-xs uppercase tracking-wide text-stone-500">{item.kind}{item.state ? ` · ${item.state.replaceAll("_", " ")}` : ""}</p></li>)}
        </ol>
      </section>
      <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Notification outbox</h2><NotificationTable items={detail.notifications} /></section>
    </AdminShell>
  );
}
