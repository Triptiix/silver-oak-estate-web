"use client";

import Link from "next/link";
import { formatDisplayDate, getCheckoutDate } from "@/lib/booking/date";
import { formatInrFromPaise, calculateRemainingBalancePaise } from "@/lib/booking/format";
import { publicInformation } from "@/config/public-information";

type SelectedDateSummaryProps = {
  dateStr: string;
  priceAmountPaise: number;
  advanceAmountPaise: number;
  checkInTime: string;
  checkOutTime: string;
  onlineBookingAvailable: boolean;
};

export function SelectedDateSummary({
  dateStr,
  priceAmountPaise,
  advanceAmountPaise,
  checkInTime,
  checkOutTime,
  onlineBookingAvailable,
}: SelectedDateSummaryProps) {
  const checkoutDateStr = getCheckoutDate(dateStr);
  const balanceAmountPaise = calculateRemainingBalancePaise(priceAmountPaise, advanceAmountPaise);
  const assistedMessage = encodeURIComponent(
    `Hello, I would like to reserve Silver Oak Estate for ${formatDisplayDate(dateStr)}. Please confirm availability and booking details.`,
  );
  const assistedBookingHref = `${publicInformation.contact.primaryPhone.whatsappHref}?text=${assistedMessage}`;

  return (
    <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex-1">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Selected Stay</h3>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div>
            <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Check-in</span>
            <span className="font-medium text-slate-900">{formatDisplayDate(dateStr)}</span>
            <span className="block text-xs">From {checkInTime || "11:00 AM"}</span>
          </div>
          <div className="w-8 h-px bg-slate-300" />
          <div>
            <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Check-out</span>
            <span className="font-medium text-slate-900">{formatDisplayDate(checkoutDateStr)}</span>
            <span className="block text-xs">Until {checkOutTime || "10:00 AM"}</span>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-slate-900 font-medium">
            Total Price: {formatInrFromPaise(priceAmountPaise)}
          </p>
          <p className="text-slate-600 text-sm">
            Advance to Hold: {formatInrFromPaise(advanceAmountPaise)}
          </p>
          <p className="text-slate-900 font-medium text-sm pt-1">
            Remaining Balance: {formatInrFromPaise(balanceAmountPaise)}
          </p>
          {!onlineBookingAvailable && (
            <p className="pt-2 text-sm text-slate-600">
              Online checkout is not active yet. Our team will confirm the date and payment details directly.
            </p>
          )}
        </div>
      </div>

      <div className="w-full md:w-auto">
        {onlineBookingAvailable ? (
          <Link
            href={`/book?date=${dateStr}`}
            className="block w-full text-center bg-slate-900 text-white px-8 py-3 rounded-md font-medium hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none focus:ring-offset-2"
          >
            Continue to Book
          </Link>
        ) : (
          <a
            href={assistedBookingHref}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center bg-slate-900 text-white px-8 py-3 rounded-md font-medium hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none focus:ring-offset-2"
          >
            Request This Date
          </a>
        )}
      </div>
    </div>
  );
}
