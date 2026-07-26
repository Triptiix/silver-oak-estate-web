import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const actions = vi.hoisted(() => ({
  createOwnerBlockAction: vi.fn(),
  createMaintenanceBlockAction: vi.fn(),
  releaseOwnerBlockAction: vi.fn(),
  releaseMaintenanceBlockAction: vi.fn(),
  createManualBookingAction: vi.fn(),
  verifyManualPaymentAction: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/app/admin/(protected)/actions/inventory", () => ({
  createOwnerBlockAction: actions.createOwnerBlockAction,
  createMaintenanceBlockAction: actions.createMaintenanceBlockAction,
  releaseOwnerBlockAction: actions.releaseOwnerBlockAction,
  releaseMaintenanceBlockAction: actions.releaseMaintenanceBlockAction,
}));
vi.mock("@/app/admin/(protected)/actions/manual-bookings", () => ({
  createManualBookingAction: actions.createManualBookingAction,
}));
vi.mock("@/app/admin/(protected)/actions/manual-payments", () => ({
  verifyManualPaymentAction: actions.verifyManualPaymentAction,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: actions.refresh }),
}));

import { ActiveInventoryBlocks } from "@/components/admin/operations/active-inventory-blocks";
import { InventoryBlockForm } from "@/components/admin/operations/inventory-block-form";
import { ManualBookingForm } from "@/components/admin/operations/manual-booking-form";
import { resolveManualPaymentCandidate } from "@/components/admin/operations/manual-payment-candidate";
import { ManualPaymentVerificationForm } from "@/components/admin/operations/manual-payment-verification-form";

const activeOwnerBlock = {
  reservationId: "10000000-0000-4000-8000-000000000001",
  reservationType: "owner_block" as const,
  status: "active" as const,
  startAt: "2026-08-01T05:30:00.000Z",
  endAt: "2026-08-02T04:30:00.000Z",
  createdAt: "2026-07-27T05:30:00.000Z",
};
const activeMaintenanceBlock = {
  ...activeOwnerBlock,
  reservationId: "20000000-0000-4000-8000-000000000002",
  reservationType: "maintenance_block" as const,
};
const blockSuccess = {
  ok: true as const,
  data: {
    result: "block_created" as const,
    reservationType: "maintenance_block" as const,
    status: "active" as const,
    firstBlockedDate: "2026-08-01",
    lastBlockedDate: "2026-08-02",
    applied: true,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  actions.createOwnerBlockAction.mockResolvedValue({
    ...blockSuccess,
    data: { ...blockSuccess.data, reservationType: "owner_block" },
  });
  actions.createMaintenanceBlockAction.mockResolvedValue(blockSuccess);
  actions.releaseOwnerBlockAction.mockResolvedValue({
    ...blockSuccess,
    data: {
      ...blockSuccess.data,
      result: "block_released",
      reservationType: "owner_block",
      status: "released",
    },
  });
  actions.releaseMaintenanceBlockAction.mockResolvedValue({
    ...blockSuccess,
    data: {
      ...blockSuccess.data,
      result: "block_released",
      status: "released",
    },
  });
});

function fillBlockForm(type: "owner_block" | "maintenance_block") {
  const typeSelect = screen.queryByLabelText("Block type");
  if (typeSelect) fireEvent.change(typeSelect, { target: { value: type } });
  fireEvent.change(screen.getByLabelText("First blocked date"), { target: { value: "2026-08-01" } });
  fireEvent.change(screen.getByLabelText("Last blocked date"), { target: { value: "2026-08-02" } });
  fireEvent.change(screen.getByLabelText("Reason"), {
    target: { value: type === "owner_block" ? "owner_use" : "maintenance" },
  });
}

function fillReleaseForm() {
  fireEvent.change(screen.getByLabelText("Release reason"), { target: { value: "corrected" } });
  fireEvent.click(screen.getByLabelText(/I confirm that this active block should be released/i));
}

describe("administrator operations role visibility and action wiring", () => {
  it("operations sees manual booking and maintenance creation but no owner controls", () => {
    render(<><ManualBookingForm /><InventoryBlockForm role="operations" /></>);
    expect(screen.getByRole("heading", { name: "Create a manual booking" })).toBeInTheDocument();
    expect(screen.getByText("Maintenance block")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Owner block" })).not.toBeInTheDocument();
  });

  it("admin and super-admin see owner and maintenance block options", () => {
    const { rerender } = render(<InventoryBlockForm role="admin" />);
    expect(screen.getByRole("option", { name: "Owner block" })).toBeInTheDocument();
    rerender(<InventoryBlockForm role="super_admin" />);
    expect(screen.getByRole("option", { name: "Owner block" })).toBeInTheDocument();
  });

  it("operations can release maintenance blocks but not owner blocks", () => {
    render(<ActiveInventoryBlocks blocks={[activeMaintenanceBlock, activeOwnerBlock]} role="operations" />);
    expect(screen.getAllByText(/Release this maintenance block/i)).toHaveLength(1);
    expect(screen.getByText(/Owner-block release requires/i)).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain(activeMaintenanceBlock.reservationId);
    expect(document.body.innerHTML).not.toContain(activeOwnerBlock.reservationId);
  });

  it("admin and super-admin can release both block types", () => {
    const { rerender } = render(<ActiveInventoryBlocks blocks={[activeMaintenanceBlock, activeOwnerBlock]} role="admin" />);
    expect(screen.getAllByText(/Release this/i)).toHaveLength(2);
    rerender(<ActiveInventoryBlocks blocks={[activeMaintenanceBlock, activeOwnerBlock]} role="super_admin" />);
    expect(screen.getAllByText(/Release this/i)).toHaveLength(2);
  });

  it("calls only the owner-block action for owner creation", async () => {
    render(<InventoryBlockForm role="admin" />);
    fillBlockForm("owner_block");
    fireEvent.click(screen.getByRole("button", { name: "Create inventory block" }));
    await waitFor(() => expect(actions.createOwnerBlockAction).toHaveBeenCalledOnce());
    expect(actions.createMaintenanceBlockAction).not.toHaveBeenCalled();
  });

  it("calls only the maintenance action for maintenance creation", async () => {
    render(<InventoryBlockForm role="operations" />);
    fillBlockForm("maintenance_block");
    fireEvent.click(screen.getByRole("button", { name: "Create inventory block" }));
    await waitFor(() => expect(actions.createMaintenanceBlockAction).toHaveBeenCalledOnce());
    expect(actions.createOwnerBlockAction).not.toHaveBeenCalled();
  });

  it("prevents a duplicate submit while the action is pending", async () => {
    let resolveAction!: (value: typeof blockSuccess) => void;
    actions.createMaintenanceBlockAction.mockReturnValue(
      new Promise((resolve) => { resolveAction = resolve; }),
    );
    render(<InventoryBlockForm role="operations" />);
    fillBlockForm("maintenance_block");
    const submit = screen.getByRole("button", { name: "Create inventory block" });
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByRole("button", { name: "Creating block…" })).toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Creating block…" }));
    expect(actions.createMaintenanceBlockAction).toHaveBeenCalledOnce();
    resolveAction(blockSuccess);
    await screen.findByText("Inventory block created");
  });

  it("calls only the fixed owner release action for an owner row", async () => {
    render(<ActiveInventoryBlocks blocks={[activeOwnerBlock]} role="admin" />);
    fillReleaseForm();
    fireEvent.click(screen.getByRole("button", { name: "Release inventory block" }));
    await waitFor(() => expect(actions.releaseOwnerBlockAction).toHaveBeenCalledOnce());
    expect(actions.releaseMaintenanceBlockAction).not.toHaveBeenCalled();
  });

  it("calls only the fixed maintenance release action for a maintenance row", async () => {
    render(<ActiveInventoryBlocks blocks={[activeMaintenanceBlock]} role="operations" />);
    fillReleaseForm();
    fireEvent.click(screen.getByRole("button", { name: "Release inventory block" }));
    await waitFor(() => expect(actions.releaseMaintenanceBlockAction).toHaveBeenCalledOnce());
    expect(actions.releaseOwnerBlockAction).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before a release action", async () => {
    render(<ActiveInventoryBlocks blocks={[activeMaintenanceBlock]} role="operations" />);
    fireEvent.change(screen.getByLabelText("Release reason"), { target: { value: "corrected" } });
    fireEvent.click(screen.getByRole("button", { name: "Release inventory block" }));
    expect(await screen.findByText("Release not confirmed")).toBeInTheDocument();
    expect(screen.getAllByText(/Confirm that this active block should be released/i)).toHaveLength(2);
    expect(actions.releaseMaintenanceBlockAction).not.toHaveBeenCalled();
  });

  it("shows the 31-night date guidance", () => {
    render(<InventoryBlockForm role="operations" />);
    expect(screen.getByText(/maximum 31-night range/i)).toBeInTheDocument();
  });
});

function fillManualBooking() {
  fireEvent.change(screen.getByLabelText("Check-in date"), { target: { value: "2026-08-01" } });
  fireEvent.change(screen.getByLabelText("Customer name"), { target: { value: "Guest Name" } });
  fireEvent.change(screen.getByLabelText("Customer phone"), { target: { value: "+91 99999 00001" } });
  fireEvent.change(screen.getByLabelText("Total guest count"), { target: { value: "4" } });
  fireEvent.change(screen.getByLabelText("Overnight guest count"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Manual payment provider"), { target: { value: "manual_upi" } });
}

describe("manual booking form", () => {
  it("calls only createManualBookingAction and links successful output", async () => {
    actions.createManualBookingAction.mockResolvedValue({
      ok: true,
      data: {
        result: "manual_booking_created",
        bookingReference: "SOE-20260801-ABCDEF12",
        bookingStatus: "payment_pending",
        reservationStatus: "active",
        paymentProvider: "manual_upi",
        checkInAt: "2026-08-01T05:30:00.000Z",
        checkOutAt: "2026-08-02T04:30:00.000Z",
        totalAmountPaise: 2_000_000,
        advanceAmountPaise: 500_000,
        balanceAmountPaise: 1_500_000,
        currency: "INR",
        holdExpiresAt: "2026-07-27T06:00:00.000Z",
        applied: true,
      },
    });
    render(<ManualBookingForm />);
    fillManualBooking();
    fireEvent.click(screen.getByRole("button", { name: "Create manual booking" }));
    await waitFor(() => expect(actions.createManualBookingAction).toHaveBeenCalledOnce());
    expect(screen.getByRole("link", { name: "Open booking detail" }))
      .toHaveAttribute("href", "/admin/bookings/SOE-20260801-ABCDEF12");
  });

  it("prevents overnight guests exceeding total guests", async () => {
    render(<ManualBookingForm />);
    fillManualBooking();
    fireEvent.change(screen.getByLabelText("Total guest count"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Overnight guest count"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Create manual booking" }));
    expect(await screen.findByText("Overnight guests cannot exceed total guests.")).toBeInTheDocument();
    expect(actions.createManualBookingAction).not.toHaveBeenCalled();
  });

  it("renders server field errors beside the relevant input", async () => {
    actions.createManualBookingAction.mockResolvedValue({
      ok: false,
      error: {
        code: "invalid_input",
        message: "Review the highlighted fields.",
        fieldErrors: { customerName: ["Enter a valid customer name."] },
      },
    });
    render(<ManualBookingForm />);
    fillManualBooking();
    fireEvent.click(screen.getByRole("button", { name: "Create manual booking" }));
    expect(await screen.findByText("Enter a valid customer name.")).toBeInTheDocument();
    expect(screen.getByLabelText("Customer name")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("request ID lifecycle through a form", () => {
  it("retains failures and rotates after an edited intent-bound field", async () => {
    actions.createMaintenanceBlockAction.mockResolvedValue({
      ok: false,
      error: { code: "operation_failed", message: "The operation could not be completed." },
    });
    render(<InventoryBlockForm role="operations" />);
    fillBlockForm("maintenance_block");
    const submit = screen.getByRole("button", { name: "Create inventory block" });
    fireEvent.click(submit);
    await waitFor(() => expect(actions.createMaintenanceBlockAction).toHaveBeenCalledTimes(1));
    fireEvent.click(submit);
    await waitFor(() => expect(actions.createMaintenanceBlockAction).toHaveBeenCalledTimes(2));
    const firstRequestId = actions.createMaintenanceBlockAction.mock.calls[0][0].requestId;
    expect(actions.createMaintenanceBlockAction.mock.calls[1][0].requestId).toBe(firstRequestId);
    fireEvent.change(screen.getByLabelText("Internal note (optional)"), { target: { value: "edited" } });
    fireEvent.click(submit);
    await waitFor(() => expect(actions.createMaintenanceBlockAction).toHaveBeenCalledTimes(3));
    expect(actions.createMaintenanceBlockAction.mock.calls[2][0].requestId).not.toBe(firstRequestId);
  });

  it("retains a request ID after a network failure", async () => {
    actions.createMaintenanceBlockAction
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: false,
        error: { code: "operation_failed", message: "The operation could not be completed." },
      });
    render(<InventoryBlockForm role="operations" />);
    fillBlockForm("maintenance_block");
    const submit = screen.getByRole("button", { name: "Create inventory block" });
    fireEvent.click(submit);
    await screen.findByText("Connection interrupted");
    fireEvent.click(submit);
    await waitFor(() => expect(actions.createMaintenanceBlockAction).toHaveBeenCalledTimes(2));
    expect(actions.createMaintenanceBlockAction.mock.calls[1][0].requestId)
      .toBe(actions.createMaintenanceBlockAction.mock.calls[0][0].requestId);
    expect(screen.queryByText("network")).not.toBeInTheDocument();
  });

  it.each([true, false])("clears a completed applied=%s intent", async (applied) => {
    actions.createMaintenanceBlockAction.mockResolvedValue({
      ...blockSuccess,
      data: { ...blockSuccess.data, applied },
    });
    render(<InventoryBlockForm role="operations" />);
    fillBlockForm("maintenance_block");
    const submit = screen.getByRole("button", { name: "Create inventory block" });
    fireEvent.click(submit);
    await waitFor(() => expect(actions.createMaintenanceBlockAction).toHaveBeenCalledTimes(1));
    fireEvent.click(submit);
    await waitFor(() => expect(actions.createMaintenanceBlockAction).toHaveBeenCalledTimes(2));
    expect(actions.createMaintenanceBlockAction.mock.calls[1][0].requestId)
      .not.toBe(actions.createMaintenanceBlockAction.mock.calls[0][0].requestId);
  });
});

describe("manual-payment eligibility and verification", () => {
  const pendingManual = {
    provider: "manual_upi",
    status: "pending",
    amountPaise: 500_000,
    currency: "INR",
  };

  it("shows eligible pending and expired candidates only to admin roles", () => {
    expect(resolveManualPaymentCandidate("admin", "SOE-20260801-ABCDEF12", [pendingManual])).not.toBeNull();
    expect(resolveManualPaymentCandidate("super_admin", "SOE-20260801-ABCDEF12", [{ ...pendingManual, status: "expired" }])).not.toBeNull();
    expect(resolveManualPaymentCandidate("operations", "SOE-20260801-ABCDEF12", [pendingManual])).toBeNull();
  });

  it("rejects Razorpay and already-processed manual candidates", () => {
    expect(resolveManualPaymentCandidate("admin", "SOE-20260801-ABCDEF12", [{ ...pendingManual, provider: "razorpay" }])).toBeNull();
    expect(resolveManualPaymentCandidate("admin", "SOE-20260801-ABCDEF12", [{ ...pendingManual, status: "manually_verified" }])).toBeNull();
  });

  it("requires attestation before invoking the payment action", async () => {
    render(<ManualPaymentVerificationForm candidate={{
      bookingReference: "SOE-20260801-ABCDEF12",
      provider: "manual_upi",
      paymentStatus: "pending",
      expectedAmountPaise: 500_000,
      currency: "INR",
    }} />);
    fireEvent.change(screen.getByLabelText("External payment reference"), { target: { value: "UPI-REFERENCE-1" } });
    fireEvent.change(screen.getByLabelText("Observed INR amount"), { target: { value: "5000" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit verified payment observation" }));
    expect(await screen.findByText("Confirm that you independently verified the payment.")).toBeInTheDocument();
    expect(actions.verifyManualPaymentAction).not.toHaveBeenCalled();
  });

  it("calls only verifyManualPaymentAction and links reconciliation to recovery", async () => {
    actions.verifyManualPaymentAction.mockResolvedValue({
      ok: true,
      data: {
        result: "reconciliation_required",
        bookingReference: "SOE-20260801-ABCDEF12",
        bookingStatus: "expired",
        reservationType: "manual_booking",
        reservationStatus: "expired",
        paymentStatus: "reconciliation_required",
        manualProvider: "manual_upi",
        expectedAmountPaise: 500_000,
        observedAmountPaise: 400_000,
        currency: "INR",
        applied: true,
      },
    });
    render(<ManualPaymentVerificationForm candidate={{
      bookingReference: "SOE-20260801-ABCDEF12",
      provider: "manual_upi",
      paymentStatus: "pending",
      expectedAmountPaise: 500_000,
      currency: "INR",
    }} />);
    fireEvent.change(screen.getByLabelText("External payment reference"), { target: { value: "UPI-REFERENCE-1" } });
    fireEvent.change(screen.getByLabelText("Observed INR amount"), { target: { value: "4000" } });
    fireEvent.click(screen.getByLabelText(/I independently verified/i));
    fireEvent.click(screen.getByRole("button", { name: "Submit verified payment observation" }));
    await waitFor(() => expect(actions.verifyManualPaymentAction).toHaveBeenCalledOnce());
    expect(screen.getByRole("link", { name: "Open recovery queue" })).toHaveAttribute("href", "/admin/recovery");
  });

  it("offers no file, URL, image or data-url input", () => {
    render(<ManualPaymentVerificationForm candidate={{
      bookingReference: "SOE-20260801-ABCDEF12",
      provider: "payment_link",
      paymentStatus: "expired",
      expectedAmountPaise: 500_000,
      currency: "INR",
    }} />);
    expect(document.querySelector('input[type="file"]')).toBeNull();
    expect(document.querySelector('input[type="url"]')).toBeNull();
    expect(screen.getByText(/Do not enter a URL, file, image or data payload/i)).toBeInTheDocument();
  });
});

describe("client mutation boundary", () => {
  it("contains no operational Supabase calls or server-only imports", () => {
    const files = [
      "active-inventory-blocks.tsx",
      "inventory-block-form.tsx",
      "manual-booking-form.tsx",
      "manual-payment-verification-form.tsx",
      "release-inventory-block-form.tsx",
    ];
    const source = files.map((file) => readFileSync(
      `src/components/admin/operations/${file}`,
      "utf8",
    )).join("\n");
    expect(source).not.toMatch(/\.rpc\s*\(|\.from\s*\(/);
    expect(source).not.toMatch(/mutation-schemas|lib\/admin\/mutations|supabase\/service-role/);
    expect(source).not.toMatch(/localStorage|sessionStorage|console\./);
  });

  it("keeps administrator and recovery copy operationally accurate", () => {
    const shell = readFileSync("src/components/admin/admin-shell.tsx", "utf8");
    const recovery = readFileSync(
      "src/app/admin/(protected)/recovery/page.tsx",
      "utf8",
    );
    expect(shell).toContain("Controlled manual booking and inventory operations");
    expect(shell).toContain("Live Razorpay, automatic refunds and automatic reconciliation remain disabled");
    expect(shell).not.toContain("Read-only recovery");
    expect(recovery).toContain("Diagnosis for refund_pending and reconciliation_required only");
    expect(recovery).toContain("Refund, confirmation and revival controls are intentionally absent");
  });
});
