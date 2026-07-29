import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/components/booking/availability-flow", () => ({
  AvailabilityFlow: ({
    onlineBookingAvailable,
  }: {
    onlineBookingAvailable: boolean;
  }) => (
    <div
      data-testid="availability-flow"
      data-online-booking={String(onlineBookingAvailable)}
    >
      Read-only availability calendar
    </div>
  ),
}));

import AvailabilityPage from "@/app/(marketing)/availability/page";
import {
  publicInformation,
} from "@/config/public-information";
import { evaluateOnlineBookingCapability } from "@/lib/capabilities/online-booking";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe("Phase 7B.3 assisted availability page", () => {
  it("presents a canonical assisted enquiry without a self-service booking path", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { container } = render(<AvailabilityPage />);
    const pageText = container.textContent ?? "";
    const hrefs = Array.from(container.querySelectorAll("a")).map((link) =>
      link.getAttribute("href"),
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(pageText).toMatch(/subject to written confirmation/i);
    expect(pageText).toMatch(/enquiry does not reserve the estate/i);
    expect(pageText).not.toMatch(/\bBook now\b|\bPay now\b/i);
    expect(hrefs).not.toContain("/book");

    for (const phone of [
      publicInformation.contact.primaryPhone,
      publicInformation.contact.secondaryPhone,
    ]) {
      expect(
        screen.getByRole("link", { name: `Call ${phone.display}` }),
      ).toHaveAttribute("href", phone.telHref);

      const whatsapp = screen.getByRole("link", {
        name: `WhatsApp ${phone.display} (opens in a new tab)`,
      });
      expect(whatsapp).toHaveAttribute("href", phone.whatsappHref);
      expect(whatsapp).toHaveAttribute("target", "_blank");
      expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
    }

    expect(
      screen.getAllByRole("link", { name: "Email the Estate" })[0],
    ).toHaveAttribute("href", publicInformation.contact.mailtoHref);
    expect(pageText).toContain(publicInformation.capacity.overnightLabel);
    expect(pageText).toContain(
      publicInformation.capacity.standardDayEventLabel,
    );
    expect(pageText).toContain(publicInformation.booking.slotStatement);
  });

  it("cannot expose online booking through the public calendar even when capability inputs are complete", () => {
    process.env = {
      ...originalEnvironment,
      ONLINE_BOOKING_ENABLED: "true",
      APP_ENV: "staging",
      PAYMENT_PROVIDER: "razorpay",
      PAYMENT_PROVIDER_MODE: "test",
      BOOKING_HOLD_MINUTES: "10",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "turnstile-site-key",
      TURNSTILE_SECRET_KEY: "turnstile-secret-key",
      BOOKING_TOKEN_SECRET: "booking-token-secret",
      RAZORPAY_KEY_ID: "rzp_test_key",
      RAZORPAY_KEY_SECRET: "razorpay-secret",
      RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    };

    expect(evaluateOnlineBookingCapability(process.env).available).toBe(true);

    const { container } = render(<AvailabilityPage />);
    expect(screen.getByTestId("availability-flow")).toHaveAttribute(
      "data-online-booking",
      "false",
    );
    expect(container.querySelector('a[href^="/book"]')).toBeNull();
  });

  it("retains the explicit disabled booking kill-switch contract", () => {
    expect(
      evaluateOnlineBookingCapability({
        ONLINE_BOOKING_ENABLED: "false",
      }),
    ).toMatchObject({
      available: false,
      state: "disabled",
    });
  });
});
