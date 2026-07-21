import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/admin/actions";

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <Container className="py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </div>
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="mb-2 text-xl font-bold">Administrator access active</h2>
        <p className="text-[var(--muted-foreground)]">
          Your Supabase session and active Silver Oak Estate administrator
          membership have both been verified on the server. Booking operations
          are intentionally deferred to a later phase.
        </p>
      </div>
    </Container>
  );
}
