import Link from "next/link";
import { formatAdminDateTime, formatPaise } from "@/lib/admin/format";
import type { AdminPaymentItem } from "@/lib/admin/types";
import { StatusBadge } from "./status-badge";

export function PaymentTable({
  items,
  recovery = false,
  context = "default",
  resetPath,
}: {
  items: AdminPaymentItem[];
  recovery?: boolean;
  context?: "default" | "booking-detail";
  resetPath?: string;
}) {
  if (!items.length) {
    if (context === "booking-detail") {
      return (
        <div className="rounded border border-dashed p-8 text-center text-[var(--muted-foreground)]">
          No payment attempts are recorded for this booking.
        </div>
      );
    }
    return (
      <div className="rounded border border-dashed p-8 text-center text-[var(--muted-foreground)]">
        <p>
          {recovery
            ? "No payments require recovery."
            : "No payment attempts match these filters."}
        </p>
        <p className="mt-2 text-sm">
          {recovery
            ? "No recovery records matched the current server-side filters."
            : "No payment attempts matched the current server-side filters."}
        </p>
        {resetPath ? (
          <Link
            href={resetPath}
            className="mt-4 inline-flex min-h-11 items-center rounded border border-[var(--border)] px-4 font-semibold text-[var(--foreground)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          >
            Reset filters
          </Link>
        ) : null}
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
    <ul
      aria-label={recovery ? "Payment recovery queue" : "Payment attempts"}
      className="space-y-4"
    >
      {items.map((item, index) => (
        <li
          key={`${item.bookingReference}-${item.providerOrderId ?? index}`}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 sm:p-5"
        >
          <article className={recovery ? "border-l-4 border-amber-500 pl-4" : ""}>
            <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Booking reference
                </p>
                <Link
                  className="mt-1 inline-flex min-h-11 max-w-full items-center break-all font-mono font-bold underline decoration-stone-300 underline-offset-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                  href={`/admin/bookings/${item.bookingReference}`}
                >
                  {item.bookingReference}
                </Link>
                <div className="mt-2"><StatusBadge value={item.status} /></div>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Amount
                </p>
                <p className="mt-1 font-mono text-lg font-bold">
                  {formatPaise(item.amountPaise, item.currency)}
                </p>
              </div>
            </div>

            <dl className="grid gap-4 py-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Provider</dt>
                <dd className="break-all font-medium capitalize">
                  {item.provider.replaceAll("_", " ")}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Provider order reference</dt>
                <dd className="break-all font-mono">
                  {item.providerOrderId ?? "Not attached"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Provider payment reference</dt>
                <dd className="break-all font-mono">
                  {item.providerPaymentId ?? "Not attached"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Provider event reference</dt>
                <dd className="break-all font-mono">
                  {item.providerEventId ?? "Not attached"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Verification</dt>
                <dd className="break-words">
                  {item.verificationSource ?? "Not verified"}
                  <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                    {item.verifiedAt ? (
                      <time dateTime={item.verifiedAt}>
                        {formatAdminDateTime(item.verifiedAt)}
                      </time>
                    ) : (
                      "Verification time not available"
                    )}
                  </span>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Recovery or failure</dt>
                <dd className="break-words font-medium">
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
            </dl>

            <dl className="border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Updated</dt>
                <dd>
                  <time dateTime={item.updatedAt}>
                    {formatAdminDateTime(item.updatedAt)}
                  </time>
                </dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ul>
  );
}
