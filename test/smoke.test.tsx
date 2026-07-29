import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import HomePage from "@/app/(marketing)/page";
import EstatePage from "@/app/(marketing)/estate/page";
import ExperiencesPage from "@/app/(marketing)/experiences/page";
import PricingPage from "@/app/(marketing)/pricing/page";
import LocationPage from "@/app/(marketing)/location/page";
import ContactPage from "@/app/(marketing)/contact/page";
import PoliciesPage from "@/app/(marketing)/policies/page";
import { publicInformation } from "@/config/public-information";
import MarketingLayout from "@/app/(marketing)/layout";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBookingCTA } from "@/components/layout/mobile-booking-cta";
import nextConfig from "../next.config";

const onlineBookingCapabilityMock = vi.hoisted(() => ({
  available: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/capabilities/online-booking", () => ({
  getOnlineBookingCapability: () => ({
    available: onlineBookingCapabilityMock.available,
    state: onlineBookingCapabilityMock.available ? "ready" : "disabled",
    missingFields: [],
  }),
}));

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
    const name = tokens[0].toLowerCase();
    const values = tokens.slice(1);

    if (name in directives) continue;

    directives[name] = values;
  }

  return directives;
}

describe("Smoke & Launch-Unblock Regression Suite", () => {
  beforeEach(() => {
    mockPathname = "/";
    onlineBookingCapabilityMock.available = false;
  });

  describe("Root Route Ownership", () => {
    it("1. proves src/app/page.tsx does not exist", () => {
      const pagePath = path.resolve(__dirname, "../src/app/page.tsx");
      expect(fs.existsSync(pagePath)).toBe(false);
    });

    it("2. renders Silver Oak Estate on marketing homepage", () => {
      render(<HomePage />);
      expect(screen.getAllByText(/Silver Oak Estate/i).length).toBeGreaterThan(0);
    });

    it("3. verifies starter copy is absent from homepage", () => {
      render(<HomePage />);
      expect(screen.queryByText(/To get started/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Deploy Now/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Templates/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Learning/i)).not.toBeInTheDocument();
    });

    it("4. verifies Gate 3 homepage imports Estate UI primitives and not legacy Container", () => {
      const filePath = path.resolve(__dirname, "../src/app/(marketing)/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("@/components/estate-ui/estate-section");
      expect(content).toContain("@/components/estate-ui/estate-container");
      expect(content).toContain("@/components/estate-ui/estate-heading");
      expect(content).toContain("@/components/estate-ui/estate-text");
      expect(content).toContain("@/components/estate-ui/estate-eyebrow");
      expect(content).toContain("@/components/estate-ui/estate-action-link");

      expect(content).not.toContain("@/components/ui/container");
      expect(content).not.toContain("var(--muted-foreground)");
      expect(content).not.toContain("[Estate Image Placeholder]");
      expect(content).toContain("focus-visible:outline-hidden");
      expect(content).not.toContain("focus-visible:outline-none");
    });

    it("5. verifies heading hierarchy has exactly one H1", () => {
      render(<HomePage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("A Private Escape for Stays, Gatherings and Celebrations");
    });

    it("6. verifies all required CTA links are present with correct hrefs", () => {
      const { container } = render(<HomePage />);

      const links = container.querySelectorAll("a");
      const hrefs = Array.from(links).map((l) => l.getAttribute("href"));

      expect(hrefs).toContain("/availability");
      expect(hrefs).toContain("/estate");
      expect(hrefs).not.toContain("/book");
      expect(hrefs).toContain("/contact");
      expect(hrefs).toContain("/gallery");
      expect(hrefs).toContain("/pricing");
      expect(hrefs).toContain("/location");
      expect(hrefs).toContain("mailto:contact@silveroakestate.online");

      hrefs.forEach((h) => {
        expect(h).not.toMatch(/^tel:/i);
        expect(h).not.toContain("wa.me");
      });
    });

    it("routes the Stay panel to availability when booking is disabled", () => {
      onlineBookingCapabilityMock.available = false;
      render(<HomePage />);

      expect(
        screen.getByRole("link", { name: /Plan Your Stay/i })
      ).toHaveAttribute("href", "/availability");
    });

    it("routes the Stay panel to booking when capability is ready", () => {
      onlineBookingCapabilityMock.available = true;
      render(<HomePage />);

      expect(
        screen.getByRole("link", { name: /Plan Your Stay/i })
      ).toHaveAttribute("href", "/book");
    });

    it("7. verifies all homepage image sources use /images/estate/home/ with valid alt text including corrected bedroom alt", () => {
      const { container } = render(<HomePage />);
      const imgs = container.querySelectorAll("img");

      expect(imgs.length).toBeGreaterThan(0);
      imgs.forEach((img) => {
        const src = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt");

        expect(decodeURIComponent(src)).toContain("/images/estate/home/");
        expect(alt).toBeTruthy();
        expect(alt?.trim().length).toBeGreaterThan(5);
      });

      const bedroomImg = Array.from(imgs).find((img) =>
        (img.getAttribute("src") || "").includes("estate-bedroom")
      );
      expect(bedroomImg).toBeDefined();
      expect(bedroomImg?.getAttribute("alt")).toBe("Bedroom with a king bed at Silver Oak Estate");

      const text = document.body.textContent || "";
      expect(text).not.toContain("Master bedroom");
    });

    it("8. verifies confirmed pricing details and updated pricing wording are present and unsupported claims are absent", () => {
      render(<HomePage />);

      expect(screen.getByText("₹15,000")).toBeInTheDocument();
      expect(screen.getByText("₹20,000")).toBeInTheDocument();
      expect(screen.getByText("₹5,000")).toBeInTheDocument();

      expect(screen.getByText("Weekday")).toBeInTheDocument();
      expect(screen.getByText("Weekend")).toBeInTheDocument();
      expect(screen.getByText("CURRENT RATES")).toBeInTheDocument();

      const text = document.body.textContent || "";
      expect(text).not.toContain("Mon – Fri");
      expect(text).not.toContain("Sat – Sun");
      expect(text).not.toContain("TRANSPARENT RATES");
      expect(text).not.toContain("full property access");

      expect(text).not.toContain("GST");
      expect(text).not.toContain("security deposit");
      expect(text).not.toContain("cleaning fee");
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

    it("main element contains flex-1 and no pb-24 padding classes", () => {
      render(
        <MarketingLayout>
          <div>Content</div>
        </MarketingLayout>
      );
      const main = screen.getByRole("main");
      expect(main.className).toContain("flex-1");
      expect(main.className).not.toContain("pb-24");
      expect(main.className).not.toContain("sm:pb-0");
      expect(main.className).not.toContain("md:pb-0");
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
        "/availability",
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

    it("16. disabled booking state uses assisted availability actions", () => {
      render(<SiteHeader onlineBookingAvailable={false} />);

      expect(screen.queryByRole("link", { name: "Book Now" })).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      const availabilityLinks = screen.getAllByRole("link", {
        name: "Check Availability",
      });

      expect(availabilityLinks).toHaveLength(2);
      availabilityLinks.forEach((link) => {
        expect(link.tagName).toBe("A");
        expect(link).toHaveAttribute("href", "/availability");
      });

      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      fireEvent.click(
        within(mobileNav).getByRole("link", { name: "Check Availability" })
      );
      expect(
        screen.queryByRole("navigation", { name: "Mobile navigation" })
      ).toBeNull();
    });

    it("17. enabled booking state uses Book Now actions linking to /book", () => {
      render(<SiteHeader onlineBookingAvailable />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      const bookLinks = screen.getAllByRole("link", { name: "Book Now" });
      expect(bookLinks).toHaveLength(2);
      bookLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/book");
      });

      const bookNowWrapper = bookLinks[0].parentElement;
      expect(bookNowWrapper?.className).toContain("hidden md:inline-flex");
      expect(bookNowWrapper?.className).not.toContain("sm:inline-flex");
    });

    it("18. mobile trigger remains available through tablet widths", () => {
      render(<SiteHeader />);
      const trigger = screen.getByRole("button", { name: "Open navigation" });
      expect(trigger.className).toContain("lg:hidden");
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
      expect(
        within(mobileNav).getByRole("link", { name: "The Estate" }).className
      ).toContain("focus-visible:outline-hidden");
      expect(
        screen.getByRole("button", { name: "Close navigation" }).className
      ).toContain("focus-visible:outline-hidden");
    });
  });

  describe("Premium Estate Footer", () => {
    it("renders complete verified footer destinations", () => {
      render(<SiteFooter />);

      const hrefs = Array.from(document.querySelectorAll("a")).map((link) =>
        link.getAttribute("href")
      );

      expect(hrefs).toEqual(
        expect.arrayContaining([
          "/estate",
          "/experiences",
          "/gallery",
          "/availability",
          "/pricing",
          "/location",
          "/policies",
          "/privacy",
          "/terms",
          "/contact",
          publicInformation.contact.mailtoHref,
        ])
      );
    });

    it("uses labelled navigation landmarks and visible focus classes", () => {
      render(<SiteFooter />);

      expect(
        screen.getByRole("navigation", { name: "Footer Estate" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: "Footer Plan your visit" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: "Footer information" })
      ).toBeInTheDocument();

      document.querySelectorAll("footer a").forEach((link) => {
        expect(link.className).toContain(
          "focus-visible:ring-[var(--soe-color-focus-ring)]"
        );
        expect(link.className).toContain("focus-visible:outline-hidden");
      });
    });

    it("contains no invented social, telephone, or legal-entity links", () => {
      render(<SiteFooter />);

      const text = (document.body.textContent || "").toLowerCase();
      const hrefs = Array.from(document.querySelectorAll("footer a")).map(
        (link) => link.getAttribute("href") || ""
      );

      expect(text).not.toContain("instagram");
      expect(text).not.toContain("facebook");
      expect(text).not.toContain("private limited");
      expect(hrefs.some((href) => href.startsWith("tel:"))).toBe(false);
      expect(hrefs.some((href) => href.includes("wa.me"))).toBe(false);
    });
  });

  describe("Mobile Booking CTA Route Matrix & Accessibility", () => {
    it("21. CTA renders on /estate", () => {
      mockPathname = "/estate";
      render(<MobileBookingCTA />);
      expect(
        screen.getByRole("link", { name: "Check Availability" })
      ).toBeInTheDocument();
    });

    it("22. CTA renders on /", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);
      expect(
        screen.getByRole("link", { name: "Check Availability" })
      ).toBeInTheDocument();
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
      const cta = screen.getByRole("link", { name: "Check Availability" });
      expect(cta.tagName).toBe("A");
      expect(cta.querySelector("button")).toBeNull();
    });

    it("28. disabled CTA points to assisted availability", () => {
      mockPathname = "/";
      render(<MobileBookingCTA onlineBookingAvailable={false} />);
      const cta = screen.getByRole("link", { name: "Check Availability" });
      expect(cta).toHaveAttribute("href", "/availability");
    });

    it("enabled CTA points to the booking flow", () => {
      mockPathname = "/";
      render(<MobileBookingCTA onlineBookingAvailable />);
      const cta = screen.getByRole("link", {
        name: "Check Availability & Book",
      });
      expect(cta).toHaveAttribute("href", "/book");
    });

    it("29. CTA wrapper does not include pb-safe", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);
      const wrapper = screen.getByRole("complementary", { name: "Booking action" });
      expect(wrapper.className).not.toContain("pb-safe");
    });

    it("30. CTA wrapper contains exact safe-area padding-bottom style", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);
      const wrapper = screen.getByRole("complementary", { name: "Booking action" });
      expect(wrapper.style.paddingBottom).toBe("calc(1rem + env(safe-area-inset-bottom))");
    });

    it("CTA wrapper is a labelled complementary landmark", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);

      const landmark = screen.getByRole("complementary", {
        name: "Booking action",
      });

      const link = within(landmark).getByRole("link", {
        name: "Check Availability",
      });

      expect(landmark).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/availability");
    });

    it("CTA landmark contains md:hidden and not sm:hidden on /", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);
      const landmark = screen.getByRole("complementary", { name: "Booking action" });
      expect(landmark.className).toContain("md:hidden");
      expect(landmark.className).not.toContain("sm:hidden");
    });

    it("renders aria-hidden spacer with safe-area height and md:hidden on /", () => {
      mockPathname = "/";
      render(<MobileBookingCTA />);
      const spacer = screen.getByTestId("mobile-booking-spacer");

      expect(spacer).toHaveAttribute("aria-hidden", "true");
      expect(spacer).toHaveClass("md:hidden");
      expect(spacer).not.toHaveClass("h-24");
      expect(spacer).toHaveStyle({
        height: "calc(6rem + env(safe-area-inset-bottom))",
      });
    });

    it("neither landmark nor spacer renders on /book", () => {
      mockPathname = "/book";
      render(<MobileBookingCTA />);
      expect(screen.queryByRole("complementary", { name: "Booking action" })).toBeNull();
      expect(screen.queryByTestId("mobile-booking-spacer")).toBeNull();
    });

    it("neither landmark nor spacer renders on /availability", () => {
      mockPathname = "/availability";
      render(<MobileBookingCTA />);
      expect(screen.queryByRole("complementary", { name: "Booking action" })).toBeNull();
      expect(screen.queryByTestId("mobile-booking-spacer")).toBeNull();
    });

    it("enabled CTA remains suppressed on booking and availability routes", () => {
      for (const pathname of [
        "/book",
        "/book/confirmation",
        "/availability",
        "/availability/calendar",
      ]) {
        mockPathname = pathname;
        const { container, unmount } = render(
          <MobileBookingCTA onlineBookingAvailable />
        );

        expect(container.firstChild).toBeNull();
        unmount();
      }
    });
  });

  describe("Next Image & CSP Security Configuration", () => {
    let cspDirectives: Record<string, string[]>;

    beforeAll(async () => {
      const headers = await nextConfig.headers!();
      const cspHeader = headers[0].headers.find(
        (header) => header.key === "Content-Security-Policy"
      );

      expect(cspHeader).toBeDefined();
      cspDirectives = parseCspDirectives(cspHeader!.value);
    });

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

    it("35. CSP img-src directive equals exactly approved tokens", () => {
      expect(cspDirectives["img-src"]).toEqual([
        "'self'",
        "data:",
        "https://tcjijcqdulszckbbkbcz.supabase.co",
      ]);
    });

    it("36. CSP connect-src directive equals exactly approved tokens", () => {
      expect(cspDirectives["connect-src"]).toEqual([
        "'self'",
        "https://challenges.cloudflare.com",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
      ]);
    });

    it("37. CSP frame-src directive equals exactly approved tokens", () => {
      expect(cspDirectives["frame-src"]).toEqual([
        "https://challenges.cloudflare.com",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
      ]);
    });

    it("38. existing object-src 'none' remains", () => {
      expect(cspDirectives["object-src"]).toEqual(["'none'"]);
    });

    it("39. existing frame-ancestors 'none' remains", () => {
      expect(cspDirectives["frame-ancestors"]).toEqual(["'none'"]);
    });

    it("40. existing form-action 'self' remains", () => {
      expect(cspDirectives["form-action"]).toEqual(["'self'"]);
    });

    it("41. CSP parser handles case-insensitivity and first duplicate wins", () => {
      const parsed = parseCspDirectives(
        "IMG-SRC 'self'; img-src https://unsafe.example; CONNECT-SRC 'self'"
      );
      expect(parsed["img-src"]).toEqual(["'self'"]);
      expect(parsed["connect-src"]).toEqual(["'self'"]);
    });
  });

  describe("Gate 3 Batch 2: The Estate Page", () => {
    it("verifies Estate page imports Estate UI primitives and Next Image, and not legacy Container or Button", () => {
      const filePath = path.resolve(__dirname, "../src/app/(marketing)/estate/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("@/components/estate-ui/estate-section");
      expect(content).toContain("@/components/estate-ui/estate-container");
      expect(content).toContain("@/components/estate-ui/estate-heading");
      expect(content).toContain("@/components/estate-ui/estate-text");
      expect(content).toContain("@/components/estate-ui/estate-media-frame");
      expect(content).toContain("@/components/estate-ui/estate-action-link");
      expect(content).toContain("@/components/estate-ui/estate-eyebrow");
      expect(content).toContain("next/image");

      expect(content).not.toContain("@/components/ui/container");
      expect(content).not.toContain("@/components/ui/button");
      expect(content).not.toContain("var(--muted-foreground)");
      expect(content).not.toContain("Placeholder");
    });

    it("verifies heading hierarchy has exactly one H1 with correct text", () => {
      render(<EstatePage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("A Complete Private Estate for Time Together");
    });

    it("verifies exact metadata title and complete description are exported", async () => {
      const estateModule = await import("@/app/(marketing)/estate/page");
      expect(estateModule.metadata.title).toBe("The Estate | Silver Oak Estate Private Farmhouse in Noida");
      expect(estateModule.metadata.description).toBe(
        "Explore the fully furnished 3 BHK residence, lawn, pool, kitchen and private gathering spaces at Silver Oak Estate in Sector 135, Noida."
      );
    });

    it("verifies rendered page images use exact 8 production WebP paths and corrected alt text", () => {
      const { container } = render(<EstatePage />);
      const imgs = container.querySelectorAll("img");
      expect(imgs).toHaveLength(8);

      const expectedPaths = [
        "/images/estate/estate/estate-hero.webp",
        "/images/estate/estate/estate-living-area.webp",
        "/images/estate/estate/estate-bedroom.webp",
        "/images/estate/estate/estate-bathroom.webp",
        "/images/estate/estate/estate-kitchen.webp",
        "/images/estate/estate/estate-dining.webp",
        "/images/estate/estate/estate-pool-deck.webp",
        "/images/estate/estate/estate-lawn-evening.webp",
      ];

      const actualPaths = Array.from(imgs).map((img) => decodeURIComponent(img.getAttribute("src") || ""));
      expectedPaths.forEach((expected) => {
        expect(actualPaths.some((p) => p.includes(expected))).toBe(true);
      });

      const livingAreaImg = screen.getByAltText(
        "Indoor seating area with two chairs and a table at Silver Oak Estate"
      );
      expect(livingAreaImg).toBeInTheDocument();

      Array.from(imgs).forEach((image) => expect(image.getAttribute("sizes")).toBeTruthy());
    });

    it("verifies CTA action links queried by accessible names have correct destinations", () => {
      render(<EstatePage />);

      const checkAvailLinks = screen.getAllByRole("link", { name: /Check Availability/i });
      expect(checkAvailLinks.length).toBeGreaterThan(0);
      checkAvailLinks.forEach((link) => expect(link).toHaveAttribute("href", "/availability"));

      const viewGalleryLink = screen.getByRole("link", { name: /View the Gallery/i });
      expect(viewGalleryLink).toHaveAttribute("href", "/gallery");

      const planEventLink = screen.getByRole("link", { name: /Plan an Event/i });
      expect(planEventLink).toHaveAttribute("href", "/contact");

      const emailLink = screen.getByRole("link", { name: /Email the Estate/i });
      expect(emailLink).toHaveAttribute("href", "mailto:contact@silveroakestate.online");
    });

    it("verifies the editorial capacity section contains all canonical facts", () => {
      render(<EstatePage />);
      const h2 = screen.getByRole("heading", { level: 2, name: /Designed around your group/i });
      const section = h2.closest("section");
      expect(section).not.toBeNull();

      if (section) {
        const s = within(section);
        expect(s.getByText(/Overnight stays/i)).toBeInTheDocument();
        expect(s.getByText(publicInformation.capacity.overnightLabel)).toBeInTheDocument();
        expect(s.getByText(/Indoor gatherings/i)).toBeInTheDocument();
        expect(s.getByText(publicInformation.capacity.indoorLabel)).toBeInTheDocument();
        expect(s.getByText(/Standard daytime events/i)).toBeInTheDocument();
        expect(s.getByText(publicInformation.capacity.standardDayEventLabel)).toBeInTheDocument();
      }
    });

    it("verifies verified property facts and operational features are present on the rendered page", () => {
      render(<EstatePage />);
      expect(screen.getAllByText(/Fully furnished 3 BHK/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Three themed king-bed bedrooms/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Three attached bathrooms/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/one lawn bathroom/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/pool changing room/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(new RegExp(publicInformation.capacity.overnightLabel, "i")).length).toBeGreaterThan(0);
      expect(screen.getAllByText(new RegExp(publicInformation.capacity.standardDayEventLabel, "i")).length).toBeGreaterThan(0);
      expect(screen.getAllByText(new RegExp(publicInformation.capacity.indoorLabel, "i")).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/seating for 5/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Wi-Fi/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/RO drinking water/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Diesel generator backup/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Solar power support/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Emergency lighting/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/24\/7 caretaker/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CCTV security/i).length).toBeGreaterThan(0);
      expect(
        screen.getAllByText(
          `${publicInformation.parking.inside.valueLabel} inside the property`,
        ).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(
          `${publicInformation.parking.outside.valueLabel} outside the property`,
        ).length,
      ).toBeGreaterThan(0);
      const text = document.body.textContent || "";
      expect(text).not.toContain("Approximately 3 vehicles");
      expect(text).not.toContain("10 or more vehicles");
    });

    it("verifies unsupported claims are absent from the page source", () => {
      const filePath = path.resolve(__dirname, "../src/app/(marketing)/estate/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      const forbidden = [
        "master bedroom",
        "luxury bedroom",
        "resort",
        "five-star",
        "premium bedding",
        "hotel service",
        "daily housekeeping",
        "room service",
        "chef included",
        "catering included",
        "grocery included",
        "pool depth",
        "pool dimensions",
        "heated pool",
        "infinity pool",
        "lifeguard",
        "unlimited pool access",
        "guaranteed internet",
        "uninterrupted power",
        "guaranteed security",
        "GST",
        "security deposit",
        "cleaning fee",
        "extra guest fee",
        "overtime fee",
        "tel:",
        "wa.me",
        "travel minutes",
        "travel distance",
        "airport distance",
        "metro distance",
      ];

      forbidden.forEach((term) => {
        expect(content.toLowerCase()).not.toContain(term.toLowerCase());
      });
    });
  });

  describe("Gate 4B.1: Estate Page Public-Facts Alignment", () => {
    it("renders canonical maximum capacities from publicInformation config", () => {
      render(<EstatePage />);
      const text = document.body.textContent || "";
      expect(text).toContain(publicInformation.capacity.overnightLabel);
      expect(text).toContain(publicInformation.capacity.indoorLabel);
      expect(text).toContain(publicInformation.capacity.standardDayEventLabel);
    });

    it("renders the larger-event written-approval statement", () => {
      render(<EstatePage />);
      const text = document.body.textContent || "";
      expect(text).toContain(publicInformation.capacity.largerEventStatement);
    });

    it("contains no 24-hour booking wording", () => {
      render(<EstatePage />);
      const text = document.body.textContent || "";
      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
    });

    it("contains no old approximate capacity ranges", () => {
      render(<EstatePage />);
      const text = document.body.textContent || "";
      expect(text).not.toContain("6\u201310 Guests");
      expect(text).not.toContain("30\u201340 Guests");
      expect(text).not.toContain("~15\u201320 Guests");
      expect(text).not.toContain("Approximately 15\u201320");
      expect(text).not.toContain("Approximately 3 Inside");
    });

    it("remains structurally valid with single H1 and navigation links", () => {
      render(<EstatePage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe("ExperiencesPage Architecture and Content Guardrails", () => {
    it("verifies heading hierarchy has exactly one H1 with correct text", () => {
      render(<ExperiencesPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Experiences at Silver Oak Estate");
    });

    it("verifies exact metadata title and complete description are exported", async () => {
      const expModule = await import("@/app/(marketing)/experiences/page");
      expect(expModule.metadata.title).toBe("Experiences | Private Stays & Gatherings at Silver Oak Estate");
      expect(expModule.metadata.description).toBe(
        `Discover private stays, approved gatherings, pool and lawn time at Silver Oak Estate in Sector 135, Noida. The fully furnished 3 BHK farmhouse accommodates ${publicInformation.capacity.overnightLabel.toLowerCase()}.`
      );
    });

    it("verifies rendered page images use exact 7 production WebP paths and alt text", () => {
      const { container } = render(<ExperiencesPage />);
      const imgs = container.querySelectorAll("img");
      expect(imgs).toHaveLength(7);

      const expectedPaths = [
        "/images/estate/experiences/experiences-hero.webp",
        "/images/estate/experiences/experiences-stay.webp",
        "/images/estate/experiences/experiences-gather.webp",
        "/images/estate/experiences/experiences-dining.webp",
        "/images/estate/experiences/experiences-pool-lawn.webp",
        "/images/estate/experiences/experiences-residence.webp",
        "/images/estate/experiences/experiences-lawn-evening.webp",
      ];

      const actualPaths = Array.from(imgs).map((img) => decodeURIComponent(img.getAttribute("src") || ""));
      expectedPaths.forEach((expected) => {
        expect(actualPaths.some((p) => p.includes(expected))).toBe(true);
      });
    });

    it("verifies CTA action links queried by accessible names have correct destinations", () => {
      render(<ExperiencesPage />);
      const availabilityLinks = screen.getAllByRole("link", { name: "Check Availability" });
      expect(availabilityLinks.length).toBeGreaterThanOrEqual(1);
      availabilityLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/availability");
      });

      const emailLink = screen.getByRole("link", { name: "Email an Enquiry" });
      expect(emailLink).toHaveAttribute("href", "mailto:contact@silveroakestate.online");
    });
  });

  describe("Gate 4B.1: Experiences Page Public-Facts Alignment", () => {
    it("renders canonical maximum capacities from publicInformation config on experiences page", () => {
      render(<ExperiencesPage />);
      const text = document.body.textContent || "";
      expect(text.toLowerCase()).toContain(publicInformation.capacity.overnightLabel.toLowerCase());
      expect(text.toLowerCase()).toContain(publicInformation.capacity.indoorLabel.toLowerCase());
      expect(text.toLowerCase()).toContain(publicInformation.capacity.standardDayEventLabel.toLowerCase());
    });

    it("renders the larger-event written-approval statement on experiences page", () => {
      render(<ExperiencesPage />);
      const text = document.body.textContent || "";
      expect(text).toContain(publicInformation.capacity.largerEventStatement);
    });

    it("contains no 24-hour booking wording on experiences page", () => {
      render(<ExperiencesPage />);
      const text = document.body.textContent || "";
      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
    });

    it("contains no old approximate capacity ranges or unconfirmed claims on experiences page", () => {
      render(<ExperiencesPage />);
      const text = document.body.textContent || "";
      expect(text).not.toContain("6–10");
      expect(text).not.toContain("6-10");
      expect(text).not.toContain("30–40");
      expect(text).not.toContain("30-40");
      expect(text).not.toContain("15–20");
      expect(text).not.toContain("15-20");
      expect(text).not.toContain("approximately 30");
      expect(text).not.toContain("approximately 15");
      expect(text).not.toContain("unlimited");
      expect(text).not.toContain("no restriction");
    });

    it("remains structurally valid with single H1 and navigation links on experiences page", () => {
      render(<ExperiencesPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe("PublicInformationPages Smoke Architecture", () => {
    it("renders expected H1 heading and metadata title for Pricing Page", async () => {
      render(<PricingPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pricing at Silver Oak Estate");
      const pricingMod = await import("@/app/(marketing)/pricing/page");
      expect(pricingMod.metadata.title).toBe("Pricing | Silver Oak Estate");
      expect(screen.getByRole("link", { name: "Check Availability" })).toHaveAttribute("href", "/availability");
    });

    it("renders expected H1 heading and metadata title for Location Page", async () => {
      render(<LocationPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Location & Address");
      const locationMod = await import("@/app/(marketing)/location/page");
      expect(locationMod.metadata.title).toBe("Location | Silver Oak Estate, Sector 135 Noida");
      expect(screen.getByRole("link", { name: "Open in Google Maps" })).toHaveAttribute(
        "href",
        "https://maps.app.goo.gl/zaB8oYQeiaUWChYM7"
      );
    });

    it("renders expected H1 heading and metadata title for Contact Page", async () => {
      render(<ContactPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Contact & Enquiries");
      const contactMod = await import("@/app/(marketing)/contact/page");
      expect(contactMod.metadata.title).toBe("Contact | Silver Oak Estate");
      const emailLinks = screen.getAllByRole("link", { name: "Email an Enquiry" });
      expect(emailLinks.length).toBeGreaterThanOrEqual(1);
      expect(emailLinks[0]).toHaveAttribute("href", "mailto:contact@silveroakestate.online");
    });

    it("renders expected H1 heading and metadata title for Policies Page", async () => {
      render(<PoliciesPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Booking Information & Current Policies");
      const policiesMod = await import("@/app/(marketing)/policies/page");
      expect(policiesMod.metadata.title).toBe("Booking Information | Silver Oak Estate");
      expect(screen.getByRole("link", { name: "View Pricing" })).toHaveAttribute("href", "/pricing");
    });

    it("verifies homepage renders fixed booking-slot wording", () => {
      render(<HomePage />);
      const text = document.body.textContent || "";
      expect(text).toContain("standard 23-hour slot");
      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
    });

    it("verifies pricing page renders fixed booking-slot timings and non-GST statement", () => {
      render(<PricingPage />);
      const text = document.body.textContent || "";
      expect(text).toContain("standard 23-hour slot");
      expect(text).toContain("11:00 AM");
      expect(text).toContain("10:00 AM the following day");
      expect(text).toContain("GST is not currently charged");
      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
    });

    it("verifies contact page renders primary and secondary call and WhatsApp actions", () => {
      render(<ContactPage />);
      expect(screen.getByRole("link", { name: "Call +91 86794 70955" })).toHaveAttribute("href", "tel:+918679470955");
      expect(screen.getByRole("link", { name: "Call +91 99102 03212" })).toHaveAttribute("href", "tel:+919910203212");

      const wa1 = screen.getByRole("link", { name: "WhatsApp +91 86794 70955" });
      expect(wa1).toHaveAttribute("href", "https://wa.me/918679470955");
      expect(wa1).toHaveAttribute("target", "_blank");

      const wa2 = screen.getByRole("link", { name: "WhatsApp +91 99102 03212" });
      expect(wa2).toHaveAttribute("href", "https://wa.me/919910203212");
      expect(wa2).toHaveAttribute("target", "_blank");
    });

    it("verifies policies page renders canonical capacity maximums and larger-event statement", () => {
      render(<PoliciesPage />);
      const text = document.body.textContent || "";
      expect(text).toContain("Up to 10 guests");
      expect(text).toContain("Up to 20 people");
      expect(text).toContain("Up to 40 people");
      expect(text).toContain("Events above 40 people require prior written approval");
      expect(text).not.toContain("unlimited");
    });

    it("verifies absence of 24-hour wording across affected public route components", () => {
      [HomePage, PricingPage, ContactPage, PoliciesPage].forEach((Component) => {
        const { container } = render(<Component />);
        const text = (container.textContent || "").toLowerCase();
        expect(text).not.toContain("24-hour");
        expect(text).not.toContain("24 hours");
        expect(text).not.toContain("for 24 hours");
      });
    });
  });
});
