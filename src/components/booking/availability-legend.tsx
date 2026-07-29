export function AvailabilityLegend() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-soe-ui text-xs text-[var(--soe-surface-text-secondary)]">
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-sm border border-[var(--soe-color-gold)]/45 bg-[var(--soe-surface-bg-primary)]" />
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-sm border border-[var(--soe-color-gold)]/45 bg-[var(--soe-color-stone)] opacity-65" />
        <span>Unavailable</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-sm border border-[var(--soe-color-brand)] bg-[var(--soe-color-brand)]" />
        <span>Selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-sm border-2 border-[var(--soe-color-brand)] bg-[var(--soe-surface-bg-primary)]" />
        <span>Today</span>
      </div>
    </div>
  );
}
