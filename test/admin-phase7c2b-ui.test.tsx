import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: "operations" as "operations" | "admin" | "super_admin",
  requireAdminRole: vi.fn(),
  listAdminPayments: vi.fn(),
  listAdminNotifications: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin", () => ({
  requireAdminRole: mocks.requireAdminRole,
}));
vi.mock("@/lib/admin/database", () => ({
  listAdminPayments: mocks.listAdminPayments,
  listAdminNotifications: mocks.listAdminNotifications,
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

import AdminPaymentsPage, {
  metadata as paymentsMetadata,
} from "@/app/admin/(protected)/payments/page";
import AdminRecoveryPage, {
  metadata as recoveryMetadata,
} from "@/app/admin/(protected)/recovery/page";
import AdminNotificationsPage, {
  metadata as notificationsMetadata,
} from "@/app/admin/(protected)/notifications/page";
import { PaymentTable } from "@/components/admin/payment-table";
import { NotificationTable } from "@/components/admin/notification-table";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { AdminRouteSkeleton } from "@/components/admin/admin-route-skeleton";
import PaymentsError from "@/app/admin/(protected)/payments/error";
import RecoveryError from "@/app/admin/(protected)/recovery/error";
import NotificationsError from "@/app/admin/(protected)/notifications/error";
import type {
  AdminNotificationItem,
  AdminPaymentItem,
} from "@/lib/admin/types";

const bookingReference = "SOE-20260725-ABCD1234";

const payment: AdminPaymentItem = {
  bookingReference,
  provider: "manual_upi",
  providerOrderId: "ORDER-REFERENCE-THAT-IS-VERY-LONG-000000",
  providerPaymentId: "PAYMENT-REFERENCE-THAT-IS-VERY-LONG-0000",
  providerEventId: "EVENT-REFERENCE-THAT-IS-VERY-LONG-000000",
  amountPaise: 500_000,
  currency: "INR",
  status: "refund_pending",
  verificationSource: "manual_attestation",
  recoveryReason: "duplicate_capture",
  failureCode: null,
  orderCreatedAt: null,
  checkoutStartedAt: null,
  authorizedAt: null,
  capturedAt: null,
  verifiedAt: "2026-07-25T05:45:00.000Z",
  recoveryRequiredAt: null,
  createdAt: "2026-07-24T05:30:00.000Z",
  updatedAt: "2026-07-25T05:45:00.000Z",
};

const paymentNoReferences: AdminPaymentItem = {
  ...payment,
  provider: "payment_link",
  providerOrderId: null,
  providerPaymentId: null,
  providerEventId: null,
  status: "pending",
  verificationSource: null,
  recoveryReason: null,
  failureCode: null,
  verifiedAt: null,
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

const systemNotification: AdminNotificationItem = {
  ...notification,
  bookingReference: null,
  templateKey: "admin_alert",
  recipientMasked: null,
};

function paymentsPage(items: AdminPaymentItem[], totalPages = 1) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages };
}

function notificationsPage(items: AdminNotificationItem[], totalPages = 1) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = "operations";
  mocks.requireAdminRole.mockImplementation(async () => ({
    role: mocks.role,
    name: "Safe Administrator",
  }));
  mocks.listAdminPayments.mockResolvedValue(paymentsPage([payment]));
  mocks.listAdminNotifications.mockResolvedValue(notificationsPage([notification]));
});

afterEach(() => cleanup());

async function renderPayments(
  params: Record<string, string | string[] | undefined> = {},
) {
  return render(await AdminPaymentsPage({ searchParams: Promise.resolve(params) }));
}
async function renderRecovery(
  params: Record<string, string | string[] | undefined> = {},
) {
  return render(await AdminRecoveryPage({ searchParams: Promise.resolve(params) }));
}
async function renderNotifications(
  params: Record<string, string | string[] | undefined> = {},
) {
  return render(
    await AdminNotificationsPage({ searchParams: Promise.resolve(params) }),
  );
}

describe("Phase 7C.2B route metadata and authorization", () => {
  it("exposes safe titles with no customer or record data", () => {
    for (const meta of [paymentsMetadata, recoveryMetadata, notificationsMetadata]) {
      expect(String(meta.title)).toContain("Silver Oak Estate Operations");
      expect(String(meta.title)).not.toMatch(/SOE-\d{8}/);
      expect(String(meta.title)).not.toMatch(/@/);
    }
    expect(String(paymentsMetadata.title)).toContain("Payment attempts");
    expect(String(recoveryMetadata.title)).toContain("Recovery queue");
    expect(String(notificationsMetadata.title)).toContain("Notification outbox");
  });

  it("gates every route on the three operational roles", async () => {
    await renderPayments();
    await renderRecovery();
    await renderNotifications();
    for (const call of mocks.requireAdminRole.mock.calls) {
      expect(call).toEqual(["operations", "admin", "super_admin"]);
    }
    expect(mocks.requireAdminRole).toHaveBeenCalledTimes(3);
  });
});

describe("Phase 7C.2B payments route", () => {
  it("uses the payments list function with the normalized query", async () => {
    await renderPayments({ page: "2", pageSize: "10", paymentStatus: "verified" });
    expect(mocks.listAdminPayments).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10, paymentStatus: "verified" }),
    );
    // Payments list uses the non-recovery form (single argument).
    expect(mocks.listAdminPayments.mock.calls[0]).toHaveLength(1);
  });

  it("renders single H1, safe intro, route heading and pagination label", async () => {
    mocks.listAdminPayments.mockResolvedValue(paymentsPage([payment], 3));
    await renderPayments();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Filter payment attempts" }))
      .toBeInTheDocument();
    expect(screen.getByText(/no refund, reconciliation, capture, deletion or editing/i))
      .toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Payment attempts pagination" }))
      .toBeInTheDocument();
  });

  it("retains valid filter values and ignores invalid ones", async () => {
    await renderPayments({
      paymentStatus: "reconciliation_required",
      recoveryState: "refund_pending",
      pageSize: "50",
      sort: "oldest",
      bookingReference,
    });
    expect(screen.getByLabelText("Payment state")).toHaveValue("reconciliation_required");
    expect(screen.getByLabelText("Recovery state")).toHaveValue("refund_pending");
    expect(screen.getByLabelText("Results per page")).toHaveValue("50");
    expect(screen.getByLabelText("Sort order")).toHaveValue("oldest");
    expect(screen.getByLabelText("Booking reference")).toHaveValue(bookingReference);
    expect(screen.getByRole("link", { name: "Reset filters" }))
      .toHaveAttribute("href", "/admin/payments");
  });

  it("does not reflect a partial booking reference or expose unsafe search", async () => {
    const { container } = await renderPayments({
      bookingReference: "SOE-2026",
      paymentStatus: "not_a_real_status",
    });
    expect(screen.getByLabelText("Booking reference")).toHaveValue("");
    expect(screen.getByLabelText("Payment state")).toHaveValue("");
    expect(mocks.listAdminPayments).toHaveBeenCalledWith(
      expect.objectContaining({ bookingReference: undefined, paymentStatus: undefined }),
    );
    expect(container.querySelector('[name="customerName"]')).toBeNull();
    expect(container.querySelector('[name="email"]')).toBeNull();
    expect(container.querySelector('[name="providerOrderId"]')).toBeNull();
  });

  it("renders no mutation control and no /book link", async () => {
    const { container } = await renderPayments();
    expect(container.querySelector('a[href="/book"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /refund|reconcile|retry|capture|delete|edit/i }))
      .not.toBeInTheDocument();
  });
});

describe("Phase 7C.2B recovery route", () => {
  it("uses the recovery-only list call and route-specific label", async () => {
    mocks.listAdminPayments.mockResolvedValue(paymentsPage([payment], 2));
    await renderRecovery({ recoveryState: "reconciliation_required" });
    expect(mocks.listAdminPayments).toHaveBeenCalledWith(
      expect.objectContaining({ recoveryState: "reconciliation_required" }),
      true,
    );
    expect(screen.getByRole("navigation", { name: "Recovery queue pagination" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Filter recovery queue" }))
      .toBeInTheDocument();
  });

  it("shows the diagnosis boundary and retains recovery state, ignoring unsupported values", async () => {
    await renderRecovery({ recoveryState: "captured", pageSize: "10", sort: "oldest" });
    expect(screen.getByText(/queue is read-only/i)).toBeInTheDocument();
    expect(screen.getByText(/no refund is initiated here/i)).toBeInTheDocument();
    // "captured" is not a recovery state -> ignored.
    expect(screen.getByLabelText("Recovery state")).toHaveValue("");
    expect(screen.getByLabelText("Results per page")).toHaveValue("10");
    expect(screen.getByLabelText("Sort order")).toHaveValue("oldest");
    expect(screen.getByRole("link", { name: "Reset filters" }))
      .toHaveAttribute("href", "/admin/recovery");
  });

  it("renders no payment-state filter and no mutation control", async () => {
    const { container } = await renderRecovery();
    expect(screen.queryByLabelText("Payment state")).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/book"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /refund|reconcile|confirm|retry|revive/i }))
      .not.toBeInTheDocument();
  });
});

describe("Phase 7C.2B notifications route", () => {
  it("uses the notifications list function with the normalized query and label", async () => {
    mocks.listAdminNotifications.mockResolvedValue(notificationsPage([notification], 2));
    await renderNotifications({ notificationStatus: "sent", pageSize: "10" });
    expect(mocks.listAdminNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ notificationStatus: "sent", pageSize: 10 }),
    );
    expect(screen.getByRole("navigation", { name: "Notification outbox pagination" }))
      .toBeInTheDocument();
  });

  it("retains notification state and ignores unsupported values, with no recipient search", async () => {
    const { container } = await renderNotifications({
      notificationStatus: "opened",
      sort: "oldest",
    });
    expect(screen.getByLabelText("Notification state")).toHaveValue("");
    expect(screen.getByLabelText("Sort order")).toHaveValue("oldest");
    expect(screen.getAllByText(/An outbox row alone is not proof of delivery/i).length)
      .toBeGreaterThan(0);
    expect(container.querySelector('[name="recipient"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /resend|retry|deliver/i }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset filters" }))
      .toHaveAttribute("href", "/admin/notifications");
  });

  it("retains each valid notification state", async () => {
    for (const value of ["pending", "sent", "failed"] as const) {
      await renderNotifications({ notificationStatus: value });
      expect(screen.getByLabelText("Notification state")).toHaveValue(value);
      cleanup();
    }
  });
});

describe("Phase 7C.2B payment records", () => {
  it("renders required fields, links booking detail and shows no internal identifiers", () => {
    const { container } = render(
      <PaymentTable items={[payment]} resetPath="/admin/payments" />,
    );
    expect(screen.getByRole("list", { name: "Payment attempts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: bookingReference }))
      .toHaveAttribute("href", `/admin/bookings/${bookingReference}`);
    expect(screen.getByText("refund pending")).toBeInTheDocument();
    expect(screen.getByText("manual upi")).toBeInTheDocument();
    expect(screen.getByText(payment.providerOrderId as string)).toBeInTheDocument();
    expect(screen.getByText(payment.providerPaymentId as string)).toBeInTheDocument();
    expect(screen.getByText("manual_attestation")).toBeInTheDocument();
    expect(screen.getByText("duplicate capture")).toBeInTheDocument();
    expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
    expect(container.querySelectorAll("time").length).toBeGreaterThanOrEqual(1);
    // No internal UUID leaks into the markup.
    expect(container.innerHTML).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    expect(screen.getByRole("link", { name: bookingReference }).className)
      .toContain("break-all");
  });

  it("uses safe language for missing provider references and no action control", () => {
    render(<PaymentTable items={[paymentNoReferences]} />);
    expect(screen.getAllByText("Not attached").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Not verified")).toBeInTheDocument();
    expect(screen.getByText("No recovery or failure reason")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows recovery diagnosis-only language and no action button in recovery mode", () => {
    render(<PaymentTable items={[payment]} recovery resetPath="/admin/recovery" />);
    expect(screen.getByRole("list", { name: "Payment recovery queue" }))
      .toBeInTheDocument();
    expect(screen.getByText("Diagnosis only — no action available"))
      .toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /refund|reconcile|confirm|retry|revive/i }))
      .not.toBeInTheDocument();
  });

  it("gives payment empty states a reset without claiming global absence", () => {
    const { rerender } = render(
      <PaymentTable items={[]} resetPath="/admin/payments" />,
    );
    expect(screen.getByText(/matched the current server-side filters/i))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset filters" }))
      .toHaveAttribute("href", "/admin/payments");

    rerender(<PaymentTable items={[]} recovery resetPath="/admin/recovery" />);
    expect(screen.getByText(/No recovery records matched the current server-side filters/i))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset filters" }))
      .toHaveAttribute("href", "/admin/recovery");
  });
});

describe("Phase 7C.2B notification records", () => {
  it("renders required fields, masks recipients and never claims pending delivery", () => {
    const { container } = render(
      <NotificationTable items={[notification]} resetPath="/admin/notifications" />,
    );
    expect(screen.getByRole("list", { name: "Notification outbox" })).toBeInTheDocument();
    expect(screen.getByText("booking confirmation")).toBeInTheDocument();
    expect(screen.getByText("email")).toBeInTheDocument();
    expect(screen.getByText("g***@example.test")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("queued")).toBeInTheDocument();
    expect(screen.getByText("Delivery not implemented in Phase 5A.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: bookingReference }))
      .toHaveAttribute("href", `/admin/bookings/${bookingReference}`);
    expect(container.querySelectorAll("time")).toHaveLength(1);
    expect(container.innerHTML).not.toContain("delivered");
    expect(container.innerHTML).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });

  it("renders System origin records and no resend control", () => {
    render(<NotificationTable items={[systemNotification]} />);
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("admin alert")).toBeInTheDocument();
    expect(screen.getByText("Masked")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resend|retry|deliver/i }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: bookingReference })).not.toBeInTheDocument();
  });

  it("gives the notification empty state a reset without claiming global absence", () => {
    render(<NotificationTable items={[]} resetPath="/admin/notifications" />);
    expect(
      screen.getByText(/No notification-outbox records matched the current server-side filters/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset filters" }))
      .toHaveAttribute("href", "/admin/notifications");
  });
});

describe("Phase 7C.2B loading and error boundaries", () => {
  it("loading placeholder is labelled and contains no fake records", () => {
    const { container } = render(<AdminRouteSkeleton label="Loading payment attempts…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading payment attempts…");
    expect(container.innerHTML).not.toMatch(/SOE-\d{8}/);
    expect(container.innerHTML).not.toMatch(/₹/);
  });

  it("shared error alert announces, retries with a button and hides details", () => {
    const reset = vi.fn();
    render(
      <AdminRouteError
        title="Payment attempts are temporarily unavailable"
        description="No payment, provider or customer details were exposed."
        reset={reset}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(within(alert).getByRole("heading")).toHaveTextContent(
      "Payment attempts are temporarily unavailable",
    );
    const button = within(alert).getByRole("button", { name: "Try again" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("min-h-11");
  });

  it.each([
    ["payments", PaymentsError, /payment state was modified/i],
    ["recovery", RecoveryError, /booking or reservation state was modified/i],
    ["notifications", NotificationsError, /sent, resent or modified/i],
  ] as const)("%s error uses role=alert, type=button and route-safe wording", (_name, Component, phrase) => {
    render(<Component reset={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toHaveAttribute("type", "button");
    expect(screen.getByText(phrase)).toBeInTheDocument();
  });
});
