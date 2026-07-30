import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationTable } from "@/components/admin/notification-table";
import { ManualPaymentVerificationPanel } from "@/components/admin/operations/manual-payment-verification-panel";
import { resolveManualPaymentCandidate } from "@/components/admin/operations/manual-payment-candidate";
import { PaymentTable } from "@/components/admin/payment-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatAdminDateTime, formatPaise } from "@/lib/admin/format";
import { getAdminBookingDetail } from "@/lib/admin/database";
import { isCanonicalBookingReference } from "@/lib/admin/query";
import { requireAdminRole } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Booking diagnosis | Silver Oak Estate",
};

function Fact({
  label,
  value,
  state,
}: {
  label: string;
  value?: string;
  state?: string | null;
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd className="mt-2 break-words font-medium">
        {state !== undefined ? <StatusBadge value={state} /> : value}
      </dd>
    </div>
  );
}

function FactGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--accent)] p-4 sm:p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingReference: string }>;
}) {
  const admin = await requireAdminRole("operations", "admin", "super_admin");
  const { bookingReference } = await params;
  if (!isCanonicalBookingReference(bookingReference)) notFound();
  const detail = await getAdminBookingDetail(bookingReference);
  if (!detail) notFound();

  const { booking } = detail;
  const latestPayment = detail.payments.at(-1);
  const hasEligibleManualPayment = Boolean(
    latestPayment
      && ["manual_upi", "payment_link"].includes(latestPayment.provider)
      && ["pending", "expired"].includes(latestPayment.status),
  );
  const manualPaymentCandidate = resolveManualPaymentCandidate(
    admin.role,
    booking.bookingReference,
    detail.payments,
  );

  return (
    <AdminShell
      title={booking.bookingReference}
      description="Unified operational diagnosis from persisted booking, reservation, payment, audit and notification records."
    >
      <Link
        href="/admin/bookings"
        className="mb-5 inline-flex min-h-11 items-center rounded border border-[var(--border)] bg-white px-4 text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
      >
        Back to booking records
      </Link>

      {detail.interventionRequired ? (
        <div
          role="alert"
          className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-amber-950"
        >
          <strong>Administrator intervention required.</strong>{" "}
          This is a diagnosis state only. Refund, revival and reconciliation
          execution controls remain absent.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <FactGroup
          title="Lifecycle"
          description="Persisted booking, reservation, payment and recovery states."
        >
          <Fact label="Booking state" state={booking.bookingStatus} />
          <Fact label="Reservation state" state={booking.reservationStatus} />
          <Fact label="Payment state" state={booking.paymentStatus} />
          <Fact label="Recovery state" state={booking.recoveryState} />
        </FactGroup>
        <FactGroup
          title="Inventory"
          description="Authoritative reservation and conversion observations."
        >
          <Fact
            label="Hold eligibility"
            value={detail.holdEligible ? "Eligible" : "Not eligible"}
          />
          <Fact
            label="Authoritative reservation"
            value={detail.authoritativeReservationExists ? "Exists" : "Does not exist"}
          />
          <Fact
            label="Inventory conversion"
            value={detail.inventoryConverted ? "Converted" : "Not converted"}
          />
          <Fact
            label="Reservation type"
            value={
              booking.reservationType?.replaceAll("_", " ")
              ?? "Not available"
            }
          />
        </FactGroup>
        <FactGroup
          title="Money observation"
          description="Captured and verified are separate persisted facts."
        >
          <Fact
            label="Captured"
            value={detail.moneyCaptured ? "Captured" : "Not captured"}
          />
          <Fact
            label="Verified"
            value={detail.moneyVerified ? "Verified" : "Not verified"}
          />
          <Fact
            label="Payment provider"
            value={
              booking.paymentProvider?.replaceAll("_", " ")
              ?? "No payment attempt"
            }
          />
          <Fact
            label="Hold expiry"
            value={formatAdminDateTime(booking.holdExpiresAt)}
          />
        </FactGroup>
      </div>

      <section className="mt-8 rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            Masked read model
          </p>
          <h2 className="mt-2 text-xl font-bold">Customer, stay and amounts</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Customer identifiers remain masked. This workspace does not provide
            contact or editing actions.
          </p>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <section aria-labelledby="customer-facts-heading">
            <h3 id="customer-facts-heading" className="font-bold">
              Masked customer
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--muted-foreground)]">Name</dt>
                <dd className="break-words font-medium">
                  {booking.customerNameMasked}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Email</dt>
                <dd className="break-all font-medium">
                  {booking.customerEmailMasked ?? "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Phone</dt>
                <dd className="font-mono font-medium">
                  {booking.customerPhoneMasked}
                </dd>
              </div>
            </dl>
          </section>
          <section aria-labelledby="stay-facts-heading">
            <h3 id="stay-facts-heading" className="font-bold">
              Stay
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--muted-foreground)]">Check-in</dt>
                <dd className="font-medium">
                  {formatAdminDateTime(booking.checkInAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Checkout</dt>
                <dd className="font-medium">
                  {formatAdminDateTime(booking.checkOutAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Guests</dt>
                <dd className="font-medium">
                  {booking.guestCount} total ·{" "}
                  {booking.overnightGuestCount ?? 0} overnight
                </dd>
              </div>
            </dl>
          </section>
          <section aria-labelledby="amount-facts-heading">
            <h3 id="amount-facts-heading" className="font-bold">
              Amounts
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--muted-foreground)]">Total amount</dt>
                <dd className="font-mono text-lg font-bold">
                  {formatPaise(booking.totalAmountPaise)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Advance amount</dt>
                <dd className="font-mono font-bold">
                  {formatPaise(booking.advanceAmountPaise)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="payment-history-heading">
        <h2 id="payment-history-heading" className="text-xl font-bold">
          Payment-attempt history
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Read-only provider and verification facts for this booking.
        </p>
        <div className="mt-4">
          <PaymentTable
            items={detail.payments}
            recovery={detail.interventionRequired}
            context="booking-detail"
          />
        </div>
      </section>

      {(admin.role === "admin" || admin.role === "super_admin") ? (
        <ManualPaymentVerificationPanel
          key={booking.bookingReference}
          candidate={manualPaymentCandidate}
        />
      ) : null}
      {admin.role === "operations" && hasEligibleManualPayment ? (
        <aside className="mt-8 rounded border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <h2 className="font-bold">Manual-payment permission boundary</h2>
          <p className="mt-2">
            Manual-payment verification requires an admin or super-admin.
            The Server Action and PostgreSQL function enforce this role boundary
            independently of the interface.
          </p>
        </aside>
      ) : null}

      <section className="mt-8" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-xl font-bold">
          Audit and operational timeline
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Server-ordered operational events. An audit event alone does not prove
          payment settlement or external notification delivery.
        </p>
        {detail.timeline.length ? (
          <ol className="mt-4 space-y-3 border-l border-stone-300 pl-5">
            {detail.timeline.map((item, index) => (
              <li
                key={`${item.kind}-${item.occurredAt}-${index}`}
                className="relative rounded border border-[var(--border)] bg-white p-4 before:absolute before:-left-[1.55rem] before:top-5 before:h-2 before:w-2 before:rounded-full before:bg-stone-800"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <strong className="break-words capitalize">{item.label}</strong>
                  <time
                    dateTime={item.occurredAt}
                    className="shrink-0 font-mono text-xs text-[var(--muted-foreground)]"
                  >
                    {formatAdminDateTime(item.occurredAt)}
                  </time>
                </div>
                <p className="mt-2 break-words text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  {item.kind}
                  {item.state ? ` · ${item.state.replaceAll("_", " ")}` : ""}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded border border-dashed p-6 text-sm text-[var(--muted-foreground)]">
            No operational timeline records are available for this booking.
          </p>
        )}
      </section>

      <section className="mt-8" aria-labelledby="notification-history-heading">
        <h2 id="notification-history-heading" className="text-xl font-bold">
          Notification outbox
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          An outbox row alone is not proof of delivery. Pending means queued and
          delivery is not implemented.
        </p>
        <div className="mt-4">
          <NotificationTable
            items={detail.notifications}
            context="booking-detail"
          />
        </div>
      </section>
    </AdminShell>
  );
}
