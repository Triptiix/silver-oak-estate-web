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
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium">{monthLabel}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={currentMonth <= currentBusinessMonth || isLoading}
            className="p-2 border rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous month"
          >
            &larr;
          </button>
          <button
            onClick={handleNextMonth}
            disabled={isLoading}
            className="p-2 border rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 space-y-4">
            <p className="text-red-600" role="alert">Failed to load calendar. Please try again.</p>
            <button
              onClick={() => setReloadVersion((v) => v + 1)}
              className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        )}
        
        {isLoading && !data && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10" aria-live="polite">
            <p className="text-slate-500">Loading availability…</p>
          </div>
        )}

        <div className={`transition-opacity duration-200 ${isTransitioning ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
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
            <div className="mt-8 text-center text-slate-500">
              <p>No availability data returned for this month.</p>
            </div>
          )}
        </div>
      </div>

      <AvailabilityLegend />
    </div>
  );
}
