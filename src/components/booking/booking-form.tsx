"use client";

import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";
import { envClient } from "@/lib/env/client";
import type { HoldResponse } from "@/types/booking";

declare global { interface Window { onSoeTurnstile?: (token: string) => void } }

export function BookingForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => { window.onSoeTurnstile = setTurnstileToken; return () => { delete window.onSoeTurnstile; }; }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/bookings/hold", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestId: crypto.randomUUID(), propertySlug: "silver-oak-estate",
        checkInDate: values.checkInDate, customerName: values.customerName,
        customerEmail: values.customerEmail || undefined, customerPhone: values.customerPhone,
        guestCount: Number(values.guestCount), overnightGuestCount: Number(values.overnightGuestCount || 0),
        specialRequests: values.specialRequests || undefined, turnstileToken,
      }),
    });
    const body = await response.json(); setPending(false);
    if (!response.ok) { setMessage(body.error?.message ?? "The hold could not be created."); return; }
    const hold = body as HoldResponse;
    setMessage(`Hold ${hold.bookingReference} is reserved until ${new Date(hold.holdExpiresAt).toLocaleTimeString("en-IN")}. This is not a confirmed booking.`);
  }
  return (
    <form onSubmit={submit} className="grid gap-5 rounded-[var(--radius)] border border-[var(--border)] p-6">
      <label>Check-in date<input required name="checkInDate" type="date" className="mt-1 block w-full border p-2" /></label>
      <label>Name<input required name="customerName" maxLength={120} className="mt-1 block w-full border p-2" /></label>
      <label>Email (optional)<input name="customerEmail" type="email" maxLength={254} className="mt-1 block w-full border p-2" /></label>
      <label>Phone<input required name="customerPhone" type="tel" maxLength={24} className="mt-1 block w-full border p-2" /></label>
      <label>Total guests<input required name="guestCount" type="number" min="1" max="30" className="mt-1 block w-full border p-2" /></label>
      <label>Overnight guests<input name="overnightGuestCount" type="number" min="0" max="8" defaultValue="0" className="mt-1 block w-full border p-2" /></label>
      <label>Special requests (optional)<textarea name="specialRequests" maxLength={1000} className="mt-1 block w-full border p-2" /></label>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile" data-sitekey={envClient.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback="onSoeTurnstile" />
      <button disabled={pending || !turnstileToken} className="rounded bg-[var(--foreground)] px-4 py-3 text-[var(--background)] disabled:opacity-50">
        {pending ? "Creating hold…" : "Hold this date for 10 minutes"}
      </button>
      <p className="text-sm" aria-live="polite">{message}</p>
    </form>
  );
}
