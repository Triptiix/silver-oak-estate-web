"use client";

import { useEffect, useState, useRef } from "react";
import { AvailabilityDay } from "./availability-day";
import { AvailabilityLegend } from "./availability-legend";
import { fetchAvailability } from "@/lib/booking/client";
import { getCurrentBusinessMonth, isPastBusinessDate, getCurrentBusinessDate } from "@/lib/booking/date";
import type { AvailabilityResponse } from "@/types/booking";

type AvailabilityCalendarProps = {
  selectedDate?: string;
  onSelectDate?: (date: string, priceAmountPaise: number, advanceAmountPaise: number, checkInTime: string, checkOutTime: string) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AvailabilityCalendar({ selectedDate, onSelectDate }: AvailabilityCalendarProps) {
  const currentBusinessMonth = getCurrentBusinessMonth();
  const currentBusinessDate = getCurrentBusinessDate();
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? selectedDate.slice(0, 7) : currentBusinessMonth
  );

  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function loadMonth() {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const ac = new AbortController();
      abortControllerRef.current = ac;

      if (!data) setIsLoading(true);
      else setIsTransitioning(true);
      setError(false);

      try {
        const response = await fetchAvailability(currentMonth, ac.signal);
        setData(response);
        setError(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Do not show an error, do not clear data
          return;
        }
        setError(true);
        // Do not clear data on error so stale data remains visible if network fails
      } finally {
        if (abortControllerRef.current === ac) {
          setIsLoading(false);
          setIsTransitioning(false);
        }
      }
    }

    loadMonth();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, reloadVersion]);

  function handlePrevMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    let newM = m - 1;
    let newY = y;
    if (newM === 0) {
      newM = 12;
      newY -= 1;
    }
    const nextStr = `${newY}-${String(newM).padStart(2, "0")}`;
    if (nextStr >= currentBusinessMonth) {
      setCurrentMonth(nextStr);
    }
  }

  function handleNextMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    let newM = m + 1;
    let newY = y;
    if (newM === 13) {
      newM = 1;
      newY += 1;
    }
    const nextStr = `${newY}-${String(newM).padStart(2, "0")}`;
    setCurrentMonth(nextStr);
  }

  // Calculate grid
  const [y, m] = currentMonth.split("-").map(Number);
  const firstDayOfMonth = new Date(Date.UTC(y, m - 1, 1));
  const startingDayOfWeek = firstDayOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const blanks = Array.from({ length: startingDayOfWeek }, (_, i) => `blank-${i}`);

  const monthFormatter = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const monthLabel = monthFormatter.format(firstDayOfMonth);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-[var(--soe-color-gold)]/45 pb-5">
        <h3 className="font-soe-display text-[length:var(--soe-text-xl)]">{monthLabel}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={currentMonth <= currentBusinessMonth || isLoading}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--soe-radius-control)] border border-[var(--soe-color-gold)]/60 font-soe-ui hover:bg-[var(--soe-color-brand-soft)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
            aria-label="Previous month"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isLoading}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--soe-radius-control)] border border-[var(--soe-color-gold)]/60 font-soe-ui hover:bg-[var(--soe-color-brand-soft)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
            aria-label="Next month"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-4 bg-[var(--soe-surface-bg-primary)]/95 px-6 text-center">
            <p className="font-soe-body text-[var(--soe-color-error)]" role="alert">The calendar could not be loaded. Contact the estate team or try again.</p>
            <button
              type="button"
              onClick={() => setReloadVersion((v) => v + 1)}
              className="min-h-11 rounded-[var(--soe-radius-control)] bg-[var(--soe-surface-action-primary)] px-5 py-2 font-soe-ui font-medium text-[var(--soe-surface-text-inverse)] hover:bg-[var(--soe-surface-action-hover)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
            >
              Retry
            </button>
          </div>
        )}
        
        {isLoading && !data && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--soe-surface-bg-primary)]/90" aria-live="polite">
            <p className="font-soe-body text-[var(--soe-surface-text-secondary)]">Loading availability…</p>
          </div>
        )}

        <div className={`transition-opacity duration-200 ${isTransitioning ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2 text-center font-soe-ui text-xs font-semibold uppercase tracking-wide text-[var(--soe-surface-text-secondary)]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {blanks.map((key) => (
              <AvailabilityDay
                key={key}
                isBlank
                dateStr=""
                dayOfMonth={0}
                available={false}
                priceAmountPaise={0}
                isPast={false}
                isSelected={false}
                isToday={false}
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
              const entry = data?.dates.find((d) => d.date === dateStr);
              
              const isPast = isPastBusinessDate(dateStr);
              const isAvailable = entry ? entry.available : false;
              const price = entry ? entry.priceAmountPaise : undefined;

              return (
                <AvailabilityDay
                  key={dateStr}
                  dateStr={dateStr}
                  dayOfMonth={day}
                  available={isAvailable}
                  priceAmountPaise={price}
                  isPast={isPast}
                  isSelected={selectedDate === dateStr}
                  isToday={dateStr === currentBusinessDate}
                  onClick={() => {
                    if (!isPast && isAvailable && onSelectDate && entry && data) {
                      onSelectDate(dateStr, entry.priceAmountPaise, entry.advanceAmountPaise, data.checkInTime, data.checkOutTime);
                    }
                  }}
                />
              );
            })}
          </div>

          {data && data.dates.length === 0 && (
            <div className="mt-8 text-center font-soe-body text-[var(--soe-surface-text-secondary)]">
              <p>No availability information was returned for this month. Contact the estate team for assistance.</p>
            </div>
          )}
        </div>
      </div>

      <AvailabilityLegend />
    </div>
  );
}
