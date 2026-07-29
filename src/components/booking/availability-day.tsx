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
  let bgClass = "bg-[var(--soe-surface-bg-primary)] hover:bg-[var(--soe-color-brand-soft)]";
  let textClass = "text-[var(--soe-surface-text-primary)]";
  let borderClass = "border-[var(--soe-color-gold)]/45";

  if (isPast) {
    bgClass = "bg-[var(--soe-color-stone)] opacity-50";
    textClass = "text-[var(--soe-surface-text-secondary)]";
  } else if (!available) {
    bgClass = "bg-[var(--soe-color-stone)] opacity-65";
    textClass = "text-[var(--soe-surface-text-secondary)] line-through";
  } else if (isSelected) {
    bgClass = "bg-[var(--soe-color-brand)]";
    textClass = "text-[var(--soe-color-canvas)]";
    borderClass = "border-[var(--soe-color-brand)]";
  } else if (isToday) {
    borderClass = "border-[var(--soe-color-brand)] border-2";
  }

  const d = new Date(`${dateStr}T00:00:00Z`);
  const fullDateLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);

  const statusLabel = isPast ? "Past date" : (!available ? "Unavailable" : `Available${priceAmountPaise ? ` Price ${formatInrFromPaise(priceAmountPaise)}` : ""}`);

  const ariaLabel = [
    fullDateLabel,
    isToday ? "Today" : "",
    isSelected ? "Selected" : "",
    statusLabel
  ].filter(Boolean).join(". ");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative flex min-h-14 flex-col items-center justify-center rounded-[var(--soe-radius-control)] border p-1.5 transition-colors sm:min-h-20 sm:p-3 ${bgClass} ${textClass} ${borderClass} ${
        !disabled ? "cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]" : "cursor-not-allowed"
      }`}
    >
      <span className="font-soe-display text-base font-medium sm:text-xl">{dayOfMonth}</span>
      {priceAmountPaise !== undefined && !isPast && available && (
        <span className={`mt-1 hidden font-soe-ui text-[0.625rem] sm:block ${isSelected ? "text-[var(--soe-color-canvas)]" : "text-[var(--soe-surface-text-secondary)]"}`}>
          {formatInrFromPaise(priceAmountPaise)}
        </span>
      )}
    </button>
  );
}
