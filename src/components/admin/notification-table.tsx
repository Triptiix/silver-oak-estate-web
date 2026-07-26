import Link from "next/link";
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AdminNotificationItem } from "@/lib/admin/types";
import { StatusBadge } from "./status-badge";

export function NotificationTable({ items }: { items: AdminNotificationItem[] }) {
  if (!items.length) {
    return <div className="rounded border border-dashed p-10 text-center text-[var(--muted-foreground)]">No notification-outbox records match these filters.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-white">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">Notification outbox visibility</caption>
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-600">
          <tr>{["Booking", "Notification", "Recipient", "State", "Delivery meaning", "Created"].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item, index) => (
            <tr key={`${item.bookingReference}-${item.templateKey}-${index}`} className="align-top">
              <td className="px-4 py-4 font-mono">{item.bookingReference ? <Link className="underline underline-offset-4" href={`/admin/bookings/${item.bookingReference}`}>{item.bookingReference}</Link> : "System"}</td>
              <td className="px-4 py-4">{item.templateKey.replaceAll("_", " ")}<span className="block text-xs text-stone-500">{item.channel}</span></td>
              <td className="px-4 py-4">{item.recipientMasked ?? "Masked"}</td>
              <td className="px-4 py-4"><StatusBadge value={item.status} /></td>
              <td className="max-w-xs px-4 py-4"><strong className="capitalize">{item.deliveryLabel}</strong><span className="block text-xs text-stone-500">{item.deliveryNote}</span></td>
              <td className="whitespace-nowrap px-4 py-4 text-xs">{formatAdminDateTime(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
