import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminRoleSummary } from "@/components/admin/admin-role-summary";

export const metadata = {
  title: "Operations dashboard",
};

const workspaces = [
  {
    href: "/admin/operations",
    title: "Controlled operations",
    description:
      "Create manual bookings and manage complete-property inventory blocks within your role.",
    qualifier: "Primary workspace",
  },
  {
    href: "/admin/bookings",
    title: "Bookings",
    description:
      "Inspect bookings, holds, reservations and the unified audit timeline.",
    qualifier: "Protected records",
  },
  {
    href: "/admin/payments",
    title: "Payment attempts",
    description:
      "Review provider references, lifecycle state and verification timestamps.",
    qualifier: "Read-only visibility",
  },
  {
    href: "/admin/recovery",
    title: "Recovery queue",
    description:
      "Diagnose refund_pending and reconciliation_required without mutation controls.",
    qualifier: "Diagnosis only",
  },
  {
    href: "/admin/notifications",
    title: "Notification outbox",
    description:
      "Inspect queued records without treating an outbox row as proof of delivery.",
    qualifier: "Delivery not implemented",
  },
] as const;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AdminShell
      title="Operations dashboard"
      description="An authenticated workspace for role-gated estate operations. Sensitive actions remain independently enforced by the server and database."
    >
      {error === "forbidden" ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          You do not have permission to perform that administrator operation.
        </div>
      ) : null}

      <AdminRoleSummary />

      <section aria-labelledby="workspace-heading" className="mt-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Workspace navigation
          </p>
          <h2 id="workspace-heading" className="mt-2 text-xl font-bold">
            Choose an operational area
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Begin with controlled operations, then use the protected views for
            diagnosis and follow-up.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {workspaces.map(({ href, title, description, qualifier }) => (
            <Link
              key={href}
              href={href}
              className={`group rounded-xl border bg-white p-5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${
                href === "/admin/operations"
                  ? "border-[var(--primary)]"
                  : "border-[var(--border)] hover:border-stone-400"
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                {qualifier}
              </span>
              <h3 className="mt-2 text-lg font-bold group-hover:underline">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="boundaries-heading"
        className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--accent)] p-5 sm:p-6"
      >
        <h2 id="boundaries-heading" className="text-lg font-bold">
          Current operational boundaries
        </h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 md:grid-cols-2">
          <li>Recovery is diagnosis-only.</li>
          <li>Notification outbox records do not prove delivery.</li>
          <li>Manual bookings begin payment-pending.</li>
          <li>Online public booking remains disabled.</li>
        </ul>
      </section>
    </AdminShell>
  );
}
