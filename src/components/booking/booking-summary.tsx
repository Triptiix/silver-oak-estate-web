import { formatDisplayDate, getCheckoutDate } from "@/lib/booking/date";
import { formatInrFromPaise, calculateRemainingBalancePaise } from "@/lib/booking/format";

type BookingSummaryProps = {
  checkInDate: string;
  checkInTime: string;
  checkOutTime: string;
  priceAmountPaise: number;
  advanceAmountPaise: number;
  guestCount: number;
  overnightGuestCount: number;
};

export function BookingSummary({
  checkInDate,
  checkInTime,
  checkOutTime,
  priceAmountPaise,
  advanceAmountPaise,
  guestCount,
  overnightGuestCount
}: BookingSummaryProps) {
  const checkOutDate = getCheckoutDate(checkInDate);
  const balanceAmountPaise = calculateRemainingBalancePaise(priceAmountPaise, advanceAmountPaise);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 sticky top-8">
      <h3 className="text-lg font-medium text-slate-900 mb-6">Booking Summary</h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Check-in</span>
          <span className="font-medium text-slate-900">{formatDisplayDate(checkInDate)}</span>
          <span className="block text-sm text-slate-600">From {checkInTime || "11:00 AM"}</span>
        </div>
        
        <div>
          <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Check-out</span>
          <span className="font-medium text-slate-900">{formatDisplayDate(checkOutDate)}</span>
          <span className="block text-sm text-slate-600">Until {checkOutTime || "10:00 AM"}</span>
        </div>

        <div>
          <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Guests</span>
          <span className="font-medium text-slate-900">{guestCount} {guestCount === 1 ? "guest" : "guests"} total</span>
          {overnightGuestCount > 0 && (
            <span className="block text-sm text-slate-600">{overnightGuestCount} staying overnight</span>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 space-y-2">
        <div className="flex justify-between items-center text-slate-600">
          <span>Total Price</span>
          <span>{formatInrFromPaise(priceAmountPaise)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>Advance to Hold</span>
          <span>{formatInrFromPaise(advanceAmountPaise)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-900 font-medium text-lg pt-2 border-t border-slate-100">
          <span>Remaining Balance</span>
          <span>{formatInrFromPaise(balanceAmountPaise)}</span>
        </div>
      </div>
    </div>
  );
}
