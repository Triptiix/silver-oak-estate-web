import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingForm } from "../../../src/components/booking/booking-form";

// Mock turnstile
vi.mock("../../../src/components/booking/turnstile-widget", () => ({
  TurnstileWidget: ({ onVerify, resetSignal }: { onVerify: (token: string) => void, resetSignal: number }) => (
    <div data-testid="turnstile-mock" data-resetsignal={resetSignal}>
      <button type="button" onClick={() => onVerify("mock-token")}>Verify Turnstile</button>
    </div>
  ),
}));

global.fetch = vi.fn();

describe("BookingForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByText("Verify Turnstile"));
  };

  it("same requestId after rerender", async () => {
    const { rerender } = render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();

    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    // @ts-expect-error mock
    const firstCallBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    const firstReqId = firstCallBody.requestId;

    rerender(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByText("Verify Turnstile"));
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    // @ts-expect-error mock
    const secondCallBody = JSON.parse(global.fetch.mock.calls[1][1].body);
    expect(secondCallBody.requestId).toBe(firstReqId);
  });

  it("same requestId after network error", async () => {
    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();
    // @ts-expect-error mock
    global.fetch.mockRejectedValueOnce(new Error("Network Error"));
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    // @ts-expect-error mock
    const firstReqId = JSON.parse(global.fetch.mock.calls[0][1].body).requestId;

    fireEvent.click(screen.getByText("Verify Turnstile"));
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    // @ts-expect-error mock
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).requestId).toBe(firstReqId);
  });

  it("same requestId after SERVER_ERROR", async () => {
    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    // @ts-expect-error mock
    const firstReqId = JSON.parse(global.fetch.mock.calls[0][1].body).requestId;

    fireEvent.click(screen.getByText("Verify Turnstile"));
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    // @ts-expect-error mock
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).requestId).toBe(firstReqId);
  });

  it("same requestId after SERVER_ERROR", async () => {
    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    // @ts-expect-error mock
    const firstReqId = JSON.parse(global.fetch.mock.calls[0][1].body).requestId;

    fireEvent.click(screen.getByText("Verify Turnstile"));
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    // @ts-expect-error mock
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).requestId).toBe(firstReqId);
  });

  it("new requestId after IDEMPOTENCY_CONFLICT", async () => {
    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "IDEMPOTENCY_CONFLICT", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    // @ts-expect-error mock
    const firstReqId = JSON.parse(global.fetch.mock.calls[0][1].body).requestId;

    fireEvent.click(screen.getByText("Verify Turnstile"));
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    // @ts-expect-error mock
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).requestId).not.toBe(firstReqId);
  });

  it("new requestId after date change", async () => {
    const { rerender } = render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    // @ts-expect-error mock
    const firstReqId = JSON.parse(global.fetch.mock.calls[0][1].body).requestId;

    rerender(<BookingForm checkInDate="2024-12-02" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByText("Verify Turnstile"));
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "SERVER_ERROR", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    // @ts-expect-error mock
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).requestId).not.toBe(firstReqId);
  });

  it("one request during double submission", async () => {
    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();
    let resolveReq: (value: unknown) => void = () => {};
    // @ts-expect-error mock
    global.fetch.mockImplementation(() => new Promise((resolve) => { resolveReq = resolve; }));

    const button = screen.getByRole("button", { name: /Hold This Date/i });
    fireEvent.click(button);
    fireEvent.click(button); // Double click

    expect(global.fetch).toHaveBeenCalledTimes(1);
    resolveReq({ ok: true, json: async () => ({ holdExpiresAt: new Date().toISOString(), customerEmail: "a@a.com" }) });
  });

  it("actual Turnstile reset signal change", async () => {
    render(<BookingForm checkInDate="2024-12-01" guestCount={1} overnightGuestCount={0} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();

    const tsMock = screen.getByTestId("turnstile-mock");
    const initialSignal = tsMock.getAttribute("data-resetsignal");

    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: "BOT_VERIFICATION_FAILED", message: "Failed" } }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));

    await waitFor(() => {
      expect(tsMock.getAttribute("data-resetsignal")).not.toBe(initialSignal);
    });
  });

  it("clamps overnight guests when total guests decrease", () => {
    const onGuestCountChange = vi.fn();
    const onOvernightGuestCountChange = vi.fn();
    render(
      <BookingForm
        checkInDate="2024-12-01"
        guestCount={5}
        overnightGuestCount={5}
        onGuestCountChange={onGuestCountChange}
        onOvernightGuestCountChange={onOvernightGuestCountChange}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Decrease Total Guests" }));

    expect(onGuestCountChange).toHaveBeenCalledWith(4);
    expect(onOvernightGuestCountChange).toHaveBeenCalledWith(4);
  });

  it("controlled guest values submitted correctly", async () => {
    render(<BookingForm checkInDate="2024-12-01" guestCount={3} overnightGuestCount={2} onGuestCountChange={vi.fn()} onOvernightGuestCountChange={vi.fn()} onSuccess={vi.fn()} />);
    fillForm();

    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ holdExpiresAt: new Date().toISOString(), customerEmail: "test@example.com" }) });
    fireEvent.click(await screen.findByRole("button", { name: /Hold This Date/i }));

    await waitFor(() => {
      // @ts-expect-error mock
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.guestCount).toBe(3);
      expect(body.overnightGuestCount).toBe(2);
    });
  });
});
