export function AdminFilters({
  showBookingStatus = false,
  showPaymentStatus = false,
  showRecoveryState = false,
  showNotificationStatus = false,
  showDates = false,
}: {
  showBookingStatus?: boolean;
  showPaymentStatus?: boolean;
  showRecoveryState?: boolean;
  showNotificationStatus?: boolean;
  showDates?: boolean;
}) {
  return (
    <form method="get" className="mb-6 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-3 xl:grid-cols-6">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        Search
        <input name="search" maxLength={80} placeholder="Reference or customer" className="mt-1 block h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)]" />
      </label>
      {showBookingStatus && (
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Booking
          <select name="bookingStatus" className="mt-1 block h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm">
            <option value="">All states</option>
            {["held", "payment_pending", "confirmed", "expired", "cancelled", "completed"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      )}
      {showPaymentStatus && (
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Payment
          <select name="paymentStatus" className="mt-1 block h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm">
            <option value="">All states</option>
            {["order_created", "checkout_started", "pending", "authorized", "captured", "verified", "failed", "refund_pending", "reconciliation_required"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      )}
      {showRecoveryState && (
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Recovery
          <select name="recoveryState" className="mt-1 block h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm">
            <option value="">All recovery</option>
            <option value="refund_pending">refund_pending</option>
            <option value="reconciliation_required">reconciliation_required</option>
          </select>
        </label>
      )}
      {showNotificationStatus && (
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Notification
          <select name="notificationStatus" className="mt-1 block h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm">
            <option value="">All states</option>
            {["pending", "sent", "failed"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      )}
      {showDates && (
        <>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Check-in from<input name="checkInFrom" type="date" className="mt-1 block h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm" /></label>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Check-in to<input name="checkInTo" type="date" className="mt-1 block h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm" /></label>
        </>
      )}
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        Sort
        <select name="sort" className="mt-1 block h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </label>
      <button type="submit" className="h-10 self-end rounded-[var(--radius)] bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]">Apply filters</button>
    </form>
  );
}
