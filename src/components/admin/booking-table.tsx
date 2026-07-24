import Link from "next/link";
import { formatAdminDate, formatAdminDateTime, formatPaise } from "@/lib/admin/format";
import type { AdminBookingListItem } from "@/lib/admin/types";
import { StatusBadge } from "./status-badge";

export function BookingTable({ items }: { items: AdminBookingListItem[] }) {
  if (!items.length) {
    return <div className="rounded border border-dashed p-10 text-center text-[var(--muted-foreground)]">No bookings match these server-side filters.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-white">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">Authorized booking operations records</caption>
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-600">
          <tr>{["Booking", "Stay", "Customer", "Booking", "Reservation", "Payment", "Advance", "Updated"].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <tr key={item.bookingReference} className="align-top">
              <td className="px-4 py-4 font-mono font-semibold"><Link className="underline decoration-stone-300 underline-offset-4" href={`/admin/bookings/${item.bookingReference}`}>{item.bookingReference}</Link></td>
              <td className="whitespace-nowrap px-4 py-4">{formatAdminDate(item.checkInAt)}<span className="block text-xs text-stone-500">to {formatAdminDate(item.checkOutAt)}</span></td>
              <td className="px-4 py-4">{item.customerNameMasked}<span className="block text-xs text-stone-500">{item.customerPhoneMasked}</span></td>
              <td className="px-4 py-4"><StatusBadge value={item.bookingStatus} /></td>
              <td className="px-4 py-4"><StatusBadge value={item.reservationStatus} /><span className="mt-1 block text-xs text-stone-500">{item.reservationType?.replaceAll("_", " ") ?? "No reservation"}</span>{item.holdExpiresAt && <span className="mt-1 block text-xs text-stone-500">Hold until {formatAdminDateTime(item.holdExpiresAt)}</span>}</td>
              <td className="px-4 py-4"><StatusBadge value={item.paymentStatus} /><span className="mt-1 block text-xs text-stone-500">{item.paymentProvider ?? "No attempt"}</span></td>
              <td className="whitespace-nowrap px-4 py-4 font-mono">{formatPaise(item.advanceAmountPaise)}</td>
              <td className="whitespace-nowrap px-4 py-4 text-xs">{formatAdminDateTime(item.updatedAt)}<span className="mt-1 block text-stone-500">Created {formatAdminDateTime(item.createdAt)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
