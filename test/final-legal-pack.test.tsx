import { existsSync, readFileSync } from "fs";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("server-only", () => ({}));

import PrivacyPage, { metadata as privacyMetadata } from "@/app/(marketing)/privacy/page";
import TermsPage, { metadata as termsMetadata } from "@/app/(marketing)/terms/page";
import PoliciesPage from "@/app/(marketing)/policies/page";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { EstateStructuredData } from "@/components/seo/estate-structured-data";
import { legalInformation } from "@/config/legal-information";
import {
  formatInrFromPaise,
  publicInformation,
} from "@/config/public-information";

afterEach(() => cleanup());

const textOf = (c: HTMLElement) => c.textContent || "";

describe("privacy policy is published", () => {
  it("is indexable and no longer a review draft", () => {
    expect(privacyMetadata.robots).toBeUndefined();
    expect(privacyMetadata.alternates?.canonical).toBe("/privacy");

    const { container } = render(<PrivacyPage />);
    const text = textOf(container);
    expect(text).not.toContain("Review draft");
    expect(text).not.toContain("Not yet effective");
    expect(text).not.toMatch(/will be updated with our full privacy policy/i);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("states the effective date and the approved accountable parties", () => {
    const { container } = render(<PrivacyPage />);
    const text = textOf(container);
    expect(text).toContain(legalInformation.effectiveDateLabel);
    expect(text).toContain(legalInformation.dataFiduciary.name); // Varun Yadav
    expect(text).toContain(legalInformation.grievanceOfficer.name); // Arpit Chouhan
    expect(text).toContain(legalInformation.grievanceOfficer.email);
    expect(text).toContain(legalInformation.grievanceOfficer.phoneDisplay);
  });

  it("links the grievance email and phone", () => {
    const { container } = render(<PrivacyPage />);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain(legalInformation.grievanceOfficer.mailtoHref);
    expect(hrefs).toContain(legalInformation.grievanceOfficer.telHref);
    expect(hrefs).toContain("/terms");
    expect(hrefs).toContain("/policies");
  });

  it("states the approved retention periods", () => {
    const text = textOf(render(<PrivacyPage />).container);
    expect(text).toMatch(
      new RegExp(`${legalInformation.retention.bookedGuestMonths} months after checkout`, "i"),
    );
    expect(text).toMatch(/last meaningful interaction/i);
  });

  it("describes CCTV truthfully and excludes private areas", () => {
    const text = textOf(render(<PrivacyPage />).container);
    expect(text).toMatch(/outdoor areas and common areas/i);
    expect(text).toMatch(/No CCTV cameras are installed in bedrooms, bathrooms or private/i);
    // No unverified audio-recording or fixed-retention claim.
    expect(text).not.toMatch(/audio record/i);
    expect(text).toMatch(/limited period reasonably necessary/i);
  });

  it("requires prior consent for marketing use", () => {
    const text = textOf(render(<PrivacyPage />).container);
    expect(text).toMatch(/without prior consent/i);
    expect(text).toMatch(/does not by itself give us permission/i);
  });

  it("offers correction and deletion requests", () => {
    const text = textOf(render(<PrivacyPage />).container);
    for (const right of ["access", "correct", "complete", "delete", "withdraw"]) {
      expect(text.toLowerCase()).toContain(right);
    }
  });

  it("claims no unverified identity-document or analytics collection", () => {
    const text = textOf(render(<PrivacyPage />).container);
    expect(text).toMatch(/We do not collect Aadhaar numbers, passports/i);
    expect(text).toMatch(/does not use advertising cookies/i);
    expect(text).toMatch(/does not run\s+third-party analytics/i);
  });

  it("makes no absolute security promise", () => {
    const text = textOf(render(<PrivacyPage />).container);
    expect(text).toMatch(/reasonable technical and organisational safeguards/i);
    expect(text).toMatch(/no method of\s+transmission or storage is completely secure/i);
    expect(text).not.toMatch(/completely safe|absolutely secure|guarantee(?:s|d)? (?:the )?security/i);
  });

  it("does not claim the DPDP Act is already fully in force", () => {
    const text = textOf(render(<PrivacyPage />).container);
    expect(text).toMatch(/as applicable laws and regulations[\s\S]*come into force/i);
    expect(text).not.toMatch(/fully (?:in force|effective)/i);
  });
});

describe("terms and conditions are published", () => {
  it("is indexable and no longer a review draft", () => {
    expect(termsMetadata.robots).toBeUndefined();
    expect(termsMetadata.alternates?.canonical).toBe("/terms");

    const { container } = render(<TermsPage />);
    const text = textOf(container);
    expect(text).not.toContain("Review draft");
    expect(text).not.toMatch(/currently being finalized/i);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent)
      .toBe("Terms and Conditions");
  });

  it("names the approved contracting party without inventing an entity", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toContain(legalInformation.contractingParty.name); // Varun Yadav
    expect(text).toMatch(/is not a separate incorporated company/i);
    // No unnamed registered business, no invented tax identity.
    expect(text).not.toMatch(/registered business/i);
    expect(text).not.toMatch(/GSTIN|CIN\b|proprietorship/i);
  });

  it("sets the minimum booking age and whole-property model", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toContain(`${legalInformation.minimumBookingAge} years old`);
    expect(text).toMatch(/one complete private property/i);
    expect(text).toMatch(/Individual bedrooms\s+are not sold or reserved separately/i);
  });

  it("matches central capacity, timing and rate values", () => {
    const text = textOf(render(<TermsPage />).container).toLowerCase();
    const { capacity, booking } = publicInformation;
    expect(text).toContain(capacity.overnightLabel.toLowerCase());
    expect(text).toContain(capacity.indoorLabel.toLowerCase());
    expect(text).toContain(capacity.standardDayEventLabel.toLowerCase());
    expect(text).toContain(booking.checkIn.timeLabel.toLowerCase());
    expect(text).toContain(booking.checkOut.timeLabel.toLowerCase());
    expect(text).toContain(formatInrFromPaise(booking.weekday.ratePaise).toLowerCase());
    expect(text).toContain(formatInrFromPaise(booking.weekend.ratePaise).toLowerCase());
  });

  it("keeps the booking advance and the security deposit separate", () => {
    const text = textOf(render(<TermsPage />).container);
    const advance = formatInrFromPaise(legalInformation.bookingAdvancePaise);
    const deposit = formatInrFromPaise(legalInformation.securityDepositPaise);
    expect(advance).toBe("₹5,000");
    expect(deposit).toBe("₹5,000");

    // Advance is adjusted against the price; deposit explicitly is not.
    expect(text).toMatch(/adjusted against the total booking price/i);
    expect(text).toMatch(/separate refundable security deposit/i);
    expect(text).toMatch(/not part of the booking price/i);
    expect(text).toMatch(/not part of the booking advance/i);
    // The advance section explicitly disclaims conflation.
    expect(text).toMatch(/The booking advance is\s+not\s+the refundable security\s+deposit/i);
  });

  it("states the deposit return window", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toContain(legalInformation.depositReturnWindowLabel); // 24–48 hours
  });

  it("publishes the exact cancellation bands and refund initiation period", () => {
    const { container } = render(<TermsPage />);
    const text = textOf(container);
    for (const band of legalInformation.cancellation.bands) {
      expect(text).toContain(band.window);
      expect(text).toContain(band.refund);
    }
    expect(text).toMatch(
      new RegExp(`${legalInformation.cancellation.refundInitiationBusinessDays} business days`, "i"),
    );
    // Boundary days fall in the 50% band.
    expect(text).toMatch(/falls within the 50% band/i);
    // Deposit is not subject to the cancellation percentage.
    expect(text).toMatch(/security deposit is returned in full/i);
  });

  it("allows one reschedule with the approved notice", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toMatch(
      new RegExp(`${legalInformation.reschedule.complimentaryCount} complimentary reschedule`, "i"),
    );
    expect(text).toMatch(
      new RegExp(`${legalInformation.reschedule.minimumNoticeDays} days before check-in`, "i"),
    );
  });

  it("makes no-shows non-refundable but protects owner-side cancellation", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toMatch(/No refund is payable for a no-show/i);
    expect(text).toMatch(/does not apply where Silver Oak Estate has cancelled/i);
  });

  it("preserves non-excludable rights and consumer forums", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toMatch(/Nothing in these terms excludes or limits any liability/i);
    expect(text).toMatch(/fraud, wilful misconduct, gross negligence/i);
    expect(text).toContain(legalInformation.jurisdiction);
    expect(text).toMatch(/prevents a consumer from approaching a\s+legally competent consumer commission/i);
  });

  it("states the current GST position without inventing registration", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toMatch(/not currently represented\s+as being registered for GST/i);
    expect(text).not.toMatch(/GSTIN/i);
    expect(text).not.toMatch(/gst included|inclusive of gst/i);
  });

  it("does not promise that direct terms always override platform terms", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toMatch(/platform.{0,3}s transaction terms may also apply/i);
    expect(text).not.toMatch(/always override|take precedence over the platform/i);
  });

  it("keeps force majeure balanced with no automatic promised outcome", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toMatch(/beyond reasonable control/i);
    expect(text).toMatch(/rescheduling, a credit or another lawful\s+outcome/i);
    expect(text).not.toMatch(/full refund will be given|guaranteed refund/i);
  });

  it("invents no fixed quiet hours and no arbitrary penalty", () => {
    const text = textOf(render(<TermsPage />).container);
    expect(text).toMatch(/quiet-hour or operational limits/i);
    expect(text).not.toMatch(/\b(?:10|11|12)\s*(?:pm|p\.m\.)\b/i);
    expect(text).toMatch(/do not apply arbitrary or punitive charges/i);
  });
});

describe("policies page reflects the final terms", () => {
  it("no longer announces a pending legal review", () => {
    const text = textOf(render(<PoliciesPage />).container);
    expect(text).not.toContain("Legal review in progress");
    expect(text).not.toMatch(/will be provided for review and acceptance/i);
    expect(text).toContain(`Terms effective ${legalInformation.effectiveDateLabel}`);
  });

  it("links to the full terms and privacy policy", () => {
    const { container } = render(<PoliciesPage />);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/terms");
    expect(hrefs).toContain("/privacy");
  });

  it("shows the advance and the separate deposit without conflating them", () => {
    const text = textOf(render(<PoliciesPage />).container);
    expect(text).toMatch(/Booking Advance:/i);
    expect(text).toMatch(/Refundable Security Deposit:/i);
    expect(text).toMatch(/not part of the booking price and not part of the booking advance/i);
  });

  it("summarises cancellation consistently with the central config", () => {
    const text = textOf(render(<PoliciesPage />).container);
    for (const band of legalInformation.cancellation.bands) {
      expect(text).toContain(band.window);
    }
    expect(text).toMatch(
      new RegExp(`${legalInformation.cancellation.refundInitiationBusinessDays} business days`, "i"),
    );
  });
});

describe("indexing and sitemap after publication", () => {
  it("lists privacy and terms in the sitemap and keeps /book out", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/privacy"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/terms"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/book"))).toBe(false);
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
  });

  it("does not disallow the legal routes in robots", () => {
    const disallow = ([] as string[]).concat(
      (robots().rules as { disallow?: string | string[] }).disallow ?? [],
    );
    expect(disallow).not.toContain("/privacy");
    expect(disallow).not.toContain("/terms");
    expect(disallow).toEqual(expect.arrayContaining(["/api/", "/admin/"]));
  });
});

describe("booking safety is unchanged", () => {
  it("keeps /book noindex and unlinked", () => {
    expect(readFileSync("src/app/(marketing)/book/page.tsx", "utf8"))
      .toMatch(/index:\s*false/);
    for (const file of [
      "src/components/layout/site-header.tsx",
      "src/components/layout/site-footer.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).not.toMatch(/href="\/book"/);
    }
  });

  it("adds no booking, hold or payment action to the legal pages", () => {
    for (const Page of [PrivacyPage, TermsPage, PoliciesPage]) {
      const { container } = render(<Page />);
      expect(container.querySelector('a[href="/book"]')).toBeNull();
      expect(container.querySelector("form")).toBeNull();
      expect(container.querySelectorAll("button")).toHaveLength(0);
      cleanup();
    }
  });

  it("introduces no ReserveAction and keeps online booking disabled by default", () => {
    // Assert on the emitted JSON-LD, not the source text: the component's
    // comment legitimately explains why these fields are omitted.
    const { container } = render(<EstateStructuredData />);
    const raw = container.querySelector('script[type="application/ld+json"]')!.innerHTML;
    expect(raw).not.toContain("ReserveAction");
    expect(raw).not.toContain("potentialAction");
    expect(JSON.parse(raw).potentialAction).toBeUndefined();
    cleanup();
    for (const file of [".env", ".env.example"]) {
      if (!existsSync(file)) continue;
      const match = readFileSync(file, "utf8").match(/^ONLINE_BOOKING_ENABLED=(.*)$/m);
      if (match) expect(match[1].replace(/["']/g, "").trim()).not.toBe("true");
    }
  });

  it("publishes no secret-looking or private financial value", () => {
    for (const Page of [PrivacyPage, TermsPage, PoliciesPage]) {
      const { container } = render(<Page />);
      // Strip href values so the published business tel:/wa.me numbers (which are
      // intentionally public) are not mistaken for account-like digit strings.
      const html = container.innerHTML.replace(/href="[^"]*"/g, "");
      expect(html).not.toMatch(/\b\d{9,18}\b/); // bank account-like numbers
      expect(html).not.toMatch(/[A-Z]{4}0[A-Z0-9]{6}/); // IFSC
      expect(html).not.toMatch(/upi:\/\/|@(?:ok|ybl|paytm|axl)\b/i);
      expect(html).not.toMatch(/rzp_(?:test|live)_/);
      cleanup();
    }
  });
});
