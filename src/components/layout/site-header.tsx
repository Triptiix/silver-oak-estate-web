import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Container } from "../ui/container";
import { Button } from "../ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
      <Container className="flex h-[var(--header-height)] items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold sm:inline-block">
            {siteConfig.name}
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/estate">The Estate</Link>
          <Link href="/experiences">Experiences</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/policies">Policies</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link href="/book" className="hidden sm:inline-flex">
            <Button>Book Now</Button>
          </Link>
        </div>
      </Container>
    </header>
  );
}
