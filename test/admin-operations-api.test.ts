// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getActiveAdmin: vi.fn(),
  requireAdminRole: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  listAdminBookings: vi.fn(),
  getAdminBookingDetail: vi.fn(),
  listAdminPayments: vi.fn(),
  listAdminNotifications: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  getActiveAdmin: mocks.getActiveAdmin,
  requireAdminRole: mocks.requireAdminRole,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/admin/database", () => ({
  listAdminBookings: mocks.listAdminBookings,
  getAdminBookingDetail: mocks.getAdminBookingDetail,
  listAdminPayments: mocks.listAdminPayments,
  listAdminNotifications: mocks.listAdminNotifications,
}));

import { NextRequest } from "next/server";
import * as bookingListRoute from "@/app/api/admin/bookings/route";
import * as bookingDetailRoute from "@/app/api/admin/bookings/[bookingReference]/route";
import AdminBookingDetailPage from "@/app/admin/(protected)/bookings/[bookingReference]/page";
import * as paymentsRoute from "@/app/api/admin/payments/route";
import * as recoveryRoute from "@/app/api/admin/recovery/route";
import * as notificationRoute from "@/app/api/admin/notifications/route";

const activeAdmin = {
  id: "admin-1",
  authUserId: "auth-1",
  role: "operations",
  name: "Operations",
  email: "ops@example.test",
};

const emptyPage = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
const validReference = "SOE-20260725-ABCD1234";
const invalidDetailReferences = [
  "Priyanshu",
  "9876543210",
  "user@example.com",
  "SOE-20260724-ABC",
  "SOE-20260724-abcdef12",
  `x${validReference}`,
  `${validReference}x`,
];

function detailFixture() {
  return {
    booking: {
      bookingReference: validReference,
      customerNameMasked: "P******",
      customerEmailMasked: "g***@example.test",
      customerPhoneMasked: "***3210",
      checkInAt: "2026-07-25T05:30:00.000Z",
      checkOutAt: "2026-07-26T04:30:00.000Z",
      bookingStatus: "held",
      holdExpiresAt: null,
      reservationStatus: "active",
      reservationType: "temporary_hold",
      advanceAmountPaise: 500000,
      totalAmountPaise: 2000000,
      balanceAmountPaise: 1500000,
      guestCount: 12,
      overnightGuestCount: 4,
      paymentProvider: "razorpay",
      paymentStatus: "pending",
      recoveryState: null,
      createdAt: "2026-07-24T05:30:00.000Z",
      updatedAt: "2026-07-24T05:30:00.000Z",
    },
    holdEligible: true,
    authoritativeReservationExists: true,
    inventoryConverted: false,
    moneyCaptured: false,
    moneyVerified: false,
    interventionRequired: false,
    timeline: [],
    payments: [],
    notifications: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getActiveAdmin.mockResolvedValue(activeAdmin);
  mocks.requireAdminRole.mockResolvedValue(activeAdmin);
  mocks.listAdminBookings.mockResolvedValue(emptyPage);
  mocks.getAdminBookingDetail.mockResolvedValue(null);
  mocks.listAdminPayments.mockResolvedValue(emptyPage);
  mocks.listAdminNotifications.mockResolvedValue(emptyPage);
});

describe("Phase 5A administrator APIs", () => {
  it.each([
    ["unauthenticated", null],
    ["authenticated non-admin", null],
    ["inactive administrator", null],
  ])("rejects an %s session before privileged data access", async (_label, membership) => {
    mocks.getActiveAdmin.mockResolvedValue(membership);
    const response = await bookingListRoute.GET(
      new NextRequest("http://localhost/api/admin/bookings"),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(mocks.listAdminBookings).not.toHaveBeenCalled();
  });

  it("allows an active operations administrator with server-owned filters and pagination", async () => {
    const response = await bookingListRoute.GET(
      new NextRequest(
        `http://localhost/api/admin/bookings?page=2&pageSize=10&bookingStatus=held&bookingReference=${validReference}&sort=oldest`,
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(mocks.listAdminBookings).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      pageSize: 10,
      bookingStatus: "held",
      bookingReference: validReference,
      sort: "oldest",
    }));
  });

  it("does not pass PII-like URL values to the service-role list query", async () => {
    const response = await bookingListRoute.GET(
      new NextRequest("http://localhost/api/admin/bookings?bookingReference=guest%40example.com&page=999999999"),
    );
    expect(response.status).toBe(200);
    expect(mocks.listAdminBookings).toHaveBeenCalledWith(expect.objectContaining({
      bookingReference: undefined,
      page: 1,
    }));
    expect(JSON.stringify(await response.json())).not.toContain("guest@example.com");
  });

  it("resolves booking detail only by safe public reference and returns no secret fields", async () => {
    mocks.getAdminBookingDetail.mockResolvedValue(detailFixture());
    const response = await bookingDetailRoute.GET(
      new Request(`http://localhost/api/admin/bookings/${validReference}`),
      { params: Promise.resolve({ bookingReference: validReference }) },
    );
    const serialized = JSON.stringify(await response.json());
    expect(response.status).toBe(200);
    expect(mocks.getAdminBookingDetail).toHaveBeenCalledWith(validReference);
    expect(serialized).toContain(validReference);
    for (const forbidden of [
      "hold_token_nonce",
      "request_fingerprint",
      "public_confirmation_token",
      "service_role",
      "webhook_signature",
      "payload_hash",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("renders booking detail pages only for canonical public references", async () => {
    mocks.getAdminBookingDetail.mockResolvedValue(detailFixture());
    const page = await AdminBookingDetailPage({
      params: Promise.resolve({ bookingReference: validReference }),
    });

    expect(mocks.requireAdminRole).toHaveBeenCalledWith("operations", "admin", "super_admin");
    expect(mocks.getAdminBookingDetail).toHaveBeenCalledWith(validReference);
    expect(JSON.stringify(page)).toContain(validReference);
  });

  it("returns the same safe not-found API response for invalid and nonexistent detail references", async () => {
    for (const bookingReference of invalidDetailReferences) {
      vi.clearAllMocks();
      mocks.getActiveAdmin.mockResolvedValue(activeAdmin);
      mocks.getAdminBookingDetail.mockResolvedValue(null);
      const response = await bookingDetailRoute.GET(
        new Request(`http://localhost/api/admin/bookings/${encodeURIComponent(bookingReference)}`),
        { params: Promise.resolve({ bookingReference }) },
      );
      const serialized = JSON.stringify(await response.json());
      expect(response.status).toBe(404);
      expect(serialized).toBe(JSON.stringify({ error: "not_found" }));
      expect(serialized).not.toContain(bookingReference);
      expect(mocks.getAdminBookingDetail).not.toHaveBeenCalled();
    }

    const response = await bookingDetailRoute.GET(
      new Request(`http://localhost/api/admin/bookings/${validReference}`),
      { params: Promise.resolve({ bookingReference: validReference }) },
    );
    expect(response.status).toBe(404);
    expect(JSON.stringify(await response.json())).toBe(JSON.stringify({ error: "not_found" }));
    expect(mocks.getAdminBookingDetail).toHaveBeenCalledWith(validReference);
  });

  it("renders safe not-found pages for invalid and nonexistent detail references", async () => {
    for (const bookingReference of invalidDetailReferences) {
      vi.clearAllMocks();
      mocks.requireAdminRole.mockResolvedValue(activeAdmin);
      mocks.getAdminBookingDetail.mockResolvedValue(null);
      await expect(AdminBookingDetailPage({
        params: Promise.resolve({ bookingReference }),
      })).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mocks.requireAdminRole).toHaveBeenCalledWith("operations", "admin", "super_admin");
      expect(mocks.getAdminBookingDetail).not.toHaveBeenCalled();
      expect(JSON.stringify(mocks.notFound.mock.calls)).not.toContain(bookingReference);
    }

    await expect(AdminBookingDetailPage({
      params: Promise.resolve({ bookingReference: validReference }),
    })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.getAdminBookingDetail).toHaveBeenCalledWith(validReference);
  });

  it("independently authorizes the payments API and keeps it non-cacheable and GET-only", async () => {
    mocks.getActiveAdmin.mockResolvedValue(null);
    let response = await paymentsRoute.GET(
      new NextRequest("http://localhost/api/admin/payments"),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(mocks.listAdminPayments).not.toHaveBeenCalled();

    mocks.getActiveAdmin.mockResolvedValue(activeAdmin);
    response = await paymentsRoute.GET(
      new NextRequest("http://localhost/api/admin/payments?page=2&pageSize=10&paymentStatus=refund_pending"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(mocks.listAdminPayments).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      pageSize: 10,
      paymentStatus: "refund_pending",
    }));
    expect(paymentsRoute).not.toHaveProperty("POST");
    expect(paymentsRoute).not.toHaveProperty("PUT");
    expect(paymentsRoute).not.toHaveProperty("PATCH");
    expect(paymentsRoute).not.toHaveProperty("DELETE");
  });

  it("keeps recovery read-only and constrained to recovery states", async () => {
    const response = await recoveryRoute.GET(
      new NextRequest("http://localhost/api/admin/recovery"),
    );
    expect(response.status).toBe(200);
    expect(mocks.listAdminPayments).toHaveBeenCalledWith(expect.any(Object), true);
    expect(recoveryRoute).not.toHaveProperty("POST");
    expect(recoveryRoute).not.toHaveProperty("PATCH");
    expect(recoveryRoute).not.toHaveProperty("DELETE");
  });

  it("returns notification records without claiming queued delivery", async () => {
    mocks.listAdminNotifications.mockResolvedValue({
      ...emptyPage,
      items: [{
        status: "pending",
        deliveryLabel: "queued",
        deliveryNote: "Delivery not implemented in Phase 5A.",
      }],
    });
    const response = await notificationRoute.GET(
      new NextRequest("http://localhost/api/admin/notifications"),
    );
    expect(await response.json()).toMatchObject({
      items: [{ status: "pending", deliveryLabel: "queued" }],
    });
  });
});
