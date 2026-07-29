"use client";

import * as React from "react";
import Link from "next/link";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { siteConfig } from "@/config/site";

const navLinks = [
  { href: "/estate", label: "The Estate" },
  { href: "/experiences", label: "Experiences" },
  { href: "/gallery", label: "Gallery" },
  { href: "/policies", label: "Policies" },
] as const;

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <header
      data-estate-theme="dark"
      className="sticky top-0 z-50 w-full border-b border-[var(--soe-color-gold)]/50 bg-[var(--soe-color-night)]"
    >
      <EstateContainer
        variant="visual"
        className="flex h-[var(--header-height)] items-center justify-between gap-5"
      >
        <Link
          href="/"
          className="group min-w-0 rounded-[var(--soe-radius-control)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
        >
          <span className="block truncate font-soe-display text-[length:var(--soe-text-xl)] leading-none tracking-[var(--soe-tracking-heading)] text-[var(--soe-surface-text-primary)]">
            {siteConfig.name}
          </span>
          <span className="mt-1 hidden font-soe-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--soe-color-gold)] sm:block">
            Private estate · Noida
          </span>
        </Link>

        <nav
          aria-label="Main Navigation"
          className="hidden items-center gap-1 font-soe-ui text-[length:var(--soe-text-sm)] font-medium lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center rounded-[var(--soe-radius-control)] px-4 text-[var(--soe-surface-text-primary)] transition-colors duration-[var(--soe-duration-interface)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:inline-flex">
            <EstateActionLink variant="button" href="/book">
              Book Now
            </EstateActionLink>
          </div>

          <button
            ref={triggerRef}
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--soe-radius-control)] border border-[var(--soe-color-gold)]/70 p-2 text-[var(--soe-surface-text-primary)] transition-colors duration-[var(--soe-duration-interface)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)] lg:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setIsMobileMenuOpen((previous) => !previous)}
          >
            <span
              aria-hidden="true"
              className="relative flex h-5 w-5 items-center justify-center"
            >
              {isMobileMenuOpen ? (
                <>
                  <span className="absolute h-0.5 w-5 rotate-45 bg-current transition-transform motion-reduce:transition-none" />
                  <span className="absolute h-0.5 w-5 -rotate-45 bg-current transition-transform motion-reduce:transition-none" />
                </>
              ) : (
                <span className="flex h-4 w-5 flex-col justify-between">
                  <span className="h-0.5 w-5 bg-current" />
                  <span className="h-0.5 w-5 bg-current" />
                  <span className="h-0.5 w-5 bg-current" />
                </span>
              )}
            </span>
          </button>
        </div>
      </EstateContainer>

      {isMobileMenuOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[var(--soe-color-gold)]/35 bg-[var(--soe-color-night)] px-4 pb-7 pt-4 lg:hidden"
        >
          <EstateContainer variant="visual" className="px-0">
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex min-h-[48px] items-center border-b border-white/10 px-3 font-soe-ui text-[length:var(--soe-text-base)] font-medium text-[var(--soe-surface-text-primary)] transition-colors duration-[var(--soe-duration-interface)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
                >
                  {link.label}
                </Link>
              ))}
              <EstateActionLink
                variant="button"
                href="/book"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 w-full justify-center"
              >
                Book Now
              </EstateActionLink>
            </div>
          </EstateContainer>
        </nav>
      ) : null}
    </header>
  );
}
