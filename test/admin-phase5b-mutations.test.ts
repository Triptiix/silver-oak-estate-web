// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import {
  createManualBooking,
  verifyManualPayment,
} from "@/lib/admin/mutations";

const requestId = "11111111-1111-4111-8111-111111111111";
const bookingInput = {
  checkInDate: "2040-02-01",
  customerName: "Guest",
  customerPhone: "+919876543210",
  customerEmail: null,
  guestCount: 2,
  overnightGuestCount: 0,
  specialRequests: null,
  manualProvider: "manual_upi" as const,
  requestId,
};
const paymentInput = {
  bookingReference: "SOE-20400201-ABCDEF12",
  externalReference: "UPI-REF-001",
  observedAmountPaise: 500000,
  observedCurrency: "INR",
  requestId,
  operatorNote: null,
  evidenceDescriptor: null,
};
const bookingRow = {
  result: "manual_booking_created",
  booking_reference: "SOE-20400201-ABCDEF12",
  booking_status: "payment_pending",
  reservation_status: "active",
  payment_provider: "manual_upi",
  check_in_at: "2040-02-01T05:30:00.000Z",
  check_out_at: "2040-02-02T04:30:00.000Z",
  total_amount_paise: 1500000,
  advance_amount_paise: 500000,
  balance_amount_paise: 1000000,
  currency: "INR",
  hold_expires_at: "2040-02-01T06:00:00.000Z",
  applied: true,
};
const paymentRow = {
  result: "confirmed",
  booking_reference: "SOE-20400201-ABCDEF12",
  booking_status: "confirmed",
  reservation_type: "confirmed_booking",
  reservation_status: "active",
  payment_status: "manually_verified",
  manual_provider: "manual_upi",
  expected_amount_paise: 500000,
  observed_amount_paise: 500000,
  currency: "INR",
  applied: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
});

function returns(row: unknown) {
  mocks.rpc.mockResolvedValueOnce({ data: row, error: null });
}

describe("Phase 5B manual-booking RPC parsing", () => {
  it("parses the initial manual-booking result", async () => {
    returns(bookingRow);
    await expect(createManualBooking(bookingInput)).resolves.toMatchObject({
      bookingStatus: "payment_pending",
      reservationStatus: "active",
      applied: true,
    });
  });

  it("parses an exact replay after expiry", async () => {
    returns({
      ...bookingRow,
      booking_status: "expired",
      reservation_status: "expired",
      applied: false,
    });
    await expect(createManualBooking(bookingInput)).resolves.toMatchObject({
      bookingStatus: "expired",
      reservationStatus: "expired",
      holdExpiresAt: bookingRow.hold_expires_at,
      applied: false,
    });
  });

  it("parses an exact replay after confirmation with cleared expiry", async () => {
    returns({
      ...bookingRow,
      booking_status: "confirmed",
      reservation_status: "active",
      hold_expires_at: null,
      applied: false,
    });
    await expect(createManualBooking(bookingInput)).resolves.toMatchObject({
      bookingStatus: "confirmed",
      holdExpiresAt: null,
      applied: false,
    });
  });

  it("parses a later checked-in replay state", async () => {
    returns({
      ...bookingRow,
      booking_status: "checked_in",
      reservation_status: "active",
      hold_expires_at: null,
      applied: false,
    });
    await expect(createManualBooking(bookingInput)).resolves.toMatchObject({
      bookingStatus: "checked_in",
    });
  });
});

describe("Phase 5B manual-payment RPC parsing", () => {
  it("parses reconciliation involving an OTA reservation", async () => {
    returns({
      ...paymentRow,
      result: "reconciliation_required",
      booking_status: "expired",
      reservation_type: "ota_booking",
      reservation_status: "cancelled",
      payment_status: "reconciliation_required",
    });
    await expect(verifyManualPayment(paymentInput)).resolves.toMatchObject({
      result: "reconciliation_required",
      reservationType: "ota_booking",
      reservationStatus: "cancelled",
    });
  });

  it("parses an exact replay after the booking checked in", async () => {
    returns({
      ...paymentRow,
      booking_status: "checked_in",
      applied: false,
    });
    await expect(verifyManualPayment(paymentInput)).resolves.toMatchObject({
      result: "confirmed",
      bookingStatus: "checked_in",
      paymentStatus: "manually_verified",
      applied: false,
    });
  });

  it("parses only approved later recovery states", async () => {
    for (const paymentStatus of ["refund_pending", "partially_refunded", "refunded"]) {
      returns({
        ...paymentRow,
        result: "reconciliation_required",
        booking_status: "expired",
        reservation_type: "manual_booking",
        reservation_status: "expired",
        payment_status: paymentStatus,
        applied: false,
      });
      await expect(verifyManualPayment(paymentInput)).resolves.toMatchObject({
        result: "reconciliation_required",
        paymentStatus,
      });
    }
  });
});

describe("Phase 5B RPC output failure boundaries", () => {
  it("fails closed on an unknown booking status", async () => {
    returns({ ...bookingRow, booking_status: "unknown_status" });
    await expect(createManualBooking(bookingInput)).rejects.toMatchObject({
      code: "operation_failed",
    });
  });

  it("fails closed on an unknown reservation type", async () => {
    returns({ ...paymentRow, reservation_type: "foreign_reservation" });
    await expect(verifyManualPayment(paymentInput)).rejects.toMatchObject({
      code: "operation_failed",
    });
  });

  it("fails closed on an unrelated payment status", async () => {
    returns({ ...paymentRow, payment_status: "pending" });
    await expect(verifyManualPayment(paymentInput)).rejects.toMatchObject({
      code: "operation_failed",
    });
  });

  it("fails closed when an internal UUID appears", async () => {
    returns({
      ...paymentRow,
      payment_id: "22222222-2222-4222-8222-222222222222",
    });
    await expect(verifyManualPayment(paymentInput)).rejects.toMatchObject({
      code: "operation_failed",
    });
  });

  it("fails closed when a required result field is missing", async () => {
    const missingCurrency: Partial<typeof paymentRow> = { ...paymentRow };
    delete missingCurrency.currency;
    returns(missingCurrency);
    await expect(verifyManualPayment(paymentInput)).rejects.toMatchObject({
      code: "operation_failed",
    });
  });

  it("throws a database error for safe action-level mapping", async () => {
    const databaseError = {
      message: "payment_reference_conflict",
      details: "private details",
    };
    mocks.rpc.mockResolvedValueOnce({ data: null, error: databaseError });
    await expect(verifyManualPayment(paymentInput)).rejects.toBe(databaseError);
  });
});

describe("Phase 5B mutation source boundary", () => {
  it("uses the authenticated session-scoped client", async () => {
    returns(bookingRow);
    await createManualBooking(bookingInput);
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("retains the exact hard-coded manual RPC names", async () => {
    returns(bookingRow);
    await createManualBooking(bookingInput);
    returns(paymentRow);
    await verifyManualPayment(paymentInput);
    expect(mocks.rpc.mock.calls.map(([name]) => name)).toEqual([
      "create_admin_manual_booking",
      "verify_admin_manual_payment",
    ]);
  });

  it("contains six hard-coded RPCs and no direct table mutation", () => {
    const source = readFileSync("src/lib/admin/mutations.ts", "utf8");
    expect(source.match(/client\.rpc\("[a-z_]+"/g)).toHaveLength(6);
    expect(source).toContain('from "@/lib/supabase/server"');
    expect(source).not.toMatch(/service-role|createServiceRoleClient/);
    expect(source).not.toMatch(/\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/);
  });
});
