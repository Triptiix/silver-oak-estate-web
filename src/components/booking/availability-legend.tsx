export function AvailabilityLegend() {
  return (
    <div className="flex items-center gap-4 text-sm mt-6 justify-center text-slate-600">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm border border-slate-200 bg-white" />
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm border border-slate-200 bg-slate-50 opacity-60" />
        <span>Unavailable</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm border border-slate-900 bg-slate-900" />
        <span>Selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm border-2 border-slate-400 bg-white" />
        <span>Today</span>
      </div>
    </div>
  );
}
