"use client";

import { HoldCountdown } from "./hold-countdown";
import { formatDisplayDate, formatTimeInKolkata } from "@/lib/booking/date";
import { formatInrFromPaise } from "@/lib/booking/format";
import type { HoldSummary as HoldSummaryType } from "@/hooks/use-booking-session";
import type { PaymentVerificationResponse } from "@/types/payment";
import { PaymentCheckout } from "./payment-checkout";

type HoldSummaryProps = {
  hold: HoldSummaryType;
  onExpire: () => void;
  onRelease: () => void;
  onPaymentFinalState: (result: PaymentVerificationResponse) => void;
};

export function HoldSummary({ hold, onExpire, onRelease, onPaymentFinalState }: HoldSummaryProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Dates Held Successfully</h2>
          <p className="text-slate-600">This is not a confirmed booking. A temporary hold has been placed on these dates.</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8 text-center">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Time Remaining</p>
          <HoldCountdown expiresAt={hold.holdExpiresAt} onExpire={onExpire} />
          <p className="text-xs text-slate-500 mt-2">Your hold expires at {formatTimeInKolkata(hold.holdExpiresAt)}</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-slate-100">
            <span className="text-slate-600">Booking Reference</span>
            <span className="font-mono font-medium text-slate-900">{hold.bookingReference}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100">
            <div>
              <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Check-in</span>
              <span className="font-medium text-slate-900">{formatDisplayDate(hold.checkInAt.slice(0, 10))}</span>
              <span className="block text-sm text-slate-600">From {formatTimeInKolkata(hold.checkInAt)}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Check-out</span>
              <span className="font-medium text-slate-900">{formatDisplayDate(hold.checkOutAt.slice(0, 10))}</span>
              <span className="block text-sm text-slate-600">Until {formatTimeInKolkata(hold.checkOutAt)}</span>
            </div>
          </div>

          <div className="space-y-3 py-4 border-b border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>Total Price</span>
              <span>{formatInrFromPaise(hold.priceAmountPaise)}</span>
            </div>
            <div className="flex justify-between font-medium text-slate-900">
              <span>Advance Required to Confirm</span>
              <span>{formatInrFromPaise(hold.advanceAmountPaise)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Remaining Balance (Due at check-in)</span>
              <span>{formatInrFromPaise(hold.priceAmountPaise - hold.advanceAmountPaise)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6">
          <PaymentCheckout
            advanceAmountPaise={hold.advanceAmountPaise}
            bookingReference={hold.bookingReference}
            onFinalState={onPaymentFinalState}
          />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <button
              onClick={onRelease}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              Release Hold & Change Date
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
