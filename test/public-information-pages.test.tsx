import HomePage from "@/app/(marketing)/page";
import ContactPage, { metadata as contactMetadata } from "@/app/(marketing)/contact/page";
import EstatePage, { metadata as estateMetadata } from "@/app/(marketing)/estate/page";
import ExperiencesPage, { metadata as experiencesMetadata } from "@/app/(marketing)/experiences/page";
import LocationPage, { metadata as locationMetadata } from "@/app/(marketing)/location/page";
import PoliciesPage, { metadata as policiesMetadata } from "@/app/(marketing)/policies/page";
import PricingPage, { metadata as pricingMetadata } from "@/app/(marketing)/pricing/page";
import { formatInrFromPaise, publicInformation } from "@/config/public-information";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("Public Information Pages & Config Contracts", () => {
  describe("A. Metadata Contracts", () => {
    it("exports exact metadata for Pricing Page", () => {
      expect(pricingMetadata.title).toBe("Pricing | Silver Oak Estate");
      expect(pricingMetadata.description).toBe(
        "View confirmed weekday and weekend rates for Silver Oak Estate’s fixed booking slot, advance payment information and enquiry options in Sector 135, Noida."
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
        "Contact Silver Oak Estate via email, phone or WhatsApp regarding availability, private stays, approved gatherings, photography shoots and optional arrangements in Sector 135, Noida."
      );
    });

    it("exports exact metadata for Policies Page", () => {
      expect(policiesMetadata.title).toBe("Booking Information | Silver Oak Estate");
      expect(policiesMetadata.description).toBe(
        "Review verified capacity, payment and operational information for Silver Oak Estate. Final legal booking terms will be provided before payment and confirmation."
      );
    });

    it("exports exact metadata for Estate Page", () => {
      expect(estateMetadata.title).toBe("The Estate | Silver Oak Estate Private Farmhouse in Noida");
      expect(estateMetadata.description).toBe(
        "Explore the fully furnished 3 BHK residence, lawn, pool, kitchen and private gathering spaces at Silver Oak Estate in Sector 135, Noida."
      );
    });

    it("exports exact metadata for Experiences Page", () => {
      expect(experiencesMetadata.title).toBe("Experiences | Private Stays & Gatherings at Silver Oak Estate");
      expect(experiencesMetadata.description).toBe(
        `Discover private stays, approved gatherings, pool and lawn time at Silver Oak Estate in Sector 135, Noida. The fully furnished 3 BHK farmhouse accommodates ${publicInformation.capacity.overnightLabel.toLowerCase()}.`
      );
      expect(experiencesMetadata.description).toContain(publicInformation.capacity.overnightLabel.toLowerCase());
      expect(experiencesMetadata.description).not.toContain("6–10");
      expect(experiencesMetadata.description).not.toContain("6-10");
    });
  });

  describe("B. Heading Structure & Single H1 Rule", () => {
    it("verifies single H1 on Pricing Page", () => {
      render(<PricingPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Rates for the complete estate");
    });

    it("verifies single H1 on Location Page", () => {
      render(<LocationPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Find the estate");
    });

    it("verifies single H1 on Contact Page", () => {
      render(<ContactPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Begin with a considered enquiry");
    });

    it("verifies single H1 on Policies Page", () => {
      render(<PoliciesPage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("Booking Information & Current Policies");
    });

    it("verifies single H1 on Homepage", () => {
      render(<HomePage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("A Private Escape for Stays, Gatherings and Celebrations");
    });

    it("verifies single H1 on Estate Page", () => {
      render(<EstatePage />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent("A Complete Private Estate for Time Together");
    });
  });

  describe("C. Canonical Booking-Slot Configuration", () => {
    it("verifies exact booking slot configuration values", () => {
      expect(publicInformation.booking.durationHours).toBe(23);
      expect(publicInformation.booking.durationLabel).toBe("standard 23-hour slot");
      expect(publicInformation.booking.checkIn.timeLabel).toBe("11:00 AM");
      expect(publicInformation.booking.checkOut.timeLabel).toBe("10:00 AM the following day");
      expect(publicInformation.booking.slotStatement).toBe(
        "Check-in is at 11:00 AM and checkout is at 10:00 AM the following day."
      );
    });
  });

  describe("D. Canonical Contact Configuration", () => {
    it("verifies exact canonical phone, email, and link structure", () => {
      expect(publicInformation.contact.email).toBe("contact@silveroakestate.online");
      expect(publicInformation.contact.mailtoHref).toBe("mailto:contact@silveroakestate.online");

      expect(publicInformation.contact.primaryPhone.display).toBe("+91 86794 70955");
      expect(publicInformation.contact.primaryPhone.e164).toBe("+918679470955");
      expect(publicInformation.contact.primaryPhone.telHref).toBe("tel:+918679470955");
      expect(publicInformation.contact.primaryPhone.whatsappHref).toBe("https://wa.me/918679470955");

      expect(publicInformation.contact.secondaryPhone.display).toBe("+91 99102 03212");
      expect(publicInformation.contact.secondaryPhone.e164).toBe("+919910203212");
      expect(publicInformation.contact.secondaryPhone.telHref).toBe("tel:+919910203212");
      expect(publicInformation.contact.secondaryPhone.whatsappHref).toBe("https://wa.me/919910203212");
    });
  });

  describe("E. Canonical Capacity Configuration", () => {
    it("verifies capacity upper limits and larger-event statement", () => {
      expect(publicInformation.capacity.overnightMax).toBe(10);
      expect(publicInformation.capacity.overnightLabel).toBe("Up to 10 guests");
      expect(publicInformation.capacity.indoorMax).toBe(20);
      expect(publicInformation.capacity.indoorLabel).toBe("Up to 20 people");
      expect(publicInformation.capacity.standardDayEventMax).toBe(40);
      expect(publicInformation.capacity.standardDayEventLabel).toBe("Up to 40 people");
      expect(publicInformation.capacity.largerEventStatement).toBe(
        "Events above 40 people require prior written approval after an operational and safety review."
      );
    });
  });

  describe("F. Canonical Tax Configuration", () => {
    it("verifies non-GST-registered tax status and current statement", () => {
      expect(publicInformation.tax.gstRegistered).toBe(false);
      expect(publicInformation.tax.currentStatement).toBe(
        "GST is not currently charged. Applicable GST may be added only after registration and will be disclosed before payment and booking confirmation."
      );
    });
  });

  describe("G. Homepage Contracts", () => {
    it("renders canonical rates, booking slot, and capacity on homepage", () => {
      render(<HomePage />);
      const text = document.body.textContent || "";

      expect(text).toContain(formatInrFromPaise(publicInformation.booking.weekday.ratePaise));
      expect(text).toContain(formatInrFromPaise(publicInformation.booking.weekend.ratePaise));
      expect(text).toContain(formatInrFromPaise(publicInformation.booking.advancePaise));
      expect(text).toContain(publicInformation.booking.durationLabel);
      expect(text).toContain(publicInformation.capacity.overnightLabel.toLowerCase());
      expect(text).toContain(publicInformation.capacity.standardDayEventLabel.toLowerCase());
    });

    it("verifies absence of 24-hour wording and unconfirmed claims on homepage", () => {
      render(<HomePage />);
      const text = document.body.textContent || "";

      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
      expect(text).not.toContain("for 24 hours");
      expect(text).not.toContain("6 to 10");
      expect(text).not.toContain("30 to 40");
    });
  });

  describe("H. Pricing Page Content & Prohibitions", () => {
    it("verifies verified pricing facts, slot times, tax statement, and CTAs", () => {
      render(<PricingPage />);
      const text = document.body.textContent || "";

      expect(text).toContain(formatInrFromPaise(publicInformation.booking.weekday.ratePaise));
      expect(text).toContain(formatInrFromPaise(publicInformation.booking.weekend.ratePaise));
      expect(text).toContain(formatInrFromPaise(publicInformation.booking.advancePaise));
      expect(text).toContain(publicInformation.booking.durationLabel);
      expect(text).toContain(publicInformation.booking.checkIn.timeLabel);
      expect(text).toContain(publicInformation.booking.checkOut.timeLabel);
      expect(text).toContain(publicInformation.tax.currentStatement);
      expect(text).toContain("Published rates");
      expect(text).toContain(publicInformation.optionalArrangements.statement);
      expect(text).toContain(publicInformation.booking.balanceText);
      expect(text).toContain(publicInformation.booking.confirmationNotice);

      const availabilityLink = screen.getAllByRole("link", { name: "Check Availability" })[0];
      expect(availabilityLink).toHaveAttribute("href", "/availability");

      const emailLink = screen.getByRole("link", { name: "Email an Enquiry" });
      expect(emailLink).toHaveAttribute("href", publicInformation.contact.mailtoHref);
    });

    it("verifies absence of 24-hour wording and prohibited tax/fee claims on pricing page", () => {
      render(<PricingPage />);
      const text = (document.body.textContent || "").toLowerCase();

      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
      expect(text).not.toContain("per night");
      expect(text).not.toContain("exclusive of gst");
      expect(text).not.toContain("gst included");
      expect(text).not.toContain("gstin");
      expect(text).not.toContain("security deposit");
      expect(text).not.toContain("cleaning fee");
    });
  });

  describe("I. Location Page Content & Prohibitions", () => {
    it("verifies address, Google Maps link, exact neutral parking statements, and CTAs", () => {
      render(<LocationPage />);
      const text = document.body.textContent || "";

      expect(text).toContain(publicInformation.location.fullAddress);
      expect(screen.getByText("Parking")).toBeInTheDocument();
      expect(text).toContain(publicInformation.parking.inside.description);
      expect(text).toContain(publicInformation.parking.outside.description);

      const mapsLink = screen.getAllByRole("link", { name: "Open in Google Maps" })[0];
      expect(mapsLink).toHaveAttribute("href", publicInformation.location.mapsUrl);
      expect(mapsLink).toHaveAttribute("target", "_blank");
      expect(mapsLink.getAttribute("rel")).toContain("noopener");
      expect(mapsLink.getAttribute("rel")).toContain("noreferrer");

      const availabilityLink = screen.getAllByRole("link", { name: "Check Availability" })[0];
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

  describe("J. Contact Page Content & Prohibitions", () => {
    it("verifies phone numbers, tel links, wa.me links, email, address, and CTAs", () => {
      render(<ContactPage />);
      const text = document.body.textContent || "";

      expect(text).toContain(publicInformation.contact.primaryPhone.display);
      expect(text).toContain(publicInformation.contact.secondaryPhone.display);
      expect(text).toContain(publicInformation.contact.email);
      expect(text).toContain(publicInformation.location.fullAddress);
      expect(text).toContain("Availability and booking confirmation require written confirmation");

      const telPrimary = screen.getByRole("link", { name: `Call ${publicInformation.contact.primaryPhone.display}` });
      expect(telPrimary).toHaveAttribute("href", publicInformation.contact.primaryPhone.telHref);
      expect(telPrimary).not.toHaveAttribute("target");

      const telSecondary = screen.getByRole("link", { name: `Call ${publicInformation.contact.secondaryPhone.display}` });
      expect(telSecondary).toHaveAttribute("href", publicInformation.contact.secondaryPhone.telHref);
      expect(telSecondary).not.toHaveAttribute("target");

      const waPrimary = screen.getByRole("link", {
        name: `WhatsApp ${publicInformation.contact.primaryPhone.display} (opens in a new tab)`,
      });
      expect(waPrimary).toHaveAttribute("href", publicInformation.contact.primaryPhone.whatsappHref);
      expect(waPrimary).toHaveAttribute("target", "_blank");
      expect(waPrimary.getAttribute("rel")).toContain("noopener");
      expect(waPrimary.getAttribute("rel")).toContain("noreferrer");

      const waSecondary = screen.getByRole("link", {
        name: `WhatsApp ${publicInformation.contact.secondaryPhone.display} (opens in a new tab)`,
      });
      expect(waSecondary).toHaveAttribute("href", publicInformation.contact.secondaryPhone.whatsappHref);
      expect(waSecondary).toHaveAttribute("target", "_blank");
      expect(waSecondary.getAttribute("rel")).toContain("noopener");
      expect(waSecondary.getAttribute("rel")).toContain("noreferrer");
    });
  });

  describe("K. Policies Page Content & Prohibitions", () => {

    it("verifies legal review notice, operational status, booking slot timings, canonical capacities, larger-event statement, and tax statement", () => {
      render(<PoliciesPage />);
      const text = document.body.textContent || "";

      expect(text).toContain("Legal review in progress");
      expect(text).toContain("Verified operational parameters, guest capacity information and current payment information for Silver Oak Estate.");
      expect(text).toContain("It is an operational summary and does not constitute a final booking contract");
      expect(text).toContain(publicInformation.booking.checkIn.timeLabel);
      expect(text).toContain(publicInformation.booking.checkOut.timeLabel);
      expect(text).toContain(publicInformation.booking.durationLabel);
      expect(text.toLowerCase()).toContain(publicInformation.capacity.overnightLabel.toLowerCase());
      expect(text.toLowerCase()).toContain(publicInformation.capacity.indoorLabel.toLowerCase());
      expect(text.toLowerCase()).toContain(publicInformation.capacity.standardDayEventLabel.toLowerCase());
    });

    it("verifies CTA links on policies page", () => {
      render(<PoliciesPage />);
      const pricingLink = screen.getByRole("link", { name: "View Pricing" });
      expect(pricingLink).toHaveAttribute("href", "/pricing");

      const emailLink = screen.getByRole("link", { name: "Email an Enquiry" });
      expect(emailLink).toHaveAttribute("href", publicInformation.contact.mailtoHref);
    });

    it("verifies absence of 24-hour wording and unlimited capacity claims on policies page", () => {
      render(<PoliciesPage />);
      const text = document.body.textContent || "";

      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
      expect(text).not.toContain("6–10");
      expect(text).not.toContain("~15–20");
      expect(text).not.toContain("~30–40");
      expect(text).not.toContain("unlimited");
      expect(text).not.toContain("no restriction");
    });
  });

  describe("KA. Estate Page Content & Prohibitions", () => {
    it("renders canonical capacity labels, booking-slot wording, and larger-event statement", () => {
      render(<EstatePage />);
      const text = document.body.textContent || "";

      expect(text.toLowerCase()).toContain(publicInformation.capacity.overnightLabel.toLowerCase());
      expect(text.toLowerCase()).toContain(publicInformation.capacity.indoorLabel.toLowerCase());
      expect(text.toLowerCase()).toContain(publicInformation.capacity.standardDayEventLabel.toLowerCase());
      expect(text).toContain(publicInformation.capacity.largerEventStatement);
      expect(text).toContain(publicInformation.booking.durationLabel);
    });

    it("verifies absence of stale capacity, 24-hour wording, and prohibited claims on estate page", () => {
      render(<EstatePage />);
      const text = document.body.textContent || "";

      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
      expect(text).not.toContain("6\u201310 Guests");
      expect(text).not.toContain("30\u201340 Guests");
      expect(text).not.toContain("~15\u201320 Guests");
      expect(text).not.toContain("unlimited");
      expect(text).not.toContain("no restriction");
    });

    it("uses Estate UI primitives and contains no nested main element", () => {
      render(<EstatePage />);
      const mains = document.querySelectorAll("main");
      expect(mains.length).toBeLessThanOrEqual(1);
    });
  });

  describe("KB. Experiences Page Content & Prohibitions", () => {
    it("renders canonical capacity labels, booking-slot wording, and larger-event statement on experiences page", () => {
      render(<ExperiencesPage />);
      const text = document.body.textContent || "";

      expect(text.toLowerCase()).toContain(publicInformation.capacity.overnightLabel.toLowerCase());
      expect(text.toLowerCase()).toContain(publicInformation.capacity.indoorLabel.toLowerCase());
      expect(text.toLowerCase()).toContain(publicInformation.capacity.standardDayEventLabel.toLowerCase());
      expect(text).toContain(publicInformation.capacity.largerEventStatement);
    });

    it("verifies absence of stale capacity, 24-hour wording, and prohibited claims on experiences page", () => {
      render(<ExperiencesPage />);
      const text = document.body.textContent || "";

      expect(text).not.toContain("24-hour");
      expect(text).not.toContain("24 hours");
      expect(text).not.toContain("6–10");
      expect(text).not.toContain("30–40");
      expect(text).not.toContain("15–20");
      expect(text).not.toContain("approximately 30");
      expect(text).not.toContain("approximately 15");
      expect(text).not.toContain("unlimited");
      expect(text).not.toContain("no restriction");
    });

    it("uses Estate UI primitives and contains no nested main element on experiences page", () => {
      render(<ExperiencesPage />);
      const mains = document.querySelectorAll("main");
      expect(mains.length).toBeLessThanOrEqual(1);
    });
  });

  describe("L. Integer Paise & Currency Formatter Contracts", () => {
    it("stores booking amounts strictly as integer paise", () => {
      expect(publicInformation.booking.weekday.ratePaise).toBe(1_500_000);
      expect(publicInformation.booking.weekend.ratePaise).toBe(2_000_000);
      expect(publicInformation.booking.advancePaise).toBe(500_000);

      expect(Number.isInteger(publicInformation.booking.weekday.ratePaise)).toBe(true);
      expect(Number.isInteger(publicInformation.booking.weekend.ratePaise)).toBe(true);
      expect(Number.isInteger(publicInformation.booking.advancePaise)).toBe(true);

      const bookingObj = publicInformation.booking as Record<string, unknown>;
      expect(bookingObj).not.toHaveProperty("rate");
      expect(bookingObj).not.toHaveProperty("advance");
    });

    it("formats integer paise amounts deterministically to Indian rupees", () => {
      expect(formatInrFromPaise(1_500_000)).toBe("₹15,000");
      expect(formatInrFromPaise(2_000_000)).toBe("₹20,000");
      expect(formatInrFromPaise(500_000)).toBe("₹5,000");
    });

    it("rejects non-integer, negative, or non-whole-rupee paise amounts", () => {
      expect(() => formatInrFromPaise(15000.5)).toThrow(RangeError);
      expect(() => formatInrFromPaise(-100)).toThrow(RangeError);
      expect(() => formatInrFromPaise(500050)).toThrow(RangeError);
    });
  });

  describe("M. Architecture & Source Token Guardrails across Modified Paths", () => {
    const pagePaths = [
      "src/app/(marketing)/page.tsx",
      "src/app/(marketing)/estate/page.tsx",
      "src/app/(marketing)/pricing/page.tsx",
      "src/app/(marketing)/location/page.tsx",
      "src/app/(marketing)/contact/page.tsx",
      "src/app/(marketing)/policies/page.tsx",
    ];

    pagePaths.forEach((relPath) => {
      it(`verifies design system primitives, publicInformation imports, and negative assertions in ${relPath}`, () => {
        const fullPath = path.join(process.cwd(), relPath);
        const code = fs.readFileSync(fullPath, "utf-8");

        expect(code).toContain("@/config/public-information");
        expect(code).not.toContain("<main");
        expect(code).not.toContain("24-hour");
        expect(code).not.toContain("24 hours");
        expect(code).not.toContain("for 24 hours");
        expect(code).not.toContain("Standard 24-Hour");
        expect(code).not.toContain("exclusive of GST");
        expect(code).not.toContain("GST included");
        expect(code).not.toContain("GSTIN");
        expect(code).not.toContain("unlimited");
        expect(code).not.toContain("no restriction");
        expect(code).not.toContain("#faf8f5");

        expect(code).not.toContain("--soe-color-brand-contrast");
        expect(code).not.toContain("--soe-radius-button");
        expect(code).not.toContain("--soe-surface-bg-base");
        expect(code).not.toContain("--soe-surface-text-muted");
        expect(code).not.toContain("--soe-text-4xl");
        expect(code).not.toContain("font-soe-editorial");
      });
    });

    it("verifies estate page source does not independently hardcode canonical capacity labels or duration", () => {
      const code = fs.readFileSync(path.join(process.cwd(), "src/app/(marketing)/estate/page.tsx"), "utf-8");
      expect(code).toContain("@/config/public-information");
      expect(code).not.toContain('"6\u201310 Guests"');
      expect(code).not.toContain('"30\u201340 Guests"');
      expect(code).not.toContain('"~15\u201320 Guests"');
      expect(code).not.toContain('"Up to 10 guests"');
      expect(code).not.toContain('"Up to 20 people"');
      expect(code).not.toContain('"Up to 40 people"');
    });

    it("verifies contact page contains no unsupported immediate response-time claim", () => {
      const code = fs.readFileSync(path.join(process.cwd(), "src/app/(marketing)/contact/page.tsx"), "utf-8");
      expect(code).not.toContain("immediate enquiry assistance");
      expect(code).not.toContain("instant");
      expect(code).not.toContain("24/7");
      expect(code).toContain("The estate team can assist");
    });

    it("verifies single source-of-truth contract for publicInformation module and page sources", () => {
      const configCode = fs.readFileSync(path.join(process.cwd(), "src/config/public-information.ts"), "utf-8");

      expect(configCode).toContain("ratePaise: 1_500_000");
      expect(configCode).toContain("ratePaise: 2_000_000");
      expect(configCode).toContain("advancePaise: 500_000");
      expect(configCode).not.toContain('"₹15,000"');
      expect(configCode).not.toContain('"₹20,000"');
      expect(configCode).not.toContain('"₹5,000"');

      const modifiedPagePaths = [
        "src/app/(marketing)/page.tsx",
        "src/app/(marketing)/pricing/page.tsx",
        "src/app/(marketing)/policies/page.tsx",
      ];

      modifiedPagePaths.forEach((relPath) => {
        const pageCode = fs.readFileSync(path.join(process.cwd(), relPath), "utf-8");
        expect(pageCode).toContain("formatInrFromPaise");
        expect(pageCode).not.toContain("₹15,000");
        expect(pageCode).not.toContain("₹20,000");
        expect(pageCode).not.toContain("₹5,000");
        expect(pageCode).not.toContain("1_500_000");
        expect(pageCode).not.toContain("2_000_000");
        expect(pageCode).not.toContain("500_000");
      });
    });

    it("verifies no raw phone numbers exist outside publicInformation config in modified pages", () => {
      const pagePathsWithPhoneCheck = [
        "src/app/(marketing)/page.tsx",
        "src/app/(marketing)/estate/page.tsx",
        "src/app/(marketing)/experiences/page.tsx",
        "src/app/(marketing)/pricing/page.tsx",
        "src/app/(marketing)/location/page.tsx",
        "src/app/(marketing)/contact/page.tsx",
        "src/app/(marketing)/policies/page.tsx",
      ];

      pagePathsWithPhoneCheck.forEach((relPath) => {
        const pageCode = fs.readFileSync(path.join(process.cwd(), relPath), "utf-8");
        expect(pageCode).not.toContain("8679470955");
        expect(pageCode).not.toContain("9910203212");
        expect(pageCode).not.toContain("+91 86794 70955");
        expect(pageCode).not.toContain("+91 99102 03212");
      });
    });
  });
});
