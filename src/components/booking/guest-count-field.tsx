"use client";

import { useEffect } from "react";

type GuestCountFieldProps = {
  label: string;
  name: string;
  description?: string;
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
};

export function GuestCountField({
  label,
  name,
  description,
  min,
  max,
  value,
  onChange,
}: GuestCountFieldProps) {
  // Ensure value stays within bounds when max changes (e.g. overnight guests bounded by total guests)
  useEffect(() => {
    if (value > max) onChange(max);
    else if (value < min) onChange(min);
  }, [max, min, value, onChange]);

  function handleMinus() {
    if (value > min) onChange(value - 1);
  }

  function handlePlus() {
    if (value < max) onChange(value + 1);
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-200 last:border-0">
      <div>
        <label className="block text-sm font-medium text-slate-900" htmlFor={name}>
          {label}
        </label>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleMinus}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-900 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none"
        >
          <span className="text-lg leading-none select-none" aria-hidden="true">&minus;</span>
        </button>
        <div className="w-6 text-center text-slate-900 font-medium">
          {value}
        </div>
        <input type="hidden" name={name} value={value} />
        <button
          type="button"
          onClick={handlePlus}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-900 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none"
        >
          <span className="text-lg leading-none select-none" aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
