import Link from "next/link";
import { formatAdminDateTime, formatPaise } from "@/lib/admin/format";
import type { AdminPaymentItem } from "@/lib/admin/types";
import { StatusBadge } from "./status-badge";

export function PaymentTable({
  items,
  recovery = false,
  context = "default",
}: {
  items: AdminPaymentItem[];
  recovery?: boolean;
  context?: "default" | "booking-detail";
}) {
  if (!items.length) {
    return (
      <div className="rounded border border-dashed p-8 text-center text-[var(--muted-foreground)]">
        {context === "booking-detail"
          ? "No payment attempts are recorded for this booking."
          : recovery
            ? "No payments require recovery."
            : "No payment attempts match these filters."}
      </div>
    );
  }
  if (context === "booking-detail") {
    return (
      <ol aria-label="Payment attempts for this booking" className="space-y-4">
        {items.map((item, index) => (
          <li
            key={`${item.bookingReference}-${item.providerOrderId ?? index}`}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Attempt {index + 1}
                </p>
                <div className="mt-2"><StatusBadge value={item.status} /></div>
              </div>
              <p className="font-mono font-bold">
                {formatPaise(item.amountPaise, item.currency)}
              </p>
            </div>
            <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
              <div>
                <dt className="text-[var(--muted-foreground)]">Provider</dt>
                <dd className="break-all font-medium capitalize">
                  {item.provider.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Provider order reference</dt>
                <dd className="break-all font-mono">
                  {item.providerOrderId ?? "Not attached"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Provider payment reference</dt>
                <dd className="break-all font-mono">
                  {item.providerPaymentId ?? "Not attached"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Provider event reference</dt>
                <dd className="break-all font-mono">
                  {item.providerEventId ?? "Not attached"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Verification</dt>
                <dd className="break-words">
                  {item.verificationSource ?? "Not verified"}
                  <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                    {item.verifiedAt
                      ? formatAdminDateTime(item.verifiedAt)
                      : "Verification time not available"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Recovery or failure</dt>
                <dd className="break-words">
                  {item.recoveryReason?.replaceAll("_", " ")
                    ?? item.failureCode?.replaceAll("_", " ")
                    ?? "No recovery or failure reason"}
                  {recovery ? (
                    <span className="mt-1 block text-xs font-semibold text-amber-800">
                      Diagnosis only — no action available
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Updated</dt>
                <dd>{formatAdminDateTime(item.updatedAt)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    );
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
