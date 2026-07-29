"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createManualBookingAction } from "@/app/admin/(protected)/actions/manual-bookings";
import { Button } from "@/components/ui/button";
import {
  OVERNIGHT_GUEST_CAPACITY,
  STANDARD_DAY_EVENT_CAPACITY,
} from "@/config/public-information";
import { normalizePhone } from "@/lib/phone";
import {
  AdminOperationResult,
  type AdminOperationFeedback,
} from "./admin-operation-result";
import {
  errorClassName,
  failureFeedback,
  firstFieldError,
  inputClassName,
} from "./form-helpers";
import { useAdminMutationIntent } from "./use-admin-mutation-intent";

function formatMoney(amountPaise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amountPaise / 100);
}

export function ManualBookingForm() {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<AdminOperationFeedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const resultRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { requestIdFor, clearCompletedIntent } = useAdminMutationIntent();

  useEffect(() => {
    if (feedback) resultRef.current?.focus();
  }, [feedback]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const checkInDate = String(form.get("checkInDate") ?? "");
    const customerName = String(form.get("customerName") ?? "").trim();
    const rawPhone = String(form.get("customerPhone") ?? "");
    const customerEmail = String(form.get("customerEmail") ?? "").trim().toLowerCase();
    const guestCount = Number(form.get("guestCount"));
    const overnightGuestCount = Number(form.get("overnightGuestCount"));
    const specialRequests = String(form.get("specialRequests") ?? "").trim();
    const manualProvider = String(form.get("manualProvider") ?? "");
    const errors: Record<string, string[]> = {};
    let customerPhone = "";

    if (!checkInDate) errors.checkInDate = ["Select a check-in date."];
    if (!customerName) errors.customerName = ["Enter the customer name."];
    try {
      customerPhone = normalizePhone(rawPhone);
    } catch {
      errors.customerPhone = ["Enter a valid phone number, including country code when applicable."];
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > STANDARD_DAY_EVENT_CAPACITY) {
      errors.guestCount = [`Total guests must be between 1 and ${STANDARD_DAY_EVENT_CAPACITY}.`];
    }
    if (!Number.isInteger(overnightGuestCount) || overnightGuestCount < 0 || overnightGuestCount > OVERNIGHT_GUEST_CAPACITY) {
      errors.overnightGuestCount = [`Overnight guests must be between 0 and ${OVERNIGHT_GUEST_CAPACITY}.`];
    } else if (overnightGuestCount > guestCount) {
      errors.overnightGuestCount = ["Overnight guests cannot exceed total guests."];
    }
    if (!["manual_upi", "payment_link"].includes(manualProvider)) {
      errors.manualProvider = ["Select a supported manual payment provider."];
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({
        kind: "error",
        title: "Review the booking details",
        message: "Correct the highlighted fields and try again.",
      });
      return;
    }

    const normalized = {
      checkInDate,
      customerName,
      customerPhone,
      customerEmail,
      guestCount,
      overnightGuestCount,
      specialRequests,
      manualProvider,
    };
    const input = {
      ...normalized,
      customerEmail: customerEmail || null,
      specialRequests: specialRequests || null,
      manualProvider: manualProvider as "manual_upi" | "payment_link",
      requestId: requestIdFor(JSON.stringify(normalized)),
    };

    setPending(true);
    setFieldErrors({});
    setFeedback(null);
    try {
      const result = await createManualBookingAction(input);
      if (!result.ok) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFeedback(failureFeedback(result));
        return;
      }
      clearCompletedIntent();
      setFeedback({
        kind: result.data.applied ? "success" : "replayed",
        title: result.data.applied ? "Manual booking created" : "Completed booking operation replayed",
        message: result.data.applied
          ? "The server created a payment-pending manual booking and expiring inventory reservation."
          : "The exact previously completed operation was returned without creating another booking.",
        details: [
          `Booking reference: ${result.data.bookingReference}`,
          `Booking status: ${result.data.bookingStatus.replaceAll("_", " ")}`,
          `Reservation status: ${result.data.reservationStatus.replaceAll("_", " ")}`,
          `Manual provider: ${result.data.paymentProvider.replaceAll("_", " ")}`,
          `Check-in: ${new Date(result.data.checkInAt).toLocaleString("en-IN")}`,
          `Checkout: ${new Date(result.data.checkOutAt).toLocaleString("en-IN")}`,
          `Total: ${formatMoney(result.data.totalAmountPaise, result.data.currency)}`,
          `Advance: ${formatMoney(result.data.advanceAmountPaise, result.data.currency)}`,
          `Balance: ${formatMoney(result.data.balanceAmountPaise, result.data.currency)}`,
          ...(result.data.holdExpiresAt
            ? [`Hold expires: ${new Date(result.data.holdExpiresAt).toLocaleString("en-IN")}`]
            : []),
        ],
        link: {
          href: `/admin/bookings/${result.data.bookingReference}`,
          label: "Open booking detail",
        },
      });
      router.refresh();
    } catch {
      setFeedback({
        kind: "error",
        title: "Connection interrupted",
        message: "The result is unknown. Retry the unchanged booking to safely reuse its request ID.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        Booking workflow
      </p>
      <h2 className="mt-2 text-xl font-bold">Create a manual booking</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        Enter the check-in and customer facts only. Pricing, checkout, status and
        hold duration remain server-owned. The reservation expires if payment is
        not verified.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset
          disabled={pending}
          className="space-y-4 rounded-lg border border-stone-200 p-4"
        >
          <legend className="px-1 text-sm font-semibold">Stay and customer</legend>
          <div>
            <label htmlFor="manualCheckInDate" className="text-sm font-medium">Check-in date</label>
            <input
              required
              id="manualCheckInDate"
              name="checkInDate"
              type="date"
              aria-invalid={Boolean(firstFieldError(fieldErrors, "checkInDate"))}
              aria-describedby="manualCheckInDate-help manualCheckInDate-error"
              className={inputClassName}
            />
            <p id="manualCheckInDate-help" className="mt-1 text-xs text-stone-500">Checkout is calculated by the server.</p>
            {firstFieldError(fieldErrors, "checkInDate") && <p id="manualCheckInDate-error" className={errorClassName}>{firstFieldError(fieldErrors, "checkInDate")}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="manualCustomerName" className="text-sm font-medium">Customer name</label>
              <input
                required
                id="manualCustomerName"
                name="customerName"
                maxLength={120}
                aria-invalid={Boolean(firstFieldError(fieldErrors, "customerName"))}
                aria-describedby="manualCustomerName-error"
                className={inputClassName}
              />
              {firstFieldError(fieldErrors, "customerName") && <p id="manualCustomerName-error" className={errorClassName}>{firstFieldError(fieldErrors, "customerName")}</p>}
            </div>
            <div>
              <label htmlFor="manualCustomerPhone" className="text-sm font-medium">Customer phone</label>
              <input
                required
                id="manualCustomerPhone"
                name="customerPhone"
                type="tel"
                maxLength={24}
                placeholder="+91 99999 99999"
                aria-invalid={Boolean(firstFieldError(fieldErrors, "customerPhone"))}
                aria-describedby="manualCustomerPhone-help manualCustomerPhone-error"
                className={inputClassName}
              />
              <p id="manualCustomerPhone-help" className="mt-1 text-xs text-stone-500">Include the country code; no country code is inferred.</p>
              {firstFieldError(fieldErrors, "customerPhone") && <p id="manualCustomerPhone-error" className={errorClassName}>{firstFieldError(fieldErrors, "customerPhone")}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="manualCustomerEmail" className="text-sm font-medium">Email (optional)</label>
            <input
              id="manualCustomerEmail"
              name="customerEmail"
              type="email"
              maxLength={254}
              aria-invalid={Boolean(firstFieldError(fieldErrors, "customerEmail"))}
              aria-describedby="manualCustomerEmail-error"
              className={inputClassName}
            />
            {firstFieldError(fieldErrors, "customerEmail") && <p id="manualCustomerEmail-error" className={errorClassName}>{firstFieldError(fieldErrors, "customerEmail")}</p>}
          </div>
        </fieldset>

        <fieldset
          disabled={pending}
          className="rounded-lg border border-stone-200 p-4"
        >
          <legend className="px-1 text-sm font-semibold">Guest limits</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="manualGuestCount" className="text-sm font-medium">Total guest count</label>
              <input
                required
                id="manualGuestCount"
                name="guestCount"
                type="number"
                min={1}
                max={STANDARD_DAY_EVENT_CAPACITY}
                defaultValue={1}
                aria-invalid={Boolean(firstFieldError(fieldErrors, "guestCount"))}
                aria-describedby="manualGuestCount-error"
                className={inputClassName}
              />
              {firstFieldError(fieldErrors, "guestCount") && <p id="manualGuestCount-error" className={errorClassName}>{firstFieldError(fieldErrors, "guestCount")}</p>}
            </div>
            <div>
              <label htmlFor="manualOvernightGuestCount" className="text-sm font-medium">Overnight guest count</label>
              <input
                required
                id="manualOvernightGuestCount"
                name="overnightGuestCount"
                type="number"
                min={0}
                max={OVERNIGHT_GUEST_CAPACITY}
                defaultValue={0}
                aria-invalid={Boolean(firstFieldError(fieldErrors, "overnightGuestCount"))}
                aria-describedby="manualOvernightGuestCount-help manualOvernightGuestCount-error"
                className={inputClassName}
              />
              <p id="manualOvernightGuestCount-help" className="mt-1 text-xs text-stone-500">Cannot exceed the total guest count.</p>
              {firstFieldError(fieldErrors, "overnightGuestCount") && <p id="manualOvernightGuestCount-error" className={errorClassName}>{firstFieldError(fieldErrors, "overnightGuestCount")}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset
          disabled={pending}
          className="space-y-4 rounded-lg border border-stone-200 p-4"
        >
          <legend className="px-1 text-sm font-semibold">
            Notes and manual payment
          </legend>
          <div>
            <label htmlFor="manualSpecialRequests" className="text-sm font-medium">Special requests (optional)</label>
            <textarea id="manualSpecialRequests" name="specialRequests" maxLength={1000} rows={3} disabled={pending} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="manualPaymentProvider" className="text-sm font-medium">Manual payment provider</label>
            <select
              required
              id="manualPaymentProvider"
              name="manualProvider"
              defaultValue=""
              disabled={pending}
              aria-invalid={Boolean(firstFieldError(fieldErrors, "manualProvider"))}
              aria-describedby="manualPaymentProvider-help manualPaymentProvider-error"
              className={inputClassName}
            >
              <option value="" disabled>Select a provider</option>
              <option value="manual_upi">Manual UPI</option>
              <option value="payment_link">Payment link</option>
            </select>
            <p id="manualPaymentProvider-help" className="mt-1 text-xs leading-5 text-stone-500">
              Only Manual UPI and Payment link are supported.
            </p>
            {firstFieldError(fieldErrors, "manualProvider") && <p id="manualPaymentProvider-error" className={errorClassName}>{firstFieldError(fieldErrors, "manualProvider")}</p>}
          </div>
        </fieldset>
        <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
          {pending ? "Creating booking…" : "Create manual booking"}
        </Button>
      </form>
      <div className="mt-5">
        <AdminOperationResult ref={resultRef} feedback={feedback} onDismiss={() => setFeedback(null)} />
      </div>
    </section>
  );
}
