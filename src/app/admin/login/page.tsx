import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Login",
};

export default function AdminLoginPage() {
  return (
    <Container className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--surface)] text-center">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <p className="text-[var(--muted-foreground)] mb-6 text-sm">
          Protected route foundation established. Authentication implementation pending Phase 1 migrations.
        </p>
        <Button className="w-full" disabled>
          Login (Pending)
        </Button>
      </div>
    </Container>
  );
}
