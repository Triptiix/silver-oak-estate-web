"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { TurnstileWidget } from "./turnstile-widget";
import { GuestCountField } from "./guest-count-field";
import { BookingError } from "./booking-error";
import { createHold, BookingApiError } from "@/lib/booking/client";
import type { HoldResponse, PublicBookingErrorCode } from "@/types/booking";

type BookingFormProps = {
  checkInDate: string;
  guestCount: number;
  overnightGuestCount: number;
  onGuestCountChange: (count: number) => void;
  onOvernightGuestCountChange: (count: number) => void;
  onSuccess: (hold: HoldResponse) => void;
};

export function BookingForm({ checkInDate, guestCount, overnightGuestCount, onGuestCountChange, onOvernightGuestCountChange, onSuccess }: BookingFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<PublicBookingErrorCode | null>(null);

  // Stable requestId
  const requestIdRef = useRef<string | null>(null);

  if (requestIdRef.current === null) {
    requestIdRef.current = crypto.randomUUID();
  }

  // Regenerate if date changes
  const prevCheckInRef = useRef(checkInDate);
  useEffect(() => {
    if (prevCheckInRef.current !== checkInDate) {
      requestIdRef.current = crypto.randomUUID();
      prevCheckInRef.current = checkInDate;
    }
  }, [checkInDate]);

  function replaceRequestId() {
    requestIdRef.current = crypto.randomUUID();
  }

  const [turnstileToken, setTurnstileToken] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const [turnstileResetVersion, setTurnstileResetVersion] = useState(0);

  function resetTurnstile() {
    setTurnstileResetVersion((v) => v + 1);
    setTurnstileToken("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!turnstileToken) return;

    setPending(true);
    setError(null);

    const values = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const hold = await createHold({
        requestId: requestIdRef.current!,
        propertySlug: "silver-oak-estate",
        checkInDate,
        customerName: String(values.customerName),
        customerEmail: values.customerEmail ? String(values.customerEmail) : undefined,
        customerPhone: String(values.customerPhone),
        whatsapp: values.whatsapp ? String(values.whatsapp) : undefined,
        guestCount,
        overnightGuestCount,
        specialRequests: values.specialRequests ? String(values.specialRequests) : undefined,
        turnstileToken,
      });

      onSuccess(hold);
    } catch (err: unknown) {
      const code = err instanceof BookingApiError ? err.code : "SERVER_ERROR";
      setError(code);

      if (code === "BOT_VERIFICATION_FAILED") {
        resetTurnstile();
      } else if (code === "IDEMPOTENCY_CONFLICT") {
        // Regenerate requestId for next attempt and reset turnstile
        replaceRequestId();
        resetTurnstile();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-6">
      {error && (
        <BookingError
          code={error}
          onRetry={error !== "HOLD_LIMIT_REACHED" && error !== "PROPERTY_NOT_FOUND" && error !== "INVALID_HOLD" ? () => {
            setError(null);
          } : undefined}
        />
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-slate-900 mb-1">
            Full Name *
          </label>
          <input
            required
            id="customerName"
            name="customerName"
            maxLength={120}
            disabled={pending}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-slate-900 mb-1">
              Phone Number *
            </label>
            <input
              required
              id="customerPhone"
              name="customerPhone"
              type="tel"
              maxLength={24}
              disabled={pending}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-900 mb-1">
              WhatsApp (Optional)
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              maxLength={24}
              disabled={pending}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-slate-900 mb-1">
            Email Address (Optional)
          </label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            maxLength={254}
            disabled={pending}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Guests</h3>
        <GuestCountField
          label="Total Guests"
          name="guestCount"
          description="Maximum 30 guests allowed for events/day access."
          min={1}
          max={30}
          value={guestCount}
          onChange={onGuestCountChange}
        />
        <GuestCountField
          label="Overnight Guests"
          name="overnightGuestCount"
          description="Maximum 8 guests can stay overnight. Must not exceed total guests."
          min={0}
          max={Math.min(8, guestCount)}
          value={overnightGuestCount}
          onChange={onOvernightGuestCountChange}
        />
      </div>

      <div className="mt-8">
        <label htmlFor="specialRequests" className="block text-sm font-medium text-slate-900 mb-1">
          Special Requests (Optional)
        </label>
        <textarea
          id="specialRequests"
          name="specialRequests"
          maxLength={1000}
          rows={3}
          disabled={pending}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none disabled:opacity-50 resize-y"
        />
      </div>

      <div className="mt-6">
        <TurnstileWidget onVerify={setTurnstileToken} resetSignal={turnstileResetVersion} />
      </div>

      <button
        disabled={pending || !turnstileToken}
        className="w-full mt-6 rounded-md bg-slate-900 px-4 py-3 text-white font-medium hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none disabled:opacity-50 transition-colors"
      >
        {pending ? "Creating Hold…" : "Hold This Date"}
      </button>
    </form>
  );
}
