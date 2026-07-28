// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  createOwner: vi.fn(),
  createMaintenance: vi.fn(),
  releaseOwner: vi.fn(),
  releaseMaintenance: vi.fn(),
  createBooking: vi.fn(),
  verifyPayment: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/admin/mutation-authorization", () => ({
  authorizeAdminMutation: mocks.authorize,
}));
vi.mock("@/lib/admin/mutations", () => ({
  createOwnerBlock: mocks.createOwner,
  createMaintenanceBlock: mocks.createMaintenance,
  releaseOwnerBlock: mocks.releaseOwner,
  releaseMaintenanceBlock: mocks.releaseMaintenance,
  createManualBooking: mocks.createBooking,
  verifyManualPayment: mocks.verifyPayment,
}));

import {
  createMaintenanceBlockAction,
  createOwnerBlockAction,
  releaseMaintenanceBlockAction,
  releaseOwnerBlockAction,
} from "@/app/admin/(protected)/actions/inventory";
import { createManualBookingAction } from "@/app/admin/(protected)/actions/manual-bookings";
import { verifyManualPaymentAction } from "@/app/admin/(protected)/actions/manual-payments";
import {
  createManualBookingSchema,
  verifyManualPaymentSchema,
} from "@/lib/admin/mutation-schemas";

const requestId = "11111111-1111-4111-8111-111111111111";
const blockInput = {
  firstBlockedDate: "2040-01-01",
  lastBlockedDate: "2040-01-02",
  requestId,
  reason: "owner_use" as const,
  internalNote: "  ",
};
const blockResult = {
  result: "block_created" as const,
  reservationType: "owner_block" as const,
  status: "active" as const,
  firstBlockedDate: "2040-01-01",
  lastBlockedDate: "2040-01-02",
  applied: true,
};
const manualBookingInput = {
  checkInDate: "2040-02-01",
  customerName: "  Guest  ",
  customerPhone: "+91 98765 43210",
  customerEmail: " GUEST@EXAMPLE.COM ",
  guestCount: 4,
  overnightGuestCount: 2,
  specialRequests: " ",
  manualProvider: "manual_upi" as const,
  requestId,
};
const manualBookingResult = {
  result: "manual_booking_created" as const,
  bookingReference: "SOE-20400201-ABCDEF12",
  bookingStatus: "payment_pending" as const,
  reservationStatus: "active" as const,
  paymentProvider: "manual_upi" as const,
  checkInAt: "2040-02-01T05:30:00.000Z",
  checkOutAt: "2040-02-02T04:30:00.000Z",
  totalAmountPaise: 1500000,
  advanceAmountPaise: 500000,
  balanceAmountPaise: 1000000,
  currency: "INR",
  holdExpiresAt: "2040-02-01T06:00:00.000Z",
  applied: true,
};
const manualPaymentInput = {
  bookingReference: "SOE-20400201-ABCDEF12",
  externalReference: " upi/ref-001 ",
  observedAmountPaise: 500000,
  observedCurrency: " inr ",
  requestId,
  operatorNote: " ",
  evidenceDescriptor: " receipt sighted ",
};
const confirmedResult = {
  result: "confirmed" as const,
  bookingReference: "SOE-20400201-ABCDEF12",
  bookingStatus: "confirmed" as const,
  reservationType: "confirmed_booking" as const,
  reservationStatus: "active" as const,
  paymentStatus: "manually_verified" as const,
  manualProvider: "manual_upi" as const,
  expectedAmountPaise: 500000,
  observedAmountPaise: 500000,
  currency: "INR",
  applied: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorize.mockResolvedValue(undefined);
  mocks.createOwner.mockResolvedValue(blockResult);
  mocks.createMaintenance.mockResolvedValue({
    ...blockResult,
    reservationType: "maintenance_block",
  });
  mocks.releaseOwner.mockResolvedValue({ ...blockResult, result: "block_released", status: "released" });
  mocks.releaseMaintenance.mockResolvedValue({
    ...blockResult,
    result: "block_released",
    reservationType: "maintenance_block",
    status: "released",
  });
  mocks.createBooking.mockResolvedValue(manualBookingResult);
  mocks.verifyPayment.mockResolvedValue(confirmedResult);
});

describe("Phase 5B action ordering and roles", () => {
  it("authorizes owner creation before invoking its exact wrapper", async () => {
    await expect(createOwnerBlockAction(blockInput)).resolves.toEqual({ ok: true, data: blockResult });
    expect(mocks.authorize).toHaveBeenCalledWith(["admin", "super_admin"]);
    expect(mocks.createOwner).toHaveBeenCalledWith(expect.objectContaining({
      requestId,
      internalNote: null,
    }));
    expect(mocks.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createOwner.mock.invocationCallOrder[0],
    );
  });

  it("permits every active role for maintenance creation and release", async () => {
    const input = { ...blockInput, reason: "maintenance" as const };
    await createMaintenanceBlockAction(input);
    await releaseMaintenanceBlockAction({
      reservationId: "22222222-2222-4222-8222-222222222222",
      requestId,
      reason: "corrected",
      internalNote: null,
    });
    expect(mocks.authorize).toHaveBeenNthCalledWith(1, ["operations", "admin", "super_admin"]);
    expect(mocks.authorize).toHaveBeenNthCalledWith(2, ["operations", "admin", "super_admin"]);
  });

  it("requires admin or super-admin for owner release and payment verification", async () => {
    await releaseOwnerBlockAction({
      reservationId: "22222222-2222-4222-8222-222222222222",
      requestId,
      reason: "corrected",
      internalNote: null,
    });
    await verifyManualPaymentAction(manualPaymentInput);
    expect(mocks.authorize).toHaveBeenNthCalledWith(1, ["admin", "super_admin"]);
    expect(mocks.authorize).toHaveBeenNthCalledWith(2, ["admin", "super_admin"]);
  });

  it("never invokes an RPC wrapper after authorization rejection", async () => {
    mocks.authorize.mockRejectedValueOnce(new Error("private auth detail"));
    const result = await createOwnerBlockAction(blockInput);
    expect(result).toEqual({
      ok: false,
      error: { code: "operation_failed", message: "The operation could not be completed." },
    });
    expect(mocks.createOwner).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("private auth detail");
  });

  it("validates before wrapper invocation and returns bounded field errors", async () => {
    const result = await createOwnerBlockAction({ ...blockInput, lastBlockedDate: "2039-12-01" });
    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.error.code).toBe("invalid_input");
    expect(mocks.createOwner).not.toHaveBeenCalled();
  });
});

describe("Phase 5B normalization and safe results", () => {
  it("preserves the request UUID and normalizes customer inputs", async () => {
    await createManualBookingAction(manualBookingInput);
    expect(mocks.createBooking).toHaveBeenCalledWith(expect.objectContaining({
      requestId,
      customerName: "Guest",
      customerPhone: "+919876543210",
      customerEmail: "guest@example.com",
      specialRequests: null,
    }));
  });

  it("rejects unknown price and status inputs", () => {
    expect(createManualBookingSchema.safeParse({ ...manualBookingInput, currency: "INR" }).success)
      .toBe(false);
    expect(verifyManualPaymentSchema.safeParse({ ...manualPaymentInput, paymentStatus: "verified" }).success)
      .toBe(false);
  });

  it("rejects invalid provider, phone, guest counts, and overnight overflow", () => {
    expect(createManualBookingSchema.safeParse({ ...manualBookingInput, manualProvider: "razorpay" }).success)
      .toBe(false);
    expect(createManualBookingSchema.safeParse({ ...manualBookingInput, customerPhone: "123" }).success)
      .toBe(false);
    expect(createManualBookingSchema.safeParse({
      ...manualBookingInput,
      customerPhone: "+91+9876543210",
    }).success).toBe(false);
    expect(createManualBookingSchema.safeParse({
      ...manualBookingInput,
      customerPhone: "91+9876543210",
    }).success).toBe(false);
    expect(createManualBookingSchema.safeParse({ ...manualBookingInput, guestCount: 41 }).success)
      .toBe(false);
    expect(createManualBookingSchema.safeParse({
      ...manualBookingInput,
      guestCount: 2,
      overnightGuestCount: 3,
    }).success).toBe(false);
  });

  it("normalizes manual payment reference, currency, and empty note", async () => {
    await verifyManualPaymentAction(manualPaymentInput);
    expect(mocks.verifyPayment).toHaveBeenCalledWith(expect.objectContaining({
      requestId,
      externalReference: "UPI/REF-001",
      observedCurrency: "INR",
      operatorNote: null,
      evidenceDescriptor: "receipt sighted",
    }));
  });

  it("rejects noncanonical references, unsafe amounts, characters, and evidence URLs", () => {
    expect(verifyManualPaymentSchema.safeParse({ ...manualPaymentInput, bookingReference: "Priyanshu" }).success)
      .toBe(false);
    expect(verifyManualPaymentSchema.safeParse({ ...manualPaymentInput, externalReference: "bad value" }).success)
      .toBe(false);
    expect(verifyManualPaymentSchema.safeParse({ ...manualPaymentInput, observedAmountPaise: 1.5 }).success)
      .toBe(false);
    expect(verifyManualPaymentSchema.safeParse({
      ...manualPaymentInput,
      observedAmountPaise: Number.MAX_SAFE_INTEGER + 1,
    }).success).toBe(false);
    expect(verifyManualPaymentSchema.safeParse({
      ...manualPaymentInput,
      evidenceDescriptor: "see https://example.test/private",
    }).success).toBe(false);
  });

  it("returns reconciliation as a successful safe outcome", async () => {
    mocks.verifyPayment.mockResolvedValueOnce({
      ...confirmedResult,
      result: "reconciliation_required",
      bookingStatus: "expired",
      reservationType: "manual_booking",
      reservationStatus: "expired",
      paymentStatus: "reconciliation_required",
    });
    const result = await verifyManualPaymentAction(manualPaymentInput);
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/externalReference|operatorNote|evidenceDescriptor|requestId/);
  });

  it("maps known database errors without returning raw details or hints", async () => {
    mocks.verifyPayment.mockRejectedValueOnce({
      message: "payment_reference_conflict",
      details: "private constraint",
      hint: "private hint",
    });
    const result = await verifyManualPaymentAction(manualPaymentInput);
    expect(result).toEqual({
      ok: false,
      error: {
        code: "payment_reference_conflict",
        message: "That payment reference has already been recorded.",
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/constraint|hint/);
  });
});

describe("Phase 5B targeted revalidation", () => {
  it("revalidates only dashboard for inventory while no inventory page exists", async () => {
    await createOwnerBlockAction(blockInput);
    expect(mocks.revalidate).toHaveBeenCalledTimes(1);
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("does not revalidate an exact replay", async () => {
    mocks.createOwner.mockResolvedValueOnce({ ...blockResult, applied: false });
    await createOwnerBlockAction(blockInput);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("revalidates booking, payment, and dashboard after manual booking application", async () => {
    await createManualBookingAction(manualBookingInput);
    expect(mocks.revalidate.mock.calls.map(([path]) => path)).toEqual([
      "/admin/bookings",
      "/admin/payments",
      "/admin/dashboard",
    ]);
  });

  it("revalidates notifications only for confirmed manual payments", async () => {
    await verifyManualPaymentAction(manualPaymentInput);
    const paths = mocks.revalidate.mock.calls.map(([path]) => path);
    expect(paths).toContain("/admin/notifications");
    expect(paths).not.toContain("/admin/recovery");
  });

  it("revalidates recovery only for reconciliation outcomes", async () => {
    mocks.verifyPayment.mockResolvedValueOnce({
      ...confirmedResult,
      result: "reconciliation_required",
      bookingStatus: "expired",
      reservationType: "manual_booking",
      reservationStatus: "expired",
      paymentStatus: "reconciliation_required",
    });
    await verifyManualPaymentAction(manualPaymentInput);
    const paths = mocks.revalidate.mock.calls.map(([path]) => path);
    expect(paths).toContain("/admin/recovery");
    expect(paths).not.toContain("/admin/notifications");
  });
});

describe("Phase 5B source boundaries", () => {
  const actionPaths = [
    "src/app/admin/(protected)/actions/inventory.ts",
    "src/app/admin/(protected)/actions/manual-bookings.ts",
    "src/app/admin/(protected)/actions/manual-payments.ts",
  ];
  const libraryPaths = [
    "src/lib/admin/mutation-authorization.ts",
    "src/lib/admin/mutation-errors.ts",
    "src/lib/admin/mutation-schemas.ts",
    "src/lib/admin/mutation-types.ts",
    "src/lib/admin/mutations.ts",
    "src/lib/admin/request-integrity.ts",
  ];

  it("marks every action module use-server and every support module server-only", () => {
    for (const path of actionPaths) expect(readFileSync(path, "utf8")).toMatch(/^"use server";/);
    for (const path of libraryPaths) expect(readFileSync(path, "utf8")).toContain('import "server-only"');
  });

  it("contains no service-role mutation import, dynamic RPC dispatch, or direct table write", () => {
    const source = [...actionPaths, ...libraryPaths].map((path) => readFileSync(path, "utf8")).join("\n");
    expect(source).not.toMatch(/service-role|createServiceRoleClient|@\/lib\/admin\/database/);
    expect(source).not.toMatch(/\.from\s*\(/);
    expect(source).not.toMatch(/rpc\s*\(\s*[a-zA-Z_$]/);
  });

  it("exports only the six approved actions and no cancellation, refund, or resolution action", () => {
    const source = actionPaths.map((path) => readFileSync(path, "utf8")).join("\n");
    expect(source.match(/export async function \w+Action/g)).toHaveLength(6);
    expect(source).not.toMatch(/cancel|refund|resolveReconciliation/i);
  });

  it("does not modify Phase 5A GET routes or existing login/logout actions", () => {
    const tracked = [
      "src/app/admin/actions.ts",
      "src/app/admin/login/actions.ts",
      "src/app/api/admin/bookings/route.ts",
      "src/app/api/admin/payments/route.ts",
      "src/app/api/admin/recovery/route.ts",
    ];
    for (const path of tracked) expect(readFileSync(path, "utf8")).not.toContain("Phase 5B");
  });
});
