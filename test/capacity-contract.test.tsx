import fs from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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

  it("wires both forms to the shared executable limits", () => {
    const publicForm = fs.readFileSync(
      path.join(process.cwd(), "src/components/booking/booking-form.tsx"),
      "utf-8",
    );
    const adminForm = fs.readFileSync(
      path.join(process.cwd(), "src/components/admin/operations/manual-booking-form.tsx"),
      "utf-8",
    );

    for (const source of [publicForm, adminForm]) {
      expect(source).toContain("STANDARD_DAY_EVENT_CAPACITY");
      expect(source).toContain("OVERNIGHT_GUEST_CAPACITY");
      expect(source).not.toContain("max={30}");
      expect(source).not.toContain("max={8}");
    }

    expect(publicForm).toContain("Maximum 40 guests allowed for standard events/day access.");
    expect(publicForm).toContain("Maximum 10 guests can stay overnight.");
    expect(adminForm).toContain("Total guests must be between 1 and ${STANDARD_DAY_EVENT_CAPACITY}.");
    expect(adminForm).toContain("Overnight guests must be between 0 and ${OVERNIGHT_GUEST_CAPACITY}.");
  });
});
