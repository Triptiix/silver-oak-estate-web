import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingExperience } from "../../../src/components/booking/booking-experience";
import { useSearchParams, useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock Turnstile
vi.mock("../../../src/components/booking/turnstile-widget", () => ({
  TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <button onClick={() => onVerify("token")}>Verify</button>
  ),
}));

global.fetch = vi.fn();

describe("BookingExperience", () => {
  const mockRouter = { push: vi.fn(), replace: vi.fn() };
  
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: (key: string) => (key === "date" ? "2024-12-01" : null),
    });
  });

  it("active hold overrides URL date & no availability fetch while hold is displayed", async () => {
    sessionStorage.setItem("soe_hold_summary", JSON.stringify({
      bookingReference: "REF-123",
      checkInAt: "2024-12-05T14:00:00Z", // Different from URL date
      checkOutAt: "2024-12-06T10:00:00Z",
      holdExpiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
      priceAmountPaise: 100000,
      advanceAmountPaise: 50000,
      balanceAmountPaise: 50000,
      currency: "INR",
      version: 1
    }));

    render(<BookingExperience />);
    
    // Summary is displayed for the held date, not the URL date
    expect(screen.getByText("REF-123")).toBeInTheDocument();
    
    // No fetch call to /api/availability should occur
    expect(global.fetch).not.toHaveBeenCalled();
  });

  describe("Release Hold", () => {
    beforeEach(() => {
      sessionStorage.setItem("soe_hold_summary", JSON.stringify({
        bookingReference: "REF-123",
        checkInAt: "2024-12-05T14:00:00Z",
        checkOutAt: "2024-12-06T10:00:00Z",
        holdExpiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
        priceAmountPaise: 100000,
        advanceAmountPaise: 50000,
      balanceAmountPaise: 50000,
      currency: "INR",
      version: 1
      }));
      HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
        this.open = true;
      });
      HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
        this.open = false;
      });
    });

    it("unknown response.ok succeeds, clears summary and navigates", async () => {
      // @ts-expect-error mock
      global.fetch.mockResolvedValueOnce({ ok: true });
      
      render(<BookingExperience />);
      fireEvent.click(screen.getByText(/Release Hold & Change Date/i)); // open dialog
      fireEvent.click(screen.getByRole("button", { name: /^Release Hold$/i })); // confirm
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/bookings/release", expect.objectContaining({ method: "POST" }));
        expect(sessionStorage.getItem("soe_hold_summary")).toBeNull();
        expect(mockRouter.push).toHaveBeenCalledWith("/availability");
      });
    });

    it("failed release retains hold and does not navigate", async () => {
      // @ts-expect-error mock
      global.fetch.mockResolvedValueOnce({ ok: false });
      
      render(<BookingExperience />);
      fireEvent.click(screen.getByText(/Release Hold & Change Date/i)); // open dialog
      fireEvent.click(screen.getByRole("button", { name: /^Release Hold$/i })); // confirm
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(screen.getByText(/Failed to release hold/i)).toBeInTheDocument();
        expect(sessionStorage.getItem("soe_hold_summary")).not.toBeNull();
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    it("double confirmation sends one request", async () => {
      let resolveReq: (value: unknown) => void = () => {};
      // @ts-expect-error mock
      global.fetch.mockImplementation(() => new Promise((resolve) => { resolveReq = resolve; }));
      
      render(<BookingExperience />);
      fireEvent.click(screen.getByText(/Release Hold & Change Date/i)); // open dialog
      
      const confirmBtn = screen.getByRole("button", { name: /^Release Hold$/i });
      fireEvent.click(confirmBtn);
      fireEvent.click(confirmBtn); // Double click
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      resolveReq({ ok: true });
    });
  });
});
