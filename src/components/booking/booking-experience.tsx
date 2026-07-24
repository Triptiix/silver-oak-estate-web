"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingSession } from "@/hooks/use-booking-session";
import { fetchAvailability } from "@/lib/booking/client";
import { BookingForm } from "./booking-form";
import { BookingSummary } from "./booking-summary";
import { HoldSummary } from "./hold-summary";
import { ReleaseHoldDialog } from "./release-hold-dialog";
import { isPastBusinessDate } from "@/lib/booking/date";
import type { PaymentVerificationResponse } from "@/types/payment";

type SelectedDateEntry = {
  date: string;
  priceAmountPaise: number;
  advanceAmountPaise: number;
  checkInTime: string;
  checkOutTime: string;
};

export function BookingExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const { holdSummary, isLoaded, saveHold, clearHold } = useBookingSession();

  // Pre-check state
  const [selectedEntry, setSelectedEntry] = useState<SelectedDateEntry | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [overnightGuestCount, setOvernightGuestCount] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [hasExpired, setHasExpired] = useState(false);
  const [paymentOutcome, setPaymentOutcome] = useState<PaymentVerificationResponse | null>(null);

  const checkAvailability = useCallback(async (date: string) => {
    setIsChecking(true);
    try {
      const month = date.slice(0, 7);
      const data = await fetchAvailability(month);
      const entry = data.dates.find((d) => d.date === date);
      
      if (entry && entry.available && !isPastBusinessDate(date)) {
        setSelectedEntry({
          date: entry.date,
          priceAmountPaise: entry.priceAmountPaise,
          advanceAmountPaise: entry.advanceAmountPaise,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
        });
      } else {
        router.replace("/availability");
      }
    } catch {
      // Allow fallback if API fails, user will see error on submit
      // Or just redirect back
      router.replace("/availability");
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!holdSummary && !hasExpired && !paymentOutcome) {
      if (!dateParam || isPastBusinessDate(dateParam)) {
        router.replace("/availability");
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkAvailability(dateParam);
      }
    }
  }, [isLoaded, holdSummary, hasExpired, paymentOutcome, dateParam, router, checkAvailability]);

  async function handleReleaseHold() {
    setIsReleasing(true);
    setReleaseError(null);
    try {
      const response = await fetch("/api/bookings/release", { method: "POST" });
      if (response.ok) {
        clearHold();
        setIsReleaseDialogOpen(false);
        router.push("/availability");
      } else {
        setReleaseError("Failed to release hold safely. Please try again.");
      }
    } catch {
      setReleaseError("Network error. Please try again.");
    } finally {
      setIsReleasing(false);
    }
  }

  function handleHoldExpired() {
    setHasExpired(true);
    clearHold();
  }

  if (!isLoaded || (isChecking && !holdSummary && !hasExpired)) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-slate-500" aria-live="polite">Loading booking experience…</p>
      </div>
    );
  }

  if (hasExpired) {
    return (
      <div className="py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Hold Expired</h2>
              <p className="text-slate-600">Your temporary hold on these dates has expired.</p>
            </div>
            <button
              onClick={() => router.push("/availability")}
              className="px-6 py-3 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              Check availability again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentOutcome) {
    const confirmed = paymentOutcome.state === "confirmed";
    return (
      <div className="py-8">
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-lg p-8 shadow-sm text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            {confirmed ? "Booking confirmed" : "Payment received — recovery required"}
          </h2>
          <p className="text-slate-600 mb-4">
            {confirmed
              ? "Your booking is confirmed and the dates are reserved."
              : "Your payment was received, but the expired or released booking was not revived. Our team must review the payment."}
          </p>
          <p className="font-mono text-sm text-slate-700">{paymentOutcome.bookingReference}</p>
        </div>
      </div>
    );
  }

  if (holdSummary) {
    return (
      <div className="py-8">
        <HoldSummary 
          hold={holdSummary} 
          onExpire={handleHoldExpired}
          onRelease={() => setIsReleaseDialogOpen(true)}
          onPaymentFinalState={(result) => {
            setPaymentOutcome(result);
            clearHold();
          }}
        />
        <ReleaseHoldDialog
          isOpen={isReleaseDialogOpen}
          isReleasing={isReleasing}
          error={releaseError}
          onConfirm={handleReleaseHold}
          onCancel={() => {
            setIsReleaseDialogOpen(false);
            setReleaseError(null);
          }}
        />
      </div>
    );
  }

  if (dateParam && selectedEntry) {
    return (
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1">
          <h2 className="text-2xl font-medium text-slate-900 mb-6">Enter Your Details</h2>
          <BookingForm 
            checkInDate={dateParam}
            guestCount={guestCount}
            overnightGuestCount={overnightGuestCount}
            onGuestCountChange={(val) => {
              setGuestCount(val);
              if (overnightGuestCount > val) {
                setOvernightGuestCount(val);
              }
            }}
            onOvernightGuestCountChange={setOvernightGuestCount}
            onSuccess={(hold) => {
              saveHold(hold);
            }}
          />
        </div>
        <div className="w-full lg:w-96">
          <BookingSummary 
            checkInDate={dateParam}
            checkInTime={selectedEntry.checkInTime}
            checkOutTime={selectedEntry.checkOutTime}
            priceAmountPaise={selectedEntry.priceAmountPaise}
            advanceAmountPaise={selectedEntry.advanceAmountPaise}
            guestCount={guestCount}
            overnightGuestCount={overnightGuestCount}
          />
        </div>
      </div>
    );
  }

  return null;
}
