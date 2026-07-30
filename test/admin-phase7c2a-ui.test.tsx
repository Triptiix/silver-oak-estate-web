import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: "operations" as "operations" | "admin" | "super_admin",
  requireAdminRole: vi.fn(),
  listAdminBookings: vi.fn(),
  getAdminBookingDetail: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin", () => ({
  requireAdminRole: mocks.requireAdminRole,
}));
vi.mock("@/lib/admin/database", () => ({
  listAdminBookings: mocks.listAdminBookings,
  getAdminBookingDetail: mocks.getAdminBookingDetail,
}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/admin/(protected)/actions/manual-payments", () => ({
  verifyManualPaymentAction: vi.fn(),
}));
vi.mock("@/components/admin/admin-shell", () => ({
  AdminShell: ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </main>
  ),
}));

import AdminBookingDetailPage, {
  metadata as detailMetadata,
} from "@/app/admin/(protected)/bookings/[bookingReference]/page";
import AdminBookingsPage, {
  metadata as listMetadata,
} from "@/app/admin/(protected)/bookings/page";
import { AdminFilters } from "@/components/admin/admin-filters";
import { BookingTable } from "@/components/admin/booking-table";
import { NotificationTable } from "@/components/admin/notification-table";
import {
  buildAdminPaginationHref,
  Pagination,
} from "@/components/admin/pagination";
import { PaymentTable } from "@/components/admin/payment-table";
import { parseAdminListQuery } from "@/lib/admin/query";
import type {
  AdminBookingDetail,
  AdminBookingListItem,
  AdminNotificationItem,
  AdminPaymentItem,
} from "@/lib/admin/types";

const bookingReference = "SOE-20260725-ABCD1234";
const maskedBooking: AdminBookingListItem = {
  bookingReference,
  checkInAt: "2026-08-01T05:30:00.000Z",
  checkOutAt: "2026-08-02T04:30:00.000Z",
  customerNameMasked: "P******",
  customerEmailMasked: "g***@example.test",
  customerPhoneMasked: "***3210",
  bookingStatus: "payment_pending",
  holdExpiresAt: "2026-07-25T06:00:00.000Z",
  reservationStatus: "active",
  reservationType: "manual_booking",
  advanceAmountPaise: 500_000,
  paymentProvider: "manual_upi",
  paymentStatus: "pending",
  recoveryState: null,
  createdAt: "2026-07-24T05:30:00.000Z",
  updatedAt: "2026-07-25T05:45:00.000Z",
};

const payment: AdminPaymentItem = {
  bookingReference,
  provider: "manual_upi",
  providerOrderId: "ORDER-REFERENCE-LONG",
  providerPaymentId: "PAYMENT-REFERENCE-LONG",
  providerEventId: "EVENT-REFERENCE-LONG",
  amountPaise: 500_000,
  currency: "INR",
  status: "pending",
  verificationSource: null,
  recoveryReason: null,
  failureCode: null,
  orderCreatedAt: null,
  checkoutStartedAt: null,
  authorizedAt: null,
  capturedAt: null,
  verifiedAt: null,
  recoveryRequiredAt: null,
  createdAt: "2026-07-24T05:30:00.000Z",
  updatedAt: "2026-07-25T05:45:00.000Z",
};

const notification: AdminNotificationItem = {
  bookingReference,
  channel: "email",
  templateKey: "booking_confirmation",
  recipientMasked: "g***@example.test",
  status: "pending",
  deliveryLabel: "queued",
  deliveryNote: "Delivery not implemented in Phase 5A.",
  attemptCount: 0,
  createdAt: "2026-07-25T05:45:00.000Z",
  sentAt: null,
};

function detailFixture(): AdminBookingDetail {
  return {
    booking: {
      ...maskedBooking,
      totalAmountPaise: 2_000_000,
      balanceAmountPaise: 1_500_000,
      guestCount: 12,
      overnightGuestCount: 4,
    },
    holdEligible: false,
    authoritativeReservationExists: true,
    inventoryConverted: false,
    moneyCaptured: false,
    moneyVerified: false,
    interventionRequired: false,
    payments: [payment],
    notifications: [notification],
    timeline: [
      {
        kind: "booking",
        label: "Booking created",
        state: "payment_pending",
        occurredAt: "2026-07-24T05:30:00.000Z",
      },
      {
        kind: "payment",
        label: "Payment attempt created",
        state: "pending",
        occurredAt: "2026-07-25T05:45:00.000Z",
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = "operations";
  mocks.requireAdminRole.mockImplementation(async () => ({
    role: mocks.role,
    name: "Safe Administrator",
  }));
  mocks.listAdminBookings.mockResolvedValue({
    items: [maskedBooking],
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
  });
  mocks.getAdminBookingDetail.mockResolvedValue(detailFixture());
});

describe("Phase 7C.2A booking list", () => {
  it.each(["operations", "admin", "super_admin"] as const)(
    "keeps %s authorized and passes the normalized server query",
    async (role) => {
      mocks.role = role;
      const searchParams = {
        bookingStatus: "payment_pending",
        paymentStatus: "pending",
        recoveryState: "unsupported",
        bookingReference,
        page: "2",
        pageSize: "10",
        sort: "oldest",
      };

      render(
        await AdminBookingsPage({
          searchParams: Promise.resolve(searchParams),
        }),
      );

      expect(mocks.requireAdminRole).toHaveBeenCalledWith(
        "operations",
        "admin",
        "super_admin",
      );
      expect(mocks.listAdminBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingReference,
          bookingStatus: "payment_pending",
          paymentStatus: "pending",
          recoveryState: undefined,
          page: 2,
          pageSize: 10,
          sort: "oldest",
        }),
      );
      expect(screen.getByText(/This list contains no booking mutation controls/i))
        .toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /book now/i })).not.toBeInTheDocument();
    },
  );

  it("keeps safe metadata and ignores invalid reflected filter values", async () => {
    expect(listMetadata).toEqual({
      title: "Booking Operations | Silver Oak Estate",
    });

    render(
      await AdminBookingsPage({
        searchParams: Promise.resolve({
          bookingReference: "guest@example.com",
          bookingStatus: "private_status",
          paymentStatus: "private_payment",
          sort: "private_sort",
        }),
      }),
    );

    expect(screen.getByLabelText("Booking reference")).toHaveValue("");
    expect(screen.getByLabelText("Booking state")).toHaveValue("");
    expect(screen.getByLabelText("Payment state")).toHaveValue("");
    expect(screen.getByLabelText("Sort order")).toHaveValue("newest");
    expect(document.body).not.toHaveTextContent("guest@example.com");
    expect(document.body).not.toHaveTextContent("private_status");
  });
});

describe("Phase 7C.2A booking filters", () => {
  it("retains every validated field and preserves human labels with machine values", () => {
    const values = parseAdminListQuery({
      bookingReference,
      bookingStatus: "payment_pending",
      paymentStatus: "reconciliation_required",
      recoveryState: "refund_pending",
      checkInFrom: "2026-08-01",
      checkInTo: "2026-08-05",
      sort: "oldest",
      pageSize: "50",
      page: "3",
    });
    const { container } = render(
      <AdminFilters
        showBookingStatus
        showPaymentStatus
        showRecoveryState
        showDates
        showPageSize
        values={values}
        resetPath="/admin/bookings"
      />,
    );

    for (const name of [
      "bookingReference",
      "bookingStatus",
      "paymentStatus",
      "recoveryState",
      "checkInFrom",
      "checkInTo",
      "sort",
      "pageSize",
      "page",
    ]) {
      expect(container.querySelector(`[name="${name}"]`)).not.toBeNull();
    }
    expect(screen.getByLabelText("Booking reference")).toHaveValue(bookingReference);
    expect(screen.getByLabelText("Booking state")).toHaveValue("payment_pending");
    expect(screen.getByRole("option", { name: "Payment pending" })).toHaveValue(
      "payment_pending",
    );
    expect(
      within(screen.getByLabelText("Payment state")).getByRole("option", {
        name: "Reconciliation required",
      }),
    ).toHaveValue("reconciliation_required");
    expect(screen.getByText(/Full reference required/i)).toBeInTheDocument();
    expect(screen.getByText("SOE-YYYYMMDD-XXXXXXXX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply filters" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(screen.getByRole("link", { name: "Reset filters" })).toHaveAttribute(
      "href",
      "/admin/bookings",
    );
    expect(container.querySelectorAll("form")).toHaveLength(1);
    expect(container.querySelector('[name="customerName"]')).toBeNull();
    expect(container.querySelector('[name="email"]')).toBeNull();
    expect(container.querySelector('[name="phone"]')).toBeNull();
  });

  it("reflects a validated page size the select does not otherwise offer", () => {
    const values = parseAdminListQuery({ pageSize: "30" });
    expect(values.pageSize).toBe(30);

    render(<AdminFilters showPageSize values={values} />);

    const control = screen.getByLabelText("Results per page");
    expect(control).toHaveValue("30");
    expect(
      within(control).getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["10", "20", "30", "50"]);
  });
});

describe("Phase 7C.2A responsive booking records", () => {
  it("renders one accessible record with every required masked fact", () => {
    const { container } = render(<BookingTable items={[maskedBooking]} />);

    expect(screen.getByRole("list", {
      name: "Authorized booking operations records",
    })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("link", { name: bookingReference })).toHaveAttribute(
      "href",
      `/admin/bookings/${bookingReference}`,
    );
    expect(screen.getByText("P******")).toBeInTheDocument();
    expect(screen.getByText("***3210")).toBeInTheDocument();
    expect(screen.getByText("payment pending")).toBeInTheDocument();
    expect(screen.getByText("manual booking")).toBeInTheDocument();
    expect(screen.getByText("manual upi")).toBeInTheDocument();
    expect(screen.getByText(/Hold expiry:/)).toBeInTheDocument();
    expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("Priyanshu");
    expect(container.innerHTML).not.toContain("9876543210");
    expect(container.innerHTML).not.toContain(
      "10000000-0000-4000-8000-000000000001",
    );
    expect(screen.getByRole("link", { name: bookingReference }).className)
      .toContain("break-all");
  });

  it("omits hold expiry when absent and offers a safe empty reset", () => {
    const { rerender } = render(
      <BookingTable items={[{ ...maskedBooking, holdExpiresAt: null }]} />,
    );
    expect(screen.queryByText(/Hold expiry:/)).not.toBeInTheDocument();

    rerender(<BookingTable items={[]} />);
    expect(screen.getByText(/current server-side filters/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset booking filters" }))
      .toHaveAttribute("href", "/admin/bookings");
  });
});

describe("Phase 7C.2A pagination", () => {
  it("preserves safe filters, drops unsupported values and encodes query values", () => {
    const href = buildAdminPaginationHref("/admin/bookings", {
      bookingReference,
      bookingStatus: "payment_pending",
      paymentStatus: "pending",
      recoveryState: "refund_pending",
      checkInFrom: "2026-08-01",
      checkInTo: "2026-08-02",
      sort: "oldest",
      pageSize: "10",
      unsupported: "customer@example.com",
      notificationStatus: "private_notification_state",
    }, 2);

    expect(href).toContain(`bookingReference=${bookingReference}`);
    expect(href).toContain("bookingStatus=payment_pending");
    expect(href).toContain("paymentStatus=pending");
    expect(href).toContain("recoveryState=refund_pending");
    expect(href).toContain("checkInFrom=2026-08-01");
    expect(href).toContain("pageSize=10");
    expect(href).toContain("page=2");
    expect(href).not.toContain("unsupported");
    expect(href).not.toContain("private_notification_state");
    expect(buildAdminPaginationHref("/admin/bookings", {
      bookingReference: "guest@example.com",
    }, 2)).toBe("/admin/bookings?page=2");
  });

  it("uses real non-interactive boundaries and booking-specific labelling", () => {
    const { rerender } = render(
      <Pagination
        page={1}
        totalPages={3}
        path="/admin/bookings"
        label="Booking results pagination"
      />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Booking results pagination",
    });
    expect(within(navigation).queryByRole("link", { name: "Previous" }))
      .not.toBeInTheDocument();
    expect(within(navigation).getByText("Previous").tagName).toBe("SPAN");
    expect(within(navigation).getByText(/Page/)).toHaveTextContent("Page 1 of 3");

    rerender(
      <Pagination
        page={3}
        totalPages={3}
        path="/admin/bookings"
        label="Booking results pagination"
      />,
    );
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByText("Next").tagName).toBe("SPAN");
  });
});

describe("Phase 7C.2A booking detail", () => {
  it("preserves safe not-found behaviour for invalid and missing references", async () => {
    await expect(
      AdminBookingDetailPage({
        params: Promise.resolve({ bookingReference: "guest@example.com" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.getAdminBookingDetail).not.toHaveBeenCalled();

    mocks.getAdminBookingDetail.mockResolvedValueOnce(null);
    await expect(
      AdminBookingDetailPage({
        params: Promise.resolve({ bookingReference }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.getAdminBookingDetail).toHaveBeenCalledWith(bookingReference);
  });

  it.each(["admin", "super_admin"] as const)(
    "renders unified diagnosis and eligible verification for %s",
    async (role) => {
      mocks.role = role;
      const { container } = render(
        await AdminBookingDetailPage({
          params: Promise.resolve({ bookingReference }),
        }),
      );

      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1, name: bookingReference }))
        .toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to booking records" }))
        .toHaveAttribute("href", "/admin/bookings");
      for (const label of [
        "Booking state",
        "Reservation state",
        "Payment state",
        "Recovery state",
        "Captured",
        "Verified",
      ]) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      expect(screen.getByText("P******")).toBeInTheDocument();
      expect(screen.getAllByText("g***@example.test").length).toBeGreaterThan(0);
      expect(screen.getByText("***3210")).toBeInTheDocument();
      expect(screen.getByText(/12 total · 4 overnight/)).toBeInTheDocument();
      expect(screen.getByText(/₹20,000/)).toBeInTheDocument();
      expect(screen.getAllByText(/₹5,000/).length).toBeGreaterThan(0);
      expect(screen.getByRole("heading", { name: "Payment-attempt history" }))
        .toBeInTheDocument();
      expect(screen.getByRole("list", {
        name: "Payment attempts for this booking",
      })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Notification outbox" }))
        .toBeInTheDocument();
      expect(screen.getByRole("list", {
        name: "Notification outbox for this booking",
      })).toBeInTheDocument();
      expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(4);
      expect(screen.getByRole("heading", { name: "Verify a manual payment" }))
        .toBeInTheDocument();
      expect(screen.getByText(/No automatic refund or reconciliation/i))
        .toBeInTheDocument();
      expect(container.innerHTML).not.toContain("Priyanshu");
      expect(container.innerHTML).not.toContain("9876543210");
      expect(container.innerHTML).not.toContain(
        "10000000-0000-4000-8000-000000000001",
      );
      expect(screen.queryByRole("link", { name: /book now/i }))
        .not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /refund|revive|reconcile/i }))
        .not.toBeInTheDocument();
    },
  );

  it("gives operations a permission explanation without the verification form", async () => {
    mocks.role = "operations";
    render(
      await AdminBookingDetailPage({
        params: Promise.resolve({ bookingReference }),
      }),
    );

    expect(screen.queryByRole("heading", { name: "Verify a manual payment" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("heading", {
      name: "Manual-payment permission boundary",
    })).toBeInTheDocument();
    expect(screen.getByText(/Server Action and PostgreSQL function enforce/i))
      .toBeInTheDocument();
  });

  it("does not show a role explanation or form for an ineligible payment", async () => {
    mocks.getAdminBookingDetail.mockResolvedValue({
      ...detailFixture(),
      payments: [{ ...payment, provider: "razorpay" }],
    });
    render(
      await AdminBookingDetailPage({
        params: Promise.resolve({ bookingReference }),
      }),
    );

    expect(screen.queryByText(/Manual-payment permission boundary/i))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Verify a manual payment" }))
      .not.toBeInTheDocument();
  });

  it("preserves supplied timeline order and safe empty states", async () => {
    const { rerender } = render(
      await AdminBookingDetailPage({
        params: Promise.resolve({ bookingReference }),
      }),
    );
    const timeline = screen.getByRole("heading", {
      name: "Audit and operational timeline",
    }).parentElement!;
    const timelineText = timeline.textContent ?? "";
    expect(timelineText.indexOf("Booking created"))
      .toBeLessThan(timelineText.indexOf("Payment attempt created"));
    expect(timeline.querySelectorAll("time")).toHaveLength(2);

    mocks.getAdminBookingDetail.mockResolvedValue({
      ...detailFixture(),
      timeline: [],
      payments: [],
      notifications: [],
    });
    rerender(
      await AdminBookingDetailPage({
        params: Promise.resolve({ bookingReference }),
      }),
    );
    expect(screen.getByText(/No operational timeline records/i))
      .toBeInTheDocument();
    expect(screen.getByText(/No payment attempts are recorded/i))
      .toBeInTheDocument();
    expect(screen.getByText(/No notification-outbox records are associated/i))
      .toBeInTheDocument();
  });

  it("uses customer-safe detail metadata", () => {
    expect(detailMetadata).toEqual({
      title: "Booking diagnosis | Silver Oak Estate",
    });
    expect(JSON.stringify(detailMetadata)).not.toMatch(/customer|email|phone/i);
  });
});

describe("Phase 7C.2A shared embedded history", () => {
  it("keeps default payment and notification tables compatible", () => {
    const { rerender } = render(<PaymentTable items={[payment]} recovery />);
    expect(screen.getByText("Diagnosis only — no action available"))
      .toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();

    rerender(<NotificationTable items={[notification]} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Delivery not implemented in Phase 5A."))
      .toBeInTheDocument();
  });

  it("keeps the booking-scoped empty payment message when recovery applies", () => {
    const { rerender } = render(
      <PaymentTable items={[]} recovery context="booking-detail" />,
    );
    expect(
      screen.getByText("No payment attempts are recorded for this booking."),
    ).toBeInTheDocument();
    expect(screen.queryByText("No payments require recovery.")).toBeNull();

    rerender(<PaymentTable items={[]} recovery />);
    expect(screen.getByText("No payments require recovery."))
      .toBeInTheDocument();

    rerender(<PaymentTable items={[]} />);
    expect(screen.getByText("No payment attempts match these filters."))
      .toBeInTheDocument();
  });
});
