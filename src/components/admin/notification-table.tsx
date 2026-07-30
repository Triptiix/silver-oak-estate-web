import Link from "next/link";
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AdminNotificationItem } from "@/lib/admin/types";
import { StatusBadge } from "./status-badge";

export function NotificationTable({
  items,
  context = "default",
  resetPath,
}: {
  items: AdminNotificationItem[];
  context?: "default" | "booking-detail";
  resetPath?: string;
}) {
  if (!items.length) {
    if (context === "booking-detail") {
      return (
        <div className="rounded border border-dashed p-8 text-center text-[var(--muted-foreground)]">
          No notification-outbox records are associated with this booking.
        </div>
      );
    }
    return (
      <div className="rounded border border-dashed p-8 text-center text-[var(--muted-foreground)]">
        <p>No notification-outbox records match these filters.</p>
        <p className="mt-2 text-sm">
          No notification-outbox records matched the current server-side filters.
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
      <ol aria-label="Notification outbox for this booking" className="space-y-4">
        {items.map((item, index) => (
          <li
            key={`${item.bookingReference}-${item.templateKey}-${index}`}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="break-words font-bold capitalize">
                  {item.templateKey.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm capitalize text-[var(--muted-foreground)]">
                  {item.channel}
                </p>
              </div>
              <StatusBadge value={item.status} />
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-[var(--muted-foreground)]">Masked recipient</dt>
                <dd className="break-all font-medium">
                  {item.recipientMasked ?? "Masked"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Delivery meaning</dt>
                <dd>
                  <strong className="capitalize">{item.deliveryLabel}</strong>
                  <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                    {item.deliveryNote}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Created</dt>
                <dd>{formatAdminDateTime(item.createdAt)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul aria-label="Notification outbox" className="space-y-4">
      {items.map((item, index) => (
        <li
          key={`${item.bookingReference}-${item.templateKey}-${index}`}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 sm:p-5"
        >
          <article>
            <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-bold capitalize">
                  {item.templateKey.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm capitalize text-[var(--muted-foreground)]">
                  {item.channel}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <StatusBadge value={item.status} />
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {item.bookingReference ? "Booking" : "Origin"}
                </p>
                {item.bookingReference ? (
                  <Link
                    className="inline-flex min-h-11 max-w-full items-center break-all font-mono text-sm font-semibold underline decoration-stone-300 underline-offset-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                    href={`/admin/bookings/${item.bookingReference}`}
                  >
                    {item.bookingReference}
                  </Link>
                ) : (
                  <span className="font-mono text-sm font-semibold">System</span>
                )}
              </div>
            </div>

            <dl className="grid gap-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Masked recipient</dt>
                <dd className="break-all font-medium">
                  {item.recipientMasked ?? "Masked"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Delivery meaning</dt>
                <dd>
                  <strong className="capitalize">{item.deliveryLabel}</strong>
                  <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                    {item.deliveryNote}
                  </span>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[var(--muted-foreground)]">Created</dt>
                <dd>
                  <time dateTime={item.createdAt}>
                    {formatAdminDateTime(item.createdAt)}
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
