import { formatDisplayDate, getCheckoutDate } from "@/lib/booking/date";
import { formatInrFromPaise } from "@/lib/booking/format";

type BookingSummaryProps = {
  checkInDate: string;
  priceAmountPaise: number;
  guestCount: number;
};

export function BookingSummary({ checkInDate, priceAmountPaise, guestCount }: BookingSummaryProps) {
  const checkOutDate = getCheckoutDate(checkInDate);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 sticky top-8">
      <h3 className="text-lg font-medium text-slate-900 mb-6">Booking Summary</h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Check-in</span>
          <span className="font-medium text-slate-900">{formatDisplayDate(checkInDate)}</span>
          <span className="block text-sm text-slate-600">From 11:00 AM</span>
        </div>
        
        <div>
          <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Check-out</span>
          <span className="font-medium text-slate-900">{formatDisplayDate(checkOutDate)}</span>
          <span className="block text-sm text-slate-600">Until 09:00 AM</span>
        </div>

        <div>
          <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Guests</span>
          <span className="font-medium text-slate-900">{guestCount} {guestCount === 1 ? "guest" : "guests"} total</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center text-slate-900 font-medium text-lg">
          <span>Total</span>
          <span>{formatInrFromPaise(priceAmountPaise)}</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Includes all taxes and fees.
        </p>
      </div>
    </div>
  );
}
