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

  return (
    <AdminShell
      title="Controlled operations"
      description="Role-gated test-mode controls for manual bookings and complete-property inventory blocks."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <ManualBookingForm />
        <InventoryBlockForm role={admin.role} />
      </div>
      <div className="mt-6">
        <ActiveInventoryBlocks blocks={blocks} role={admin.role} />
      </div>
      <section className="mt-6 rounded border border-stone-300 bg-stone-50 p-5">
        <h2 className="text-lg font-bold">Role and safety guidance</h2>
        <p className="mt-2 text-sm text-stone-700">
          Operations may create and release maintenance blocks and create manual bookings.
          Owner blocks and manual-payment verification require an admin or super-admin.
          The server and database independently authorize every operation.
        </p>
      </section>
    </AdminShell>
  );
}
