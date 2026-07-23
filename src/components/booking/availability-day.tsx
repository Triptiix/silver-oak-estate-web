"use client";

import { formatInrFromPaise } from "@/lib/booking/format";

type AvailabilityDayProps = {
  dateStr: string;
  dayOfMonth: number;
  available: boolean;
  priceAmountPaise: number | undefined;
  isPast: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick?: () => void;
  isBlank?: boolean;
};

export function AvailabilityDay({
  dateStr,
  dayOfMonth,
  available,
  priceAmountPaise,
  isPast,
  isSelected,
  isToday,
  onClick,
  isBlank,
}: AvailabilityDayProps) {
  if (isBlank) {
    return <div className="p-2 border border-transparent" aria-hidden="true" />;
  }

  const disabled = isPast || !available;
  let bgClass = "bg-white hover:bg-slate-50";
  let textClass = "text-slate-900";
  let borderClass = "border-slate-200";

  if (isPast) {
    bgClass = "bg-slate-100 opacity-50";
    textClass = "text-slate-400";
  } else if (!available) {
    bgClass = "bg-slate-50 opacity-60";
    textClass = "text-slate-500 line-through";
  } else if (isSelected) {
    bgClass = "bg-slate-900";
    textClass = "text-white";
    borderClass = "border-slate-900";
  } else if (isToday) {
    borderClass = "border-slate-400 border-2";
  }

  const d = new Date(`${dateStr}T00:00:00Z`);
  const fullDateLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);

  const priceLabel = priceAmountPaise ? `Price ${formatInrFromPaise(priceAmountPaise)}` : "";
  const ariaLabel = [
    fullDateLabel,
    isToday ? "Today" : "",
    isSelected ? "Selected" : "",
    !available ? "Unavailable" : "Available",
    priceLabel
  ].filter(Boolean).join(". ");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-md transition-colors ${bgClass} ${textClass} ${borderClass} ${
        !disabled ? "cursor-pointer focus:ring-2 focus:ring-slate-900 focus:outline-none" : "cursor-not-allowed"
      } relative`}
    >
      <span className="text-lg sm:text-xl font-medium">{dayOfMonth}</span>
      {priceAmountPaise !== undefined && !isPast && available && (
        <span className={`text-xs mt-1 ${isSelected ? "text-slate-200" : "text-slate-500"}`}>
          {formatInrFromPaise(priceAmountPaise)}
        </span>
      )}
    </button>
  );
}
