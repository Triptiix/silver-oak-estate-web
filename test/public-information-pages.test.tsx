import ContactPage, { metadata as contactMetadata } from "@/app/(marketing)/contact/page";
import LocationPage, { metadata as locationMetadata } from "@/app/(marketing)/location/page";
import PoliciesPage, { metadata as policiesMetadata } from "@/app/(marketing)/policies/page";
import PricingPage, { metadata as pricingMetadata } from "@/app/(marketing)/pricing/page";
import { publicInformation } from "@/config/public-information";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Public Information Pages", () => {
  describe("A. Metadata Contracts", () => {
    it("exports exact metadata for Pricing Page", () => {
      expect(pricingMetadata.title).toBe("Pricing | Silver Oak Estate");
      expect(pricingMetadata.description).toBe(
        "View confirmed weekday and weekend 24-hour booking rates, advance payment information and enquiry options for Silver Oak Estate in Sector 135, Noida."
      );
    });

    it("exports exact metadata for Location Page", () => {
      expect(locationMetadata.title).toBe("Location | Silver Oak Estate, Sector 135 Noida");
      expect(locationMetadata.description).toBe(
        "Find Silver Oak Estate at Farm house 22, Phase 16, Green Beauty Farms, Sector 135, Noida, Uttar Pradesh 201310 and open the official Google Maps location."
      );
    });

    it("exports exact metadata for Contact Page", () => {
      expect(contactMetadata.title).toBe("Contact | Silver Oak Estate");
      expect(contactMetadata.description).toBe(
        "Email Silver Oak Estate regarding availability, private stays, approved gatherings, photography shoots and optional arrangements in Sector 135, Noida."
      );
    });

    it("exports exact metadata for Policies Page", () => {
      expect(policiesMetadata.title).toBe("Booking Information | Silver Oak Estate");
      expect(policiesMetadata.description).toBe(
        "Review verified capacity, payment and operational information for Silver Oak Estate. Final legal booking terms will be provided before payment and confirmation."
      );
    });
  });

  describe("B. Heading Structure & Single H1 Rule", () => {
    it("verifies single H1 on Pricing Page", () => {
      render(<PricingPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Pricing at Silver Oak Estate");
    });

    it("verifies single H1 on Location Page", () => {
      render(<LocationPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Location & Address");
    });

    it("verifies single H1 on Contact Page", () => {
      render(<ContactPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Contact & Enquiries");
    });

    it("verifies single H1 on Policies Page", () => {
      render(<PoliciesPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Booking Information & Current Policies");
    });
  });

  describe("C. Pricing Page Content & Prohibitions", () => {
    it("verifies verified pricing facts, mandatory statement, exact complete property statement, and CTAs", () => {
      render(<PricingPage />);
      const text = document.body.textContent || "";

      expect(text).toContain(publicInformation.booking.weekday.rate);
      expect(text).toContain(publicInformation.booking.weekend.rate);
      expect(text).toContain(publicInformation.booking.advance);
      expect(text).toContain(`for ${publicInformation.booking.durationLabel}`);
      expect(text).toContain("The published weekday and weekend rates apply to the complete 3 BHK property.");
      expect(text).toContain(publicInformation.optionalArrangements.statement);
      expect(text).toContain(publicInformation.booking.balanceText);
      expect(text).toContain(publicInformation.booking.confirmationNotice);

      const availabilityLink = screen.getByRole("link", { name: "Check Availability" });
      expect(availabilityLink).toHaveAttribute("href", "/availability");

      const emailLink = screen.getByRole("link", { name: "Email an Enquiry" });
      expect(emailLink).toHaveAttribute("href", publicInformation.contact.mailtoHref);
    });

    it("verifies absence of prohibited pricing terms and unconfirmed room claims", () => {
      render(<PricingPage />);
      const text = (document.body.textContent || "").toLowerCase();

      expect(text).not.toContain("per night");
      expect(text).not.toContain("nightly");
      expect(text).not.toContain("gst");
      expect(text).not.toContain("security deposit");
      expect(text).not.toContain("cleaning fee");
      expect(text).not.toContain("extra guest fee");
      expect(text).not.toContain("overtime fee");
      expect(text).not.toContain("independent room rentals");
    });
  });

  describe("D. Location Page Content & Prohibitions", () => {
    it("verifies address, Google Maps link, exact neutral parking statements, and CTAs", () => {
      render(<LocationPage />);
      const text = document.body.textContent || "";

      expect(text).toContain(publicInformation.location.fullAddress);
      expect(screen.getByRole("heading", { name: "Parking" })).toBeInTheDocument();
      expect(text).toContain(publicInformation.parking.inside.description);
      expect(text).toContain(publicInformation.parking.outside.description);

      const mapsLink = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(mapsLink).toHaveAttribute("href", publicInformation.location.mapsUrl);
      expect(mapsLink).toHaveAttribute("target", "_blank");
      expect(mapsLink.getAttribute("rel")).toContain("noopener");
      expect(mapsLink.getAttribute("rel")).toContain("noreferrer");

      const availabilityLink = screen.getByRole("link", { name: "Check Availability" });
      expect(availabilityLink).toHaveAttribute("href", "/availability");
    });

    it("verifies absence of placeholders, unsupported claims, and nonexistent CSS tokens", () => {
      render(<LocationPage />);
      const text = document.body.textContent || "";

      expect(text).not.toContain("[Map Placeholder]");
      expect(text).not.toContain("Detailed directions will be provided upon booking confirmation");
      expect(text).not.toContain("Parking & Accessibility");
      expect(text).not.toContain("secure parking");
      expect(text).not.toContain("gated estate compound");
      expect(text).not.toContain("ample parking");
      expect(text).not.toContain("private farm lane");
      expect(text).not.toMatch(/\b\d+\s*(mins?|minutes?|km)\b/i);
    });
  });

  describe("E. Contact Page Content & Prohibitions", () => {
    it("verifies canonical email, address, preferred date range checklist, and CTAs", () => {
      render(<ContactPage />);
      const text = document.body.textContent || "";

      expect(text).toContain(publicInformation.contact.email);
      expect(text).toContain(publicInformation.location.fullAddress);
      expect(text).toContain("Preferred booking date or date range.");
      expect(text).toContain("Expected Group Size");

      const mailLinks = screen.getAllByRole("link", { name: new RegExp(`${publicInformation.contact.email}|Email an Enquiry`, "i") });
      expect(mailLinks.length).toBeGreaterThanOrEqual(1);
      mailLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", publicInformation.contact.mailtoHref);
      });

      const availabilityLink = screen.getByRole("link", { name: "Check Availability" });
      expect(availabilityLink).toHaveAttribute("href", "/availability");
    });

    it("verifies absence of site visits, WhatsApp, phone placeholders, and wa.me/tel links", () => {
      const { container } = render(<ContactPage />);
      const text = (document.body.textContent || "").toLowerCase();

      expect(text).not.toContain("site visits");
      expect(text).not.toContain("desired check-in and check-out dates");
      expect(text).not.toContain("whatsapp");
      expect(text).not.toContain("[whatsapp cta placeholder]");

      const links = container.querySelectorAll("a");
      links.forEach((a) => {
        const href = a.getAttribute("href") || "";
        expect(href).not.toContain("wa.me");
        expect(href).not.toContain("tel:");
      });
    });
  });

  describe("F. Policies Page Content & Prohibitions", () => {
    it("verifies legal review notice, operational status, neutral parking, verified capacities, and CTAs", () => {
      render(<PoliciesPage />);
      const text = document.body.textContent || "";

      expect(text).toContain("Legal review in progress");
      expect(text).toContain("Verified operational parameters, guest capacity information and current payment information for Silver Oak Estate.");
      expect(text).toContain("It is an operational summary and does not constitute a final booking contract");
      expect(text).toContain("6–10");
      expect(text).toContain("~15–20");
      expect(text).toContain("~30–40");
      expect(text).toContain("Capacity information for approved daytime gatherings at the property.");
      expect(text).toContain(publicInformation.parking.summary);
      expect(text).toContain(publicInformation.booking.weekday.rate);
      expect(text).toContain(publicInformation.booking.weekend.rate);
      expect(text).toContain(publicInformation.booking.advance);

      const pricingLink = screen.getByRole("link", { name: "View Pricing" });
      expect(pricingLink).toHaveAttribute("href", "/pricing");

      const emailLink = screen.getByRole("link", { name: "Email an Enquiry" });
      expect(emailLink).toHaveAttribute("href", publicInformation.contact.mailtoHref);
    });

    it("verifies absence of check-in/checkout times, estate compound, pool deck, and final legal claims", () => {
      render(<PoliciesPage />);
      const text = document.body.textContent || "";

      expect(text).not.toContain("11:00 AM");
      expect(text).not.toContain("10:00 AM");
      expect(text).not.toContain("6 - 8 maximum");
      expect(text).not.toContain("30 maximum");
      expect(text).not.toContain("estate compound");
      expect(text).not.toContain("along the lane");
      expect(text).not.toContain("pool deck");
    });
  });

  describe("G. Architecture & Source Token Guardrails", () => {
    const pagePaths = [
      "src/app/(marketing)/pricing/page.tsx",
      "src/app/(marketing)/location/page.tsx",
      "src/app/(marketing)/contact/page.tsx",
      "src/app/(marketing)/policies/page.tsx",
    ];

    pagePaths.forEach((relPath) => {
      it(`verifies design system primitives, single import of publicInformation, and absence of invalid tokens in ${relPath}`, () => {
        const fullPath = path.join(process.cwd(), relPath);
        const code = fs.readFileSync(fullPath, "utf-8");

        // Design system imports & structure
        expect(code).toContain("@/components/estate-ui/");
        expect(code).toContain("@/config/public-information");
        expect(code).not.toContain("@/components/ui/container");
        expect(code).not.toContain("@/components/ui/button");
        expect(code).not.toContain("<main");
        expect(code).not.toContain("wa.me");
        expect(code).not.toContain("tel:");
        expect(code).not.toContain("Placeholder");

        // Invalid / Nonexistent tokens and utilities
        expect(code).not.toContain("--soe-color-brand-contrast");
        expect(code).not.toContain("--soe-radius-button");
        expect(code).not.toContain("--soe-surface-bg-base");
        expect(code).not.toContain("--soe-surface-text-muted");
        expect(code).not.toContain("--soe-text-4xl");
        expect(code).not.toContain("font-soe-editorial");

        // Unsupported copy claims
        expect(code).not.toContain("secure parking");
        expect(code).not.toContain("ample parking");
        expect(code).not.toContain("private farm lane");
        expect(code).not.toContain("site visits");
        expect(code).not.toContain("independent room rentals");

        // Positive valid token assertions
        expect(code).toContain("bg-[var(--soe-surface-bg-primary)]");
      });
    });

    it("verifies specific token contract usages for Pricing, Location, Contact, and Policies", () => {
      const pricingCode = fs.readFileSync(path.join(process.cwd(), "src/app/(marketing)/pricing/page.tsx"), "utf-8");
      expect(pricingCode).toContain("text-[var(--soe-surface-text-secondary)]");
      expect(pricingCode).toContain("font-soe-display");
      expect(pricingCode).toContain("text-[length:var(--soe-text-2xl)]");

      const locationCode = fs.readFileSync(path.join(process.cwd(), "src/app/(marketing)/location/page.tsx"), "utf-8");
      expect(locationCode).toContain("font-soe-display");

      const contactCode = fs.readFileSync(path.join(process.cwd(), "src/app/(marketing)/contact/page.tsx"), "utf-8");
      expect(contactCode).toContain("text-[var(--soe-surface-text-secondary)]");

      const policiesCode = fs.readFileSync(path.join(process.cwd(), "src/app/(marketing)/policies/page.tsx"), "utf-8");
      expect(policiesCode).toContain("text-[var(--soe-surface-text-secondary)]");
      expect(policiesCode).toContain("font-soe-display");
    });

    it("verifies single source-of-truth contract for publicInformation configuration module", () => {
      const rawCanonicalValues = [
        "contact@silveroakestate.online",
        "Farm house 22, Phase 16, Green Beauty Farms, Sector 135, Noida, Uttar Pradesh 201310",
        "https://maps.app.goo.gl/zaB8oYQeiaUWChYM7",
        "₹15,000",
        "₹20,000",
        "₹5,000",
        "Remaining balance payable at check-in.",
        "Final pricing and applicable charges will be confirmed in writing before payment and booking confirmation.",
        "Parking space for 3 vehicles is available inside the property.",
        "Parking space for 10+ vehicles is available outside the property.",
        "Parking space is available for 3 vehicles inside the property and 10+ vehicles outside the property.",
        "Optional arrangements such as catering, DJ arrangements, photography shoots and event-related amenities are available only on request, subject to availability, written confirmation and a case-by-case assessment.",
      ];

      const configCode = fs.readFileSync(path.join(process.cwd(), "src/config/public-information.ts"), "utf-8");
      rawCanonicalValues.forEach((val) => {
        expect(configCode).toContain(val);
      });

      pagePaths.forEach((relPath) => {
        const pageCode = fs.readFileSync(path.join(process.cwd(), relPath), "utf-8");
        rawCanonicalValues.forEach((val) => {
          expect(pageCode).not.toContain(val);
        });
      });
    });
  });
});
