import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));
vi.mock("@/components/booking/availability-flow", () => ({
  AvailabilityFlow: ({ onlineBookingAvailable }: { onlineBookingAvailable: boolean }) => (
    <div data-testid="availability-flow">
      {onlineBookingAvailable ? "Online booking enabled" : "Assisted booking only"}
    </div>
  ),
}));

import AvailabilityPage from "@/app/(marketing)/availability/page";
import BookPage from "@/app/(marketing)/book/page";
import { BookingUnavailable } from "@/components/booking/booking-unavailable";
import {
  evaluateAvailabilityCapability,
  evaluateOnlineBookingCapability,
} from "@/lib/capabilities/online-booking";

const originalEnvironment = { ...process.env };

function completeBookingEnvironment(overrides: Record<string, string | undefined> = {}) {
  return {
    ONLINE_BOOKING_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "turnstile-site-key",
    TURNSTILE_SECRET_KEY: "turnstile-secret-key",
    BOOKING_TOKEN_SECRET: "booking-token-secret",
    RAZORPAY_KEY_ID: "rzp_test_key",
    RAZORPAY_KEY_SECRET: "razorpay-secret",
    RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    ...overrides,
  };
}

afterEach(() => {
  process.env = { ...originalEnvironment };
  vi.restoreAllMocks();
});

describe("availability capability", () => {
  it("is ready with only the public Supabase URL and anon key", () => {
    expect(
      evaluateAvailabilityCapability({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toEqual({
      available: true,
      state: "ready",
      missingFields: [],
    });
  });

  it("does not require the service-role key for the public calendar", () => {
    expect(
      evaluateAvailabilityCapability({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVICE_ROLE_KEY: undefined,
      }).available,
    ).toBe(true);
  });

  it("fails closed and reports only missing public availability fields", () => {
    expect(
      evaluateAvailabilityCapability({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      }),
    ).toEqual({
      available: false,
      state: "incomplete",
      missingFields: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    });
  });
});

describe("online booking capability", () => {
  it("stays disabled unless the explicit kill switch is enabled", () => {
    expect(
      evaluateOnlineBookingCapability(
        completeBookingEnvironment({ ONLINE_BOOKING_ENABLED: "false" }),
      ),
    ).toEqual({
      available: false,
      state: "disabled",
      missingFields: [],
    });
  });

  it("remains disabled in production even if its test-mode configuration is complete", () => {
    expect(
      evaluateOnlineBookingCapability(
        completeBookingEnvironment({ APP_ENV: "production" }),
      ),
    ).toEqual({
      available: false,
      state: "disabled",
      missingFields: [],
    });
  });

  it("fails closed and reports only missing field names", () => {
    const environment = completeBookingEnvironment({
      TURNSTILE_SECRET_KEY: undefined,
      RAZORPAY_KEY_SECRET: "<YOUR_RAZORPAY_SECRET>",
    });

    const result = evaluateOnlineBookingCapability(environment);

    expect(result.available).toBe(false);
    expect(result.state).toBe("incomplete");
    expect(result.missingFields).toEqual([
      "TURNSTILE_SECRET_KEY",
      "RAZORPAY_KEY_SECRET",
    ]);
    expect(JSON.stringify(result)).not.toContain("YOUR_RAZORPAY_SECRET");
  });

  it("becomes ready only with the complete booking stack", () => {
    expect(evaluateOnlineBookingCapability(completeBookingEnvironment())).toEqual({
      available: true,
      state: "ready",
      missingFields: [],
    });
  });
});

describe("assisted booking fallback", () => {
  it("shows direct contact options and no payment claim", () => {
    render(<BookingUnavailable />);

    expect(screen.getByRole("heading", { name: "Online reservations are being prepared" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Call \+91 86794 70955/ })).toHaveAttribute("href", "tel:+918679470955");
    expect(screen.getByRole("link", { name: "WhatsApp the team" })).toHaveAttribute("href", "https://wa.me/918679470955");
    expect(screen.getByText(/No online payment is being collected/)).toBeInTheDocument();
  });

  it("shows the calendar without a service-role key while booking stays disabled", () => {
    process.env = {
      ...originalEnvironment,
      ...completeBookingEnvironment({
        ONLINE_BOOKING_ENABLED: "false",
        SUPABASE_SERVICE_ROLE_KEY: undefined,
      }),
    };

    const { unmount } = render(<AvailabilityPage />);
    expect(screen.getByTestId("availability-flow")).toHaveTextContent("Assisted booking only");
    expect(screen.queryByRole("heading", { name: "Online reservations are being prepared" })).not.toBeInTheDocument();

    unmount();
    render(<BookPage />);
    expect(screen.getByRole("heading", { name: "Online reservations are being prepared" })).toBeInTheDocument();
    expect(screen.queryByText("Enter Your Details")).not.toBeInTheDocument();
  });

  it("keeps the availability fallback when its public Supabase capability is incomplete", () => {
    process.env = {
      ...originalEnvironment,
      ...completeBookingEnvironment({
        ONLINE_BOOKING_ENABLED: "false",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      }),
    };

    render(<AvailabilityPage />);
    expect(screen.getByRole("heading", { name: "Online reservations are being prepared" })).toBeInTheDocument();
    expect(screen.queryByTestId("availability-flow")).not.toBeInTheDocument();
  });
});
