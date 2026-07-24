// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getActiveAdmin: vi.fn(),
  listAdminBookings: vi.fn(),
  getAdminBookingDetail: vi.fn(),
  listAdminPayments: vi.fn(),
  listAdminNotifications: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ getActiveAdmin: mocks.getActiveAdmin }));
vi.mock("@/lib/admin/database", () => ({
  listAdminBookings: mocks.listAdminBookings,
  getAdminBookingDetail: mocks.getAdminBookingDetail,
  listAdminPayments: mocks.listAdminPayments,
  listAdminNotifications: mocks.listAdminNotifications,
}));

import { NextRequest } from "next/server";
import * as bookingListRoute from "@/app/api/admin/bookings/route";
import * as bookingDetailRoute from "@/app/api/admin/bookings/[bookingReference]/route";
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getActiveAdmin.mockResolvedValue(activeAdmin);
  mocks.listAdminBookings.mockResolvedValue(emptyPage);
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
        "http://localhost/api/admin/bookings?page=2&pageSize=10&bookingStatus=held&search=SOE-2026&sort=oldest",
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(mocks.listAdminBookings).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      pageSize: 10,
      bookingStatus: "held",
      search: "SOE-2026",
      sort: "oldest",
    }));
  });

  it("resolves booking detail only by safe public reference and returns no secret fields", async () => {
    mocks.getAdminBookingDetail.mockResolvedValue({
      booking: { bookingReference: "SOE-20260725-ABCD1234", advanceAmountPaise: 500000 },
      timeline: [],
      payments: [],
      notifications: [],
    });
    const response = await bookingDetailRoute.GET(
      new Request("http://localhost/api/admin/bookings/SOE-20260725-ABCD1234"),
      { params: Promise.resolve({ bookingReference: "SOE-20260725-ABCD1234" }) },
    );
    const serialized = JSON.stringify(await response.json());
    expect(response.status).toBe(200);
    expect(serialized).toContain("SOE-20260725-ABCD1234");
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
