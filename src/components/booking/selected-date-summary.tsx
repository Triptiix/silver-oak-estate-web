"use client";

import Link from "next/link";
import { formatDisplayDate, getCheckoutDate } from "@/lib/booking/date";
import { formatInrFromPaise } from "@/lib/booking/format";

type SelectedDateSummaryProps = {
  dateStr: string;
  priceAmountPaise: number;
};

export function SelectedDateSummary({ dateStr, priceAmountPaise }: SelectedDateSummaryProps) {
  const checkoutDateStr = getCheckoutDate(dateStr);

  return (
    <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex-1">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Selected Stay</h3>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div>
            <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Check-in</span>
            <span className="font-medium text-slate-900">{formatDisplayDate(dateStr)}</span>
            <span className="block text-xs">From 11:00 AM</span>
          </div>
          <div className="w-8 h-px bg-slate-300" />
          <div>
            <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Check-out</span>
            <span className="font-medium text-slate-900">{formatDisplayDate(checkoutDateStr)}</span>
            <span className="block text-xs">Until 09:00 AM</span>
          </div>
        </div>
        <p className="mt-4 text-slate-900 font-medium">
          Total: {formatInrFromPaise(priceAmountPaise)}
        </p>
      </div>

      <div className="w-full md:w-auto">
        <Link
          href={`/book?date=${dateStr}`}
          className="block w-full text-center bg-slate-900 text-white px-8 py-3 rounded-md font-medium hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none focus:ring-offset-2"
        >
          Continue to Book
        </Link>
      </div>
    </div>
  );
}
