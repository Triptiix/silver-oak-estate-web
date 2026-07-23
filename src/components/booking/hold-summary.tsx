"use client";

import { HoldCountdown } from "./hold-countdown";
import { formatDisplayDate } from "@/lib/booking/date";
import { formatInrFromPaise } from "@/lib/booking/format";
import type { HoldSummary as HoldSummaryType } from "@/hooks/use-booking-session";

type HoldSummaryProps = {
  hold: HoldSummaryType;
  onExpire: () => void;
  onRelease: () => void;
};

export function HoldSummary({ hold, onExpire, onRelease }: HoldSummaryProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Dates Held Successfully</h2>
          <p className="text-slate-600">This is not a confirmed booking. Please complete your payment to confirm your stay.</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8 text-center">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Time Remaining</p>
          <HoldCountdown expiresAt={hold.holdExpiresAt} onExpire={onExpire} />
          <p className="text-xs text-slate-500 mt-2">Your hold expires at {new Date(hold.holdExpiresAt).toLocaleTimeString("en-IN")}</p>
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
              <span className="block text-sm text-slate-600">From 11:00 AM</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Check-out</span>
              <span className="font-medium text-slate-900">{formatDisplayDate(hold.checkOutAt.slice(0, 10))}</span>
              <span className="block text-sm text-slate-600">Until 09:00 AM</span>
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
          </div>
        </div>

        <div className="mt-8 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 text-amber-800 text-sm">
            <p className="font-medium mb-1">Payment Integration Pending</p>
            <p>Phase 3 does not include the Razorpay checkout flow. To test releasing this hold or booking a different date, click below.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRelease}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              Release Hold & Change Date
            </button>
            <button
              disabled
              className="px-6 py-3 bg-slate-900 text-white font-medium rounded-md opacity-50 cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
