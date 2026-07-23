import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingForm } from "../../../src/components/booking/booking-form";

// Mock turnstile
vi.mock("../../../src/components/booking/turnstile-widget", () => ({
  TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <button data-testid="turnstile-mock" onClick={() => onVerify("mock-token")}>
      Verify Turnstile
    </button>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

describe("BookingForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders correctly", () => {
    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={() => {}} />);
    
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hold This Date/i })).toBeInTheDocument();
  });

  it("submits the form successfully and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        holdExpiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
        customerEmail: "test@example.com"
      })
    });

    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={onSuccess} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: "9876543210" } });

    // Verify turnstile
    fireEvent.click(screen.getByTestId("turnstile-mock"));

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Hold This Date/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/bookings/hold", expect.objectContaining({
        method: "POST",
      }));
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows error when fetch fails", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { code: "SERVER_ERROR", message: "Failed" }
      })
    });

    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={() => {}} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: "9876543210" } });
    
    // Verify turnstile
    fireEvent.click(screen.getByTestId("turnstile-mock"));

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Hold This Date/i }));

    await waitFor(() => {
      expect(screen.getByText(/We're experiencing technical difficulties/i)).toBeInTheDocument();
    });
  });
});
