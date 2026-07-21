import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Container } from "../ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-6 md:py-0 bg-[var(--surface)]">
      <Container className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-[var(--muted-foreground)] md:text-left">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
        <nav className="flex items-center space-x-4 text-sm text-[var(--muted-foreground)]">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </nav>
      </Container>
    </footer>
  );
}
