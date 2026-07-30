import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { AdminIdentitySummary } from "@/components/admin/admin-identity-context";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

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
      <section
        aria-label="Operational safety notice"
        className="border-b border-amber-300 bg-amber-50 text-amber-950"
      >
        <Container className="grid gap-2 py-3 text-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <p className="leading-6">
            <strong>Test mode only.</strong>{" "}
            <span>
              Controlled manual booking and inventory operations are enabled for authorized roles.
            </span>{" "}
            <span>
              Live Razorpay, automatic refunds and automatic reconciliation remain disabled.
            </span>
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">
            Recovery is diagnosis-only
          </p>
        </Container>
      </section>
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <Container className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <Link
              href="/admin/dashboard"
              className="inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            >
              Silver Oak Estate Operations
            </Link>
            <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <AdminIdentitySummary />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="min-h-11">
                Log out
              </Button>
            </form>
          </div>
        </Container>
        <Container>
          <AdminNavigation />
        </Container>
      </header>
      <Container className="py-6 sm:py-8">{children}</Container>
    </>
  );
}
