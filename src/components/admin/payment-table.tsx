import Link from "next/link";
import { formatAdminDateTime, formatPaise } from "@/lib/admin/format";
import type { AdminPaymentItem } from "@/lib/admin/types";
import { StatusBadge } from "./status-badge";

export function PaymentTable({ items, recovery = false }: { items: AdminPaymentItem[]; recovery?: boolean }) {
  if (!items.length) {
    return <div className="rounded border border-dashed p-10 text-center text-[var(--muted-foreground)]">{recovery ? "No payments require recovery." : "No payment attempts match these filters."}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-white">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{recovery ? "Read-only payment recovery queue" : "Payment attempts"}</caption>
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-600">
          <tr>{["Booking", "State", "Provider references", "Amount", "Verification", "Recovery", "Updated"].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item, index) => (
            <tr key={`${item.bookingReference}-${item.providerOrderId ?? index}`} className="align-top">
              <td className="px-4 py-4 font-mono"><Link className="underline underline-offset-4" href={`/admin/bookings/${item.bookingReference}`}>{item.bookingReference}</Link></td>
              <td className="px-4 py-4"><StatusBadge value={item.status} /></td>
              <td className="px-4 py-4 font-mono text-xs"><span className="block">{item.provider}: {item.providerOrderId ?? "order not attached"}</span><span className="mt-1 block text-stone-500">{item.providerPaymentId ?? "payment not attached"}</span>{item.providerEventId && <span className="mt-1 block text-stone-500">Event {item.providerEventId}</span>}</td>
              <td className="whitespace-nowrap px-4 py-4 font-mono">{formatPaise(item.amountPaise, item.currency)}</td>
              <td className="px-4 py-4">{item.verificationSource ?? "Not verified"}<span className="block text-xs text-stone-500">{item.verifiedAt ? formatAdminDateTime(item.verifiedAt) : "—"}</span></td>
              <td className="max-w-xs px-4 py-4">{item.recoveryReason?.replaceAll("_", " ") ?? item.failureCode?.replaceAll("_", " ") ?? "None"}{recovery && <span className="mt-1 block text-xs font-semibold text-amber-800">Diagnosis only — no action available</span>}</td>
              <td className="whitespace-nowrap px-4 py-4 text-xs">{formatAdminDateTime(item.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
