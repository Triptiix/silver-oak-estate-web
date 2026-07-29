import ContactPage from "@/app/(marketing)/contact/page";
import LocationPage from "@/app/(marketing)/location/page";
import PricingPage from "@/app/(marketing)/pricing/page";
import {
  formatInrFromPaise,
  publicInformation,
} from "@/config/public-information";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Phase 7B.2 public information pages", () => {
  it("keeps pricing facts canonical and booking-safe", () => {
    const { container } = render(<PricingPage />);
    const text = container.textContent || "";
    const hrefs = Array.from(container.querySelectorAll("a")).map(
      (link) => link.getAttribute("href"),
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(text).toContain(
      formatInrFromPaise(publicInformation.booking.weekday.ratePaise),
    );
    expect(text).toContain(
      formatInrFromPaise(publicInformation.booking.weekend.ratePaise),
    );
    expect(text).toContain(
      formatInrFromPaise(publicInformation.booking.advancePaise),
    );
    expect(text).toContain(publicInformation.booking.slotStatement);
    expect(text).toContain(publicInformation.booking.balanceText);
    expect(text).toContain(publicInformation.booking.confirmationNotice);
    expect(text).toContain(publicInformation.tax.currentStatement);
    expect(text).toContain(publicInformation.optionalArrangements.statement);
    expect(hrefs).toContain("/availability");
    expect(hrefs).toContain(publicInformation.contact.mailtoHref);
    expect(hrefs).toContain("/contact");
    expect(hrefs).not.toContain("/book");
    ["per night", "security deposit", "cleaning fee", "gst included", "discount", "package"].forEach(
      (claim) => expect(text.toLowerCase()).not.toContain(claim),
    );
  });

  it("uses the configured destination, address, and neutral parking facts", () => {
    const { container } = render(<LocationPage />);
    const mapsLinks = Array.from(container.querySelectorAll("a")).filter(
      (link) => link.getAttribute("href") === publicInformation.location.mapsUrl,
    );
    const text = container.textContent || "";

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("address")).toHaveTextContent(
      publicInformation.location.fullAddress,
    );
    expect(mapsLinks).not.toHaveLength(0);
    mapsLinks.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    });
    expect(text).toContain(publicInformation.parking.inside.valueLabel);
    expect(text).toContain(publicInformation.parking.inside.description);
    expect(text).toContain(publicInformation.parking.outside.valueLabel);
    expect(text).toContain(publicInformation.parking.outside.description);
    expect(text.toLowerCase()).not.toMatch(
      /secure parking|gated parking|ample parking|guaranteed parking|\b\d+\s*(mins?|minutes?|km)\b/,
    );
  });

  it("retains direct contact methods without a form or booking exposure", () => {
    const { container } = render(<ContactPage />);
    const hrefs = Array.from(container.querySelectorAll("a")).map(
      (link) => link.getAttribute("href"),
    );
    const text = container.textContent || "";

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        publicInformation.contact.primaryPhone.telHref,
        publicInformation.contact.primaryPhone.whatsappHref,
        publicInformation.contact.secondaryPhone.telHref,
        publicInformation.contact.secondaryPhone.whatsappHref,
        publicInformation.contact.mailtoHref,
        "/availability",
        "/location",
      ]),
    );
    expect(hrefs).not.toContain("/book");
    expect(text).toContain(publicInformation.booking.confirmationNotice);
    expect(text).toContain("The required advance must be received");
    expect(text).toContain("Preferred date or date range");
    expect(text).toContain("Expected group size");
    expect(text).toContain("Optional arrangement requirements");
    expect(text).toContain(publicInformation.optionalArrangements.statement);
    expect(container.querySelector("form")).toBeNull();
    expect(text.toLowerCase()).not.toMatch(
      /immediate response|24\/7 response|booking manager|operations manager|aadhaar|government id|card information/,
    );
  });
});
