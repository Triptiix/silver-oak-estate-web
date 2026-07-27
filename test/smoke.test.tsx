import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import HomePage from "@/app/(marketing)/page";
import MarketingLayout from "@/app/(marketing)/layout";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileBookingCTA } from "@/components/layout/mobile-booking-cta";
import nextConfig from "../next.config";

// Mock next/navigation for route suppression testing
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// Mock matchMedia for jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function parseCspDirectives(cspHeader: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {};
  const parts = cspHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const tokens = trimmed.split(/\s+/);
    const name = tokens[0];
    const values = tokens.slice(1);
    directives[name] = values;
  }
  return directives;
}

describe("Smoke & Launch-Unblock Regression Suite", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  describe("Root Route Ownership", () => {
    it("1. proves src/app/page.tsx does not exist", () => {
      const pagePath = path.resolve(__dirname, "../src/app/page.tsx");
      expect(fs.existsSync(pagePath)).toBe(false);
    });

    it("2. renders Silver Oak Estate on marketing homepage", () => {
      render(<HomePage />);
      expect(screen.getByText("Silver Oak Estate")).toBeInTheDocument();
    });

    it("3. verifies starter copy is absent from homepage", () => {
      render(<HomePage />);
      expect(screen.queryByText(/To get started/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Deploy Now/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Templates/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Learning/i)).not.toBeInTheDocument();
    });
  });

  describe("Marketing Layout & Skip Link", () => {
    it("4. skip link has href='#main-content'", () => {
      render(
        <MarketingLayout>
          <div>Content</div>
        </MarketingLayout>
      );
      const link = screen.getByRole("link", { name: "Skip to main content" });
      expect(link).toHaveAttribute("href", "#main-content");
    });

    it("5. main target has id='main-content'", () => {
      render(
        <MarketingLayout>
          <div>Content</div>
        </MarketingLayout>
      );
      const main = screen.getByRole("main");
      expect(main).toHaveAttribute("id", "main-content");
    });

    it("6. main target has tabindex='-1'", () => {
      render(
        <MarketingLayout>
          <div>Content</div>
        </MarketingLayout>
      );
      const main = screen.getByRole("main");
      expect(main).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("Header & Accessible Mobile Navigation", () => {
    it("7. mobile trigger initially has aria-expanded=false", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("8. opening trigger renders nav with aria-label='Mobile navigation'", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);

      const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute("id", "mobile-navigation");
    });

    it("9. open mobile menu exposes all five destinations", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);

      const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
      const links = mobileNav.querySelectorAll("a");
      const hrefs = Array.from(links).map((l) => l.getAttribute("href"));

      expect(hrefs).toEqual([
        "/estate",
        "/experiences",
        "/gallery",
        "/policies",
        "/book",
      ]);
    });

    it("10. trigger changes to aria-expanded=true when open", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);
      expect(screen.getByRole("button", { name: "Close navigation" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
    });

    it("11. trigger closes the panel on second click", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);
      expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();

      const closeTrigger = screen.getByRole("button", { name: "Close navigation" });
      fireEvent.click(closeTrigger);
      expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
    });

    it("12. Escape closes the mobile panel", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);
      expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
    });

    it("13. Escape returns focus to the trigger button", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      trigger.focus();
      fireEvent.click(trigger);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(document.activeElement).toBe(trigger);
    });

    it("14. clicking a mobile link closes the panel", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);

      const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
      const estateLink = within(mobileNav).getByRole("link", { name: "The Estate" });
      fireEvent.click(estateLink);

      expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
    });

    it("15. no anchor contains a button and no button contains an anchor when open", () => {
      const { container } = render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);

      const anchors = container.querySelectorAll("a");
      anchors.forEach((a) => {
        expect(a.querySelector("button")).toBeNull();
      });

      const buttons = container.querySelectorAll("button");
      buttons.forEach((b) => {
        expect(b.querySelector("a")).toBeNull();
      });
    });

    it("16. Book Now is an anchor whose href is /book", () => {
      render(<SiteHeader />);
      const bookLinks = screen.getAllByRole("link", { name: "Book Now" });
      expect(bookLinks.length).toBeGreaterThan(0);
      bookLinks.forEach((link) => {
        expect(link.tagName).toBe("A");
        expect(link).toHaveAttribute("href", "/book");
      });
    });

    it("17. desktop Book Now uses hidden md:inline-flex and not sm:inline-flex", () => {
      render(<SiteHeader />);
      const bookNowWrapper = screen.getByRole("link", { name: "Book Now" }).parentElement;
      expect(bookNowWrapper?.className).toContain("hidden md:inline-flex");
      expect(bookNowWrapper?.className).not.toContain("sm:inline-flex");
    });

    it("18. mobile trigger uses md:hidden", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      expect(trigger.className).toContain("md:hidden");
    });

    it("19. SiteHeader contains no SVG elements", () => {
      const { container } = render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);
      expect(container.querySelector("svg")).toBeNull();
    });

    it("20. mobile links contain focus-visible focus ring classes", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(trigger);

      const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
      const links = mobileNav.querySelectorAll("a");
      links.forEach((l) => {
        expect(l.className).toContain("focus-visible:ring-[var(--soe-color-focus-ring)]");
      });
    });
  });

  describe("Mobile Booking CTA Route Matrix & Accessibility", () => {
    it("21. CTA renders on /estate", () => {
      mockPathname = "/estate";
      render(<MobileBookingCTA />);
      expect(screen.getByRole("link", { name: "Check Availability & Book" })).toBeInTheDocument();
    });

    it("22. CTA renders on /", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);
      expect(screen.getByRole("link", { name: "Check Availability & Book" })).toBeInTheDocument();
    });

    it("23. CTA is absent on /book", () => {
      mockPathname = "/book";
      const { container } = render(<MobileBookingCTA />);
      expect(container.firstChild).toBeNull();
    });

    it("24. CTA is absent on /book/confirmation", () => {
      mockPathname = "/book/confirmation";
      const { container } = render(<MobileBookingCTA />);
      expect(container.firstChild).toBeNull();
    });

    it("25. CTA is absent on /availability", () => {
      mockPathname = "/availability";
      const { container } = render(<MobileBookingCTA />);
      expect(container.firstChild).toBeNull();
    });

    it("26. CTA is absent on /availability/calendar", () => {
      mockPathname = "/availability/calendar";
      const { container } = render(<MobileBookingCTA />);
      expect(container.firstChild).toBeNull();
    });

    it("27. CTA is an anchor, not a button", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);
      const cta = screen.getByRole("link", { name: "Check Availability & Book" });
      expect(cta.tagName).toBe("A");
      expect(cta.querySelector("button")).toBeNull();
    });

    it("28. CTA href is /book", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);
      const cta = screen.getByRole("link", { name: "Check Availability & Book" });
      expect(cta).toHaveAttribute("href", "/book");
    });

    it("29. CTA wrapper does not include pb-safe", () => {
      mockPathname = "/";
      const { container } = render(<MobileBookingCTA />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain("pb-safe");
    });

    it("30. CTA wrapper contains exact safe-area padding-bottom style", () => {
      mockPathname = "/";
      const { container } = render(<MobileBookingCTA />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.paddingBottom).toBe("calc(1rem + env(safe-area-inset-bottom))");
    });

    it("CTA wrapper is a labelled complementary landmark", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);

      const landmark = screen.getByRole("complementary", {
        name: "Booking action",
      });

      const link = within(landmark).getByRole("link", {
        name: "Check Availability & Book",
      });

      expect(landmark).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/book");
    });
  });

  describe("Next Image & CSP Security Configuration", () => {
    it("31. remotePatterns contains exactly approved host", () => {
      const patterns = nextConfig.images?.remotePatterns || [];
      expect(patterns.length).toBe(1);
      expect(patterns[0].hostname).toBe("tcjijcqdulszckbbkbcz.supabase.co");
    });

    it("32. remotePatterns uses https", () => {
      const patterns = nextConfig.images?.remotePatterns || [];
      expect(patterns[0].protocol).toBe("https");
    });

    it("33. remotePatterns uses /storage/v1/object/public/**", () => {
      const patterns = nextConfig.images?.remotePatterns || [];
      expect(patterns[0].pathname).toBe("/storage/v1/object/public/**");
    });

    it("34. no wildcard hostname exists in remotePatterns", () => {
      const patterns = nextConfig.images?.remotePatterns || [];
      patterns.forEach((p) => {
        expect(p.hostname).not.toContain("*");
      });
    });

    it("35. CSP img-src directive equals exactly approved tokens", async () => {
      const headers = await nextConfig.headers!();
      const cspHeader = headers[0].headers.find((h) => h.key === "Content-Security-Policy");
      const directives = parseCspDirectives(cspHeader!.value);
      expect(directives["img-src"]).toEqual([
        "'self'",
        "data:",
        "https://tcjijcqdulszckbbkbcz.supabase.co",
      ]);
    });

    it("36. CSP connect-src directive equals exactly approved tokens", async () => {
      const headers = await nextConfig.headers!();
      const cspHeader = headers[0].headers.find((h) => h.key === "Content-Security-Policy");
      const directives = parseCspDirectives(cspHeader!.value);
      expect(directives["connect-src"]).toEqual([
        "'self'",
        "https://challenges.cloudflare.com",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
      ]);
    });

    it("37. CSP frame-src directive equals exactly approved tokens", async () => {
      const headers = await nextConfig.headers!();
      const cspHeader = headers[0].headers.find((h) => h.key === "Content-Security-Policy");
      const directives = parseCspDirectives(cspHeader!.value);
      expect(directives["frame-src"]).toEqual([
        "https://challenges.cloudflare.com",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
      ]);
    });

    it("38. existing object-src 'none' remains", async () => {
      const headers = await nextConfig.headers!();
      const cspHeader = headers[0].headers.find((h) => h.key === "Content-Security-Policy");
      const directives = parseCspDirectives(cspHeader!.value);
      expect(directives["object-src"]).toEqual(["'none'"]);
    });

    it("39. existing frame-ancestors 'none' remains", async () => {
      const headers = await nextConfig.headers!();
      const cspHeader = headers[0].headers.find((h) => h.key === "Content-Security-Policy");
      const directives = parseCspDirectives(cspHeader!.value);
      expect(directives["frame-ancestors"]).toEqual(["'none'"]);
    });

    it("40. existing form-action 'self' remains", async () => {
      const headers = await nextConfig.headers!();
      const cspHeader = headers[0].headers.find((h) => h.key === "Content-Security-Policy");
      const directives = parseCspDirectives(cspHeader!.value);
      expect(directives["form-action"]).toEqual(["'self'"]);
    });
  });
});
