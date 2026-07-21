import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HomePage from "@/app/(marketing)/page";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileBookingCTA } from "@/components/layout/mobile-booking-cta";

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("Smoke Tests", () => {
  it("renders the root home page", () => {
    render(<HomePage />);
    expect(screen.getByText("Silver Oak Estate")).toBeInTheDocument();
  });

  it("renders the shared site header", () => {
    render(<SiteHeader />);
    expect(screen.getByText("Silver Oak Estate")).toBeInTheDocument();
  });

  it("main booking CTA links to /book", () => {
    render(<MobileBookingCTA />);
    const link = screen.getByRole("link", { name: /Check Availability & Book/i });
    expect(link).toHaveAttribute("href", "/book");
  });
});
