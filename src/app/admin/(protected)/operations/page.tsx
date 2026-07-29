import { AdminShell } from "@/components/admin/admin-shell";
import { ActiveInventoryBlocks } from "@/components/admin/operations/active-inventory-blocks";
import { InventoryBlockForm } from "@/components/admin/operations/inventory-block-form";
import { ManualBookingForm } from "@/components/admin/operations/manual-booking-form";
import { listAdminActiveInventoryBlocks } from "@/lib/admin/database";
import { requireAdminRole } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administrator Operations",
};

export default async function AdminOperationsPage() {
  const admin = await requireAdminRole("operations", "admin", "super_admin");
  const blocks = await listAdminActiveInventoryBlocks();
  const roleLabel = admin.role === "super_admin"
    ? "Super admin"
    : admin.role === "admin"
      ? "Admin"
      : "Operations";

  return (
    <AdminShell
      title="Controlled operations"
      description="Role-gated test-mode controls for manual bookings and complete-property inventory blocks."
    >
      <section
        aria-labelledby="operations-overview-heading"
        className="rounded-xl border border-[var(--border)] bg-[var(--accent)] p-5 sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Current role · {roleLabel}
        </p>
        <h2 id="operations-overview-heading" className="mt-2 text-xl font-bold">
          Choose a controlled workflow
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
          Each workflow retains its own validation, request intent and durable
          result. Interface visibility is not the authorization boundary.
        </p>
        <nav aria-label="Operations sections" className="mt-4 flex flex-wrap gap-2">
          <a className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)]" href="#manual-booking">
            Manual booking
          </a>
          <a className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)]" href="#inventory-block">
            Inventory block
          </a>
          <a className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)]" href="#active-blocks">
            Active blocks
          </a>
        </nav>
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <div id="manual-booking" className="scroll-mt-6">
          <ManualBookingForm />
        </div>
        <div id="inventory-block" className="scroll-mt-6">
          <InventoryBlockForm role={admin.role} />
        </div>
      </div>
      <div id="active-blocks" className="mt-6 scroll-mt-6">
        <ActiveInventoryBlocks blocks={blocks} role={admin.role} />
      </div>
      <section className="mt-6 rounded-xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Role and safety limits</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
          <li>Operations may create manual bookings and create or release maintenance blocks.</li>
          <li>Owner blocks and manual-payment verification require an admin or super-admin.</li>
          <li>The server and database independently authorize every operation.</li>
          <li>All inventory blocks apply to the complete property.</li>
        </ul>
      </section>
    </AdminShell>
  );
}
