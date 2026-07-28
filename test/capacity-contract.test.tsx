import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/admin/(protected)/actions/manual-bookings", () => ({
  createManualBookingAction: vi.fn(),
}));
vi.mock("@/components/booking/turnstile-widget", () => ({
  TurnstileWidget: () => <div data-testid="turnstile" />,
}));

import { BookingForm } from "@/components/booking/booking-form";
import { ManualBookingForm } from "@/components/admin/operations/manual-booking-form";
import {
  OVERNIGHT_GUEST_CAPACITY,
  STANDARD_DAY_EVENT_CAPACITY,
} from "@/config/public-information";
import { createManualBookingSchema } from "@/lib/admin/mutation-schemas";
import { holdRequestSchema } from "@/lib/booking/schemas";

const publicRequest = {
  requestId: "31000000-0000-4000-8000-000000000001",
  propertySlug: "silver-oak-estate",
  checkInDate: "2026-08-01",
  customerName: "Capacity Guest",
  customerPhone: "+919999000001",
  turnstileToken: "test-token",
};

const manualRequest = {
  checkInDate: "2026-08-01",
  customerName: "Capacity Guest",
  customerPhone: "+919999000001",
  customerEmail: null,
  specialRequests: null,
  manualProvider: "manual_upi" as const,
  requestId: "32000000-0000-4000-8000-000000000001",
};

describe("verified booking capacity contract", () => {
  it("keeps the executable limits at 40 standard daytime and 10 overnight", () => {
    expect(STANDARD_DAY_EVENT_CAPACITY).toBe(40);
    expect(OVERNIGHT_GUEST_CAPACITY).toBe(10);
  });

  it("accepts the exact public and administrator boundaries", () => {
    expect(holdRequestSchema.safeParse({
      ...publicRequest,
      guestCount: 40,
      overnightGuestCount: 10,
    }).success).toBe(true);
    expect(createManualBookingSchema.safeParse({
      ...manualRequest,
      guestCount: 40,
      overnightGuestCount: 10,
    }).success).toBe(true);
  });

  it("rejects values above either boundary", () => {
    expect(holdRequestSchema.safeParse({
      ...publicRequest,
      guestCount: 41,
      overnightGuestCount: 10,
    }).success).toBe(false);
    expect(holdRequestSchema.safeParse({
      ...publicRequest,
      guestCount: 40,
      overnightGuestCount: 11,
    }).success).toBe(false);
    expect(createManualBookingSchema.safeParse({
      ...manualRequest,
      guestCount: 41,
      overnightGuestCount: 10,
    }).success).toBe(false);
    expect(createManualBookingSchema.safeParse({
      ...manualRequest,
      guestCount: 40,
      overnightGuestCount: 11,
    }).success).toBe(false);
  });

  it("preserves the rule that overnight guests cannot exceed total guests", () => {
    expect(holdRequestSchema.safeParse({
      ...publicRequest,
      guestCount: 5,
      overnightGuestCount: 6,
    }).success).toBe(false);
    expect(createManualBookingSchema.safeParse({
      ...manualRequest,
      guestCount: 5,
      overnightGuestCount: 6,
    }).success).toBe(false);
  });

  it("exposes the same limits in the public booking form", () => {
    render(
      <BookingForm
        checkInDate="2026-08-01"
        guestCount={40}
        overnightGuestCount={10}
        onGuestCountChange={vi.fn()}
        onOvernightGuestCountChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Total Guests")).toHaveAttribute("max", "40");
    expect(screen.getByLabelText("Overnight Guests")).toHaveAttribute("max", "10");
    expect(screen.getByText(/Maximum 40 guests allowed for standard events/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum 10 guests can stay overnight/i)).toBeInTheDocument();
  });

  it("exposes the same limits in the administrator manual-booking form", () => {
    render(<ManualBookingForm />);

    expect(screen.getByLabelText("Total guest count")).toHaveAttribute("max", "40");
    expect(screen.getByLabelText("Overnight guest count")).toHaveAttribute("max", "10");
  });
});
