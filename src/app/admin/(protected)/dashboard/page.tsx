import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Operations dashboard" description="Authenticated test-mode visibility and role-gated manual operations.">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["/admin/operations", "Controlled operations", "Create manual bookings and manage complete-property inventory blocks within your role."],
          ["/admin/bookings", "Booking operations", "Inspect bookings, holds, reservations and the unified audit timeline."],
          ["/admin/payments", "Payment attempts", "Review provider references, lifecycle state and verification timestamps."],
          ["/admin/recovery", "Recovery queue", "Diagnose refund_pending and reconciliation_required without mutation controls."],
          ["/admin/notifications", "Notification outbox", "Distinguish queued records from actual provider delivery."],
        ].map(([href, title, description]) => (
          <Link key={href} href={href} className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-sm">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{description}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
