import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const links = [
  ["/admin/operations", "Operations"],
  ["/admin/bookings", "Bookings"],
  ["/admin/payments", "Payments"],
  ["/admin/recovery", "Recovery"],
  ["/admin/notifications", "Notifications"],
] as const;

export function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <>
      <div className="border-b border-[var(--border)] bg-amber-50 text-amber-950">
        <Container className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p><strong>Test mode only.</strong> Controlled manual booking and inventory operations are enabled for authorized roles. Live Razorpay, automatic refunds and automatic reconciliation remain disabled.</p>
          <span className="font-mono text-xs uppercase tracking-[0.14em]">Diagnosis-only recovery</span>
        </Container>
      </div>
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <Container className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Silver Oak Estate Operations
            </Link>
            <h1 className="mt-2 text-3xl font-bold">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">{description}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">Log out</Button>
          </form>
        </Container>
        <Container>
          <nav aria-label="Administrator operations" className="flex gap-1 overflow-x-auto pb-3">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-[var(--radius)] px-3 py-2 text-sm font-medium hover:bg-[var(--accent)]">
                {label}
              </Link>
            ))}
          </nav>
        </Container>
      </header>
      <Container className="py-8">{children}</Container>
    </>
  );
}
