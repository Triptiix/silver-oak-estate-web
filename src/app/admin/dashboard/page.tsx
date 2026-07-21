import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="p-6 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--surface)]">
        <h2 className="text-xl font-bold mb-2">Foundation Status: Secure</h2>
        <p className="text-[var(--muted-foreground)]">
          This route is protected by middleware session validation. Role-based authorization is pending Phase 1 database migrations (admins table and RLS).
        </p>
      </div>
    </Container>
  );
}
