"use client";

import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: "/estate", label: "The Estate" },
    { href: "/experiences", label: "Experiences" },
    { href: "/gallery", label: "Gallery" },
    { href: "/policies", label: "Policies" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--soe-surface-control-border)] bg-[var(--soe-surface-bg-primary)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--soe-surface-bg-primary)]/60">
      <EstateContainer className="flex h-[var(--header-height)] items-center justify-between">
        <Link
          href="/"
          className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)] rounded-[var(--soe-radius-control)]"
        >
          <span className="font-bold sm:inline-block font-soe-ui text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-primary)]">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-6 font-soe-ui text-[length:var(--soe-text-sm)] font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--soe-surface-text-primary)] hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)] rounded-[var(--soe-radius-control)] px-2 py-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden md:inline-flex">
            <EstateActionLink variant="button" href="/book">
              Book Now
            </EstateActionLink>
          </div>

          {/* Mobile Menu Trigger Button */}
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex md:hidden items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-[var(--soe-radius-control)] text-[var(--soe-surface-text-primary)] hover:bg-[var(--soe-surface-action-quiet-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span aria-hidden="true" className="relative flex h-5 w-5 flex-col justify-center items-center">
              {isMobileMenuOpen ? (
                <>
                  <span className="absolute h-0.5 w-5 bg-current rotate-45 transition-transform motion-reduce:transition-none" />
                  <span className="absolute h-0.5 w-5 bg-current -rotate-45 transition-transform motion-reduce:transition-none" />
                </>
              ) : (
                <span className="flex flex-col justify-between h-4 w-5">
                  <span className="h-0.5 w-5 bg-current" />
                  <span className="h-0.5 w-5 bg-current" />
                  <span className="h-0.5 w-5 bg-current" />
                </span>
              )}
            </span>
          </button>
        </div>
      </EstateContainer>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="md:hidden border-b border-[var(--soe-surface-control-border)] bg-[var(--soe-surface-bg-primary)] px-4 pt-2 pb-6 space-y-3"
        >
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-[var(--soe-surface-text-primary)] hover:bg-[var(--soe-surface-action-quiet-hover)] rounded-[var(--soe-radius-control)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <EstateActionLink
                variant="button"
                href="/book"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full justify-center"
              >
                Book Now
              </EstateActionLink>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
