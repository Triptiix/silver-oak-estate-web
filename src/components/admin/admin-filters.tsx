import Link from "next/link";
import type { AdminListQuery } from "@/lib/admin/types";

const bookingStatuses = [
  "draft",
  "held",
  "payment_pending",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "expired",
] as const;

const paymentStatuses = [
  "not_started",
  "order_created",
  "checkout_started",
  "pending",
  "authorized",
  "captured",
  "verified",
  "failed",
  "expired",
  "refund_pending",
  "reconciliation_required",
  "partially_refunded",
  "refunded",
] as const;

function optionLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

export function AdminFilters({
  showBookingStatus = false,
  showPaymentStatus = false,
  showRecoveryState = false,
  showNotificationStatus = false,
  showDates = false,
  showPageSize = false,
  values,
  resetPath,
  heading = "Filter operational records",
}: {
  showBookingStatus?: boolean;
  showPaymentStatus?: boolean;
  showRecoveryState?: boolean;
  showNotificationStatus?: boolean;
  showDates?: boolean;
  showPageSize?: boolean;
  values?: AdminListQuery;
  resetPath?: string;
  heading?: string;
}) {
  return (
    <form
      method="get"
      className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
    >
      <div>
        <h2 className="text-lg font-bold">{heading}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Filters are applied on the server. Use the complete booking reference
          format, for example <span className="font-mono">SOE-YYYYMMDD-XXXXXXXX</span>.
        </p>
      </div>
      <input type="hidden" name="page" value="1" />
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label
            htmlFor="admin-booking-reference"
            className="text-sm font-semibold text-[var(--foreground)]"
          >
            Booking reference
          </label>
          <input
            id="admin-booking-reference"
            name="bookingReference"
            defaultValue={values?.bookingReference}
            maxLength={21}
            pattern="SOE-[0-9]{8}-[A-F0-9]{8}"
            placeholder="SOE-20260725-ABCD1234"
            aria-describedby="booking-reference-help"
            className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)]"
          />
          <span
            id="booking-reference-help"
            className="mt-1.5 block text-xs font-normal text-[var(--muted-foreground)]"
          >
            Full reference required; partial references and customer details are
            not searchable.
          </span>
        </div>
        {showBookingStatus && (
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Booking state
            <select
              name="bookingStatus"
              defaultValue={values?.bookingStatus ?? ""}
              className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
            >
              <option value="">All booking states</option>
              {bookingStatuses.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </select>
          </label>
        )}
        {showPaymentStatus && (
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Payment state
            <select
              name="paymentStatus"
              defaultValue={values?.paymentStatus ?? ""}
              className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
            >
              <option value="">All payment states</option>
              {paymentStatuses.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </select>
          </label>
        )}
        {showRecoveryState && (
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Recovery state
            <select
              name="recoveryState"
              defaultValue={values?.recoveryState ?? ""}
              className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
            >
              <option value="">All recovery states</option>
              <option value="refund_pending">Refund pending</option>
              <option value="reconciliation_required">
                Reconciliation required
              </option>
            </select>
          </label>
        )}
        {showNotificationStatus && (
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Notification state
            <select
              name="notificationStatus"
              defaultValue={values?.notificationStatus ?? ""}
              className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
            >
              <option value="">All notification states</option>
              {["pending", "sent", "failed"].map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </select>
          </label>
        )}
        {showDates && (
          <>
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Check-in from
              <input
                name="checkInFrom"
                type="date"
                defaultValue={values?.checkInFrom}
                className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Check-in to
              <input
                name="checkInTo"
                type="date"
                defaultValue={values?.checkInTo}
                className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
              />
            </label>
          </>
        )}
        <label className="text-sm font-semibold text-[var(--foreground)]">
          Sort order
          <select
            name="sort"
            defaultValue={values?.sort ?? "newest"}
            className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        {showPageSize && (
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Results per page
            <select
              name="pageSize"
              defaultValue={String(values?.pageSize ?? 20)}
              className="mt-1.5 block min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
            >
              {[...new Set([10, 20, 50, values?.pageSize ?? 20])]
                .sort((first, second) => first - second)
                .map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          className="min-h-11 rounded-[var(--radius)] bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)]"
        >
          Apply filters
        </button>
        {resetPath ? (
          <Link
            href={resetPath}
            className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-[var(--border)] px-5 text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          >
            Reset filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
