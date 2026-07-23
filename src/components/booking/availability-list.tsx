"use client";

import { useEffect, useState } from "react";
import type { AvailabilityResponse } from "@/types/booking";

export function AvailabilityList() {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState(false);
  const month = new Date().toISOString().slice(0, 7);
  useEffect(() => {
    fetch(`/api/availability?month=${month}`, { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then(setData).catch(() => setError(true));
  }, [month]);
  if (error) return <p role="alert">Availability could not be loaded. Please try again.</p>;
  if (!data) return <p aria-live="polite">Loading availability…</p>;
  if (!data.dates.length) return <p>No dates were returned for this month.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {data.dates.map((entry) => (
        <li key={entry.date} className="rounded-[var(--radius)] border border-[var(--border)] p-4">
          <strong>{entry.date}</strong>
          <span className="block text-sm text-[var(--muted-foreground)]">
            {entry.available ? `Available · INR ${(entry.priceAmountPaise / 100).toLocaleString("en-IN")}` : "Unavailable"}
          </span>
        </li>
      ))}
    </ul>
  );
}
