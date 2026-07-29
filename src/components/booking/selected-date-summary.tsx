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
    `Hello, I would like to request availability for Silver Oak Estate on ${formatDisplayDate(dateStr)}. Please confirm availability and enquiry details.`,
  );
  const assistedBookingHref = `${publicInformation.contact.primaryPhone.whatsappHref}?text=${assistedMessage}`;

  return (
    <div className="mx-auto mt-8 flex max-w-3xl flex-col items-start justify-between gap-7 border-y border-[var(--soe-color-gold)]/45 py-7 md:flex-row md:items-center">
      <div className="flex-1">
        <h3 className="font-soe-display text-[length:var(--soe-text-lg)] text-[var(--soe-surface-text-primary)]">
          Preferred stay date
        </h3>
        <div className="mt-4 flex items-center gap-4 font-soe-body text-sm text-[var(--soe-surface-text-secondary)]">
          <div>
            <span className="block font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)]">Check-in</span>
            <span className="font-medium text-[var(--soe-surface-text-primary)]">{formatDisplayDate(dateStr)}</span>
            <span className="block text-xs">From {checkInTime || "11:00 AM"}</span>
          </div>
          <div className="h-px w-8 bg-[var(--soe-color-gold)]/60" />
          <div>
            <span className="block font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)]">Check-out</span>
            <span className="font-medium text-[var(--soe-surface-text-primary)]">{formatDisplayDate(checkoutDateStr)}</span>
            <span className="block text-xs">Until {checkOutTime || "10:00 AM"}</span>
          </div>
        </div>
        <div className="mt-5 space-y-1 font-soe-body">
          <p className="font-medium text-[var(--soe-surface-text-primary)]">
            Published rate: {formatInrFromPaise(priceAmountPaise)}
          </p>
          <p className="text-sm text-[var(--soe-surface-text-secondary)]">
            Published advance: {formatInrFromPaise(advanceAmountPaise)}
          </p>
          <p className="pt-1 text-sm font-medium text-[var(--soe-surface-text-primary)]">
            Published balance: {formatInrFromPaise(balanceAmountPaise)}
          </p>
          {!onlineBookingAvailable && (
            <p className="max-w-xl pt-3 text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
              This selection is an enquiry only and does not reserve the estate.
              The team will confirm availability and commercial details in
              writing.
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
            rel="noopener noreferrer"
            aria-label="Request this date on WhatsApp (opens in a new tab)"
            className="block min-h-[48px] w-full rounded-[var(--soe-radius-control)] bg-[var(--soe-surface-action-primary)] px-8 py-3 text-center font-soe-ui font-medium text-[var(--soe-surface-text-inverse)] transition-colors hover:bg-[var(--soe-surface-action-hover)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
          >
            Request This Date
          </a>
        )}
      </div>
    </div>
  );
}
