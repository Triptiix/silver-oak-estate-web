import Link from "next/link";
import { formatAdminDate, formatAdminDateTime, formatPaise } from "@/lib/admin/format";
import type { AdminBookingListItem } from "@/lib/admin/types";
import { StatusBadge } from "./status-badge";

export function BookingTable({ items }: { items: AdminBookingListItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded border border-dashed p-8 text-center text-[var(--muted-foreground)] sm:p-10">
        <h2 className="font-bold text-[var(--foreground)]">
          No booking records matched
        </h2>
        <p className="mt-2 text-sm">
          No booking records matched the current server-side filters.
        </p>
        <Link
          href="/admin/bookings"
          className="mt-4 inline-flex min-h-11 items-center rounded border border-[var(--border)] px-4 font-semibold text-[var(--foreground)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        >
          Reset booking filters
        </Link>
      </div>
    );
  }
  return (
    <ul aria-label="Authorized booking operations records" className="space-y-4">
      {items.map((item) => (
        <li
          key={item.bookingReference}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 sm:p-5"
        >
          <article>
            <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Booking reference
                </p>
                <Link
                  className="mt-1 inline-flex min-h-11 max-w-full items-center break-all font-mono font-bold underline decoration-stone-300 underline-offset-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                  href={`/admin/bookings/${item.bookingReference}`}
                >
                  {item.bookingReference}
                </Link>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Advance
                </p>
                <p className="mt-1 font-mono font-bold">
                  {formatPaise(item.advanceAmountPaise)}
                </p>
              </div>
            </div>

            <div className="grid gap-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Stay
                </h2>
                <p className="mt-2 font-medium">{formatAdminDate(item.checkInAt)}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Checkout {formatAdminDate(item.checkOutAt)}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Masked customer
                </h2>
                <p className="mt-2 font-medium">{item.customerNameMasked}</p>
                <p className="font-mono text-sm text-[var(--muted-foreground)]">
                  {item.customerPhoneMasked}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Lifecycle
                </h2>
                <dl className="mt-2 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt>Booking</dt>
                    <dd><StatusBadge value={item.bookingStatus} /></dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt>Reservation</dt>
                    <dd><StatusBadge value={item.reservationStatus} /></dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt>Payment</dt>
                    <dd><StatusBadge value={item.paymentStatus} /></dd>
                  </div>
                </dl>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Operational context
                </h2>
                <dl className="mt-2 space-y-2 text-sm">
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Reservation type</dt>
                    <dd className="capitalize">
                      {item.reservationType?.replaceAll("_", " ") ?? "No reservation"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Payment provider</dt>
                    <dd className="break-all capitalize">
                      {item.paymentProvider?.replaceAll("_", " ") ?? "No payment attempt"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {item.holdExpiresAt ? (
              <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <strong>Hold expiry:</strong>{" "}
                {formatAdminDateTime(item.holdExpiresAt)}
              </p>
            ) : null}

            <dl className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)] sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Updated</dt>
                <dd>{formatAdminDateTime(item.updatedAt)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Created</dt>
                <dd>{formatAdminDateTime(item.createdAt)}</dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ul>
  );
}
